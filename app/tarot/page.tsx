"use client";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ทำนายไพ่ทาโร่ออนไลน์ฟรี - เปิดไพ่ยิปซีแม่นๆ ไม่ต้องสมัครสมาชิก",
  description:
    "ดูดวงไพ่ทาโร่ออนไลน์ฟรี เปิดไพ่ยิปซีทำนายความรัก การงาน การเงิน ใช้งานได้ทันทีโดยไม่ต้องลงทะเบียน",
  keywords: [
    "ทำนายไพ่ทาโร่",
    "ดูดวงไพ่ทาโร่",
    "เปิดไพ่ยิปซีออนไลน์",
    "ดูดวงไพ่ยิปซีฟรี",
  ],
  openGraph: {
    title: "ทำนายไพ่ทาโร่ออนไลน์ฟรี | FreeAppGenTools",
    description: "เปิดไพ่ยิปซีทำนายดวงชะตาฟรี ไม่ต้องสมัครสมาชิก ใช้งานได้ทันที",
    url: "https://freeappgentools.com/tarot",
  },
};
import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  drawSpread,
  shuffleDeck,
  TOPICS,
  type Card,
  type SpreadKind,
  type SpreadResult,
  type Tone,
  type Topic,
} from "../../lib/tarot";
import { readQuestion } from "../../lib/tarotQuestion";
import { readOpportunity } from "../../lib/tarotOpportunity";
import TarotCardArt, { TarotCardBack } from "../../components/TarotCardArt";
import CelticCrossBoard from "../../components/CelticCrossBoard";

// ต้องติดตั้งก่อน: npm i html-to-image

const TONE_STYLE: Record<Tone, { badge: string; bar: string }> = {
  ดี: { badge: "bg-emerald-100 text-emerald-700", bar: "bg-emerald-500" },
  กลาง: { badge: "bg-slate-100 text-slate-600", bar: "bg-slate-400" },
  ระวัง: { badge: "bg-rose-100 text-rose-700", bar: "bg-rose-500" },
};

// กัน crash ถ้า tone เป็นค่าที่ไม่ตรงกับ key ด้านบน (เช่น ตัวอักษรไทยต่างรหัส) ให้ใช้สไตล์กลางแทน
const FALLBACK_TONE = { badge: "bg-slate-100 text-slate-600", bar: "bg-slate-400" };
function toneStyle(tone: Tone) {
  return TONE_STYLE[tone] ?? FALLBACK_TONE;
}

const LEVEL_STYLE = {
  สูง: "bg-emerald-100 text-emerald-700",
  ปานกลาง: "bg-slate-100 text-slate-600",
  ต่ำ: "bg-rose-100 text-rose-700",
} as const;

const SUIT_GLYPH: Record<string, string> = {
  wands: "🪄",
  cups: "🏆",
  swords: "🗡️",
  pentacles: "🪙",
};

// ท่าทางของไพ่ 3 ใบในกองตอนสับ [พัก, สลับไปมา]
const STACK_REST = ["translate(0px,0px) rotate(0deg)", "translate(0px,-3px) rotate(0deg)", "translate(0px,-6px) rotate(0deg)"];
const STACK_SHUFFLE_A = ["translate(-34px,0px) rotate(-9deg)", "translate(34px,-3px) rotate(9deg)", "translate(-16px,-6px) rotate(-4deg)"];

const PRINT_CSS = `
@media print {
  body * { visibility: hidden !important; }
  #tarot-report, #tarot-report * { visibility: visible !important; }
  #tarot-report { position: absolute; left: 0; top: 0; width: 100%; box-shadow: none !important; }
  @page { size: A4 landscape; margin: 10mm; }
}
`;

// ขนาดหน้า A4 แนวตั้งที่ 150 dpi
const A4_W = 1240;
const A4_H = 1754;
const MARGIN = 50;
const FOOTER = 40;
const MAX_CANVAS_AREA = 16_000_000; // กัน canvas ใหญ่เกินจน iOS Safari สร้างไม่ได้

type PageImg = { url: string; file: File };

