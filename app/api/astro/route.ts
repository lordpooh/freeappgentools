import { NextRequest, NextResponse } from "next/server";
import { computeChart } from "../../../lib/ephemeris";
import { parseInput } from "../../../lib/thai-astro";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const input = parseInput(sp.get("date"), sp.get("time"));
  if (!input) {
    return NextResponse.json(
      { error: "รูปแบบไม่ถูกต้อง: date=YYYY-MM-DD, time=HH:MM[:SS]" },
      { status: 400 }
    );
  }

  try {
    const result = await computeChart(input.date, input.time);
    return NextResponse.json(result, {
      headers: { "Cache-Control": "public, max-age=86400" },
    });
  } catch (e) {
    const err = e as Error;
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 });
  }
}
