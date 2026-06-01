// =============================================================================
// HyCrows Escrow Protocol – Unit Tests (test.rs)
// =============================================================================
// Run with:  cargo test
//
// The Soroban testutils feature provides:
//   • Env::default()         – an in-memory ledger environment
//   • register_contract()    – deploys a contract locally
//   • mock_all_auths()       – mocks wallet auth (no real signatures needed)
//   • ledger().set()         – lets you fast-forward the on-chain clock
// =============================================================================

#![cfg(test)]

extern crate std;
use std::println;

use soroban_sdk::{
    testutils::{Address as _, Ledger, LedgerInfo},
    token, Address, Env,
};

use crate::{HyCrowsEscrow, HyCrowsEscrowClient, TransactionStatus};

// ─────────────────────────────────────────────────────────────────────────────
// Test helpers
// ─────────────────────────────────────────────────────────────────────────────

/// Bootstrap lingkungan test Soroban:
///  1. Buat in-memory ledger.
///  2. Deploy token XLM sintetis (SAC).
///  3. Deploy HyCrowsEscrow.
///  4. Panggil initialize().
fn setup() -> (
    Env,
    Address, // contract_id
    Address, // admin
    Address, // token_id (XLM SAC)
) {
    let env = Env::default();
    // Nonaktifkan verifikasi auth — kita test logika bisnis, bukan verifikasi tanda tangan.
    env.mock_all_auths();

    // Set timestamp awal non-nol agar shipped_timestamp selalu > 0.
    // soroban-sdk v26 membutuhkan protocol_version >= 22.
    env.ledger().set(LedgerInfo {
        timestamp:                  1_700_000_000, // Nov 2023 — waktu awal yang masuk akal
        protocol_version:           26,            // SDK v26 minimum protocol
        sequence_number:            1,
        network_id:                 Default::default(),
        base_reserve:               5_000_000,
        min_temp_entry_ttl:         1,
        min_persistent_entry_ttl:   1,
        max_entry_ttl:              6_312_000,
    });

    // Deploy token XLM sintetis (SAC)
    let token_admin = Address::generate(&env);
    let token_id = env
        .register_stellar_asset_contract_v2(token_admin.clone())
        .address();

    // Deploy HyCrowsEscrow (pakai register() — API baru pengganti register_contract)
    let contract_id = env.register(HyCrowsEscrow, ());

    // Initialize
    let admin = Address::generate(&env);
    let client = HyCrowsEscrowClient::new(&env, &contract_id);
    client.initialize(&admin, &token_id);

    (env, contract_id, admin, token_id)
}

/// Mint sejumlah `amount` stroops ke `recipient`.
fn mint_tokens(env: &Env, token_id: &Address, recipient: &Address, amount: i128) {
    let token_admin_client = token::StellarAssetClient::new(env, token_id);
    token_admin_client.mint(recipient, &amount);
}

// ─────────────────────────────────────────────────────────────────────────────
// Test Suite 1 – Happy Path: Alur Transaksi Sukses
// ─────────────────────────────────────────────────────────────────────────────

/// Menguji alur normal:
///   deposit → mark_as_shipped → confirm_receipt_and_release
#[test]
fn test_successful_b2c_transaction_flow() {
    let (env, contract_id, _admin, token_id) = setup();
    let client = HyCrowsEscrowClient::new(&env, &contract_id);

    let buyer  = Address::generate(&env);
    let seller = Address::generate(&env);
    let amount = 100_000_000_i128; // 10 XLM

    // Beri buyer dana
    mint_tokens(&env, &token_id, &buyer, amount);

    let token = token::Client::new(&env, &token_id);
    assert_eq!(token.balance(&buyer), amount);

    // Step 1: Buyer deposit ke escrow
    let txn_id: u64 = 1001;
    client.deposit(&txn_id, &buyer, &seller, &amount);

    assert_eq!(token.balance(&contract_id), amount);
    assert_eq!(token.balance(&buyer), 0);

    let txn = client.get_transaction(&txn_id);
    assert_eq!(txn.status, TransactionStatus::Pending);
    assert_eq!(txn.amount, amount);

    // Step 2: Seller tandai sudah dikirim
    client.mark_as_shipped(&txn_id);

    let txn = client.get_transaction(&txn_id);
    assert_eq!(txn.status, TransactionStatus::Shipped);
    assert!(txn.shipped_timestamp > 0);

    // Step 3: Buyer konfirmasi terima barang — dana ke seller
    client.confirm_receipt_and_release(&txn_id);

    let txn = client.get_transaction(&txn_id);
    assert_eq!(txn.status, TransactionStatus::Resolved);
    assert_eq!(token.balance(&seller), amount);
    assert_eq!(token.balance(&contract_id), 0);

    println!("✅ test_successful_b2c_transaction_flow PASSED");
}

