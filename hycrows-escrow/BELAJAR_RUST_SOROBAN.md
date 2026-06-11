# 📚 Belajar Rust & Soroban — dari Kode HyCrows Escrow

> Dokumen ini menjelaskan **setiap baris kode** dari `src/lib.rs` dengan bahasa
> yang mudah dipahami. Cocok untuk pemula Rust maupun yang baru belajar Soroban.

---

## 🧭 Daftar Isi

1. [Apa itu Soroban?](#1-apa-itu-soroban)
2. [Struktur File Proyek](#2-struktur-file-proyek)
3. [Baris Pertama — `#![no_std]`](#3-baris-pertama--no_std)
4. [Import / `use`](#4-import--use)
5. [Constants — Angka Ajaib yang Dinamai](#5-constants)
6. [Storage Keys](#6-storage-keys)
7. [Data Structures](#7-data-structures)
8. [Helper Functions (Private)](#8-helper-functions-private)
9. [Fungsi-Fungsi Contract](#9-fungsi-fungsi-contract)
   - [initialize](#91-initialize)
   - [deposit](#92-deposit)
   - [mark_as_shipped](#93-mark_as_shipped)
   - [confirm_receipt_and_release](#94-confirm_receipt_and_release)
   - [auto_release_funds](#95-auto_release_funds)
   - [open_dispute_with_stake](#96-open_dispute_with_stake)
   - [resolve_dispute](#97-resolve_dispute)
10. [Unit Tests — `src/test.rs`](#10-unit-tests)
11. [Cara Berpikir "State Machine"](#11-state-machine)
12. [Konsep Rust yang Perlu Dipahami](#12-konsep-rust-penting)

---

## 1. Apa itu Soroban?

**Soroban** adalah platform smart contract milik jaringan **Stellar**.

```
Stellar = blockchain pembayaran cepat & murah
Soroban = lapisan kontrak pintar di atas Stellar (seperti Ethereum punya Solidity)
```

Smart contract Soroban ditulis dalam **Rust**, lalu dikompilasi ke **WebAssembly
(WASM)** — format biner yang bisa dijalankan di mana saja.

### Perbedaan Soroban vs Ethereum/Solidity

| Fitur | Ethereum (Solidity) | Soroban (Rust) |
|---|---|---|
| Bahasa | Solidity | Rust |
| Transfer token | `payable` / `msg.value` | Token SAC Client |
| Waktu | `block.timestamp` | `env.ledger().timestamp()` |
| Storage | `mapping` | Persistent / Temporary |
| Gas fee | Ether (ETH) | Lumens (XLM) |

> 💡 **Kunci penting**: Di Soroban, **tidak ada `payable`**. Semua transfer
> token harus dilakukan secara eksplisit lewat `token::Client`.

---

## 2. Struktur File Proyek

```
hycrows-escrow/
├── Cargo.toml          ← manifest proyek Rust (seperti package.json di Node)
├── .cargo/
│   └── config.toml     ← konfigurasi target build (wasm32v1-none)
└── src/
    ├── lib.rs          ← 🧠 OTAK CONTRACT — semua logika bisnis ada di sini
    └── test.rs         ← unit tests
```

**`Cargo.toml`** — manifest proyek:
```toml
[package]
name = "hycrows-escrow"
version = "0.1.0"

[lib]
crate-type = ["cdylib", "rlib"]
# cdylib = compile ke .wasm untuk deploy
# rlib   = compile ke library Rust untuk unit tests

[dependencies]
soroban-sdk = { version = "26.0.0", features = ["alloc"] }
# soroban-sdk adalah "framework" untuk membuat smart contract Soroban

[dev-dependencies]
soroban-sdk = { version = "26.0.0", features = ["testutils"] }
# testutils hanya dipakai saat testing, tidak masuk ke WASM production
```

---

## 3. Baris Pertama — `#![no_std]`

```rust
#![no_std]
```

**Artinya**: "Jangan gunakan standard library Rust (`std`)."

Kenapa? Karena WASM yang berjalan di blockchain **tidak punya sistem operasi**.
Tidak ada filesystem, tidak ada network, tidak ada thread. Soroban SDK
menyediakan penggantinya.

> 💡 Bayangkan ini seperti menulis program untuk microcontroller (Arduino),
> bukan komputer biasa.

---

## 4. Import / `use`

```rust
use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short,
    token, Address, Env, Symbol,
};
```

Ini seperti `import` di JavaScript. Kita ambil hal-hal yang kita butuhkan dari SDK:

| Nama | Fungsi |
|---|---|
| `contract` | Macro untuk menandai struct sebagai smart contract |
| `contractimpl` | Macro untuk menandai implementasi fungsi-fungsi contract |
| `contracttype` | Macro untuk membuat tipe data yang bisa disimpan di blockchain |
| `symbol_short!` | Membuat "string pendek" yang efisien untuk storage key |
| `token` | Module untuk berinteraksi dengan token XLM (SAC) |
| `Address` | Tipe data untuk alamat wallet/contract di Stellar |
| `Env` | Objek lingkungan — pintu masuk ke semua fitur Soroban |
| `Symbol` | String pendek yang bisa disimpan di storage blockchain |

---

## 5. Constants

```rust
const AUTO_RELEASE_DELAY_SECS: u64 = 86_400;
```

- `const` = nilai yang tidak bisa berubah (seperti `const` di JS/TS)
- `u64` = tipe bilangan bulat positif 64-bit (0 hingga ~18 triliun)
- `86_400` = 24 jam dalam detik (60 × 60 × 24)
- Underscore `_` di angka hanya untuk keterbacaan, bukan bagian dari nilai

```rust
const DISPUTE_STAKE_STROOPS: i128 = 20_000_000;
```

- `i128` = bilangan bulat 128-bit, bisa negatif (dipakai untuk jumlah token)
- **Stroop** = unit terkecil XLM, seperti "satoshi" di Bitcoin
- `10_000_000 stroops = 1 XLM`, jadi `20_000_000 = 2 XLM`

> 💡 Kenapa `i128`? Karena jumlah token di blockchain bisa sangat besar dan
> Soroban menggunakan `i128` sebagai standar untuk semua nilai token.

---

## 6. Storage Keys

```rust
const CONFIG_KEY: Symbol = symbol_short!("CONFIG");
const TXN_PREFIX: Symbol = symbol_short!("TXN");
```

Blockchain Soroban menyimpan data dalam bentuk **key-value store** (seperti
`localStorage` di browser, tapi permanen di blockchain).

- `CONFIG_KEY` = kunci untuk menyimpan konfigurasi global contract
- `TXN_PREFIX` = awalan kunci untuk setiap transaksi

Contoh key transaksi yang tersimpan:
```
("TXN", 1001) → data transaksi ID 1001
("TXN", 1002) → data transaksi ID 1002
"CONFIG"      → konfigurasi admin + token address
```

---

## 7. Data Structures

### `TransactionStatus` — State Machine Transaksi

```rust
#[contracttype]           // ← Macro: "tipe ini bisa disimpan di blockchain"
#[derive(Clone, PartialEq, Eq, Debug)]
pub enum TransactionStatus {
    Pending,    // Baru dibuat, menunggu seller kirim barang
    Shipped,    // Seller sudah kirim, timer 24 jam mulai
    Disputed,   // Buyer membuka sengketa
    Resolved,   // Selesai: seller dapat uang
    Refunded,   // Selesai: buyer dapat uang kembali
}
```

**`enum`** di Rust seperti "pilihan eksklusif" — sebuah transaksi hanya bisa
berada di SATU status pada satu waktu.

**`#[derive(...)]`** = "tolong Rust auto-generate fitur ini untuk saya":
- `Clone` = bisa di-copy
- `PartialEq` + `Eq` = bisa dibandingkan dengan `==`
- `Debug` = bisa di-print untuk debugging

### `EscrowTransaction` — Data Satu Transaksi

```rust
#[contracttype]
#[derive(Clone)]
pub struct EscrowTransaction {
    pub transaction_id: u64,      // ID unik
    pub buyer: Address,           // Alamat pembeli
    pub seller: Address,          // Alamat penjual
    pub amount: i128,             // Jumlah XLM (dalam stroops)
    pub status: TransactionStatus,// Status sekarang
    pub shipped_timestamp: u64,   // Waktu kirim (unix timestamp)
    pub stake_amount: i128,       // Jumlah stake dispute (0 jika belum dispute)
}
```

**`struct`** di Rust seperti `interface` di TypeScript — kumpulan field dengan tipe.

> 💡 Analoginya: `struct` ini adalah "baris database" untuk satu transaksi escrow.

### `Config` — Konfigurasi Global

```rust
#[contracttype]
#[derive(Clone)]
pub struct Config {
    pub admin_address: Address,  // Alamat admin/treasury HyCrows
    pub token_address: Address,  // Alamat SAC contract XLM
}
```

---

## 8. Helper Functions (Private)

Fungsi-fungsi ini bersifat **private** (tidak `pub`) — hanya bisa dipanggil
dari dalam contract, tidak dari luar.

### `get_config`

```rust
fn get_config(env: &Env) -> Config {
    env.storage()
        .persistent()                           // gunakan Persistent storage
        .get::<Symbol, Config>(&CONFIG_KEY)     // ambil dengan key CONFIG_KEY
        .expect("Contract not initialized.")    // panic jika tidak ada
}
```

**Penjelasan sintaks Rust**:
- `fn` = function (seperti `function` di JS)
- `env: &Env` = parameter `env` bertipe referensi ke `Env` (`&` = borrow/pinjam)
- `-> Config` = return type adalah `Config`
- `.get::<Symbol, Config>` = generic function, artinya "key-nya Symbol, value-nya Config"
- `.expect("pesan")` = kalau `None` (tidak ditemukan), panic dengan pesan ini

### `get_transaction`

```rust
fn get_transaction(env: &Env, transaction_id: u64) -> EscrowTransaction {
    let key = (TXN_PREFIX, transaction_id);  // Buat tuple sebagai composite key
    env.storage()
        .persistent()
        .get::<(Symbol, u64), EscrowTransaction>(&key)
        .expect("Transaction not found.")
}
```

- `let key = (TXN_PREFIX, transaction_id)` = membuat **tuple** (pasangan nilai)
- Tuple ini jadi kunci unik: `("TXN", 1001)`

### `save_transaction`

```rust
fn save_transaction(env: &Env, txn: &EscrowTransaction) {
    let key = (TXN_PREFIX, txn.transaction_id);
    env.storage()
        .persistent()
        .set::<(Symbol, u64), EscrowTransaction>(&key, txn);
}
```

- `.set(key, value)` = simpan ke storage (seperti `localStorage.setItem`)

### `token_client`

```rust
fn token_client<'a>(env: &'a Env, config: &Config) -> token::Client<'a> {
    token::Client::new(env, &config.token_address)
}
```

- Membuat "klien" untuk berinteraksi dengan token XLM
- `<'a>` = **lifetime annotation** (konsep unik Rust, lihat bagian 12)

---

## 9. Fungsi-Fungsi Contract

```rust
#[contract]
pub struct HyCrowsEscrow;   // Nama contract kita (struct kosong)

#[contractimpl]
impl HyCrowsEscrow {
    // semua fungsi publik di sini
}
```

- `#[contract]` = "struct ini adalah smart contract"
- `impl HyCrowsEscrow { }` = implementasi fungsi-fungsi untuk struct ini

### 9.1 `initialize`

```rust
pub fn initialize(env: Env, admin_address: Address, token_address: Address) {
    // Guard: cek apakah sudah pernah diinisialisasi
    assert!(
        !env.storage().persistent().has(&CONFIG_KEY),
        "Contract is already initialized."
    );

    let config = Config { admin_address, token_address };

    env.storage()
        .persistent()
        .set::<Symbol, Config>(&CONFIG_KEY, &config);
}
```

**Alur**:
1. Cek: kalau `CONFIG_KEY` sudah ada di storage → **panic** (tidak bisa init ulang)
2. Buat `Config` dengan admin dan token address
3. Simpan ke persistent storage

**`assert!(kondisi, pesan)`** = kalau kondisi `false`, langsung stop dan
lempar error dengan pesan itu. Seperti `if (!kondisi) throw new Error(pesan)`.

### 9.2 `deposit`

```rust
pub fn deposit(env: Env, transaction_id: u64, buyer: Address, seller: Address, amount: i128) {
    // Validasi input
    assert!(amount > 0, "Deposit amount must be positive.");

    // Cegah duplikasi transaction ID
    let key = (TXN_PREFIX, transaction_id);
    assert!(!env.storage().persistent().has(&key), "Transaction ID already exists.");

    // ⭐ PENTING: Verifikasi tanda tangan kriptografi buyer
    buyer.require_auth();

    let config = get_config(&env);
    let token = token_client(&env, &config);

    // Transfer XLM dari buyer ke contract
    token.transfer(&buyer, &env.current_contract_address(), &amount);

    // Simpan data transaksi baru
    let txn = EscrowTransaction {
        transaction_id,
        buyer,
        seller,
        amount,
        status: TransactionStatus::Pending,
        shipped_timestamp: 0,
        stake_amount: 0,
    };
    save_transaction(&env, &txn);
}
```

**Kunci penting: `buyer.require_auth()`**

Ini memverifikasi bahwa transaksi blockchain ini benar-benar **ditandatangani
oleh private key milik buyer**. Tanpa ini, siapa saja bisa deposit atas nama
orang lain!

Di Soroban, authorization = tanda tangan kriptografi. Berbeda dengan Ethereum
di mana `msg.sender` otomatis diverifikasi.

### 9.3 `mark_as_shipped`

```rust
pub fn mark_as_shipped(env: Env, transaction_id: u64) {
    let mut txn = get_transaction(&env, transaction_id);
    //  ^^^
    //  `mut` = kita akan mengubah nilai txn ini

    txn.seller.require_auth();  // Hanya seller yang boleh panggil

    assert!(txn.status == TransactionStatus::Pending, "...");

    txn.shipped_timestamp = env.ledger().timestamp(); // Catat waktu kirim
    txn.status = TransactionStatus::Shipped;

    save_transaction(&env, &txn);
}
```

- `let mut txn` = `mut` artinya variabel ini **bisa diubah**
- Di Rust, variabel **immutable (tidak bisa diubah) secara default!**
- `env.ledger().timestamp()` = waktu sekarang di blockchain (unix timestamp)

### 9.4 `confirm_receipt_and_release`

```rust
pub fn confirm_receipt_and_release(env: Env, transaction_id: u64) {
    let mut txn = get_transaction(&env, transaction_id);
    txn.buyer.require_auth();

    assert!(txn.status == TransactionStatus::Shipped, "...");

    let config = get_config(&env);
    let token = token_client(&env, &config);

    // Transfer dari contract → seller
    token.transfer(&env.current_contract_address(), &txn.seller, &txn.amount);

    txn.status = TransactionStatus::Resolved;
    save_transaction(&env, &txn);
}
```

**Alur uang**:
```
Buyer → [deposit] → Contract → [confirm] → Seller
```

### 9.5 `auto_release_funds`

```rust
pub fn auto_release_funds(env: Env, transaction_id: u64) {
    let mut txn = get_transaction(&env, transaction_id);

    assert!(txn.status == TransactionStatus::Shipped, "...");

    let current_time = env.ledger().timestamp();
    let release_time = txn.shipped_timestamp + AUTO_RELEASE_DELAY_SECS;

    assert!(current_time > release_time, "Auto-release window has not elapsed yet.");

    // ... transfer ke seller ...
}
```

**Tidak ada `require_auth()`** di sini — artinya **siapa saja** boleh panggil
fungsi ini! Ini disebut "permissionless" / "trustless".

Contoh use case: Bot otomatis (keeper bot) yang memantau semua transaksi dan
memanggil auto_release saat waktunya tiba.

### 9.6 `open_dispute_with_stake`

```rust
pub fn open_dispute_with_stake(env: Env, transaction_id: u64) {
    let mut txn = get_transaction(&env, transaction_id);
    txn.buyer.require_auth();

    assert!(txn.status == TransactionStatus::Shipped, "...");

    let config = get_config(&env);
    let token = token_client(&env, &config);

    // Buyer harus bayar 2 XLM sebagai "jaminan serius"
    token.transfer(
        &txn.buyer,
        &env.current_contract_address(),
        &DISPUTE_STAKE_STROOPS,  // 20_000_000 stroops = 2 XLM
    );

    txn.stake_amount = DISPUTE_STAKE_STROOPS;
    txn.status = TransactionStatus::Disputed;

    save_transaction(&env, &txn);
}
```

**Kenapa ada stake 2 XLM?**

Ini adalah **Anti-Griefing Mechanism**. Tanpa stake, buyer bisa dengan mudah
membuka dispute spam untuk menunda pembayaran ke seller. Dengan stake:

- Buyer serius → dispute valid → stake dikembalikan (+ uang balik)
- Buyer spam   → dispute gagal → stake disita oleh treasury (penalty)

### 9.7 `resolve_dispute`

```rust
pub fn resolve_dispute(env: Env, transaction_id: u64, buyer_is_right: bool) {
    let config = get_config(&env);
    config.admin_address.require_auth(); // HANYA ADMIN yang boleh

    let mut txn = get_transaction(&env, transaction_id);
    assert!(txn.status == TransactionStatus::Disputed, "...");

    let token = token_client(&env, &config);
    let contract_addr = env.current_contract_address();

    if buyer_is_right {
        // Buyer menang: kembalikan principal + stake
        let total_refund = txn.amount + txn.stake_amount;
        token.transfer(&contract_addr, &txn.buyer, &total_refund);
        txn.status = TransactionStatus::Refunded;
    } else {
        // Seller menang: bayar seller, sita stake ke treasury
        token.transfer(&contract_addr, &txn.seller, &txn.amount);
        token.transfer(&contract_addr, &config.admin_address, &txn.stake_amount);
        txn.status = TransactionStatus::Resolved;
    }

    save_transaction(&env, &txn);
}
```

**`if/else`** di Rust sama seperti bahasa lain. Tapi perhatikan:
- Tidak ada kurung `()` di kondisi (beda dengan C/Java)
- Blok `{ }` selalu wajib

---

## 10. Unit Tests

File `src/test.rs` berisi 7 test yang memvalidasi semua skenario.

### Setup Helper

```rust
fn setup() -> (Env, Address, Address, Address) {
    let env = Env::default();      // Buat blockchain simulasi di memori
    env.mock_all_auths();          // Simulasi semua tanda tangan (bypass signature)

    // Set waktu awal = Nov 2023 (non-zero supaya shipped_timestamp > 0)
    env.ledger().set(LedgerInfo {
        timestamp: 1_700_000_000,
        protocol_version: 21,
        // ...
    });

    // Deploy token SAC simulasi
    let token_admin = Address::generate(&env);
    let token_id = env.register_stellar_asset_contract_v2(token_admin.clone()).address();

    // Deploy HyCrowsEscrow
    let contract_id = env.register_contract(None, HyCrowsEscrow);

    // Initialize
    let admin = Address::generate(&env);
    let client = HyCrowsEscrowClient::new(&env, &contract_id);
    client.initialize(&admin, &token_id);

    (env, contract_id, admin, token_id)
}
```

**`HyCrowsEscrowClient`** adalah kode yang **di-auto-generate** oleh
`#[contractimpl]` — kita tidak perlu membuatnya manual. SDK membuatkan
"client" yang bisa memanggil setiap fungsi contract.

### Contoh Test

```rust
#[test]
fn test_successful_b2c_transaction_flow() {
    let (env, contract_id, _admin, token_id) = setup();
    let client = HyCrowsEscrowClient::new(&env, &contract_id);

    let buyer  = Address::generate(&env);
    let seller = Address::generate(&env);
    let amount = 100_000_000_i128; // 10 XLM

    mint_tokens(&env, &token_id, &buyer, amount); // Beri buyer 10 XLM test

    // Deposit
    client.deposit(&1001, &buyer, &seller, &amount);
    // Mark shipped
    client.mark_as_shipped(&1001);
    // Confirm
    client.confirm_receipt_and_release(&1001);

    // Verifikasi: seller dapat uang
    let token = token::Client::new(&env, &token_id);
    assert_eq!(token.balance(&seller), amount); // ✅
}
```

**`assert_eq!(kiri, kanan)`** = pastikan kiri == kanan, kalau tidak → test gagal.

---

## 11. State Machine

Contract ini menggunakan pola **State Machine** — sistem yang memiliki
"status" terdefinisi dan transisi yang diizinkan.

```
                    [deposit]
                       │
                    PENDING
                       │
               [mark_as_shipped]
                       │
                    SHIPPED ──────────────────┐
                   /       \                  │
    [confirm] /               \ [dispute]     │ [auto_release]
             /                 \              │  (setelah 24 jam)
        RESOLVED             DISPUTED         │
        (seller ✅)          (admin review)   │
                            /         \       │
               [buyer_right=true]  [buyer_right=false]
                          /                   \
                    REFUNDED              RESOLVED
                    (buyer ✅)           (seller ✅, stake → treasury)
```

Kenapa ini penting? Karena setiap fungsi hanya boleh dipanggil pada status
tertentu. Ini mencegah:
- Seller "kirim" barang yang belum pernah di-deposit
- Buyer konfirmasi yang belum di-shipped
- Admin resolve dispute yang belum ada

---

## 12. Konsep Rust Penting

### Ownership & Borrowing

Rust punya sistem unik: setiap nilai punya **satu pemilik**. Saat kamu "pinjam"
nilai dengan `&`, nilai itu tidak berpindah pemilik.

```rust
// Tanpa &: nilai PINDAH (moved), variabel asli tidak bisa dipakai lagi
let config = get_config(env);        // env dipindah ke fungsi!
let config2 = get_config(env);       // ❌ ERROR: env sudah dipindah

// Dengan &: nilai DIPINJAM, variabel asli masih bisa dipakai
let config = get_config(&env);       // env dipinjam
let config2 = get_config(&env);      // ✅ OK: env masih ada
```

### `Option` dan `Result`

Rust tidak punya `null`. Sebagai gantinya ada `Option<T>`:

```rust
// Option<T> = bisa Some(nilai) atau None
let nilai: Option<i32> = Some(42);
let kosong: Option<i32> = None;

// Ambil nilainya:
nilai.unwrap()              // panic kalau None
nilai.expect("pesan error") // panic dengan pesan custom kalau None
nilai.unwrap_or(0)          // return 0 kalau None
```

### `mut` — Mutability

```rust
let x = 5;       // immutable, tidak bisa diubah
// x = 10;       // ❌ ERROR!

let mut y = 5;   // mutable, bisa diubah
y = 10;          // ✅ OK
```

Di Soroban, hampir semua data dari storage perlu `let mut` kalau mau diubah.

### Lifetime `<'a>`

```rust
fn token_client<'a>(env: &'a Env, config: &Config) -> token::Client<'a> { ... }
```

`'a` adalah **lifetime** — Rust memastikan `token::Client` tidak hidup lebih
lama dari `env`. Ini mencegah dangling pointer (referensi ke memori yang sudah
bebas).

Untuk pemula: **abaikan dulu**, compiler akan memberitahu kapan perlu ditambahkan.

---

## 📖 Resource Belajar Lanjut

| Topik | Link |
|---|---|
| Rust dasar | https://doc.rust-lang.org/book/ |
| Soroban docs | https://developers.stellar.org/docs/smart-contracts |
| Soroban contoh | https://github.com/stellar/soroban-examples |
| Stellar Expert | https://stellar.expert/explorer/testnet |
| Stellar Lab (UI) | https://lab.stellar.org |

---

## 🎯 Ringkasan Alur HyCrows

```
1. Admin deploy contract ke blockchain
2. Admin panggil initialize(admin_addr, xlm_sac_addr)
3. Marketplace buat transaksi:
   a. Buyer panggil deposit(txn_id, buyer, seller, amount)
   b. Seller kirim barang → panggil mark_as_shipped(txn_id)
   c. Buyer terima barang → panggil confirm_receipt_and_release(txn_id)
      ATAU
   c'. Buyer tidak konfirmasi 24 jam → siapapun panggil auto_release_funds(txn_id)
      ATAU
   c''. Buyer tidak puas → panggil open_dispute_with_stake(txn_id) + bayar 2 XLM
       → Admin review → panggil resolve_dispute(txn_id, buyer_is_right)
```

Selesai! Uang sudah di tangan yang tepat, transaksi tercatat permanen di blockchain. 🎉
