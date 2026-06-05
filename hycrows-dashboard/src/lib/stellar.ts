// src/lib/stellar.ts
// Semua logic untuk berinteraksi dengan Stellar network & HyCrows contract

import {
  Account,
  Contract,
  rpc,
  TransactionBuilder,
  BASE_FEE,
  Address,
  nativeToScVal,
  scValToNative,
  xdr,
} from "@stellar/stellar-sdk";

// ─── Config ──────────────────────────────────────────────────────────────────
export const CONTRACT_ID         = process.env.NEXT_PUBLIC_CONTRACT_ID_V2 || "CATBRQ6RQII3MZDEPIS4GB7RLAXKREC3AUSOSJMDHZDJPF6YBZYDRJUC";
export const RPC_URL             = process.env.NEXT_PUBLIC_STELLAR_RPC_URL || "https://mainnet.stellar.validationcloud.io/v1/soroban";
export const NETWORK_PASSPHRASE  = process.env.NEXT_PUBLIC_STELLAR_PASSPHRASE || "Public Global Stellar Network ; September 2015";
export const XLM_SAC             = process.env.NEXT_PUBLIC_XLM_SAC || "CAS3J7GYLGXMF6TDJBBYYSE3HQ6BBSMLNUQ34T6TZMYMW2EVH34XOWMA";
export const ADMIN_ADDRESS       = process.env.NEXT_PUBLIC_ADMIN_ADDRESS_V2 || "GD3MANCVQZ35HURGSOV6LBF7IP4SU3IPGISHNM3237MCE4IO4NALZC54";

export const IS_MAINNET          = (process.env.NEXT_PUBLIC_STELLAR_NETWORK || "mainnet") === "mainnet";
export const EXPLORER_BASE_URL   = IS_MAINNET ? "https://stellar.expert/explorer/public" : "https://stellar.expert/explorer/testnet";
export const LAB_BASE_URL        = IS_MAINNET ? "https://lab.stellar.org/r/public" : "https://lab.stellar.org/r/testnet";

// 1 XLM = 10_000_000 stroops
export const XLM_DECIMALS = 7;
export const ONE_XLM      = 10_000_000n;

// ─── Types (mirror dari Rust struct) ─────────────────────────────────────────

export type TxStatus =
  | "Pending"
  | "Shipped"
  | "Disputed"
  | "Resolved"
  | "Refunded";

