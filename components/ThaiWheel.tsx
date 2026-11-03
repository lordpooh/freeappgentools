import {
  DISPLAY_ORDER,
  THAI_ZODIACS,
  isRetrograde,
  navamsaSign,
  planetSymbol,
  type ChartResult,
  type PlanetInfo,
} from "../lib/thai-astro";

// ผังดวงไทยแบบวงกลม ตามหน้าตาปฏิทินโหราศาสตร์สุริยยาตร์
// - ลองจิจูดเพิ่มทวนเข็มนาฬิกา เมษ 15° อยู่บนสุด (กลางราศีเมษอยู่ที่ 12 นาฬิกา, กลางราศีตุลย์อยู่ล่างสุด)
//   มุมหน้าจอ (องศา ตามเข็มจากบนสุด) = 15 - ลองจิจูด
// - วงแหวนนอกสุด: เลของศา 1-30 ของแต่ละราศี / วงถัดมา: ชื่อราศี / ด้านในวางดาว

const SIZE = 760; // เผื่อขอบนอกสำหรับป้ายลัคนา
const C = SIZE / 2;
const R_OUT = 335; // ขอบนอกวงเลของศา
const R_DEG_IN = 313; // ขอบในวงเลของศา = ขอบนอกวงชื่อราศี
const R_SIGN_IN = 282; // ขอบในวงชื่อราศี
const LANES = [258, 220, 182]; // รัศมีวางดาว ใช้หลายชั้นเมื่อดาวอยู่ใกล้กัน
const R_CENTER = 150; // วงกลมกลาง (ผังราศี + นวางค์)
const R_RASI = 100; // ขอบนอกผังราศี (วงในสุด) ; ระหว่าง R_RASI ถึง R_CENTER = ผังนวางค์
const R_CORE = 40; // วงกลางสุด แสดงองศาอาทิตย์
const MARK_R = 14;
const MARK_HALF_W = 16; // ครึ่งความกว้างที่ดาวหนึ่งดวงกินที่ ใช้คำนวณระยะห่างขั้นต่ำ

const FONT = '"Noto Sans Thai", "Leelawadee UI", Sarabun, Tahoma, sans-serif';

const f = (n: number) => n.toFixed(2);
const toTheta = (lon: number) => 15 - lon;

function pt(r: number, theta: number): [number, number] {
  const a = (theta * Math.PI) / 180;
  return [C + r * Math.sin(a), C - r * Math.cos(a)];
}

// ส่วนของวงแหวน (ลองจิจูด a -> b) ; theta ลดลงเมื่อลองจิจูดเพิ่ม จึงสลับด้าน
function sectorLon(r1: number, r2: number, a: number, b: number) {
  const t1 = toTheta(b);
  const t2 = toTheta(a);
  const [x1, y1] = pt(r2, t1);
  const [x2, y2] = pt(r2, t2);
  const [x3, y3] = pt(r1, t2);
  const [x4, y4] = pt(r1, t1);
  return `M${f(x1)} ${f(y1)} A${r2} ${r2} 0 0 1 ${f(x2)} ${f(y2)} L${f(x3)} ${f(y3)} A${r1} ${r1} 0 0 0 ${f(x4)} ${f(y4)} Z`;
}

// หมุนข้อความให้อ่านได้ไม่กลับหัว
function readable(rot: number) {
  let r = ((rot % 360) + 360) % 360;
  if (r > 180) r -= 360;
  return Math.abs(r) > 90 ? r + 180 : r;
}

type Placed = { p: PlanetInfo; lane: number; disp: number };

const minGapFor = (lane: number) => ((2 * Math.asin(MARK_HALF_W / LANES[lane])) * 180) / Math.PI;

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

const GOLD_STROKE = "stroke-[#8a6d3b] dark:stroke-[#b38b45]";

