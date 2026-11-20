// lib/tarotQuestion.ts
// ตีความ "คำถามที่พิมพ์" ให้เข้ากับไพ่ที่เปิดได้ (ไม่แก้ tarot.ts เดิม)

import type { SpreadResult, Tone } from "./tarot";

export type QuestionReading = {
  question: string;
  kindLabel: string; // ประเภทคำถามที่ตรวจจับได้
  verdict: string; // คำตอบสั้น ๆ
  lines: string[]; // รายละเอียดที่โยงกับไพ่
};

const SCORE: Record<Tone, number> = { ดี: 1, กลาง: 0, ระวัง: -1 };

type QKind = "yesno" | "choice" | "timing" | "why" | "how" | "general";

function detectKind(q: string): QKind {
  if (/(เมื่อไหร่|เมื่อไร|ตอนไหน|เมื่อใด|กี่วัน|กี่เดือน)/.test(q)) return "timing";
  if (/(ทำไม|เพราะอะไร|สาเหตุ)/.test(q)) return "why";
  if (/(ยังไง|อย่างไร|ทำอย่างไร|แก้ยังไง|ควรทำอะไร)/.test(q)) return "how";
  if (/(ไหม|มั้ย|หรือไม่|หรือเปล่า|ใช่หรือ|ได้หรือ)/.test(q)) return "yesno";
  if (/.+หรือ.+/.test(q)) return "choice";
  return "general";
}

const KIND_LABEL: Record<QKind, string> = {
  yesno: "คำถามใช่/ไม่ใช่",
  choice: "คำถามเลือกทาง",
  timing: "คำถามเรื่องช่วงเวลา",
  why: "คำถามหาสาเหตุ",
  how: "คำถามหาวิธีรับมือ",
  general: "คำถามทั่วไป",
};

function nm(c: SpreadResult["cards"][number]) {
  return `${c.card.name}${c.reversed ? " (กลับหัว)" : ""}`;
}

export function readQuestion(r: SpreadResult): QuestionReading | null {
  const q = r.question?.trim();
  if (!q) return null;

  const cards = r.cards;
  const four = r.kind === "four";
  const outcome = cards[cards.length - 1];
  const obstacle = cards[1];
  const advice = four ? cards[2] : cards[4]; // 10 ใบ: เป้าหมาย/ความคาดหวัง
  const near = four ? cards[2] : cards[5]; // 10 ใบ: อนาคตอันใกล้
  const root = four ? cards[0] : cards[2];

  const kind = detectKind(q);

  // คะแนนความโน้มเอียง: ผลลัพธ์หนักสุด
  const lean =
    SCORE[outcome.tone] * 2 + SCORE[near.tone] + SCORE[advice.tone] * 0.5 + SCORE[obstacle.tone] * 0.5;

  let verdict: string;
  if (kind === "timing") {
    const fast = /(Knight|Eight|Ace|Page)/.test(outcome.card.en);
    verdict =
      outcome.tone === "ระวัง" || outcome.reversed
        ? "ยังต้องรออีกพัก ควรเตรียมตัวและแก้อุปสรรคก่อน"
        : fast
          ? "ค่อนข้างใกล้ เหตุการณ์น่าจะเคลื่อนไหวเร็ว"
          : "ช่วงปานกลาง ค่อยเป็นค่อยไป";
  } else if (kind === "why") {
    verdict = `ต้นเหตุสะท้อนผ่าน ${nm(root)} และตัวที่ทับซ้อนคือ ${nm(obstacle)}`;
  } else if (kind === "how") {
    verdict = `แนวทางหลักคือ ${nm(advice)}: ${advice.meaning}`;
  } else if (kind === "choice") {
    verdict =
      lean >= 1.5
        ? "ทางที่ใจคุณโน้มไปตอนนี้มีแนวโน้มส่งผลดี"
        : lean <= -1
          ? "ควรชั่งใจอีกครั้ง ทางที่เลือกอยู่อาจมีอุปสรรคมาก"
          : "ทั้งสองทางยังพอ ๆ กัน ผลขึ้นกับวิธีที่คุณลงมือ";
  } else {
    verdict =
      lean >= 1.5
        ? "โน้มไปทาง “ได้ / ใช่” ถ้าลงมือทำอย่างตั้งใจ"
        : lean <= -1
          ? "โน้มไปทาง “ยังไม่ใช่ตอนนี้” ควรชะลอหรือปรับแผนก่อน"
          : "ยังไม่ฟันธง ผลขึ้นอยู่กับการตัดสินใจของคุณในช่วงนี้";
  }

  const lines: string[] = [];
  lines.push(`ต้นเรื่องของคำถามนี้สะท้อนจาก ${nm(root)}: ${root.meaning}`);
  lines.push(`สิ่งที่ขวางอยู่คือ ${nm(obstacle)}: ${obstacle.meaning}`);
  lines.push(
    four
      ? `คำแนะนำต่อคำถามนี้คือ ${nm(advice)}: ${advice.meaning}`
      : `สิ่งที่คุณคาดหวังคือ ${nm(advice)} และสิ่งที่กำลังจะเข้ามาคือ ${nm(near)}: ${near.meaning}`,
  );
  lines.push(`ปลายทางของ “${q}” คือ ${nm(outcome)}: ${outcome.meaning}`);

  const revCount = cards.filter((c) => c.reversed).length;
  if (revCount > cards.length / 2) {
    lines.push("ไพ่กลับหัวเยอะ คำตอบยังไม่นิ่ง ควรถามซ้ำหลังจัดการเรื่องที่ติดค้างแล้ว");
  }

  return { question: q, kindLabel: KIND_LABEL[kind], verdict, lines };
}