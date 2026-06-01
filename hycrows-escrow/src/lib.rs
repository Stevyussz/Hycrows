// =============================================================================
// HyCrows Escrow Protocol – Core Contract (lib.rs)
// =============================================================================
// Architecture : Hybrid Automated Escrow with Anti-Griefing Staking
// Runtime      : Stellar Soroban (WebAssembly)
// SDK          : soroban-sdk v26
//
// Key Design Decisions
// ──────────────────────
// • Soroban does not have "payable" functions; all XLM transfers are handled
//   via the token::Client from the SAC (Stellar Asset Contract).
// • Ledger timestamps (env.ledger().timestamp()) are used for all time checks.
// • Persistent storage is used to keep contract data safe even if the ledger
//   is archived. The TTL is automatically extended upon read/write operations.
// • Anti-Griefing Stake (2 XLM) is required when opening a dispute to ensure
//   only serious issues are raised. If the buyer loses the dispute, the stake
//   is slashed and sent to the HyCrows Treasury as a platform fee.
// • Every state change is emitted as a Soroban event so indexers and explorers
//   can track the transaction history without reading storage directly.
// =============================================================================

#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short, token, Address, Env, Symbol,
};

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

/// Time limit (in seconds) for the buyer to respond after the item is marked
/// as "Shipped" before `auto_release_funds` can be triggered. 24 hours = 86,400s.
const AUTO_RELEASE_DELAY_SECS: u64 = 86_400;

/// The anti-griefing stake required from the buyer to open a dispute.
/// 2 XLM = 20,000,000 stroops (1 XLM = 10,000,000 stroops).
const DISPUTE_STAKE_STROOPS: i128 = 20_000_000;

/// TTL Extension — 1 ledger ≈ 5 seconds
/// Extend if TTL remaining is < 30 days (~518,400 ledgers).
const LEDGER_THRESHOLD: u32 = 518_400;
/// Extend up to ~1 year (~6,307,200 ledgers).
const LEDGER_BUMP: u32 = 6_307_200;

// ─────────────────────────────────────────────────────────────────────────────
// Storage Keys
// ─────────────────────────────────────────────────────────────────────────────

const CONFIG_KEY: Symbol = symbol_short!("CONFIG");
const TXN_PREFIX: Symbol = symbol_short!("TXN");

// ─────────────────────────────────────────────────────────────────────────────
// Contract Events
// ─────────────────────────────────────────────────────────────────────────────

#[contracttype]
pub struct DepositEvent  { pub transaction_id: u64, pub buyer: Address,  pub seller: Address, pub amount: i128 }
#[contracttype]
pub struct ShippedEvent  { pub transaction_id: u64, pub shipped_timestamp: u64 }
#[contracttype]
pub struct ReleaseEvent  { pub transaction_id: u64, pub seller: Address,  pub amount: i128 }
#[contracttype]
pub struct AutoRelEvent  { pub transaction_id: u64, pub seller: Address,  pub amount: i128 }
#[contracttype]
pub struct DisputeEvent  { pub transaction_id: u64, pub buyer: Address,   pub stake: i128 }
#[contracttype]
pub struct ResolveEvent  { pub transaction_id: u64, pub buyer_is_right: bool }

// ─────────────────────────────────────────────────────────────────────────────
// Data Structures
// ─────────────────────────────────────────────────────────────────────────────

/// Lifecycle stages of an escrow transaction.
///
/// Valid transitions:
///   Pending  → Shipped   (seller calls mark_as_shipped)
///   Shipped  → Disputed  (buyer calls open_dispute_with_stake)
///   Shipped  → Resolved  (buyer confirms OR auto_release_funds is triggered)
///   Disputed → Resolved  (admin rules in favor of seller)
///   Disputed → Refunded  (admin rules in favor of buyer)
#[contracttype]
#[derive(Clone, PartialEq, Eq, Debug)]
pub enum TransactionStatus {
    Pending,   // Waiting for shipment
    Shipped,   // Shipped, 24-hour countdown active
    Disputed,  // Under dispute, waiting for admin review
    Resolved,  // Finished — seller receives funds
    Refunded,  // Refunded — buyer gets funds back
}