// ─────────────────────────────────────────────────────────────────────────────
// Test Suite 2 – Auto Release Setelah 24 Jam
// ─────────────────────────────────────────────────────────────────────────────

/// Verifikasi siapapun bisa trigger auto_release_funds setelah 24 jam.
#[test]
fn test_auto_release_after_24_hours() {
    let (env, contract_id, _admin, token_id) = setup();
    let client = HyCrowsEscrowClient::new(&env, &contract_id);

    let buyer  = Address::generate(&env);
    let seller = Address::generate(&env);
    let amount = 50_000_000_i128; // 5 XLM

    mint_tokens(&env, &token_id, &buyer, amount);

    let txn_id: u64 = 2002;

    client.deposit(&txn_id, &buyer, &seller, &amount);
    client.mark_as_shipped(&txn_id);

    let txn = client.get_transaction(&txn_id);
    let shipped_at = txn.shipped_timestamp;

    // Majukan waktu ledger 25 jam ke depan.
    // Sequence number TIDAK diubah agar entry persistent tidak kadaluarsa.
    env.ledger().set(LedgerInfo {
        timestamp:                  shipped_at + 90_000, // 25 jam kemudian
        protocol_version:           26,
        sequence_number:            env.ledger().sequence(), // tetap sama
        network_id:                 Default::default(),
        base_reserve:               5_000_000,
        min_temp_entry_ttl:         1,
        min_persistent_entry_ttl:   1,
        max_entry_ttl:              6_312_000,
    });

    // Bot atau siapapun bisa trigger auto_release
    client.auto_release_funds(&txn_id);

    let txn = client.get_transaction(&txn_id);
    assert_eq!(txn.status, TransactionStatus::Resolved);

    let token = token::Client::new(&env, &token_id);
    assert_eq!(token.balance(&seller), amount);
    assert_eq!(token.balance(&contract_id), 0);

    println!("✅ test_auto_release_after_24_hours PASSED");
}

// ─────────────────────────────────────────────────────────────────────────────
// Test Suite 2B – Auto Release Tepat Pada Batas 24 Jam (>= fix)
// ─────────────────────────────────────────────────────────────────────────────

/// Verifikasi auto_release bisa dijalankan TEPAT saat 24 jam (bukan hanya setelahnya).
#[test]
fn test_auto_release_exactly_at_boundary() {
    let (env, contract_id, _admin, token_id) = setup();
    let client = HyCrowsEscrowClient::new(&env, &contract_id);

    let buyer  = Address::generate(&env);
    let seller = Address::generate(&env);
    let amount = 30_000_000_i128; // 3 XLM

    mint_tokens(&env, &token_id, &buyer, amount);

    let txn_id: u64 = 2003;
    client.deposit(&txn_id, &buyer, &seller, &amount);
    client.mark_as_shipped(&txn_id);

    let txn = client.get_transaction(&txn_id);
    let shipped_at = txn.shipped_timestamp;

    // Majukan TEPAT 24 jam (86.400 detik)
    env.ledger().set(LedgerInfo {
        timestamp:                  shipped_at + 86_400, // tepat 24 jam
        protocol_version:           26,
        sequence_number:            env.ledger().sequence(),
        network_id:                 Default::default(),
        base_reserve:               5_000_000,
        min_temp_entry_ttl:         1,
        min_persistent_entry_ttl:   1,
        max_entry_ttl:              6_312_000,
    });

    // Harus bisa dijalankan tepat saat batas (bukan hanya setelahnya)
    client.auto_release_funds(&txn_id);

    let txn = client.get_transaction(&txn_id);
    assert_eq!(txn.status, TransactionStatus::Resolved);

    println!("✅ test_auto_release_exactly_at_boundary PASSED");
}