export interface EscrowTransaction {
  transaction_id:    bigint;
  buyer:             string;
  seller:            string;
  amount:            bigint;
  status:            TxStatus;
  shipped_timestamp: bigint;
  stake_amount:      bigint;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Konversi stroops → XLM string dengan 2 desimal */
export function stroopsToXlm(stroops: bigint): string {
  const xlm = Number(stroops) / 1e7;
  return xlm.toFixed(2);
}

/** Konversi XLM float → stroops bigint */
export function xlmToStroops(xlm: number): bigint {
  return BigInt(Math.round(xlm * 1e7));
}

/** Format unix timestamp (detik) → string lokal */
export function formatTimestamp(ts: bigint): string {
  if (ts === 0n) return "—";
  return new Date(Number(ts) * 1000).toLocaleString("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

/** Status → kelas warna badge */
export const STATUS_COLOR: Record<TxStatus, string> = {
  Pending:  "bg-amber-100 text-amber-800 border-amber-200",
  Shipped:  "bg-blue-100 text-blue-800 border-blue-200",
  Disputed: "bg-red-100 text-red-800 border-red-200",
  Resolved: "bg-emerald-100 text-emerald-800 border-emerald-200",
  Refunded: "bg-purple-100 text-purple-800 border-purple-200",
};

/** Cek apakah transaksi sudah selesai (tidak bisa diapa-apain lagi) */
export function isFinalStatus(status: TxStatus): boolean {
  return status === "Resolved" || status === "Refunded";
}

// ─── RPC Client ──────────────────────────────────────────────────────────────

function getRpc(): rpc.Server {
  return new rpc.Server(RPC_URL, { allowHttp: false });
}

// ─── READ: XLM Balance via Horizon ───────────────────────────────────────────

/**
 * Fetch native XLM balance for a given Stellar address using Horizon API.
 * Returns balance as a formatted string (e.g. "9,842.50") or "0.00" on error.
 */
export async function fetchXlmBalance(address: string): Promise<string> {
  try {
    const network = process.env.NEXT_PUBLIC_STELLAR_NETWORK || "mainnet";
    const horizonUrl = network === "testnet"
      ? "https://horizon-testnet.stellar.org"
      : "https://horizon.stellar.org";

    const res = await fetch(`${horizonUrl}/accounts/${address}`);
    if (!res.ok) return "0.00";

    const data = await res.json();
    const native = (data.balances as Array<{ asset_type: string; balance: string }>)
      ?.find((b) => b.asset_type === "native");

    if (!native) return "0.00";
    return parseFloat(native.balance).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  } catch {
    return "0.00";
  }
}

// ─── READ: get_transaction ───────────────────────────────────────────────────

/**
 * Fetch data transaksi escrow dari kontrak (read-only simulation).
 * Tidak memerlukan akun yang didanai karena hanya simulasi.
 */
export async function fetchTransaction(
  txnId: number
): Promise<EscrowTransaction | null> {
  try {
    const server   = getRpc();
    const contract = new Contract(CONTRACT_ID);

    const op = contract.call(
      "get_transaction",
      nativeToScVal(BigInt(txnId), { type: "u64" })
    );

    // Untuk simulasi read-only, sequence number tidak penting.
    // Kita pakai dummy Account agar tidak bergantung pada ADMIN_ADDRESS terdanai.
    const sourceAccount = new Account(ADMIN_ADDRESS, "0");

    const tx = new TransactionBuilder(sourceAccount, {
      fee:              BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(op)
      .setTimeout(30)
      .build();

    const result = await server.simulateTransaction(tx);

    if (!result || "error" in result) {
      console.error("Simulation error:", (result as { error: string }).error);
      return null;
    }

    const returnVal = result.result?.retval;
    if (!returnVal) return null;

    const native = scValToNative(returnVal) as Record<string, unknown>;

    const map: Record<string, TxStatus> = {
      "0": "Pending", "1": "Shipped", "2": "Disputed", "3": "Resolved", "4": "Refunded",
      "Pending": "Pending", "Shipped": "Shipped", "Disputed": "Disputed", "Resolved": "Resolved", "Refunded": "Refunded"
    };

    let extractedKey = "Pending";
    const rawStatus = native.status;
    
    if (Array.isArray(rawStatus) && rawStatus.length > 0) {
      extractedKey = String(rawStatus[0]);
    } else if (typeof rawStatus === "number" || typeof rawStatus === "string") {
      extractedKey = String(rawStatus);
    } else if (typeof rawStatus === "object" && rawStatus !== null) {
      extractedKey = Object.keys(rawStatus)[0];
    }

    const parsedStatus: TxStatus = map[extractedKey] || "Pending";
    if (process.env.NODE_ENV !== "production") {
      console.log("[DEBUG] rawStatus:", rawStatus, "extractedKey:", extractedKey, "parsedStatus:", parsedStatus);
    }

    return {
      transaction_id:    BigInt(native.transaction_id as string | number),
      buyer:             native.buyer as string,
      seller:            native.seller as string,
      amount:            BigInt(native.amount as string | number),
      status:            parsedStatus,
      shipped_timestamp: BigInt(native.shipped_timestamp as string | number),
      stake_amount:      BigInt(native.stake_amount as string | number),
    };
  } catch (err) {
    console.error("fetchTransaction error:", err);
    return null;
  }
}

// ─── WRITE: Build + Sign + Submit via Freighter ───────────────────────────────

/**
 * Build, sign, dan submit sebuah contract call melalui Freighter wallet.
 * Mengembalikan tx hash jika berhasil; melempar Error jika gagal.
 */
export async function invokeContract(
  senderAddress: string,
  functionName: string,
  args: xdr.ScVal[]
): Promise<string> {
  const { signTransaction } = await import("@stellar/freighter-api");

  const server   = getRpc();
  const account  = await server.getAccount(senderAddress);
  const contract = new Contract(CONTRACT_ID);

  const tx = new TransactionBuilder(account, {
    fee:              BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call(functionName, ...args))
    .setTimeout(180) // 3 minutes — gives user enough time to review Freighter popup
    .build();

  // Simulasikan dan rakit transaksi (handle footprint & resource fee)
  const preparedTx = await server.prepareTransaction(tx);

  // Minta user sign via Freighter
  const { signedTxXdr } = await signTransaction(preparedTx.toXDR(), {
    networkPassphrase: NETWORK_PASSPHRASE,
  });

  // Submit ke network
  const submittedTx = await server.sendTransaction(
    TransactionBuilder.fromXDR(signedTxXdr, NETWORK_PASSPHRASE)
  );

  if (submittedTx.status === "ERROR") {
    throw new Error(`Submit gagal: ${JSON.stringify(submittedTx.errorResult)}`);
  }

  // Poll sampai konfirmasi
  const MAX_POLLS = 30;
  let polls = 0;
  let getResponse = await server.getTransaction(submittedTx.hash);

  while (getResponse.status === "NOT_FOUND" && polls < MAX_POLLS) {
    await new Promise((r) => setTimeout(r, 1000));
    getResponse = await server.getTransaction(submittedTx.hash);
    polls++;
  }

  if (getResponse.status === "FAILED") {
    console.error("Tx Failed On-Chain:", getResponse);
    throw new Error(`Transaksi gagal dikonfirmasi on-chain: ${JSON.stringify(getResponse.resultXdr || getResponse)}`);
  }

  if (getResponse.status === "NOT_FOUND") {
    throw new Error("Timeout menunggu konfirmasi transaksi");
  }

  return submittedTx.hash;
}

// ─── Contract Function Wrappers ───────────────────────────────────────────────

export async function depositEscrow(
  senderAddress: string,
  txnId: number,
  buyer: string,
  seller: string,
  amountXlm: number
) {
  return invokeContract(senderAddress, "deposit", [
    nativeToScVal(BigInt(txnId), { type: "u64" }),
    new Address(buyer).toScVal(),
    new Address(seller).toScVal(),
    nativeToScVal(xlmToStroops(amountXlm), { type: "i128" }),
  ]);
}

export async function markAsShipped(senderAddress: string, txnId: number) {
  return invokeContract(senderAddress, "mark_as_shipped", [
    nativeToScVal(BigInt(txnId), { type: "u64" }),
  ]);
}

export async function confirmReceipt(senderAddress: string, txnId: number) {
  return invokeContract(senderAddress, "confirm_receipt_and_release", [
    nativeToScVal(BigInt(txnId), { type: "u64" }),
  ]);
}

export async function openDispute(senderAddress: string, txnId: number) {
  return invokeContract(senderAddress, "open_dispute_with_stake", [
    nativeToScVal(BigInt(txnId), { type: "u64" }),
  ]);
}

export async function autoRelease(senderAddress: string, txnId: number) {
  return invokeContract(senderAddress, "auto_release_funds", [
    nativeToScVal(BigInt(txnId), { type: "u64" }),
  ]);
}

export async function resolveDispute(
  senderAddress: string,
  txnId: number,
  buyerIsRight: boolean
) {
  return invokeContract(senderAddress, "resolve_dispute", [
    nativeToScVal(BigInt(txnId), { type: "u64" }),
    nativeToScVal(buyerIsRight, { type: "bool" }),
  ]);
}
