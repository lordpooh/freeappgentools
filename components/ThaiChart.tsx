import {
  DISPLAY_ORDER,
  THAI_ZODIACS,
  isRetrograde,
  planetSymbol,
  type ChartResult,
} from "../lib/thai-astro";

// ผังดวงไทย: ราศีเรียงตามเข็มนาฬิกา เริ่มช่องบนซ้าย = มีน, เมษ, พฤษภ, เมถุน ...
// index ราศี (0 = เมษ) -> [คอลัมน์, แถว] ในตาราง 4x4
const SIGN_CELL: [number, number][] = [
  [1, 0], [2, 0], [3, 0], [3, 1], [3, 2], [3, 3],
  [2, 3], [1, 3], [0, 3], [0, 2], [0, 1], [0, 0],
];

const CELL = 150;
const PAD = 10;
const SIZE = CELL * 4 + PAD * 2;

const FONT = '"Noto Sans Thai", "Leelawadee UI", Sarabun, Tahoma, sans-serif';

function fmtAyanamsa(a: number) {
  return `${Math.floor(a)}°${String(Math.floor((a % 1) * 60)).padStart(2, "0")}′`;
}

export default function ThaiChart({ chart }: { chart: ChartResult }) {
  // จัดดาวเข้าช่องราศี
  const bySign: Record<number, ChartResult["planets"][string][]> = {};
  for (const code of DISPLAY_ORDER) {
    const p = chart.planets[code];
    const zIdx = Math.floor(p.longitude / 30);
    (bySign[zIdx] ||= []).push(p);
  }

  const mid = PAD + CELL * 2;
  const [date, time] = chart.datetime_th.split(" ");

  return (
    <svg
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      className="w-full h-auto"
      role="img"
      aria-label={`ผังดวงชะตาไทย ${chart.datetime_th}`}
      style={{ fontFamily: FONT }}
    >
      <rect
        width={SIZE}
        height={SIZE}
        rx={8}
        className="fill-[#fffaf0] dark:fill-[#17130d]"
      />

      {SIGN_CELL.map(([cx, cy], zIdx) => {
        const x = PAD + cx * CELL;
        const y = PAD + cy * CELL;
        return (
          <g key={zIdx}>
            <rect
              x={x}
              y={y}
              width={CELL}
              height={CELL}
              strokeWidth={1.5}
              className="fill-[#fffdf7] stroke-[#8a6d3b] dark:fill-[#1e1a12] dark:stroke-[#b38b45]"
            />
            <text
              x={x + 8}
              y={y + 18}
              fontSize={13}
              fontWeight={600}
              className="fill-[#8a6d3b] dark:fill-[#d4a95a]"
            >
              {zIdx + 1} {THAI_ZODIACS[zIdx]}
            </text>
            {(bySign[zIdx] || []).map((p, i) => {
              const retro = isRetrograde(p);
              const ty = y + 42 + i * 19;
              return (
                <text
                  key={p.code}
                  x={x + 10}
                  y={ty}
                  fontSize={14.5}
                  className={
                    retro
                      ? "fill-[#c0392b] dark:fill-[#ff8a7a]"
                      : "fill-[#1f2937] dark:fill-[#eee7d8]"
                  }
                >
                  <tspan fontWeight={700}>{planetSymbol(p.code)}</tspan>
                  <tspan dx={8}>{p.name}</tspan>
                  <tspan
                    dx={6}
                    fontSize={12.5}
                    className={
                      retro
                        ? "fill-[#c0392b] dark:fill-[#ff8a7a]"
                        : "fill-[#6b7280] dark:fill-[#a39a86]"
                    }
                  >
                    {p.degree}°{String(p.minute).padStart(2, "0")}′{retro ? " R" : ""}
                  </tspan>
                </text>
              );
            })}
          </g>
        );
      })}

      {/* กรอบกลาง 2x2 */}
      <rect
        x={PAD + CELL}
        y={PAD + CELL}
        width={CELL * 2}
        height={CELL * 2}
        strokeWidth={1.5}
        className="fill-[#f6ecd6] stroke-[#8a6d3b] dark:fill-[#2a2314] dark:stroke-[#b38b45]"
      />
      <g textAnchor="middle" className="fill-[#5b4a2a] dark:fill-[#d9cba8]">
        <text
          x={mid}
          y={PAD + CELL + 120}
          fontSize={28}
          fontWeight={700}
          className="fill-[#5b3f10] dark:fill-[#f0d9a0]"
        >
          ดวงชะตาไทย
        </text>
        <text x={mid} y={PAD + CELL + 155} fontSize={15}>
          วันที่ {date}
        </text>
        <text x={mid} y={PAD + CELL + 180} fontSize={15}>
          เวลา {time} (เวลาไทย)
        </text>
        <text
          x={mid}
          y={PAD + CELL + 210}
          fontSize={12.5}
          className="fill-[#8a7a58] dark:fill-[#a39a86]"
        >
          นิรายนะ · ลาหิรี {fmtAyanamsa(chart.ayanamsa)}
        </text>
        <text
          x={mid}
          y={PAD + CELL + 232}
          fontSize={12.5}
          className="fill-[#8a7a58] dark:fill-[#a39a86]"
        >
          R = พักร (ถอยหลัง)
        </text>
      </g>
    </svg>
  );
}