/// The complete on-chain state of a single escrow transaction.
#[contracttype]
#[derive(Clone)]
pub struct EscrowTransaction {
    pub transaction_id:    u64,
    pub buyer:             Address,
    pub seller:            Address,
    pub amount:            i128,
    pub status:            TransactionStatus,
    /// Ledger timestamp when the seller called mark_as_shipped. Zero = not shipped.
    pub shipped_timestamp: u64,
    /// Anti-griefing stake from the buyer. Zero unless status is Disputed.
    pub stake_amount:      i128,
}

/// Global settings stored once upon initialization.
#[contracttype]
#[derive(Clone)]
pub struct Config {
    /// HyCrows treasury address; the only authority capable of resolving disputes.
    pub admin_address: Address,
    /// SAC (Stellar Asset Contract) address for XLM on the current network.
    pub token_address: Address,
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal Functions (private)
// ─────────────────────────────────────────────────────────────────────────────

/// Read global config; auto-extend TTL. Panics if not initialized.
fn get_config(env: &Env) -> Config {
    let config: Config = env
        .storage()
        .persistent()
        .get::<Symbol, Config>(&CONFIG_KEY)
        .expect("Contract not initialized. Please call initialize() first.");
    env.storage()
        .persistent()
        .extend_ttl::<Symbol>(&CONFIG_KEY, LEDGER_THRESHOLD, LEDGER_BUMP);
    config
}

/// Read transaction data; auto-extend TTL. Panics if ID does not exist.
fn get_transaction(env: &Env, transaction_id: u64) -> EscrowTransaction {
    let key = (TXN_PREFIX, transaction_id);
    let txn: EscrowTransaction = env
        .storage()
        .persistent()
        .get::<(Symbol, u64), EscrowTransaction>(&key)
        .expect("Transaction not found for the given ID.");
    env.storage()
        .persistent()
        .extend_ttl::<(Symbol, u64)>(&key, LEDGER_THRESHOLD, LEDGER_BUMP);
    txn
}

/// Save transaction to storage and auto-extend TTL.
fn save_transaction(env: &Env, txn: &EscrowTransaction) {
    let key = (TXN_PREFIX, txn.transaction_id);
    env.storage()
        .persistent()
        .set::<(Symbol, u64), EscrowTransaction>(&key, txn);
    env.storage()
        .persistent()
        .extend_ttl::<(Symbol, u64)>(&key, LEDGER_THRESHOLD, LEDGER_BUMP);
}

/// Create a token client from the SAC address in config.
fn token_client<'a>(env: &'a Env, config: &Config) -> token::Client<'a> {
    token::Client::new(env, &config.token_address)
}

// ─────────────────────────────────────────────────────────────────────────────
// Contract Definition
// ─────────────────────────────────────────────────────────────────────────────

#[contract]
pub struct HyCrowsEscrow;

#[contractimpl]
impl HyCrowsEscrow {
    // ─────────────────────────────────────────────────────────────────────
    // 1. initialize
    // ─────────────────────────────────────────────────────────────────────

    /// Initialize the contract settings for the first time.
    /// Can only be called once, right after deployment.
    ///
    /// # Arguments
    /// * `admin_address` – HyCrows treasury / admin wallet.
    /// * `token_address` – SAC contract ID for XLM on the target network.
    ///
    /// # Panics
    /// If called more than once.
    pub fn initialize(env: Env, admin_address: Address, token_address: Address) {
        assert!(
            !env.storage().persistent().has(&CONFIG_KEY),
            "Contract has already been initialized."
        );

        let config = Config { admin_address, token_address };

        env.storage()
            .persistent()
            .set::<Symbol, Config>(&CONFIG_KEY, &config);
        env.storage()
            .persistent()
            .extend_ttl::<Symbol>(&CONFIG_KEY, LEDGER_THRESHOLD, LEDGER_BUMP);
    }

    // ─────────────────────────────────────────────────────────────────────
    // 2. deposit
    // ─────────────────────────────────────────────────────────────────────

