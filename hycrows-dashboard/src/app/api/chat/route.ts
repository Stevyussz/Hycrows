import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import crypto from "crypto";

// Simpan di root project agar tidak men-trigger HMR Next.js
const DB_PATH = path.join(process.cwd(), "chat.db.json");

// Validasi
const MAX_TEXT_LENGTH  = 500;  // maks karakter per pesan
const MAX_MESSAGES_PER_TXN = 200; // maks pesan per transaksi (pagination protection)

interface ChatMessage {
  id:        string;
  txnId:     number;
  sender:    string; // Stellar wallet address
  text:      string;
  timestamp: number;
}

// ─── File-based DB helpers ────────────────────────────────────────────────────

function readDB(): ChatMessage[] {
  try {
    if (fs.existsSync(DB_PATH)) {
      const data = fs.readFileSync(DB_PATH, "utf-8");
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    }
  } catch (err) {
    console.error("Error reading chat DB:", err);
  }
  return [];
}

function writeDB(data: ChatMessage[]) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing chat DB:", err);
  }
}

// Validasi Stellar address (dimulai G, panjang 56 karakter, alphanumeric)
function isValidStellarAddress(addr: string): boolean {
  return /^G[A-Z0-9]{55}$/.test(addr);
}

// ─── GET: Ambil pesan berdasarkan txnId ───────────────────────────────────────
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const txnIdStr = searchParams.get("txnId");

  if (!txnIdStr) {
    return NextResponse.json({ error: "txnId wajib diisi" }, { status: 400 });
  }

  const txnId = Number(txnIdStr);
  if (!Number.isFinite(txnId) || txnId <= 0) {
    return NextResponse.json({ error: "txnId tidak valid" }, { status: 400 });
  }

  const messages = readDB();
  const filtered = messages
    .filter((m) => m.txnId === txnId)
    .slice(-MAX_MESSAGES_PER_TXN) // Ambil 200 pesan terakhir saja
    .sort((a, b) => a.timestamp - b.timestamp);

  return NextResponse.json(filtered);
}

// ─── POST: Kirim pesan baru ───────────────────────────────────────────────────
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { txnId, sender, text } = body;

    // Validasi field wajib
    if (!txnId || !sender || !text) {
      return NextResponse.json(
        { error: "txnId, sender, dan text wajib diisi" },
        { status: 400 }
      );
    }

    // Validasi txnId
    const txnIdNum = Number(txnId);
    if (!Number.isFinite(txnIdNum) || txnIdNum <= 0) {
      return NextResponse.json({ error: "txnId tidak valid" }, { status: 400 });
    }

    // Validasi sender address
    if (typeof sender !== "string" || !isValidStellarAddress(sender)) {
      return NextResponse.json(
        { error: "sender harus berupa Stellar address yang valid (G…)" },
        { status: 400 }
      );
    }

    // Validasi teks
    if (typeof text !== "string" || text.trim().length === 0) {
      return NextResponse.json({ error: "Pesan tidak boleh kosong" }, { status: 400 });
    }
    if (text.trim().length > MAX_TEXT_LENGTH) {
      return NextResponse.json(
        { error: `Pesan maksimal ${MAX_TEXT_LENGTH} karakter` },
        { status: 400 }
      );
    }

    const messages = readDB();

    const newMessage: ChatMessage = {
      id:        crypto.randomUUID(),
      txnId:     txnIdNum,
      sender:    sender.trim(),
      text:      text.trim(),
      timestamp: Date.now(),
    };

    messages.push(newMessage);
    writeDB(messages);

    return NextResponse.json(newMessage, { status: 201 });
  } catch (err) {
    console.error("Chat POST error:", err);
    return NextResponse.json(
      { error: "Request tidak valid" },
      { status: 400 }
    );
  }
}
