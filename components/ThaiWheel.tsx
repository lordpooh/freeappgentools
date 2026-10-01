import {
  DISPLAY_ORDER,
  THAI_ZODIACS,
  isRetrograde,
  planetSymbol,
  type ChartResult,
  type PlanetInfo,
} from "../lib/thai-astro";

// ผังดวงไทยแบบวงกลม
// - ราศีเรียงตามเข็มนาฬิกา ตรงกับผังสี่เหลี่ยม: มีนอยู่บนซ้าย เมษต่อจากมีน
// - เส้นแบ่ง เมษ | พฤษภ อยู่ที่ 12 นาฬิกา  =>  มุมหน้าจอ (องศา ตามเข็มจากบนสุด) = ลองจิจูด - 30
// - ดาววางที่องศาจริงในราศี มีเส้นนำจากวงแหวนราศี

const SIZE = 760; // เผื่อขอบนอกสำหรับป้ายลัคนา
const C = SIZE / 2;
const R_OUT = 335; // ขอบนอกวงแหวนราศี
const R_SIGN_IN = 255; // ขอบในวงแหวนราศี
const R_CENTER = 86; // วงกลมกลาง
const LANES = [226, 176, 126]; // รัศมีของแต่ละชั้น ใช้เมื่อดาวอยู่ใกล้กัน
const MARK_R = 16;
const LABEL_HALF_W = 24; // ครึ่งความกว้างของข้อความองศา ใช้คำนวณระยะห่างขั้นต่ำ

const FONT = '"Noto Sans Thai", "Leelawadee UI", Sarabun, Tahoma, sans-serif';

const f = (n: number) => n.toFixed(2);
const toTheta = (lon: number) => lon - 30;

function pt(r: number, theta: number): [number, number] {
  const a = (theta * Math.PI) / 180;
  return [C + r * Math.sin(a), C - r * Math.cos(a)];
}

function sectorPath(r1: number, r2: number, t1: number, t2: number) {
  const [x1, y1] = pt(r2, t1);
  const [x2, y2] = pt(r2, t2);
  const [x3, y3] = pt(r1, t2);
  const [x4, y4] = pt(r1, t1);
  return `M${f(x1)} ${f(y1)} A${r2} ${r2} 0 0 1 ${f(x2)} ${f(y2)} L${f(x3)} ${f(y3)} A${r1} ${r1} 0 0 0 ${f(x4)} ${f(y4)} Z`;
}

function angDiff(a: number, b: number) {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}

function fmtAyanamsa(a: number) {
  return `${Math.floor(a)}°${String(Math.floor((a % 1) * 60)).padStart(2, "0")}′`;
}

type Placed = { p: PlanetInfo; lane: number; disp: number };

const minGapFor = (lane: number) =>
  ((2 * Math.asin(LABEL_HALF_W / LANES[lane])) * 180) / Math.PI;

// ดาวที่อยู่ใกล้กันจะถูกสลับไปคนละชั้น แล้วกางออกตามแนววงกลมไม่ให้ทับกัน
// (ตำแหน่งจริงยังแสดงด้วยเส้นนำที่ชี้ไปยังองศาบนวงแหวนราศี)
function layoutPlanets(planets: PlanetInfo[]): Placed[] {
  const sorted = [...planets].sort((a, b) => a.longitude - b.longitude);
  const gap0 = minGapFor(0);

  const placed: Placed[] = [];
  sorted.forEach((p, i) => {
    let lane = 0;
    if (i > 0 && p.longitude - sorted[i - 1].longitude < gap0) {
      lane = (placed[i - 1].lane + 1) % LANES.length;
    }
    placed.push({ p, lane, disp: p.longitude });
  });

  for (let lane = 0; lane < LANES.length; lane++) {
    const items = placed.filter((q) => q.lane === lane);
    const minGap = minGapFor(lane);
    if (items.length < 2) continue;
    for (let iter = 0; iter < 300; iter++) {
      let moved = false;
      for (let i = 0; i < items.length; i++) {
        const a = items[i];
        const b = items[(i + 1) % items.length];
        let gap = b.disp - a.disp;
        if (i === items.length - 1) gap += 360;
        if (gap < minGap - 1e-6) {
          const push = (minGap - gap) / 2;
          a.disp -= push;
          b.disp += push;
          moved = true;
        }
      }
      if (!moved) break;
    }
  }
  return placed;
}