export default function ThaiWheel({ chart }: { chart: ChartResult }) {
  const planets = DISPLAY_ORDER.map((c) => chart.planets[c]);
  const placed = layoutPlanets(planets);

  // ผังราศีและนวางค์: ช่องละ 1 ราศี (เมษอยู่บนสุด) เก็บเลขดาวที่อยู่ในช่อง
  const rasi: string[][] = THAI_ZODIACS.map(() => []);
  const nav: string[][] = THAI_ZODIACS.map(() => []);
  for (const code of DISPLAY_ORDER) {
    const p = chart.planets[code];
    const z = THAI_ZODIACS.indexOf(p.zodiac);
    if (z >= 0) rasi[z].push(planetSymbol(code));
    nav[navamsaSign(p.longitude)].push(planetSymbol(code));
  }
  const lagRasi = THAI_ZODIACS.indexOf(chart.lagna.zodiac);
  const lagNav = navamsaSign(chart.lagna.longitude);
  const sun = chart.planets["1"];

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

      {/* พื้นวงแหวน */}
      <circle cx={C} cy={C} r={R_OUT} strokeWidth={1.5} className={`fill-[#fffdf7] dark:fill-[#1a160f] ${GOLD_STROKE}`} />

      {/* วงชื่อราศี 12 ช่อง (สลับสีพื้น) */}
      {THAI_ZODIACS.map((name, z) => {
        const tc = toTheta(z * 30 + 15);
        const [tx, ty] = pt((R_DEG_IN + R_SIGN_IN) / 2, tc);
        const rot = readable(tc);
        return (
          <g key={name}>
            <path
              d={sectorLon(R_SIGN_IN, R_DEG_IN, z * 30, (z + 1) * 30)}
              strokeWidth={1.5}
              className={
                z % 2 === 0
                  ? `fill-[#f6ecd6] dark:fill-[#2a2314] ${GOLD_STROKE}`
                  : `fill-[#fffdf7] dark:fill-[#1e1a12] ${GOLD_STROKE}`
              }
            />
            <text
              x={f(tx)}
              y={f(ty)}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={17}
              fontWeight={700}
              transform={`rotate(${f(rot)} ${f(tx)} ${f(ty)})`}
              className="fill-[#5b3f10] dark:fill-[#f0d9a0]"
            >
              {z + 1} {name}
            </text>
          </g>
        );
      })}

      {/* วงเลของศา 1-30 ทุกราศี */}
      {THAI_ZODIACS.flatMap((_, z) =>
        Array.from({ length: 30 }, (_, i) => {
          const lon = z * 30 + i;
          const [x1, y1] = pt(R_DEG_IN, toTheta(lon));
          const [x2, y2] = pt(R_OUT, toTheta(lon));
          const tc = toTheta(lon + 0.5);
          const [tx, ty] = pt((R_DEG_IN + R_OUT) / 2, tc);
          const rot = readable(tc - 90);
          const major = (i + 1) % 5 === 0;
          return (
            <g key={`d-${z}-${i}`}>
              <line
                x1={f(x1)}
                y1={f(y1)}
                x2={f(x2)}
                y2={f(y2)}
                strokeWidth={i === 0 ? 1.5 : 0.6}
                className={GOLD_STROKE}
              />
              <text
                x={f(tx)}
                y={f(ty)}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={6.5}
                fontWeight={major ? 700 : 400}
                transform={`rotate(${f(rot)} ${f(tx)} ${f(ty)})`}
                className="fill-[#6b5a35] dark:fill-[#c9b68a]"
              >
                {i + 1}
              </text>
            </g>
          );
        })
      )}

      {/* ลัคนา: ขอบราศีเน้นสี + เส้นตัดวงแหวนที่องศาจริง + ป้าย "ล" ด้านนอก */}
      <path
        d={sectorLon(R_SIGN_IN, R_DEG_IN, lagSign * 30, (lagSign + 1) * 30)}
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
        return (
          <g key={`l-${p.code}`}>
            <line
              x1={f(x1)}
              y1={f(y1)}
              x2={f(x2)}
              y2={f(y2)}
              strokeWidth={1}
              className="stroke-[#1d4ed8]/70 dark:stroke-[#60a5fa]/70"
            />
            <circle cx={f(x1)} cy={f(y1)} r={2.5} className="fill-[#1d4ed8] dark:fill-[#60a5fa]" />
          </g>
        );
      })}

      {/* ดาว: วงกลมสีน้ำเงิน เลขไทยสีขาว พักรมี พ. สีแดง */}
      {placed.map(({ p, lane, disp }) => {
        const [x, y] = pt(LANES[lane], toTheta(disp));
        const retro = isRetrograde(p);
        const slow = p.status.startsWith("มนต์");
        return (
          <g key={p.code}>
            <title>{`${p.name} ${p.formatted}${retro ? " — พักร" : slow ? " — มนต์" : ""}`}</title>
            <circle cx={f(x)} cy={f(y)} r={MARK_R} className="fill-[#1d4ed8] dark:fill-[#2563eb]" />
            <text
              x={f(x)}
              y={f(y + 0.5)}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={16}
              fontWeight={700}
              className="fill-white"
            >
              {planetSymbol(p.code)}
            </text>
            {(retro || slow) && (
              <g>
                <circle
                  cx={f(x + 11)}
                  cy={f(y - 11)}
                  r={7.5}
                  strokeWidth={1}
                  className={
                    retro
                      ? "fill-[#dc2626] stroke-white dark:fill-[#ef4444] dark:stroke-[#17130d]"
                      : "fill-[#8a6d3b] stroke-white dark:fill-[#b38b45] dark:stroke-[#17130d]"
                  }
                />
                <text
                  x={f(x + 11)}
                  y={f(y - 10.5)}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={9}
                  fontWeight={700}
                  className="fill-white"
                >
                  {retro ? "พ" : "ม"}
                </text>
              </g>
            )}
          </g>
        );
      })}

      {/* วงกลมกลาง: วงในสุด = ผังราศี, วงนอก = ผังนวางค์, กลางสุด = องศาอาทิตย์ */}
      <circle cx={C} cy={C} r={R_CENTER} strokeWidth={1.5} className={`fill-[#f6ecd6] dark:fill-[#2a2314] ${GOLD_STROKE}`} />
      <circle cx={C} cy={C} r={R_RASI} strokeWidth={1.2} className={`fill-[#fffdf7] dark:fill-[#1a160f] ${GOLD_STROKE}`} />
      <circle cx={C} cy={C} r={R_CORE} strokeWidth={1.2} className={`fill-[#f6ecd6] dark:fill-[#2a2314] ${GOLD_STROKE}`} />
      {THAI_ZODIACS.map((_, z) => {
        const [x1, y1] = pt(R_CORE, toTheta(z * 30));
        const [x2, y2] = pt(R_CENTER, toTheta(z * 30));
        return (
          <line key={`cl-${z}`} x1={f(x1)} y1={f(y1)} x2={f(x2)} y2={f(y2)} strokeWidth={0.8} className={GOLD_STROKE} />
        );
      })}
      {THAI_ZODIACS.map((name, z) => {
        const tc = toTheta(z * 30 + 15);
        const [rx, ry] = pt(70, tc);
        const [nx, ny] = pt(125, tc);
        const isLagRasi = z === lagRasi;
        const isLagNav = z === lagNav;
        return (
          <g key={`c-${z}`}>
            <title>{`${name} — ราศี: ${rasi[z].join(" ") || "-"} · นวางค์: ${nav[z].join(" ") || "-"}`}</title>
            {(rasi[z].length > 0 || isLagRasi) && (
              <text x={f(rx)} y={f(ry)} textAnchor="middle" dominantBaseline="central" fontSize={16} fontWeight={700} className="fill-[#1e3a8a] dark:fill-[#93c5fd]">
                {isLagRasi && <tspan className="fill-[#0f766e] dark:fill-[#5eead4]">ล</tspan>}
                {rasi[z].join("")}
              </text>
            )}
            {(nav[z].length > 0 || isLagNav) && (
              <text x={f(nx)} y={f(ny)} textAnchor="middle" dominantBaseline="central" fontSize={14} fontWeight={600} className="fill-[#1e3a8a]/80 dark:fill-[#93c5fd]/80">
                {isLagNav && <tspan className="fill-[#0f766e] dark:fill-[#5eead4]">ล</tspan>}
                {nav[z].join("")}
              </text>
            )}
          </g>
        );
      })}
      <g textAnchor="middle" className="fill-[#1e3a8a] dark:fill-[#93c5fd]">
        <title>{`อาทิตย์ ${sun.zodiac} ${sun.degree}°${String(sun.minute).padStart(2, "0")}′`}</title>
        <text x={C} y={C - 5} fontSize={15} fontWeight={600}>
          {sun.degree}°
        </text>
        <text x={C} y={C + 13} fontSize={15} fontWeight={600}>
          {String(sun.minute).padStart(2, "0")}′
        </text>
      </g>
    </svg>
  );
}