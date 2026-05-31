# 🦅 HyCrows Escrow Protocol

**HyCrows** is a modern, hybrid automated escrow protocol built on the Stellar network using Soroban Smart Contracts. It facilitates secure transactions between buyers and sellers with an integrated anti-griefing staking mechanism and a decentralized dispute resolution system.

This repository contains both the **Soroban Smart Contract** (`hycrows-escrow`) and the **Next.js Dashboard** (`hycrows-dashboard`).

![HyCrows Protocol](https://img.shields.io/badge/Network-Stellar%20Testnet-blue) ![Soroban SDK](https://img.shields.io/badge/Soroban%20SDK-v26-orange) ![Next.js](https://img.shields.io/badge/Next.js-14-black)

---

## 🏗 System Architecture

The HyCrows ecosystem is composed of two main modules:

1. **`hycrows-escrow/` (Smart Contract)**
   - Written in **Rust**.
   - Built on **Soroban SDK v26** (Protocol version 26).
   - Manages the state machine of transactions (Pending → Shipped → Resolved / Disputed → Refunded).
   - Features persistent TTL extension, preventing storage archiving on the Stellar ledger.
   - Emits structured Soroban Events for easy indexing.

2. **`hycrows-dashboard/` (Frontend Application)**
   - Built with **Next.js** and **Tailwind CSS**.
   - Integrates with `@stellar/freighter-api` for seamless wallet connectivity.
   - Connects to the contract via `@stellar/stellar-sdk`.
   - Includes a real-time polling **Chat Room** for transaction participants (Buyer, Seller, Admin) to communicate off-chain.

---

## 🔄 Transaction Lifecycle (State Machine)

1. **Deposit (Pending)**: The Buyer initiates an escrow by depositing XLM. Funds are securely locked in the smart contract.
2. **Mark as Shipped (Shipped)**: The Seller fulfills the service/product and marks it as shipped. A 24-hour timer starts.
3. **Completion (Resolved)**: 
   - **Happy Path**: The Buyer confirms receipt, releasing funds to the Seller.
   - **Auto-Release**: If 24 hours pass without Buyer response, anyone can trigger `auto_release_funds` to pay the Seller.
4. **Dispute (Disputed)**: The Buyer can open a dispute by staking a **2 XLM** anti-griefing fee. Funds are frozen.
5. **Resolution (Admin Review)**: The HyCrows Treasury (Admin) reviews the case (via the Chat Room) and resolves it:
   - **Buyer Wins (Refunded)**: Buyer gets their principal deposit + the 2 XLM stake back.
   - **Seller Wins (Resolved)**: Seller receives the principal deposit. The 2 XLM stake is sent to the HyCrows Treasury.

---

## 🚀 Getting Started

### Prerequisites
- [Rust](https://rustup.rs/) (v1.84+ recommended with `wasm32v1-none` target)
- [Node.js](https://nodejs.org/) (v18+)
- [Stellar CLI](https://stellar.org/developers/stellar-cli) (v26)
- [Freighter Wallet](https://www.freighter.app/) extension installed on your browser.

### 1. Smart Contract Deployment

```bash
cd hycrows-escrow

# Add the WASM target
rustup target add wasm32v1-none

# Build the contract
cargo build --target wasm32v1-none --release

# Run unit tests
cargo test

# Deploy to Stellar Testnet (Requires a funded identity, e.g., 'deployer')
stellar contract deploy \
  --wasm target/wasm32v1-none/release/hycrows_escrow.wasm \
  --network testnet \
  --source deployer
```

After deployment, initialize the contract with the Admin address and the native XLM token address:
```bash
stellar contract invoke \
  --id <YOUR_CONTRACT_ID> \
  --network testnet \
  --source deployer \
  -- initialize \
  --admin_address <ADMIN_ADDRESS> \
  --token_address CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC
```

### 2. Running the Dashboard

```bash
cd hycrows-dashboard

# Install dependencies
npm install

# Set up your environment variables
# Edit the .env.local file and replace the NEXT_PUBLIC_CONTRACT_ID
cp .env.example .env.local

# Run the development server
npm run dev
```
Open `http://localhost:3000` in your browser to interact with the protocol.

---

## 🔒 Security & Best Practices
- **Anti-Griefing Mechanism**: The 2 XLM dispute stake deters buyers from opening frivolous disputes to stall seller payouts.
- **Strict Authorization**: `require_auth()` is strictly enforced on all state-mutating functions (`deposit`, `mark_as_shipped`, `resolve_dispute`, etc.).
- **Read-only Simulation**: The dashboard utilizes Stellar RPC simulation `simulateTransaction` for gas-free read operations (e.g., fetching transaction states).
- **Persistent Data**: The contract actively extends ledger Entry TTL limits upon reading and writing, keeping transaction records accessible for ~1 year without restoration fees.

---

## 📄 License
This project is proprietary software belonging to Duta Persada Nusantara (HyCrows Protocol).

Built with 💜 for the Stellar ecosystem.