export default function ThaiWheel({ chart }: { chart: ChartResult }) {
  const planets = DISPLAY_ORDER.map((c) => chart.planets[c]);
  const placed = layoutPlanets(planets);
  const [date, time] = chart.datetime_th.split(" ");

  // ลัคนา
  const lag = chart.lagna;
  const lagT = toTheta(lag.longitude);
  const lagSign = Math.floor(lag.longitude / 30);
  const [lax1, lay1] = pt(R_SIGN_IN, lagT);
  const [lax2, lay2] = pt(R_OUT + 8, lagT);
  const [lbx, lby] = pt(R_OUT + 24, lagT);
  const lagLabel = `ลัคนา ${lag.zodiac} ${lag.degree}°${String(lag.minute).padStart(2, "0")}′`;

  return (
    <svg
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      className="h-auto w-full"
      role="img"
      aria-label={`ผังดวงชะตาไทยแบบวงกลม ${chart.datetime_th} ลัคนา${chart.lagna.zodiac} ${chart.lagna.degree} องศา`}
      style={{ fontFamily: FONT }}
    >
      <rect width={SIZE} height={SIZE} rx={12} className="fill-[#fffaf0] dark:fill-[#17130d]" />

      {/* วงแหวนราศี 12 ช่อง */}
      {THAI_ZODIACS.map((name, z) => {
        const t1 = toTheta(z * 30);
        const t2 = toTheta((z + 1) * 30);
        const [lx, ly] = pt((R_OUT + R_SIGN_IN) / 2, (t1 + t2) / 2);
        return (
          <g key={name}>
            <path
              d={sectorPath(R_SIGN_IN, R_OUT, t1, t2)}
              strokeWidth={1.5}
              className={
                z % 2 === 0
                  ? "fill-[#f6ecd6] stroke-[#8a6d3b] dark:fill-[#2a2314] dark:stroke-[#b38b45]"
                  : "fill-[#fffdf7] stroke-[#8a6d3b] dark:fill-[#1e1a12] dark:stroke-[#b38b45]"
              }
            />
            <text
              x={f(lx)}
              y={f(ly - 6)}
              textAnchor="middle"
              fontSize={12}
              className="fill-[#8a7a58] dark:fill-[#a39a86]"
            >
              {z + 1}
            </text>
            <text
              x={f(lx)}
              y={f(ly + 14)}
              textAnchor="middle"
              fontSize={18}
              fontWeight={700}
              className="fill-[#5b3f10] dark:fill-[#f0d9a0]"
            >
              {name}
            </text>
          </g>
        );
      })}

      {/* ลัคนา: ขอบราศีเน้นสี + เส้นตัดวงแหวนที่องศาจริง + ป้าย "ล" ด้านนอก */}
      <path
        d={sectorPath(R_SIGN_IN, R_OUT, toTheta(lagSign * 30), toTheta((lagSign + 1) * 30))}
        fill="none"
        strokeWidth={3.5}
        className="stroke-[#0f766e] dark:stroke-[#5eead4]"
      />
      <g>
        <title>{`${lagLabel} (${chart.location.name})`}</title>
        <line
          x1={f(lax1)}
          y1={f(lay1)}
          x2={f(lax2)}
          y2={f(lay2)}
          strokeWidth={3}
          strokeLinecap="round"
          className="stroke-[#0f766e] dark:stroke-[#5eead4]"
        />
        <circle cx={f(lbx)} cy={f(lby)} r={14} className="fill-[#0f766e] dark:fill-[#5eead4]" />
        <text
          x={f(lbx)}
          y={f(lby + 0.5)}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={16}
          fontWeight={700}
          className="fill-white dark:fill-[#0b2f2b]"
        >
          ล
        </text>
      </g>

      {/* ขีดบอกองศาทุก 5° (ยาวขึ้นที่ 10°, 20°) */}
      {THAI_ZODIACS.flatMap((_, z) =>
        [5, 10, 15, 20, 25].map((d) => {
          const t = toTheta(z * 30 + d);
          const len = d % 10 === 0 ? 10 : 6;
          const [x1, y1] = pt(R_SIGN_IN, t);
          const [x2, y2] = pt(R_SIGN_IN + len, t);
          return (
            <line
              key={`${z}-${d}`}
              x1={f(x1)}
              y1={f(y1)}
              x2={f(x2)}
              y2={f(y2)}
              strokeWidth={1}
              className="stroke-[#8a6d3b] dark:stroke-[#b38b45]"
            />
          );
        })
      )}

      {/* วงกลมด้านในสำหรับวางดาว */}
      <circle
        cx={C}
        cy={C}
        r={R_SIGN_IN}
        strokeWidth={1.5}
        className="fill-[#fffdf7] stroke-[#8a6d3b] dark:fill-[#1a160f] dark:stroke-[#b38b45]"
      />

      {/* เส้นแบ่งราศีต่อเข้ามาด้านใน (จาง ๆ) */}
      {THAI_ZODIACS.map((_, z) => {
        const [x1, y1] = pt(R_CENTER, toTheta(z * 30));
        const [x2, y2] = pt(R_SIGN_IN, toTheta(z * 30));
        return (
          <line
            key={z}
            x1={f(x1)}
            y1={f(y1)}
            x2={f(x2)}
            y2={f(y2)}
            strokeWidth={1}
            strokeDasharray="3 4"
            className="stroke-[#c9b68a] dark:stroke-[#4a3f28]"
          />
        );
      })}

      {/* เส้นนำจากองศาจริงบนวงแหวนไปยังดาว */}
      {placed.map(({ p, lane, disp }) => {
        const [x1, y1] = pt(R_SIGN_IN, toTheta(p.longitude));
        const [x2, y2] = pt(LANES[lane] + MARK_R, toTheta(disp));
        const retro = isRetrograde(p);
        return (
          <g key={`l-${p.code}`}>
            <line
              x1={f(x1)}
              y1={f(y1)}
              x2={f(x2)}
              y2={f(y2)}
              strokeWidth={1}
              className={retro ? "stroke-[#c0392b]/60 dark:stroke-[#ff8a7a]/60" : "stroke-[#8a6d3b]/50 dark:stroke-[#b38b45]/60"}
            />
            <circle
              cx={f(x1)}
              cy={f(y1)}
              r={2.5}
              className={retro ? "fill-[#c0392b] dark:fill-[#ff8a7a]" : "fill-[#8a6d3b] dark:fill-[#d4a95a]"}
            />
          </g>
        );
      })}

      {/* ดาว */}
      {placed.map(({ p, lane, disp }) => {
        const [x, y] = pt(LANES[lane], toTheta(disp));
        const retro = isRetrograde(p);
        const labelY = y > C ? y - MARK_R - 5 : y + MARK_R + 12;
        return (
          <g key={p.code}>
            <title>{`${p.name} ${p.formatted} — ${p.status}`}</title>
            <circle
              cx={f(x)}
              cy={f(y)}
              r={MARK_R}
              strokeWidth={2}
              className={
                retro
                  ? "fill-[#fdecea] stroke-[#c0392b] dark:fill-[#3a1d19] dark:stroke-[#ff8a7a]"
                  : "fill-[#fffaf0] stroke-[#8a6d3b] dark:fill-[#2a2314] dark:stroke-[#d4a95a]"
              }
            />
            <text
              x={f(x)}
              y={f(y + 0.5)}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={17}
              fontWeight={700}
              className={retro ? "fill-[#c0392b] dark:fill-[#ff8a7a]" : "fill-[#1f2937] dark:fill-[#eee7d8]"}
            >
              {planetSymbol(p.code)}
            </text>
            {retro && (
              <text
                x={f(x + 15)}
                y={f(y - 12)}
                textAnchor="middle"
                fontSize={10}
                fontWeight={700}
                className="fill-[#c0392b] dark:fill-[#ff8a7a]"
              >
                R
              </text>
            )}
            <text
              x={f(x)}
              y={f(labelY)}
              textAnchor="middle"
              fontSize={11.5}
              className={retro ? "fill-[#c0392b] dark:fill-[#ff8a7a]" : "fill-[#5b4a2a] dark:fill-[#d9cba8]"}
            >
              {p.degree}°{String(p.minute).padStart(2, "0")}′
            </text>
          </g>
        );
      })}

      {/* วงกลมกลาง */}
      <circle
        cx={C}
        cy={C}
        r={R_CENTER}
        strokeWidth={1.5}
        className="fill-[#f6ecd6] stroke-[#8a6d3b] dark:fill-[#2a2314] dark:stroke-[#b38b45]"
      />
      <g textAnchor="middle" className="fill-[#5b4a2a] dark:fill-[#d9cba8]">
        <text x={C} y={C - 34} fontSize={20} fontWeight={700} className="fill-[#5b3f10] dark:fill-[#f0d9a0]">
          ดวงชะตาไทย
        </text>
        <text x={C} y={C - 12} fontSize={13}>
          {date}
        </text>
        <text x={C} y={C + 5} fontSize={13}>
          {time.slice(0, 5)} น.
        </text>
        <text x={C} y={C + 26} fontSize={13} fontWeight={700} className="fill-[#0f766e] dark:fill-[#5eead4]">
          {lagLabel}
        </text>
        <text x={C} y={C + 44} fontSize={11} className="fill-[#8a7a58] dark:fill-[#a39a86]">
          ลาหิรี {fmtAyanamsa(chart.ayanamsa)}
        </text>
        <text x={C} y={C + 59} fontSize={11} className="fill-[#c0392b] dark:fill-[#ff8a7a]">
          R = พักร
        </text>
      </g>
    </svg>
  );
}