    /// Lock `amount` stroops from the buyer into the contract.
    ///
    /// The buyer must have authorized the contract to move their XLM
    /// (via SAC approval mechanism or auth envelope).
    ///
    /// # Arguments
    /// * `transaction_id` – A unique u64 ID chosen by the application/marketplace.
    /// * `buyer`          – The party depositing the funds.
    /// * `seller`         – The party providing the order/service.
    /// * `amount`         – Amount in stroops (must be > 0).
    ///
    /// # Panics
    /// * If the transaction_id is already used.
    /// * If the amount is ≤ 0.
    pub fn deposit(
        env: Env,
        transaction_id: u64,
        buyer: Address,
        seller: Address,
        amount: i128,
    ) {
        assert!(amount > 0, "Deposit amount must be greater than zero.");

        // Do not overwrite existing transactions.
        let key = (TXN_PREFIX, transaction_id);
        assert!(
            !env.storage().persistent().has(&key),
            "Transaction ID already used. Please provide a unique ID."
        );

        // Buyer must provide cryptographic proof of authorization.
        buyer.require_auth();

        let config = get_config(&env);
        let token = token_client(&env, &config);

        // Transfer XLM from buyer's account to this contract's address.
        token.transfer(&buyer, &env.current_contract_address(), &amount);

        let txn = EscrowTransaction {
            transaction_id,
            buyer:             buyer.clone(),
            seller:            seller.clone(),
            amount,
            status:            TransactionStatus::Pending,
            shipped_timestamp: 0,
            stake_amount:      0,
        };

        save_transaction(&env, &txn);

        env.events().publish(
            (symbol_short!("deposit"), transaction_id),
            DepositEvent { transaction_id, buyer, seller, amount },
        );
    }

    // ─────────────────────────────────────────────────────────────────────
    // 3. mark_as_shipped
    // ─────────────────────────────────────────────────────────────────────

    /// Mark that the seller has shipped the goods/service.
    /// This starts the 24-hour countdown timer for auto_release_funds.
    ///
    /// # Panics
    /// * If the caller is not the seller.
    /// * If the transaction status is not Pending.
    pub fn mark_as_shipped(env: Env, transaction_id: u64) {
        let mut txn = get_transaction(&env, transaction_id);

        txn.seller.require_auth();

        assert!(
            txn.status == TransactionStatus::Pending,
            "Transaction must be Pending to be marked as shipped."
        );

        txn.shipped_timestamp = env.ledger().timestamp();
        txn.status = TransactionStatus::Shipped;

        save_transaction(&env, &txn);

        env.events().publish(
            (symbol_short!("shipped"), transaction_id),
            ShippedEvent { transaction_id, shipped_timestamp: txn.shipped_timestamp },
        );
    }

    // ─────────────────────────────────────────────────────────────────────
    // 4. confirm_receipt_and_release
    // ─────────────────────────────────────────────────────────────────────

    /// Called by the buyer when satisfied with the received goods/service.
    /// Instantly releases the escrow funds to the seller.
    ///
    /// # Panics
    /// * If the caller is not the buyer.
    /// * If the transaction status is not Shipped.
    pub fn confirm_receipt_and_release(env: Env, transaction_id: u64) {
        let mut txn = get_transaction(&env, transaction_id);

        txn.buyer.require_auth();

        assert!(
            txn.status == TransactionStatus::Shipped,
            "Item must be Shipped before receipt can be confirmed."
        );

        let config = get_config(&env);
        let token = token_client(&env, &config);

        token.transfer(&env.current_contract_address(), &txn.seller, &txn.amount);

        txn.status = TransactionStatus::Resolved;
        save_transaction(&env, &txn);

        env.events().publish(
            (symbol_short!("release"), transaction_id),
            ReleaseEvent { transaction_id, seller: txn.seller, amount: txn.amount },
        );
    }

    // ─────────────────────────────────────────────────────────────────────
    // 5. auto_release_funds
    // ─────────────────────────────────────────────────────────────────────

