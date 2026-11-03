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
const R_CENTER = 160; // วงกลมกลาง (ผังราศี + นวางค์)
const R_RASI = 112; // ขอบนอกผังราศี (วงในสุด) ; ระหว่าง R_RASI ถึง R_CENTER = ผังนวางค์
const H = 30; // ครึ่งความกว้างช่องสี่เหลี่ยมกลางผังราศี (แสดงองศาอาทิตย์)
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

type Sym = { s: string; kind: "lag" | "mod" | "std" };
const SYM_CLASS = {
  lag: "fill-[#0f766e] dark:fill-[#5eead4]",
  mod: "fill-[#1d4ed8] dark:fill-[#60a5fa]",
  std: "fill-[#1f2937] dark:fill-[#eee7d8]",
};

// ตำแหน่งกึ่งกลางของแต่ละภพในผังราศีแบบไทย ("#" + เส้นทแยงจากมุมช่องกลาง = 12 ภพ)
// เมษ = ช่องบน, กรกฎ = ช่องซ้าย, ตุลย์ = ช่องล่าง, มังกร = ช่องขวา ; ที่เหลือคือสามเหลี่ยมในมุมทั้งสี่ (มุมละ 2 ช่อง)
const S22 = Math.sin(Math.PI / 8);
const C22 = Math.cos(Math.PI / 8);
function rasiCellCenter(z: number): [number, number] {
  const rr = (H + R_RASI * 0.96) / 2;
  if (z === 0) return [C, C - rr];
  if (z === 3) return [C - rr, C];
  if (z === 6) return [C, C + rr];
  if (z === 9) return [C + rr, C];
  const sx = z < 6 ? -1 : 1;
  const sy = z === 1 || z === 2 || z === 10 || z === 11 ? -1 : 1;
  const nearVertical = z === 1 || z === 5 || z === 7 || z === 11; // ติดช่องบน/ล่าง
  const ux = sx * (nearVertical ? S22 : C22);
  const uy = sy * (nearVertical ? C22 : S22);
  const cx0 = sx * H;
  const cy0 = sy * H;
  const b = cx0 * ux + cy0 * uy;
  const d = -b + Math.sqrt(b * b - (cx0 * cx0 + cy0 * cy0 - R_RASI * R_RASI));
  return [C + cx0 + ux * d * 0.5, C + cy0 + uy * d * 0.5];
}

