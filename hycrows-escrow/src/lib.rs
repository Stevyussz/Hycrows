// =============================================================================
// Protokol Escrow HyCrows – Kontrak Inti (lib.rs)
// =============================================================================
// Arsitektur   : Escrow Otomatis Hibrida dengan Staking Anti-Griefing
// Runtime      : Stellar Soroban (WebAssembly)
// SDK          : soroban-sdk v26
//
// Keputusan Desain Utama
// ──────────────────────
// • Tidak ada fungsi "payable" di Soroban; semua perpindahan XLM harus lewat
//   token::Client dari SAC (Stellar Asset Contract).
// • Timestamp buku besar (env.ledger().timestamp()) dipakai buat semua cek waktu.
// • Persistent storage menjaga data kontrak tetap aman meski ledger diarsip.
//   TTL di-extend otomatis setiap kali data dibaca/ditulis.
// • Stake Anti-Griefing (2 XLM) diambil saat ada komplain/dispute biar cuma
//   masalah serius yang diangkat. Kalau pembeli kalah, stakenya masuk ke
//   Treasury HyCrows sebagai biaya platform.
// • Setiap perubahan state diterbitkan sebagai Soroban event agar indexer dan
//   explorer bisa melacak riwayat transaksi tanpa baca storage langsung.
// =============================================================================

#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short, token, Address, Env, Symbol,
};

// ─────────────────────────────────────────────────────────────────────────────
// Konstanta
// ─────────────────────────────────────────────────────────────────────────────

/// Berapa lama (detik) penjual punya waktu setelah "dikirim" sebelum
/// auto_release_funds bisa dipanggil. 24 jam = 86.400 detik.
const AUTO_RELEASE_DELAY_SECS: u64 = 86_400;

/// Jaminan anti-griefing yang wajib ditaruh pembeli saat buka dispute.
/// 2 XLM = 20.000.000 stroops (1 XLM = 10.000.000 stroops).
const DISPUTE_STAKE_STROOPS: i128 = 20_000_000;

/// TTL Extension — 1 ledger ≈ 5 detik
/// Extend jika TTL sisa < 30 hari (~518.400 ledger).
const LEDGER_THRESHOLD: u32 = 518_400;
/// Extend hingga ~1 tahun (~6.307.200 ledger).
const LEDGER_BUMP: u32 = 6_307_200;

// ─────────────────────────────────────────────────────────────────────────────
// Kunci Penyimpanan (Storage Keys)
// ─────────────────────────────────────────────────────────────────────────────

const CONFIG_KEY: Symbol = symbol_short!("CONFIG");
const TXN_PREFIX: Symbol = symbol_short!("TXN");

// ─────────────────────────────────────────────────────────────────────────────
// Contract Events (menggunakan #[contractevent] macro — SDK v26+)
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
// Struktur Data
// ─────────────────────────────────────────────────────────────────────────────

/// Tahapan siklus hidup dari sebuah transaksi escrow.
///
/// Transisi yang valid:
///   Pending  → Shipped   (penjual panggil mark_as_shipped)
///   Shipped  → Disputed  (pembeli panggil open_dispute_with_stake)
///   Shipped  → Resolved  (pembeli konfirmasi ATAU auto_release_funds jalan)
///   Disputed → Resolved  (admin putuskan penjual menang)
///   Disputed → Refunded  (admin putuskan pembeli menang)
#[contracttype]
#[derive(Clone, PartialEq, Eq, Debug)]
pub enum TransactionStatus {
    Pending,   // Menunggu pengiriman
    Shipped,   // Sudah dikirim, timer 24 jam aktif
    Disputed,  // Dalam sengketa, admin review
    Resolved,  // Selesai — penjual dapat dana
    Refunded,  // Dikembalikan — pembeli dapat dana balik
}

/// Status lengkap satu transaksi escrow yang disimpan on-chain.
#[contracttype]
#[derive(Clone)]
pub struct EscrowTransaction {
    pub transaction_id:    u64,
    pub buyer:             Address,
    pub seller:            Address,
    pub amount:            i128,
    pub status:            TransactionStatus,
    /// Timestamp ledger saat penjual panggil mark_as_shipped. Nol = belum dikirim.
    pub shipped_timestamp: u64,
    /// Stake anti-griefing dari pembeli. Nol kecuali status Disputed.
    pub stake_amount:      i128,
}

/// Pengaturan global yang disimpan sekali saat inisialisasi.
#[contracttype]
#[derive(Clone)]
pub struct Config {
    /// Alamat treasury HyCrows; satu-satunya yang bisa memutus sengketa.
    pub admin_address: Address,
    /// Alamat SAC (Stellar Asset Contract) untuk XLM di network yang dipakai.
    pub token_address: Address,
}

