import { NextRequest, NextResponse } from "next/server";
import { store, CallEvent } from "@/lib/store";

// POST - receive call status from Teli adapter
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const event = store.addEvent({
      callId: body.callId || `call-${Date.now()}`,
      caller: body.caller || "Unknown",
      verdict: body.verdict || "UNCERTAIN",
      status: body.status || "completed",
      transcript: body.transcript || "",
      analysis: body.analysis || {},
      timestamp: new Date().toISOString(),
    });

    console.log(`[CallStatus] Received: ${event.verdict} from ${event.caller}`);

    return NextResponse.json({ ok: true, event });
  } catch (err: any) {
    console.error("[CallStatus] Error:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

// GET - retrieve recent call events
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get("limit") || "20");

  return NextResponse.json({
    ok: true,
    events: store.getEvents(limit),
    blocklist: store.getBlocklist(),
  });
}
