import type { DrawnCard } from "../lib/tarot";
import TarotCardArt, { TarotCardBack } from "./TarotCardArt";

// ผังไพ่ 10 ใบแบบ Celtic Cross
//
//            [5]                [10]
//        [4] [1/2] [6]          [9]
//            [3]                [8]
//                               [7]
//
// ลำดับใน cards (index 0-9) = ตำแหน่ง 1-10 ตาม SPREADS.ten ใน lib/tarot.ts
// ใบที่ 2 (อุปสรรค) วางขวางทับใบที่ 1 หมุน 90°

const W = 72; // กว้างไพ่ (px)
const H = 120; // สูงไพ่ (px) = W * 200/120

// [index ของไพ่, คอลัมน์ grid, แถว grid]
const CELLS: [number, number, number][] = [
  [4, 2, 1], // 5 เป้าหมาย (บน)
  [3, 1, 2], // 4 อดีต (ซ้าย)
  [0, 2, 2], // 1 ปัจจุบัน + 2 อุปสรรค (กลาง)
  [5, 3, 2], // 6 อนาคตอันใกล้ (ขวา)
  [2, 2, 3], // 3 รากฐาน (ล่าง)
  [9, 4, 1], // 10 ผลลัพธ์ (บนสุดของไม้เท้า)
  [8, 4, 2], // 9 ความหวัง/ความกลัว
  [7, 4, 3], // 8 สภาพแวดล้อม
  [6, 4, 4], // 7 ตัวคุณ (ล่างสุด)
];

type Props = {
  cards: DrawnCard[];
  revealed: Set<number>;
  onReveal?: (i: number) => void;
};

function shortLabel(position: string) {
  // "1. ปัจจุบัน" -> "ปัจจุบัน"
  return position.replace(/^\d+\.\s*/, "");
}

function Slot({
  c,
  i,
  revealed,
  onReveal,
  crossing = false,
}: {
  c: DrawnCard;
  i: number;
  revealed: boolean;
  onReveal?: (i: number) => void;
  crossing?: boolean;
}) {
  const art = revealed ? (
    <TarotCardArt card={c.card} reversed={c.reversed} className="w-full h-full drop-shadow-lg" />
  ) : (
    <TarotCardBack className="w-full h-full drop-shadow-lg" />
  );

  return (
    <button
      type="button"
      onClick={() => onReveal?.(i)}
      disabled={revealed || !onReveal}
      aria-label={`${c.position}${revealed ? ` ${c.card.name}` : " แตะเพื่อเปิดไพ่"}`}
      className={`relative block rounded-lg disabled:cursor-default focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-300 ${
        crossing ? "absolute left-0 top-0" : ""
      }`}
      style={{
        width: W,
        height: H,
        transform: crossing ? "rotate(90deg)" : undefined,
        zIndex: crossing ? 10 : undefined,
      }}
    >
      {art}
      <span
        className="absolute -top-2 -left-2 w-5 h-5 rounded-full bg-amber-300 text-indigo-950 text-[10px] font-bold flex items-center justify-center shadow"
        style={{ transform: crossing ? "rotate(-90deg)" : undefined }}
      >
        {i + 1}
      </span>
    </button>
  );
}

export default function CelticCrossBoard({ cards, revealed, onReveal }: Props) {
  if (cards.length < 10) return null;

  return (
    <div className="overflow-x-auto">
      <div
        className="mx-auto grid gap-x-8 gap-y-9 pb-2"
        style={{
          gridTemplateColumns: `repeat(4, ${W}px)`,
          gridTemplateRows: `repeat(4, ${H}px)`,
          width: "max-content",
        }}
      >
        {CELLS.map(([idx, col, row]) => {
          const c = cards[idx];
          const isCenter = idx === 0;
          return (
            <div
              key={idx}
              className="relative"
              style={{ gridColumn: col, gridRow: row, width: W, height: H }}
            >
              <Slot c={c} i={idx} revealed={revealed.has(idx)} onReveal={onReveal} />

              {isCenter && (
                <Slot
                  c={cards[1]}
                  i={1}
                  revealed={revealed.has(1)}
                  onReveal={onReveal}
                  crossing
                />
              )}

              <span
                className="absolute left-1/2 -translate-x-1/2 top-full mt-1 text-[10px] leading-tight text-center text-indigo-100 w-24"
              >
                {isCenter ? (
                  <>
                    1 {shortLabel(c.position)}
                    <br />2 {shortLabel(cards[1].position)}
                  </>
                ) : (
                  <>
                    {idx + 1} {shortLabel(c.position)}
                  </>
                )}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}