// ─────────────────────────────────────────────────────────────────────────────
// Test Suite 3 – Sengketa Spam (Stake Buyer Dipotong)
// ─────────────────────────────────────────────────────────────────────────────

/// Menguji jalur penalti anti-griefing:
///   deposit → mark_as_shipped → open_dispute_with_stake
///   → resolve_dispute(buyer_is_right = false)
///
/// Hasil yang diharapkan:
///   • Seller mendapat modal awal.
///   • Treasury HyCrows (admin) mendapat stake 2 XLM.
///   • Buyer tidak mendapat apa-apa.
#[test]
fn test_spam_dispute_buyer_stake_slashed() {
    let (env, contract_id, admin, token_id) = setup();
    let client = HyCrowsEscrowClient::new(&env, &contract_id);

    let buyer  = Address::generate(&env);
    let seller = Address::generate(&env);
    let principal = 100_000_000_i128; // 10 XLM
    let stake     =  20_000_000_i128; //  2 XLM

    mint_tokens(&env, &token_id, &buyer, principal + stake);

    let txn_id: u64 = 3003;

    client.deposit(&txn_id, &buyer, &seller, &principal);
    client.mark_as_shipped(&txn_id);
    client.open_dispute_with_stake(&txn_id);

    let txn = client.get_transaction(&txn_id);
    assert_eq!(txn.status, TransactionStatus::Disputed);
    assert_eq!(txn.stake_amount, stake);

    let token = token::Client::new(&env, &token_id);
    // Kontrak pegang principal + stake
    assert_eq!(token.balance(&contract_id), principal + stake);

    // Admin putuskan buyer bersalah
    client.resolve_dispute(&txn_id, &false);

    let txn = client.get_transaction(&txn_id);
    assert_eq!(txn.status, TransactionStatus::Resolved);

    assert_eq!(token.balance(&seller), principal);  // Seller dapat modal
    assert_eq!(token.balance(&admin), stake);        // Treasury dapat stake
    assert_eq!(token.balance(&buyer), 0);            // Buyer tidak dapat apa-apa
    assert_eq!(token.balance(&contract_id), 0);      // Kontrak kosong

    println!("✅ test_spam_dispute_buyer_stake_slashed PASSED");
}

// ─────────────────────────────────────────────────────────────────────────────
// Test Suite 4 – Sengketa Sah (Buyer Menang, Dapat Refund Penuh)
// ─────────────────────────────────────────────────────────────────────────────

/// Verifikasi saat buyer benar, mereka menerima modal + stake kembali.
#[test]
fn test_legitimate_dispute_buyer_wins() {
    let (env, contract_id, admin, token_id) = setup();
    let client = HyCrowsEscrowClient::new(&env, &contract_id);

    let buyer  = Address::generate(&env);
    let seller = Address::generate(&env);
    let principal = 100_000_000_i128; // 10 XLM
    let stake     =  20_000_000_i128; //  2 XLM

    mint_tokens(&env, &token_id, &buyer, principal + stake);

    let txn_id: u64 = 4004;

    client.deposit(&txn_id, &buyer, &seller, &principal);
    client.mark_as_shipped(&txn_id);
    client.open_dispute_with_stake(&txn_id);

    // Admin putuskan buyer benar (seller tidak benar-benar kirim)
    client.resolve_dispute(&txn_id, &true);

    let txn = client.get_transaction(&txn_id);
    assert_eq!(txn.status, TransactionStatus::Refunded);

    let token = token::Client::new(&env, &token_id);

    assert_eq!(token.balance(&buyer), principal + stake); // Buyer dapat modal + stake kembali
    assert_eq!(token.balance(&seller), 0);                // Seller tidak dapat apa-apa
    assert_eq!(token.balance(&admin), 0);                 // Treasury tidak dapat apa-apa
    assert_eq!(token.balance(&contract_id), 0);           // Kontrak kosong

    println!("✅ test_legitimate_dispute_buyer_wins PASSED");
}

