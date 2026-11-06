import type { Card } from "../lib/tarot";

// ภาพไพ่วาดเป็น SVG จาก card.id (ไม่ต้องมีไฟล์รูป)
// id 0-21 = เมเจอร์ / 22+ = ไมเนอร์ เรียงชุด ไม้เท้า → ถ้วย → ดาบ → เหรียญ ชุดละ 14 ใบ (เอซ..สิบ, เพจ, ไนท์, ควีน, คิง)

const T = "\uFE0E"; // บังคับให้แสดงเป็นตัวอักษร ไม่เป็นอีโมจิสี

const ROMAN = [
  "0", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X",
  "XI", "XII", "XIII", "XIV", "XV", "XVI", "XVII", "XVIII", "XIX", "XX", "XXI",
];

const MAJOR_GLYPH = [
  "✧", "∞", "☽", "♀", "♂", "✝", "♥", "♞", "♌", "✶", "☸",
  "⚖", "Ψ", "☠", "♒", "♑", "♜", "★", "☾", "☀", "✺", "❂",
];

const SUITS = ["wands", "cups", "swords", "pentacles"] as const;

const SUIT_STYLE: Record<
  (typeof SUITS)[number],
  { glyph: string; bg: string; fg: string }
> = {
  wands: { glyph: "♣", bg: "#fff4e6", fg: "#c2410c" },
  cups: { glyph: "♥", bg: "#eef6ff", fg: "#1d4ed8" },
  swords: { glyph: "♠", bg: "#f1f5f9", fg: "#334155" },
  pentacles: { glyph: "♦", bg: "#f3f9ee", fg: "#4d7c0f" },
};

const PIPS: Record<number, [number, number][]> = {
  2: [[60, 70], [60, 130]],
  3: [[60, 65], [60, 100], [60, 135]],
  4: [[40, 75], [80, 75], [40, 125], [80, 125]],
  5: [[40, 75], [80, 75], [60, 100], [40, 125], [80, 125]],
  6: [[40, 65], [80, 65], [40, 100], [80, 100], [40, 135], [80, 135]],
  7: [[40, 65], [80, 65], [60, 82], [40, 100], [80, 100], [40, 135], [80, 135]],
  8: [[40, 65], [80, 65], [60, 82], [40, 100], [80, 100], [60, 118], [40, 135], [80, 135]],
  9: [[40, 60], [80, 60], [40, 87], [80, 87], [60, 100], [40, 113], [80, 113], [40, 140], [80, 140]],
  10: [[40, 60], [80, 60], [60, 73], [40, 90], [80, 90], [40, 110], [80, 110], [60, 127], [40, 140], [80, 140]],
};

const COURT = ["เพจ", "ไนท์", "ควีน", "คิง"];
const COURT_LETTER = ["P", "Kn", "Q", "K"];

type Props = {
  card: Card;
  reversed?: boolean;
  className?: string;
};