    /// Anyone (guardian bot / seller) can trigger this after 24 hours
    /// if the buyer becomes unresponsive.
    ///
    /// # Panics
    /// * If status is not Shipped.
    /// * If the 24-hour waiting period has not elapsed.
    pub fn auto_release_funds(env: Env, transaction_id: u64) {
        let mut txn = get_transaction(&env, transaction_id);

        assert!(
            txn.status == TransactionStatus::Shipped,
            "Auto-release requires the transaction status to be Shipped."
        );

        let current_time = env.ledger().timestamp();
        let release_time = txn.shipped_timestamp + AUTO_RELEASE_DELAY_SECS;

        // >= ensures funds can be released exactly when the 24h timer expires
        assert!(
            current_time >= release_time,
            "The 24-hour waiting period has not yet elapsed. Please wait."
        );

        let config = get_config(&env);
        let token = token_client(&env, &config);

        token.transfer(&env.current_contract_address(), &txn.seller, &txn.amount);

        txn.status = TransactionStatus::Resolved;
        save_transaction(&env, &txn);

        env.events().publish(
            (symbol_short!("autorel"), transaction_id),
            AutoRelEvent { transaction_id, seller: txn.seller, amount: txn.amount },
        );
    }

    // ─────────────────────────────────────────────────────────────────────
    // 6. open_dispute_with_stake
    // ─────────────────────────────────────────────────────────────────────

    /// Buyer opens an official dispute by depositing a 2 XLM stake.
    /// The stake is slashed to the treasury if the admin rules against the buyer.
    ///
    /// # Panics
    /// * If the caller is not the buyer.
    /// * If status is not Shipped.
    pub fn open_dispute_with_stake(env: Env, transaction_id: u64) {
        let mut txn = get_transaction(&env, transaction_id);

        txn.buyer.require_auth();

        assert!(
            txn.status == TransactionStatus::Shipped,
            "A dispute can only be opened if the status is Shipped."
        );

        let config = get_config(&env);
        let token = token_client(&env, &config);

        token.transfer(
            &txn.buyer,
            &env.current_contract_address(),
            &DISPUTE_STAKE_STROOPS,
        );

        txn.stake_amount = DISPUTE_STAKE_STROOPS;
        txn.status = TransactionStatus::Disputed;

        save_transaction(&env, &txn);

        env.events().publish(
            (symbol_short!("dispute"), transaction_id),
            DisputeEvent { transaction_id, buyer: txn.buyer, stake: DISPUTE_STAKE_STROOPS },
        );
    }

    // ─────────────────────────────────────────────────────────────────────
    // 7. resolve_dispute
    // ─────────────────────────────────────────────────────────────────────

    /// Admin Only: resolve an active escrow dispute.
    ///
    /// `buyer_is_right = true`  → Refund (principal + stake) back to buyer.
    /// `buyer_is_right = false` → Funds to seller; stake slashed to treasury.
    ///
    /// # Panics
    /// * If the caller is not the admin.
    /// * If status is not Disputed.
    pub fn resolve_dispute(env: Env, transaction_id: u64, buyer_is_right: bool) {
        let config = get_config(&env);

        // Verify admin auth before reading transaction data.
        config.admin_address.require_auth();

        let mut txn = get_transaction(&env, transaction_id);

        assert!(
            txn.status == TransactionStatus::Disputed,
            "Only Disputed transactions can be resolved by the admin."
        );

        let token = token_client(&env, &config);
        let contract_addr = env.current_contract_address();

        if buyer_is_right {
            // ── BUYER WINS: refund principal + stake ──────────────────────────
            let total_refund = txn.amount + txn.stake_amount;
            token.transfer(&contract_addr, &txn.buyer, &total_refund);
            txn.status = TransactionStatus::Refunded;
        } else {
            // ── INVALID DISPUTE: pay seller + slash stake to treasury ─────────
            token.transfer(&contract_addr, &txn.seller, &txn.amount);
            token.transfer(&contract_addr, &config.admin_address, &txn.stake_amount);
            txn.status = TransactionStatus::Resolved;
        }

        save_transaction(&env, &txn);

        env.events().publish(
            (symbol_short!("resolve"), transaction_id),
            ResolveEvent { transaction_id, buyer_is_right },
        );
    }

    // ─────────────────────────────────────────────────────────────────────
    // Read-only helpers
    // ─────────────────────────────────────────────────────────────────────

    /// Retrieve full transaction data. Useful for frontends/indexers.
    pub fn get_transaction(env: Env, transaction_id: u64) -> EscrowTransaction {
        get_transaction(&env, transaction_id)
    }

    /// Retrieve global contract configuration.
    pub fn get_config(env: Env) -> Config {
        get_config(&env)
    }
}

// Attach testing module (only compiled when running `cargo test`).
#[cfg(test)]
mod test;