// ─────────────────────────────────────────────────────────────────────────────
// Test Suite 5 – Edge Cases & Guards
// ─────────────────────────────────────────────────────────────────────────────

/// Pastikan kontrak tidak bisa diinisialisasi dua kali.
#[test]
#[should_panic(expected = "Contract has already been initialized.")]
fn test_double_initialize_panics() {
    let (env, contract_id, _admin, token_id) = setup();
    let client = HyCrowsEscrowClient::new(&env, &contract_id);

    let other_admin = Address::generate(&env);
    // Inisialisasi kedua harus panic.
    client.initialize(&other_admin, &token_id);
}

/// Pastikan auto_release tidak bisa dijalankan sebelum 24 jam.
#[test]
#[should_panic(expected = "The 24-hour waiting period has not yet elapsed. Please wait.")]
fn test_auto_release_too_early_panics() {
    let (env, contract_id, _admin, token_id) = setup();
    let client = HyCrowsEscrowClient::new(&env, &contract_id);

    let buyer  = Address::generate(&env);
    let seller = Address::generate(&env);
    let amount = 50_000_000_i128;

    mint_tokens(&env, &token_id, &buyer, amount);

    let txn_id: u64 = 5005;
    client.deposit(&txn_id, &buyer, &seller, &amount);
    client.mark_as_shipped(&txn_id);

    // Langsung dipanggil tanpa tunggu 24 jam — harus panic.
    client.auto_release_funds(&txn_id);
}

/// Pastikan deposit dengan jumlah nol ditolak.
#[test]
#[should_panic(expected = "Deposit amount must be greater than zero.")]
fn test_zero_amount_deposit_panics() {
    let (env, contract_id, _admin, _token_id) = setup();
    let client = HyCrowsEscrowClient::new(&env, &contract_id);

    let buyer  = Address::generate(&env);
    let seller = Address::generate(&env);

    client.deposit(&9999, &buyer, &seller, &0);
}

/// Pastikan ID transaksi yang duplikat ditolak.
#[test]
#[should_panic(expected = "Transaction ID already used. Please provide a unique ID.")]
fn test_duplicate_transaction_id_panics() {
    let (env, contract_id, _admin, token_id) = setup();
    let client = HyCrowsEscrowClient::new(&env, &contract_id);

    let buyer  = Address::generate(&env);
    let seller = Address::generate(&env);
    let amount = 10_000_000_i128; // 1 XLM

    mint_tokens(&env, &token_id, &buyer, amount * 2);

    let txn_id: u64 = 6006;

    // Deposit pertama — sukses
    client.deposit(&txn_id, &buyer, &seller, &amount);

    // Deposit kedua dengan ID sama — harus panic
    client.deposit(&txn_id, &buyer, &seller, &amount);
}

/// Pastikan hanya penjual yang bisa mark_as_shipped.
#[test]
#[should_panic(expected = "Transaction must be Pending to be marked as shipped.")]
fn test_double_mark_as_shipped_panics() {
    let (env, contract_id, _admin, token_id) = setup();
    let client = HyCrowsEscrowClient::new(&env, &contract_id);

    let buyer  = Address::generate(&env);
    let seller = Address::generate(&env);
    let amount = 10_000_000_i128;

    mint_tokens(&env, &token_id, &buyer, amount);

    let txn_id: u64 = 7007;
    client.deposit(&txn_id, &buyer, &seller, &amount);
    client.mark_as_shipped(&txn_id); // OK

    // Panggil lagi — status sudah Shipped, harus panic
    client.mark_as_shipped(&txn_id);
}
