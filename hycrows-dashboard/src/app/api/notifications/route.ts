import { NextResponse } from "next/server";

interface Notification {
  id: string;
  type: "new_escrow" | "status_change";
  txnId: number;
  from: string;       // buyer address (shortened later on client)
  amount: string;      // XLM amount as string
  message: string;
  timestamp: number;
  read: boolean;
}

declare global {
  var notifications: Record<string, Notification[]> | undefined;
}

if (!global.notifications) {
  global.notifications = {};
}

// GET: Fetch notifications for a specific wallet address
// Usage: GET /api/notifications?address=GABCDEF...
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get("address")?.trim().toUpperCase();

  if (!address) {
    return NextResponse.json({ error: "Missing address parameter" }, { status: 400 });
  }

  const userNotifs = global.notifications![address] || [];
  return NextResponse.json({ notifications: userNotifs });
}

// POST: Create a new notification for a target address
// Body: { targetAddress, txnId, from, amount, message, type? }
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { targetAddress, txnId, from, amount, message, type } = body;

    if (!targetAddress || !txnId) {
      return NextResponse.json({ error: "Missing targetAddress or txnId" }, { status: 400 });
    }

    const addr = targetAddress.trim().toUpperCase();

    if (!global.notifications![addr]) {
      global.notifications![addr] = [];
    }

    // Don't duplicate notifications for the same txnId
    const exists = global.notifications![addr].some((n) => n.txnId === Number(txnId));
    if (!exists) {
      global.notifications![addr].push({
        id: `${txnId}-${Date.now()}`,
        type: type || "new_escrow",
        txnId: Number(txnId),
        from: from || "Unknown",
        amount: amount || "0",
        message: message || `New escrow #${txnId} created`,
        timestamp: Date.now(),
        read: false,
      });

      // Cap at 30 notifications per address
      if (global.notifications![addr].length > 30) {
        global.notifications![addr] = global.notifications![addr].slice(-30);
      }
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

// PATCH: Mark notifications as read for a specific address
// Body: { address }
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const addr = body.address?.trim().toUpperCase();

    if (!addr || !global.notifications![addr]) {
      return NextResponse.json({ success: true });
    }

    global.notifications![addr] = global.notifications![addr].map((n) => ({
      ...n,
      read: true,
    }));

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