export default function TarotPage() {
  const [topic, setTopic] = useState<Topic>("today");
  const [kind, setKind] = useState<SpreadKind>("four");
  const [question, setQuestion] = useState("");

  // ขั้นสับไพ่
  const [deck, setDeck] = useState<Card[] | null>(null);
  const [shuffleCount, setShuffleCount] = useState(0);
  const [shuffling, setShuffling] = useState(false);

  // ขั้นเปิดไพ่
  const [result, setResult] = useState<SpreadResult | null>(null);
  const [revealed, setRevealed] = useState<Set<number>>(new Set());
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [pages, setPages] = useState<PageImg[] | null>(null);

  const reportRef = useRef<HTMLDivElement>(null);

  const allRevealed = result !== null && revealed.size === result.cards.length;
  const qReading = result ? readQuestion(result) : null;
  const opp = useMemo(() => (result ? readOpportunity(result) : null), [result]);

  function shuffle() {
    if (shuffling) return;
    setShuffling(true);
    setDeck(shuffleDeck());
    setShuffleCount((n) => n + 1);
    setTimeout(() => setShuffling(false), 450);
  }

  function start() {
    if (!deck) return;
    setResult(drawSpread(kind, { topic, question: question.trim() || undefined, deck }));
    setRevealed(new Set());
    setSaveError(null);
  }

  function closePages() {
    setPages((prev) => {
      prev?.forEach((p) => URL.revokeObjectURL(p.url));
      return null;
    });
  }

  function reset() {
    closePages();
    setResult(null);
    setRevealed(new Set());
    setDeck(null);
    setShuffleCount(0);
    setSaveError(null);
  }

  function reveal(i: number) {
    setRevealed((prev) => new Set(prev).add(i));
  }

  function revealAll() {
    if (result) setRevealed(new Set(result.cards.map((_, i) => i)));
  }

  function fileStamp() {
    const d = new Date();
    const p = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`;
  }

  function download(href: string, name: string) {
    const a = document.createElement("a");
    a.href = href;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  // สร้างรูป A4 (แนวตั้ง) ถ้ายาวเกินหนึ่งหน้าจะแบ่งหน้าตามขอบบล็อก ไม่ตัดกลางการ์ด
  async function saveImage() {
    const el = reportRef.current;
    if (!el || saving) return;
    setSaving(true);
    setSaveError(null);
    try {
      const { toCanvas } = await import("html-to-image");

      const cssW = el.offsetWidth;
      const cssH = el.offsetHeight;
      const target = (A4_W - MARGIN * 2) / cssW; // px ของ A4 ต่อ 1 CSS px
      const used = Math.min(target, Math.sqrt(MAX_CANVAS_AREA / (cssW * cssH)));

      // จุดตัดหน้าที่เป็นไปได้ = ขอบล่างของบล็อกหลัก และของการ์ดแต่ละใบ
      const top0 = el.getBoundingClientRect().top;
      const cuts = Array.from(
        el.querySelectorAll<HTMLElement>(":scope > *, :scope > ul > li, :scope > div > div"),
      )
        .map((n) => Math.round(n.getBoundingClientRect().bottom - top0))
        .filter((y) => y > 0 && y < cssH)
        .sort((a, b) => a - b);

      const pageCss = (A4_H - MARGIN * 2 - FOOTER) / target; // ความสูงเนื้อหาต่อหน้า (CSS px)
      const slices: [number, number][] = [];
      let start = 0;
      while (start < cssH - 1) {
        const limit = start + pageCss;
        if (limit >= cssH) {
          slices.push([start, cssH]);
          break;
        }
        let end = 0;
        for (const c of cuts) if (c > start + 40 && c <= limit) end = c;
        if (!end) end = limit; // บล็อกเดียวสูงเกินหน้า ตัดตามความสูงหน้า
        slices.push([start, end]);
        start = end;
      }

      const full = await toCanvas(el, {
        pixelRatio: used,
        backgroundColor: "#ffffff",
        skipFonts: true, // กัน error จาก stylesheet/ฟอนต์ข้ามโดเมน
      });
      const ratio = full.width / cssW;
      const stamp = fileStamp();
      const out: PageImg[] = [];

      for (let i = 0; i < slices.length; i++) {
        const [s, e] = slices[i];
        const page = document.createElement("canvas");
        page.width = A4_W;
        page.height = A4_H;
        const ctx = page.getContext("2d");
        if (!ctx) throw new Error("สร้าง canvas ไม่ได้");
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, A4_W, A4_H);

        const sy = Math.min(Math.round(s * ratio), full.height - 1);
        const sh = Math.min(Math.round((e - s) * ratio), full.height - sy);
        ctx.drawImage(
          full,
          0, sy, full.width, sh,
          MARGIN, MARGIN, cssW * target, (e - s) * target,
        );

        ctx.fillStyle = "#94a3b8";
        ctx.font = "22px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(
          `ทำนายไพ่ Tarot · หน้า ${i + 1}/${slices.length}`,
          A4_W / 2,
          A4_H - MARGIN / 2,
        );

        const blob = await new Promise<Blob | null>((res) =>
          page.toBlob(res, "image/png"),
        );
        if (!blob) throw new Error("แปลงรูปไม่สำเร็จ");
        const file = new File([blob], `tarot-${stamp}-p${i + 1}.png`, {
          type: "image/png",
        });
        out.push({ url: URL.createObjectURL(file), file });
        page.width = 0;
      }
      full.width = 0;

      closePages();
      setPages(out);
    } catch (e) {
      console.error("save image failed", e);
      const msg = e instanceof Error ? e.message : String(e);
      const missing = /Cannot find module|Failed to fetch dynamically|Module not found/i.test(msg);
      setSaveError(
        missing
          ? "ยังไม่ได้ติดตั้ง html-to-image: รัน npm i html-to-image แล้วรีสตาร์ท dev server"
          : `เซฟรูปไม่สำเร็จ (${msg}) ลองใหม่ หรือใช้ปุ่มพิมพ์/PDF แทน`,
      );
    } finally {
      setSaving(false);
    }
  }

  // มือถือ: เปิดหน้าต่างแชร์ของระบบ เลือก "บันทึกรูปภาพ" เพื่อเก็บลงอัลบั้ม
  async function sharePages() {
    if (!pages) return;
    const files = pages.map((p) => p.file);
    setSaveError(null);
    if (typeof navigator !== "undefined" && navigator.canShare?.({ files })) {
      try {
        await navigator.share({ files, title: "ผลทำนายไพ่ Tarot" });
      } catch (e) {
        if (!(e instanceof DOMException && e.name === "AbortError")) {
          setSaveError("แชร์รูปไม่สำเร็จ ลองกดค้างที่รูปเพื่อบันทึกแทน");
        }
      }
    } else {
      setSaveError(
        "เบราว์เซอร์นี้แชร์ไฟล์ไม่ได้ ให้กดค้างที่รูปเพื่อบันทึกลงรูปภาพ หรือกดดาวน์โหลด",
      );
    }
  }

  async function downloadPages() {
    if (!pages) return;
    for (const p of pages) {
      download(p.url, p.file.name);
      await new Promise((r) => setTimeout(r, 400));
    }
  }

  // เซฟเป็นรายงานข้อความ .txt
  function saveText() {
    if (!result) return;
    const L: string[] = [];
    L.push(`รายงานทำนายไพ่ Tarot`);
    L.push(`${result.title}`);
    L.push(`หัวข้อ: ${TOPICS[result.topic].label}`);
    if (result.question) L.push(`คำถาม: ${result.question}`);
    L.push(`วันที่: ${new Date().toLocaleString("th-TH")}`);
    L.push("");
    result.cards.forEach((c, i) => {
      L.push(`${i + 1}) ${c.position} — ${c.card.name}${c.reversed ? " (กลับหัว)" : ""} [${c.card.en}] · ${c.tone}`);
      L.push(`   ความหมาย: ${c.meaning}`);
      L.push(`   ${TOPICS[result.topic].short}: ${c.topicNote}`);
      L.push(`   ตำแหน่งนี้: ${c.hint}`);
      L.push("");
    });
    if (qReading) {
      L.push(`── ตอบคำถาม: ${qReading.question} (${qReading.kindLabel}) ──`);
      L.push(`คำตอบโดยรวม: ${qReading.verdict}`);
      qReading.lines.forEach((t) => L.push(`• ${t}`));
      L.push("");
    }
    if (opp) {
      L.push(`── ทำนายโอกาส (โอกาสเกิดขึ้น: ${opp.level}) ──`);
      L.push(opp.levelNote);
      opp.rows.forEach((row) => {
        L.push(`${row.icon} ${row.label}: ${row.value}`);
        if (row.sub) L.push(`   ${row.sub}`);
        L.push(`   จากไพ่: ${row.from}`);
      });
      L.push("");
    }
    L.push(`── สรุปภาพรวม (${result.tone}) ──`);
    L.push(result.summary);
    L.push("");
    L.push("ใช้เพื่อความบันเทิงและเป็นแนวทางคิดเท่านั้น");

    const blob = new Blob([L.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    download(url, `tarot-report-${fileStamp()}.txt`);
    URL.revokeObjectURL(url);
  }

  return (
    <main className="min-h-screen bg-slate-100 flex items-start justify-center p-4 font-sans">
      <style>{PRINT_CSS}</style>
      <div
        className={`bg-white w-full rounded-2xl shadow-xl p-6 mt-4 ${
          result ? "max-w-5xl" : "max-w-md"
        }`}
      >
        <Link href="/" className="text-xs text-slate-500 hover:text-indigo-600">
          ← กลับหน้าแรก
        </Link>

        <h1 className="text-2xl font-bold text-slate-800 mt-3 mb-1">
          🔮 ทำนายไพ่ Tarot
        </h1>
        <p className="text-sm text-slate-500 mb-5">
          ตั้งใจคิดเรื่องที่อยากรู้ สับไพ่จนรู้สึกพอ แล้วค่อยเริ่มเปิด
        </p>

        {/* ───────── ขั้นที่ 1: ตั้งค่า + สับไพ่ ───────── */}
        {!result && (
          <>
            <p className="text-xs font-bold text-slate-700 mb-2">
              อยากรู้เรื่องอะไร
            </p>
            <div className="grid grid-cols-5 gap-1.5 mb-5">
              {(Object.keys(TOPICS) as Topic[]).map((k) => (
                <button
                  key={k}
                  type="button"
                  aria-pressed={topic === k}
                  onClick={() => setTopic(k)}
                  className={`flex flex-col items-center gap-0.5 py-2 rounded-xl border text-[11px] font-semibold transition ${
                    topic === k
                      ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <span className="text-lg leading-none">{TOPICS[k].emoji}</span>
                  {TOPICS[k].short}
                </button>
              ))}
            </div>

            <div className="flex bg-slate-100 p-1 rounded-xl mb-3">
              {(
                [
                  ["four", "ไพ่ 4 ใบ"],
                  ["ten", "ไพ่ 10 ใบ"],
                ] as [SpreadKind, string][]
              ).map(([k, label]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setKind(k)}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition ${
                    kind === k
                      ? "bg-white text-indigo-600 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-400 mb-4">
              {kind === "four"
                ? "ภาพรวมเร็ว: สถานการณ์ อุปสรรค คำแนะนำ ผลลัพธ์"
                : "แบบ Celtic Cross: ลงรายละเอียดอดีต ปัจจุบัน อนาคต และความรู้สึกลึก ๆ"}
            </p>

            <label className="block text-xs font-bold text-slate-700 mb-1">
              คำถาม (ไม่ใส่ก็ได้)
            </label>
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder={TOPICS[topic].example}
              className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 mb-1"
            />
            <p className="text-[11px] text-slate-400 mb-5">
              ถ้าใส่คำถาม ระบบจะนำมาตีความร่วมกับไพ่ที่เปิดได้ในส่วน “ตอบคำถามของคุณ”
            </p>

            {/* กองไพ่ */}
            <div className="rounded-xl bg-indigo-950/95 py-6 mb-3 flex flex-col items-center">
              <div className="relative w-24 h-40" aria-hidden="true">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="absolute inset-0 motion-reduce:transition-none"
                    style={{
                      transform: shuffling ? STACK_SHUFFLE_A[i] : STACK_REST[i],
                      transition: "transform 220ms ease-in-out",
                    }}
                  >
                    <TarotCardBack className="w-24 drop-shadow-lg" />
                  </div>
                ))}
              </div>
              <p className="mt-4 text-sm text-indigo-100" aria-live="polite">
                {shuffleCount === 0
                  ? "ยังไม่ได้สับไพ่"
                  : `สับแล้ว ${shuffleCount} ครั้ง`}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={shuffle}
                disabled={shuffling}
                className="bg-white border border-indigo-300 text-indigo-700 hover:bg-indigo-50 disabled:opacity-60 font-bold py-2.5 rounded-lg text-sm transition"
              >
                {shuffleCount === 0 ? "สับไพ่" : "สับอีกครั้ง"}
              </button>
              <button
                type="button"
                onClick={start}
                disabled={shuffleCount === 0 || shuffling}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold py-2.5 rounded-lg text-sm transition"
              >
                เริ่มเปิดไพ่
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mt-2 text-center">
              สับกี่ครั้งก็ได้ เมื่อรู้สึกว่าพอแล้วให้กด "เริ่มเปิดไพ่"
            </p>
          </>
        )}

        {/* ───────── ขั้นที่ 2: ผลลัพธ์ (แนวนอน) ───────── */}
        {result && (
          <section>
            <div className="flex flex-wrap items-center justify-end gap-2 mb-3">
              {!allRevealed && (
                <button
                  type="button"
                  onClick={revealAll}
                  className="text-xs font-semibold text-indigo-600 hover:underline"
                >
                  เปิดทั้งหมด
                </button>
              )}
              {allRevealed && (
                <>
                  <button
                    type="button"
                    onClick={saveImage}
                    disabled={saving}
                    className="text-xs font-bold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white px-3 py-2 rounded-lg transition"
                  >
                    {saving ? "กำลังสร้างรูป…" : "💾 เซฟเป็นรูป (A4)"}
                  </button>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="text-xs font-bold bg-white border border-indigo-300 text-indigo-700 hover:bg-indigo-50 px-3 py-2 rounded-lg transition"
                  >
                    🖨️ พิมพ์ / เซฟ PDF
                  </button>
                  <button
                    type="button"
                    onClick={saveText}
                    className="text-xs font-bold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 px-3 py-2 rounded-lg transition"
                  >
                    📄 รายงาน (.txt)
                  </button>
                </>
              )}
            </div>
            {saveError && (
              <p className="text-xs text-rose-600 mb-2" role="alert">
                {saveError}
              </p>
            )}

            {/* พื้นที่รายงาน: ใช้สำหรับเซฟรูป / พิมพ์ */}
            <div id="tarot-report" ref={reportRef} className="bg-white">
              <div className="flex items-end justify-between gap-3 mb-1">
                <h2 className="text-base font-bold text-slate-800">
                  🔮 {result.title}
                </h2>
                <span className="text-[11px] text-slate-400 shrink-0">
                  {new Date().toLocaleDateString("th-TH", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mb-3">
                {TOPICS[result.topic].emoji} {TOPICS[result.topic].label} · สับไป{" "}
                {shuffleCount} ครั้ง
              </p>

              {result.question && (
                <div className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-2 mb-4">
                  <p className="text-[11px] text-slate-400">คำถาม</p>
                  <p className="text-sm font-semibold text-slate-800">
                    {result.question}
                  </p>
                </div>
              )}

              {/* แถบไพ่: 10 ใบ = ผัง Celtic Cross / 4 ใบ = แถวแนวนอน */}
              <div className="rounded-xl bg-indigo-950 px-3 py-4 mb-4">
                {result.kind === "ten" ? (
                  <CelticCrossBoard
                    cards={result.cards}
                    revealed={revealed}
                    onReveal={reveal}
                  />
                ) : (
                  <div className="overflow-x-auto">
                    <div className="flex gap-3 justify-center min-w-max mx-auto">
                      {result.cards.map((c, i) => (
                        <div key={i} className="flex flex-col items-center w-[72px]">
                          {revealed.has(i) ? (
                            <TarotCardArt
                              card={c.card}
                              reversed={c.reversed}
                              className="w-[72px] drop-shadow-lg"
                            />
                          ) : (
                            <TarotCardBack className="w-[72px] drop-shadow-lg" />
                          )}
                          <span className="mt-1.5 text-[10px] leading-tight text-center text-indigo-100">
                            {c.position}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* รายละเอียดไพ่แต่ละใบ แนวนอน */}
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {result.cards.map((c, i) => {
                  const open = revealed.has(i);
                  if (!open) {
                    return (
                      <li key={i}>
                        <button
                          type="button"
                          onClick={() => reveal(i)}
                          data-html2canvas-ignore
                          className="w-full h-full min-h-[96px] flex items-center gap-3 text-left rounded-xl border border-indigo-900/20 bg-indigo-950 px-3 py-3 hover:bg-indigo-900 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-400"
                        >
                          <TarotCardBack className="w-9 shrink-0" />
                          <span>
                            <span className="block text-sm font-semibold text-white">
                              {c.position}
                            </span>
                            <span className="block text-[11px] text-indigo-200">
                              แตะเพื่อเปิดไพ่
                            </span>
                          </span>
                        </button>
                      </li>
                    );
                  }

                  const t = toneStyle(c.tone);
                  return (
                    <li
                      key={i}
                      className="relative overflow-hidden rounded-xl border border-slate-200 bg-white pl-4 pr-3 py-3 break-inside-avoid"
                    >
                      <span
                        className={`absolute left-0 top-0 bottom-0 w-1 ${t.bar}`}
                      />
                      <div className="flex gap-3">
                        <TarotCardArt
                          card={c.card}
                          reversed={c.reversed}
                          className="w-20 shrink-0 self-start drop-shadow-md"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-[11px] text-slate-400">
                                {c.position}
                              </p>
                              <p className="text-sm font-bold text-slate-800">
                                <span className="text-indigo-500 mr-1">
                                  {c.card.suit ? SUIT_GLYPH[c.card.suit] : "✦"}
                                </span>
                                {c.card.name}
                                {c.reversed && (
                                  <span className="ml-1.5 text-[11px] font-semibold text-amber-600">
                                    กลับหัว
                                  </span>
                                )}
                              </p>
                              <p className="text-[11px] text-slate-400">
                                {c.card.en}
                              </p>
                            </div>
                            <span
                              className={`shrink-0 text-[11px] font-semibold px-2 py-0.5 rounded-full ${t.badge}`}
                            >
                              {c.tone}
                            </span>
                          </div>
                          <p className="text-xs text-slate-700 mt-2">
                            {c.meaning}
                          </p>
                          <p className="text-xs text-indigo-800 bg-indigo-50 rounded-lg px-2 py-1.5 mt-2">
                            <span className="font-semibold">
                              {TOPICS[result.topic].short}:
                            </span>{" "}
                            {c.topicNote}
                          </p>
                          <p className="text-[11px] text-slate-400 mt-1">
                            ตำแหน่งนี้: {c.hint}
                          </p>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>

              {allRevealed && (
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                  {opp && (
                    <div className="md:col-span-2 rounded-xl bg-violet-50 border border-violet-200 p-4 break-inside-avoid">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h3 className="text-sm font-bold text-violet-800">
                          ทำนายโอกาส: แบบไหน ใคร ที่ไหน เมื่อไหร่
                        </h3>
                        <span
                          className={`shrink-0 text-[11px] font-semibold px-2 py-0.5 rounded-full ${LEVEL_STYLE[opp.level]}`}
                        >
                          โอกาสเกิดขึ้น: {opp.level}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mb-3">{opp.levelNote}</p>
                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {opp.rows.map((row) => (
                          <li
                            key={row.key}
                            className="rounded-lg bg-white border border-violet-100 px-3 py-2"
                          >
                            <p className="text-[11px] font-semibold text-violet-700">
                              {row.icon} {row.label}
                            </p>
                            <p className="text-xs text-slate-800 mt-0.5 leading-relaxed">
                              {row.value}
                            </p>
                            {row.sub && (
                              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                                {row.sub}
                              </p>
                            )}
                            <p className="text-[10px] text-slate-400 mt-1">
                              จากไพ่: {row.from}
                            </p>
                          </li>
                        ))}
                      </ul>
                      <p className="text-[10px] text-slate-400 mt-2">
                        การระบุบุคคล สถานที่ และเวลา เป็นการตีความตามตำราทาโรต์ ใช้เป็นแนวทางเท่านั้น
                      </p>
                    </div>
                  )}

                  {qReading && (
                    <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 break-inside-avoid">
                      <div className="flex items-center justify-between mb-2 gap-2">
                        <h3 className="text-sm font-bold text-amber-800">
                          ตอบคำถามของคุณ
                        </h3>
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                          {qReading.kindLabel}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mb-1">
                        “{qReading.question}”
                      </p>
                      <p className="text-sm font-semibold text-slate-800 mb-2">
                        {qReading.verdict}
                      </p>
                      <ul className="space-y-1 list-disc pl-4">
                        {qReading.lines.map((l, i) => (
                          <li key={i} className="text-xs text-slate-700 leading-relaxed">
                            {l}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div
                    className={`rounded-xl bg-indigo-50 border border-indigo-200/70 p-4 break-inside-avoid ${
                      qReading ? "" : "md:col-span-2"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-bold text-indigo-800">
                        สรุปภาพรวม
                      </h3>
                      <span
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${toneStyle(result.tone).badge}`}
                      >
                        {result.tone}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed">
                      {result.summary}
                    </p>
                  </div>
                </div>
              )}

              <p className="mt-4 text-[11px] text-slate-400 text-center">
                ใช้เพื่อความบันเทิงและเป็นแนวทางคิดเท่านั้น
              </p>
            </div>

            <button
              type="button"
              onClick={reset}
              className="mt-5 w-full bg-white border border-indigo-300 text-indigo-700 hover:bg-indigo-50 font-bold py-2.5 rounded-lg text-sm transition"
            >
              เริ่มใหม่ (สับไพ่รอบใหม่)
            </button>
          </section>
        )}

      </div>

      {/* หน้าต่างแสดงรูป A4 ที่สร้างเสร็จ */}
      {pages && (
        <div
          className="fixed inset-0 z-50 bg-black/70 overflow-y-auto p-4"
          role="dialog"
          aria-modal="true"
          aria-label="รูปรายงาน A4"
        >
          <div className="mx-auto max-w-md bg-white rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-slate-800">
                รูปรายงาน A4 ({pages.length} หน้า)
              </h3>
              <button
                type="button"
                onClick={closePages}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800"
              >
                ปิด
              </button>
            </div>
            <p className="text-[11px] text-slate-500 mb-3">
              มือถือ: กด “บันทึกลงรูปภาพ” แล้วเลือก “บันทึกรูปภาพ” หรือกดค้างที่รูปแต่ละหน้าเพื่อบันทึกลงอัลบั้ม
            </p>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <button
                type="button"
                onClick={sharePages}
                className="text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-lg transition"
              >
                📱 บันทึกลงรูปภาพ
              </button>
              <button
                type="button"
                onClick={downloadPages}
                className="text-xs font-bold bg-white border border-indigo-300 text-indigo-700 hover:bg-indigo-50 py-2.5 rounded-lg transition"
              >
                ⬇️ ดาวน์โหลดไฟล์
              </button>
            </div>
            {saveError && (
              <p className="text-xs text-rose-600 mb-2" role="alert">
                {saveError}
              </p>
            )}
            <ul className="space-y-3">
              {pages.map((p, i) => (
                <li key={p.url}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.url}
                    alt={`รายงานหน้า ${i + 1}`}
                    className="w-full border border-slate-200 rounded shadow-sm"
                  />
                  <p className="text-[11px] text-slate-400 text-center mt-1">
                    หน้า {i + 1}/{pages.length}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </main>
  );
}