// ─────────────────────────────────────────────────────────────────────────────
// Fungsi Internal (private)
// ─────────────────────────────────────────────────────────────────────────────

/// Baca config global; auto-extend TTL. Panic jika belum diinisialisasi.
fn get_config(env: &Env) -> Config {
    let config: Config = env
        .storage()
        .persistent()
        .get::<Symbol, Config>(&CONFIG_KEY)
        .expect("Kontrak belum diinisialisasi. Panggil fungsi initialize() dulu ya.");
    env.storage()
        .persistent()
        .extend_ttl::<Symbol>(&CONFIG_KEY, LEDGER_THRESHOLD, LEDGER_BUMP);
    config
}

/// Baca data transaksi; auto-extend TTL. Panic jika ID tidak ada.
fn get_transaction(env: &Env, transaction_id: u64) -> EscrowTransaction {
    let key = (TXN_PREFIX, transaction_id);
    let txn: EscrowTransaction = env
        .storage()
        .persistent()
        .get::<(Symbol, u64), EscrowTransaction>(&key)
        .expect("Transaksi gak ketemu untuk ID yang dikasih.");
    env.storage()
        .persistent()
        .extend_ttl::<(Symbol, u64)>(&key, LEDGER_THRESHOLD, LEDGER_BUMP);
    txn
}

/// Simpan transaksi ke storage dan auto-extend TTL.
fn save_transaction(env: &Env, txn: &EscrowTransaction) {
    let key = (TXN_PREFIX, txn.transaction_id);
    env.storage()
        .persistent()
        .set::<(Symbol, u64), EscrowTransaction>(&key, txn);
    env.storage()
        .persistent()
        .extend_ttl::<(Symbol, u64)>(&key, LEDGER_THRESHOLD, LEDGER_BUMP);
}

/// Buat token client dari alamat SAC di config.
fn token_client<'a>(env: &'a Env, config: &Config) -> token::Client<'a> {
    token::Client::new(env, &config.token_address)
}

// ─────────────────────────────────────────────────────────────────────────────
// Definisi Kontrak
// ─────────────────────────────────────────────────────────────────────────────

#[contract]
pub struct HyCrowsEscrow;

#[contractimpl]
impl HyCrowsEscrow {
    // ─────────────────────────────────────────────────────────────────────
    // 1. initialize
    // ─────────────────────────────────────────────────────────────────────

