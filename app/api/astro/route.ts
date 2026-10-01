import { NextRequest, NextResponse } from "next/server";
import { computeChart } from "../../../lib/ephemeris";
import { parseInput } from "../../../lib/thai-astro";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  
  // 1. แก้ไข parseInput โดยส่ง object แทนการแยก 2 arguments
  const dateStr = sp.get("date");
  const timeStr = sp.get("time");

  if (!dateStr || !timeStr) {
    return NextResponse.json(
      { error: "รูปแบบไม่ถูกต้อง: date=YYYY-MM-DD, time=HH:MM[:SS]" },
      { status: 400 }
    );
  }

  const input = parseInput({ date: dateStr, time: timeStr });
  if (!input) {
    return NextResponse.json(
      { error: "รูปแบบไม่ถูกต้อง: date=YYYY-MM-DD, time=HH:MM[:SS]" },
      { status: 400 }
    );
  }

  try {
    // 2. แก้ไข computeChart โดยใส่ argument ตัวที่ 3 ให้ครบตามที่ฟังก์ชันต้องการ
    const result = await computeChart(input.date, input.time, {
      name: "Bangkok",
      lat: 13.7563,
      lon: 100.5018,
    });

    return NextResponse.json(result, {
      headers: { "Cache-Control": "public, max-age=86400" },
    });
  } catch (e) {
    const err = e as Error;
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 });
  }
}