"use client";

import { useRef, useState } from "react";
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
import TarotCardArt, { TarotCardBack } from "../../components/TarotCardArt";

// ต้องติดตั้งก่อน: npm i html-to-image

const TONE_STYLE: Record<Tone, { badge: string; bar: string }> = {
  ดี: { badge: "bg-emerald-100 text-emerald-700", bar: "bg-emerald-500" },
  กลาง: { badge: "bg-slate-100 text-slate-600", bar: "bg-slate-400" },
  ร้าย: { badge: "bg-rose-100 text-rose-700", bar: "bg-rose-500" },
};

const SUIT_GLYPH: Record<string, string> = {
  wands: "♣",
  cups: "♥",
  swords: "♠",
  pentacles: "♦",
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

  const reportRef = useRef<HTMLDivElement>(null);

  const allRevealed = result !== null && revealed.size === result.cards.length;
  const qReading = result ? readQuestion(result) : null;

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

  function reset() {
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

  // เซฟเป็นรูป PNG
  async function saveImage() {
    if (!reportRef.current || saving) return;
    setSaving(true);
    setSaveError(null);
    try {
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(reportRef.current, {
        pixelRatio: 2,
        backgroundColor: "#ffffff",
        skipFonts: true, // กัน error จาก stylesheet/ฟอนต์ข้ามโดเมน
      });
      download(dataUrl, `tarot-${fileStamp()}.png`);
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
                    {saving ? "กำลังสร้างรูป…" : "💾 เซฟเป็นรูป (PNG)"}
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

              {/* แถบไพ่แนวนอน */}
              <div className="rounded-xl bg-indigo-950 px-3 py-4 mb-4 overflow-x-auto">
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

                  const t = TONE_STYLE[c.tone];
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
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${TONE_STYLE[result.tone].badge}`}
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
    </main>
  );
}