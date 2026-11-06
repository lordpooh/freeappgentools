"use client";

import { useState } from "react";
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
import TarotCardArt, { TarotCardBack } from "../../components/TarotCardArt";

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

  const allRevealed = result !== null && revealed.size === result.cards.length;

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
  }

  function reset() {
    setResult(null);
    setRevealed(new Set());
    setDeck(null);
    setShuffleCount(0);
  }

  function reveal(i: number) {
    setRevealed((prev) => new Set(prev).add(i));
  }

  function revealAll() {
    if (result) setRevealed(new Set(result.cards.map((_, i) => i)));
  }

  return (
    <main className="min-h-screen bg-slate-100 flex items-start justify-center p-4 font-sans">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl p-6 mt-4">
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
              className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 mb-5"
            />

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

        {/* ───────── ขั้นที่ 2: ผลลัพธ์ ───────── */}
        {result && (
          <section>
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-sm font-bold text-slate-800">
                {result.title}
              </h2>
              {!allRevealed && (
                <button
                  type="button"
                  onClick={revealAll}
                  className="text-xs font-semibold text-indigo-600 hover:underline"
                >
                  เปิดทั้งหมด
                </button>
              )}
            </div>
            <p className="text-[11px] text-slate-400 mb-3">
              {TOPICS[result.topic].emoji} {TOPICS[result.topic].label} · สับไป{" "}
              {shuffleCount} ครั้ง
              {result.question ? ` · คำถาม: ${result.question}` : ""}
            </p>

            <ul className="space-y-2.5">
              {result.cards.map((c, i) => {
                const open = revealed.has(i);
                if (!open) {
                  return (
                    <li key={i}>
                      <button
                        type="button"
                        onClick={() => reveal(i)}
                        className="w-full flex items-center gap-3 text-left rounded-xl border border-indigo-900/20 bg-indigo-950 px-3 py-3 hover:bg-indigo-900 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-400"
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
                    className="relative overflow-hidden rounded-xl border border-slate-200 bg-white pl-4 pr-3 py-3"
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
              <div className="mt-5 rounded-xl bg-indigo-50 border border-indigo-200/70 p-4">
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
            )}

            <button
              type="button"
              onClick={reset}
              className="mt-5 w-full bg-white border border-indigo-300 text-indigo-700 hover:bg-indigo-50 font-bold py-2.5 rounded-lg text-sm transition"
            >
              เริ่มใหม่ (สับไพ่รอบใหม่)
            </button>
          </section>
        )}

        <p className="mt-8 text-[11px] text-slate-400 text-center">
          ใช้เพื่อความบันเทิงและเป็นแนวทางคิดเท่านั้น
        </p>
      </div>
    </main>
  );
}