export default function TarotCardArt({ card, reversed = false, className = "" }: Props) {
  const isMajor = card.id < 22;
  const rot = reversed ? "rotate(180deg)" : undefined;

  // ───── เมเจอร์ ─────
  if (isMajor) {
    return (
      <svg
        viewBox="0 0 120 200"
        className={className}
        style={{ transform: rot }}
        role="img"
        aria-label={`${card.en}${reversed ? " (reversed)" : ""}`}
      >
        <rect x="1" y="1" width="118" height="198" rx="8" fill="#1e1b4b" stroke="#d4af37" strokeWidth="2" />
        <rect x="7" y="7" width="106" height="186" rx="5" fill="none" stroke="#d4af37" strokeWidth="0.8" opacity="0.7" />
        <text x="60" y="30" textAnchor="middle" fontSize="15" fill="#d4af37" fontFamily="Georgia, serif">
          {ROMAN[card.id]}
        </text>
        <circle cx="60" cy="98" r="38" fill="none" stroke="#d4af37" strokeWidth="0.8" opacity="0.6" />
        <text x="60" y="116" textAnchor="middle" fontSize="52" fill="#fde68a" fontFamily="'Segoe UI Symbol', 'Noto Sans Symbols', serif">
          {MAJOR_GLYPH[card.id] + T}
        </text>
        <text x="60" y="172" textAnchor="middle" fontSize="11" fill="#fde68a" fontFamily="sans-serif">
          {card.name}
        </text>
        <text x="60" y="185" textAnchor="middle" fontSize="6.5" fill="#d4af37" fontFamily="Georgia, serif">
          {card.en.toUpperCase()}
        </text>
      </svg>
    );
  }

  // ───── ไมเนอร์ ─────
  const n = card.id - 22;
  const suit = SUITS[Math.floor(n / 14)];
  const r = n % 14; // 0=เอซ … 9=สิบ, 10..13 = เพจ..คิง
  const s = SUIT_STYLE[suit];
  const isCourt = r >= 10;
  const count = r + 1;

  return (
    <svg
      viewBox="0 0 120 200"
      className={className}
      style={{ transform: rot }}
      role="img"
      aria-label={`${card.en}${reversed ? " (reversed)" : ""}`}
    >
      <rect x="1" y="1" width="118" height="198" rx="8" fill={s.bg} stroke={s.fg} strokeWidth="2" />
      <rect x="7" y="7" width="106" height="186" rx="5" fill="none" stroke={s.fg} strokeWidth="0.8" opacity="0.5" />

      <text x="16" y="26" fontSize="14" fill={s.fg} fontFamily="Georgia, serif" fontWeight="bold">
        {isCourt ? COURT_LETTER[r - 10] : r === 0 ? "A" : count}
      </text>
      <text x="104" y="26" textAnchor="end" fontSize="14" fill={s.fg} fontFamily="'Segoe UI Symbol', 'Noto Sans Symbols', serif">
        {s.glyph + T}
      </text>

      {r === 0 && (
        <text x="60" y="122" textAnchor="middle" fontSize="70" fill={s.fg} fontFamily="'Segoe UI Symbol', 'Noto Sans Symbols', serif">
          {s.glyph + T}
        </text>
      )}

      {r > 0 && !isCourt &&
        PIPS[count].map(([x, y], i) => (
          <text
            key={i}
            x={x}
            y={y + 9}
            textAnchor="middle"
            fontSize="26"
            fill={s.fg}
            fontFamily="'Segoe UI Symbol', 'Noto Sans Symbols', serif"
          >
            {s.glyph + T}
          </text>
        ))}

      {isCourt && (
        <>
          <circle cx="60" cy="100" r="34" fill="none" stroke={s.fg} strokeWidth="1" opacity="0.5" />
          <text x="60" y="112" textAnchor="middle" fontSize="34" fill={s.fg} fontFamily="Georgia, serif" fontWeight="bold">
            {COURT_LETTER[r - 10]}
          </text>
          <text x="60" y="142" textAnchor="middle" fontSize="20" fill={s.fg} fontFamily="'Segoe UI Symbol', 'Noto Sans Symbols', serif">
            {s.glyph + T}
          </text>
        </>
      )}

      <text x="60" y="180" textAnchor="middle" fontSize="11" fill={s.fg} fontFamily="sans-serif">
        {card.name}
      </text>
      <text x="60" y="190" textAnchor="middle" fontSize="6" fill={s.fg} opacity="0.7" fontFamily="Georgia, serif">
        {card.en.toUpperCase()}
      </text>
    </svg>
  );
}

// ใช้ตอนไพ่ยังคว่ำอยู่
export function TarotCardBack({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 200" className={className} aria-hidden="true">
      <rect x="1" y="1" width="118" height="198" rx="8" fill="#1e1b4b" stroke="#d4af37" strokeWidth="2" />
      <rect x="8" y="8" width="104" height="184" rx="5" fill="none" stroke="#d4af37" strokeWidth="0.8" opacity="0.7" />
      <circle cx="60" cy="100" r="30" fill="none" stroke="#d4af37" strokeWidth="1" opacity="0.7" />
      <circle cx="60" cy="100" r="18" fill="none" stroke="#d4af37" strokeWidth="0.8" opacity="0.5" />
      <text x="60" y="112" textAnchor="middle" fontSize="32" fill="#fde68a" fontFamily="'Segoe UI Symbol', 'Noto Sans Symbols', serif">
        {"✦" + T}
      </text>
    </svg>
  );
}