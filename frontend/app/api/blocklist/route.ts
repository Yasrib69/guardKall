import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";

// GET - retrieve blocklist
export async function GET() {
  return NextResponse.json({
    ok: true,
    numbers: store.getBlocklist(),
  });
}

// POST - add number to blocklist
export async function POST(req: NextRequest) {
  try {
    const { number } = await req.json();

    if (!number) {
      return NextResponse.json({ ok: false, error: "number required" }, { status: 400 });
    }

    store.blockNumber(number);
    console.log(`[Blocklist] Added: ${number}`);

    return NextResponse.json({ ok: true, number, action: "blocked" });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

// DELETE - remove number from blocklist
export async function DELETE(req: NextRequest) {
  try {
    const { number } = await req.json();

    if (!number) {
      return NextResponse.json({ ok: false, error: "number required" }, { status: 400 });
    }

    store.unblockNumber(number);
    console.log(`[Blocklist] Removed: ${number}`);

    return NextResponse.json({ ok: true, number, action: "unblocked" });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