    /// Nyalakan pengaturan kontrak untuk pertama kalinya.
    /// Hanya boleh dipanggil sekali, tepat setelah kontrak di-deploy.
    ///
    /// # Argumen
    /// * `admin_address` – Wallet treasury / admin HyCrows.
    /// * `token_address` – ID kontrak SAC untuk XLM di jaringan tujuan.
    ///
    /// # Panics
    /// Jika dipanggil lebih dari sekali.
    pub fn initialize(env: Env, admin_address: Address, token_address: Address) {
        assert!(
            !env.storage().persistent().has(&CONFIG_KEY),
            "Eits, kontrak udah diinisialisasi sebelumnya."
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

    /// Kunci sejumlah `amount` stroops dari pembeli ke dalam kontrak.
    ///
    /// Pembeli harus sudah memberi izin ke kontrak untuk memindahkan XLM-nya
    /// (via mekanisme SAC approval atau auth envelope).
    ///
    /// # Argumen
    /// * `transaction_id` – ID u64 unik yang dipilih aplikasi/marketplace.
    /// * `buyer`          – Pihak yang menitip dana.
    /// * `seller`         – Pihak yang mengerjakan order.
    /// * `amount`         – Jumlah dalam stroops (harus > 0).
    ///
    /// # Panics
    /// * Jika transaction_id sudah dipakai.
    /// * Jika jumlah ≤ 0.
    pub fn deposit(
        env: Env,
        transaction_id: u64,
        buyer: Address,
        seller: Address,
        amount: i128,
    ) {
        assert!(amount > 0, "Jumlah deposit harus lebih dari nol dong.");

        // Jangan timpa transaksi yang sudah ada.
        let key = (TXN_PREFIX, transaction_id);
        assert!(
            !env.storage().persistent().has(&key),
            "ID Transaksi udah dipakai nih. Tolong pakai ID yang unik ya."
        );

        // Pembeli harus berikan bukti kriptografi persetujuan.
        buyer.require_auth();

        let config = get_config(&env);
        let token = token_client(&env, &config);

        // Tarik XLM dari akun pembeli ke alamat kontrak ini.
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

    /// Tandai bahwa penjual sudah mengirim barang/jasa.
    /// Ini memulai timer hitung mundur 24 jam untuk auto_release_funds.
    ///
    /// # Panics
    /// * Jika yang memanggil bukan penjual.
    /// * Jika status transaksi bukan Pending.
    pub fn mark_as_shipped(env: Env, transaction_id: u64) {
        let mut txn = get_transaction(&env, transaction_id);

        txn.seller.require_auth();

        assert!(
            txn.status == TransactionStatus::Pending,
            "Transaksinya harus berstatus Pending dulu kalau mau ditandai udah dikirim."
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

    /// Dipanggil pembeli saat puas dengan barang/jasa yang diterima.
    /// Langsung mencairkan dana escrow ke penjual.
    ///
    /// # Panics
    /// * Jika yang memanggil bukan pembeli.
    /// * Jika status transaksi bukan Shipped.
    pub fn confirm_receipt_and_release(env: Env, transaction_id: u64) {
        let mut txn = get_transaction(&env, transaction_id);

        txn.buyer.require_auth();

        assert!(
            txn.status == TransactionStatus::Shipped,
            "Barangnya harus dikirim (Shipped) dulu sebelum bisa dikonfirmasi."
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

    /// Siapapun (bot penjaga / penjual) bisa panggil ini setelah 24 jam
    /// jika pembeli tidak merespons.
    ///
    /// # Panics
    /// * Jika status bukan Shipped.
    /// * Jika waktu 24 jam belum habis.
    pub fn auto_release_funds(env: Env, transaction_id: u64) {
        let mut txn = get_transaction(&env, transaction_id);

        assert!(
            txn.status == TransactionStatus::Shipped,
            "Pencairan otomatis butuh status barangnya udah dikirim (Shipped)."
        );

        let current_time = env.ledger().timestamp();
        let release_time = txn.shipped_timestamp + AUTO_RELEASE_DELAY_SECS;

        // >= agar tepat saat 24 jam habis sudah bisa dicairkan
        assert!(
            current_time >= release_time,
            "Sabar ya, waktu tunggunya belum habis nih. Silakan tunggu bentar lagi."
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

    /// Pembeli membuka sengketa resmi dengan menyetor jaminan 2 XLM.
    /// Jaminan hangus ke treasury jika admin putuskan pembeli bersalah.
    ///
    /// # Panics
    /// * Jika yang memanggil bukan pembeli.
    /// * Jika status bukan Shipped.
    pub fn open_dispute_with_stake(env: Env, transaction_id: u64) {
        let mut txn = get_transaction(&env, transaction_id);

        txn.buyer.require_auth();

        assert!(
            txn.status == TransactionStatus::Shipped,
            "Sengketa cuma bisa dibuka kalau status barangnya udah dikirim (Shipped)."
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

    /// Khusus Admin: memutus sengketa escrow yang sedang berjalan.
    ///
    /// `buyer_is_right = true`  → Refund (modal + stake) kembali ke pembeli.
    /// `buyer_is_right = false` → Dana ke penjual; stake masuk treasury.
    ///
    /// # Panics
    /// * Jika yang memanggil bukan admin.
    /// * Jika status bukan Disputed.
    pub fn resolve_dispute(env: Env, transaction_id: u64, buyer_is_right: bool) {
        let config = get_config(&env);

        // Auth admin diperiksa sebelum data transaksi dibaca.
        config.admin_address.require_auth();

        let mut txn = get_transaction(&env, transaction_id);

        assert!(
            txn.status == TransactionStatus::Disputed,
            "Hanya transaksi yang bersengketa (Disputed) yang bisa diputus sama admin."
        );

        let token = token_client(&env, &config);
        let contract_addr = env.current_contract_address();

        if buyer_is_right {
            // ── PEMBELI MENANG: kembalikan modal + stake ──────────────────
            let total_refund = txn.amount + txn.stake_amount;
            token.transfer(&contract_addr, &txn.buyer, &total_refund);
            txn.status = TransactionStatus::Refunded;
        } else {
            // ── SENGKETA TIDAK SAH: bayar penjual + potong stake ke treasury
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

    /// Ambil data lengkap sebuah transaksi. Berguna untuk frontend/indexer.
    pub fn get_transaction(env: Env, transaction_id: u64) -> EscrowTransaction {
        get_transaction(&env, transaction_id)
    }

    /// Ambil pengaturan global kontrak.
    pub fn get_config(env: Env) -> Config {
        get_config(&env)
    }
}

// Sambungkan ke modul testing (hanya dikompilasi saat `cargo test`).
#[cfg(test)]
mod test;
