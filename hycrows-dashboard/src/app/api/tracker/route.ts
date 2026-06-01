import { NextResponse } from "next/server";

declare global {
  var activeEscrows: number[] | undefined;
}

if (!global.activeEscrows) {
  global.activeEscrows = [];
}

// GET: Returns the list of tracked transaction IDs
export async function GET() {
  return NextResponse.json({ activeEscrows: global.activeEscrows });
}

// POST: Add a transaction ID to the tracker
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { txnId } = body;

    const id = Number(txnId);
    if (Number.isFinite(id) && id > 0) {
      if (!global.activeEscrows!.includes(id)) {
        global.activeEscrows!.push(id);
      }
    }

    return NextResponse.json({ success: true, activeEscrows: global.activeEscrows });
  } catch (err) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