function SymText({
  x,
  y,
  syms,
  size,
  weight,
  rot = 0,
}: {
  x: number;
  y: number;
  syms: Sym[];
  size: number;
  weight: number;
  rot?: number;
}) {
  const half = Math.ceil(syms.length / 2);
  const lines = syms.length > 3 ? [syms.slice(0, half), syms.slice(half)] : [syms];
  const lh = size * 1.15;
  return (
    <text
      x={f(x)}
      y={f(y - ((lines.length - 1) * lh) / 2)}
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={size}
      fontWeight={weight}
      transform={rot ? `rotate(${f(rot)} ${f(x)} ${f(y)})` : undefined}
    >
      {lines.map((ln, i) => (
        <tspan key={i} x={f(x)} dy={i === 0 ? 0 : lh}>
          {ln.map((q, j) => (
            <tspan key={j} className={SYM_CLASS[q.kind]}>
              {q.s}
            </tspan>
          ))}
        </tspan>
      ))}
    </text>
  );
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

  // ผังราศีและนวางค์: ช่องละ 1 ราศี (เมษอยู่บนสุด) เก็บสัญลักษณ์ดาวที่อยู่ในช่อง
  const rasi: Sym[][] = THAI_ZODIACS.map(() => []);
  const nav: Sym[][] = THAI_ZODIACS.map(() => []);
  const lagRasi = THAI_ZODIACS.indexOf(chart.lagna.zodiac);
  const lagNav = navamsaSign(chart.lagna.longitude);
  if (lagRasi >= 0) rasi[lagRasi].push({ s: "ล", kind: "lag" });
  nav[lagNav].push({ s: "ล", kind: "lag" });
  for (const code of DISPLAY_ORDER) {
    const p = chart.planets[code];
    const z = THAI_ZODIACS.indexOf(p.zodiac);
    const kind = code === "N" || code === "P" ? "mod" : "std";
    if (z >= 0) rasi[z].push({ s: planetSymbol(code), kind });
    nav[navamsaSign(p.longitude)].push({ s: planetSymbol(code), kind });
  }
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

      {/* วงกลมกลาง: ในสุด = ผังราศี (12 ภพ), วงนอก = ผังนวางค์ */}
      <circle cx={C} cy={C} r={R_CENTER} strokeWidth={1.5} className={`fill-[#fffdf7] dark:fill-[#1a160f] ${GOLD_STROKE}`} />
      {/* เส้นแบ่งราศีในวงนอก (นวางค์) */}
      {THAI_ZODIACS.map((_, z) => {
        const [x1, y1] = pt(R_RASI, toTheta(z * 30));
        const [x2, y2] = pt(R_CENTER, toTheta(z * 30));
        return <line key={`rl-${z}`} x1={f(x1)} y1={f(y1)} x2={f(x2)} y2={f(y2)} strokeWidth={0.8} className={GOLD_STROKE} />;
      })}
      <circle cx={C} cy={C} r={R_RASI} strokeWidth={1.5} className="fill-[#fffdf7] stroke-[#374151] dark:fill-[#1a160f] dark:stroke-[#9ca3af]" />
      {/* เส้น "#" และเส้นทแยงจากมุมช่องกลาง */}
      {(() => {
        const e = Math.sqrt(R_RASI * R_RASI - H * H);
        const dg = (() => {
          const b = H * Math.SQRT2;
          return -b + Math.sqrt(b * b - (2 * H * H - R_RASI * R_RASI));
        })();
        const k = dg / Math.SQRT2;
        const L = "stroke-[#374151] dark:stroke-[#9ca3af]";
        const lines: [number, number, number, number][] = [
          [C - H, C - e, C - H, C + e],
          [C + H, C - e, C + H, C + e],
          [C - e, C - H, C + e, C - H],
          [C - e, C + H, C + e, C + H],
          [C - H, C - H, C - H - k, C - H - k],
          [C + H, C - H, C + H + k, C - H - k],
          [C - H, C + H, C - H - k, C + H + k],
          [C + H, C + H, C + H + k, C + H + k],
        ];
        return lines.map(([x1, y1, x2, y2], n) => (
          <line key={`g-${n}`} x1={f(x1)} y1={f(y1)} x2={f(x2)} y2={f(y2)} strokeWidth={1.2} className={L} />
        ));
      })()}
      {THAI_ZODIACS.map((name, z) => {
        const [rx, ry] = rasiCellCenter(z);
        const tc = toTheta(z * 30 + 15);
        const [nx, ny] = pt((R_RASI + R_CENTER) / 2, tc);
        return (
          <g key={`c-${z}`}>
            <title>{`${name} — ราศี: ${rasi[z].map((q) => q.s).join(" ") || "-"} · นวางค์: ${nav[z].map((q) => q.s).join(" ") || "-"}`}</title>
            {rasi[z].length > 0 && <SymText x={rx} y={ry} syms={rasi[z]} size={15} weight={600} />}
            {nav[z].length > 0 && <SymText x={nx} y={ny} syms={nav[z]} size={14} weight={600} rot={readable(tc)} />}
          </g>
        );
      })}
      <g textAnchor="middle" className="fill-[#1f2937] dark:fill-[#eee7d8]">
        <title>{`อาทิตย์ ${sun.zodiac} ${sun.degree}°${String(sun.minute).padStart(2, "0")}′`}</title>
        <text x={C} y={C - 4} fontSize={14}>
          {sun.degree}°
        </text>
        <text x={C} y={C + 13} fontSize={14}>
          {String(sun.minute).padStart(2, "0")}′
        </text>
      </g>
    </svg>
  );
}