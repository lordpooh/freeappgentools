import type { Metadata } from "next";
import Link from "next/link";
import ThaiWheel from "../../../components/ThaiWheel";
import { computeChart, computeTimeline } from "../../../lib/ephemeris";
import { buildForecast, buildReading, type Gender, type Item, type Reading, type Section, type Tone } from "../../../lib/predict";
import { PLACES, parseInput, type ChartResult } from "../../../lib/thai-astro";

export const metadata: Metadata = {
  title: "คำทำนายจากวันเกิด (ระบบพลูหลวง)",
  description: "ดวงกำเนิดตามคัมภีร์สุริยยาตร์ เทียบกับดาวจรปัจจุบัน แปลผลตามระบบโหราศาสตร์พลูหลวง",
};

type Props = {
  searchParams: Promise<{
    date?: string;
    time?: string;
    nt?: string;
    place?: string;
    sex?: string;
    range?: string;
    month?: string;
    year?: string;
  }>;
};

const RANGES: Record<string, { label: string; days: number }> = {
  "1": { label: "1 เดือน", days: 31 },
  "3": { label: "3 เดือน", days: 92 },
  "6": { label: "6 เดือน", days: 183 },
  "12": { label: "12 เดือน", days: 366 },
};

const inputCls =
  "rounded-lg border border-neutral-300 bg-transparent px-3 py-2 text-base text-inherit dark:border-neutral-700";
const card = "rounded-xl border border-neutral-200 p-4 dark:border-neutral-800";

const THAI_MONTHS = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
];

function thaiDate(date: string) {
  const [y, m, d] = date.split("-").map(Number);
  return `${d} ${THAI_MONTHS[m - 1] ?? ""} พ.ศ.${y + 543}`;
}

const TONE_CLS: Record<Tone, string> = {
  ดี: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  ร้าย: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
  ผสม: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  กลาง: "",
};

function ToneBadge({ tone }: { tone?: Tone }) {
  if (!tone || tone === "กลาง") return null;
  return <span className={`ml-2 rounded px-1.5 py-0.5 text-xs font-semibold ${TONE_CLS[tone]}`}>{tone}</span>;
}

// -------------------------------------------------------------
// ฟังก์ชันสรุปภาษาคน (12 ดาว)
// -------------------------------------------------------------
function simplifyText(text: string): string {
  let t = text.trim().replace(/^[•\-\*\s]+/, "");

  if (t.includes("อาทิตย์")) {
    t = t.replace(/อาทิตย์จร/g, "เรื่องเกียรติยศ ผลงาน หรือผู้ใหญ่/หัวหน้า");
  } else if (t.includes("จันทร์")) {
    t = t.replace(/จันทร์จร/g, "เรื่องอารมณ์ ความรู้สึก การเดินทาง หรือผู้หญิง/คู่ครอง");
  } else if (t.includes("อังคาร")) {
    t = t.replace(/อังคารจร/g, "เรื่องการลุยงาน ความขยัน (ระวังใจร้อน ทะเลาะ หรืออุบัติเหตุ)");
  } else if (t.includes("พุธ")) {
    t = t.replace(/พุธจร/g, "เรื่องการเจรจา สื่อสาร เอกสารสัญญา การพูดคุย การประพันธ์ ปรับตัวง่าย");
  } else if (t.includes("พฤหัสบดี")) {
    t = t.replace(/พฤหัสบดีจร/g, "เรื่องผู้ใหญ่สนับสนุน โอกาสดีๆ การเรียนรู้ โชคลาภ ปัญญา");
  } else if (t.includes("ศุกร์")) {
    t = t.replace(/ศุกร์จร/g, "เรื่องความรัก ความสุข การเงิน โชคลาภ การใช้จ่าย ศิลปะ คู่ครอง การแต่งงาน");
  } else if (t.includes("เสาร์")) {
    t = t.replace(/เสาร์จร/g, "เรื่องภาระงานหนัก ความกดดัน อุปสรรค หรือความเหน็ดเหนื่อย");
  } else if (t.includes("ราหู")) {
    t = t.replace(/ราหูจร/g, "ระวังความลุ่มหลง การถูกหลอก เอกสารหลุมพราง ต่างชาติต่างภาษา");
  } else if (t.includes("เกตุ")) {
    t = t.replace(/เกตุจร/g, "เรื่องเก่าๆ ที่ย้อนกลับมา เรื่องลี้ลับ สิ่งศักดิ์สิทธิ์");
  } else if (t.includes("มฤตยู")) {
    t = t.replace(/มฤตยูจร/g, "เรื่องไม่คาดฝัน การเปลี่ยนแปลงกะทันหัน หรือไอเดียใหม่ๆ การคิดค้นสิ่งใหม่ การเดินทาง  ต่างแดน");
  } else if (t.includes("เนปจูน")) {
    t = t.replace(/เนปจูนจร/g, "เรื่องความคลุมเครือ สื่อสังคมออนไลน์ หรือระวังการถูกปิดบัง การสังคม ฝูงชน การโฆษณา ไสยศาสตร์ เรื่องเร้นลับ การปิดบัง");
  } else if (t.includes("พลูโต")) {
    t = t.replace(/พลูโตจร/g, "แรงกดดันลึกๆ การสูญเสีย/พลัดพราก หรือการปรับปรุงชีวิตใหม่ ความเงียบขรึม การสะสม โหราศาสตร์ วิญญาณ");
  }

  t = t.replace(/ตรีโกณ|จตุโกณ \(กากบาท\)|ศูนยพาหะ|ปลายหอก|กุม\/ทับ|ตามหลัง \(ก้ามปู\)|โยคหน้า|โยคหลัง|เล็ง/g, "");
  t = t.replace(/ศุภเคราะห์|บาปเคราะห์/g, "");
  t = t.replace(/ดาวเจ้าเรือนลัคน์\s*\([^)]*\)/g, "ตัวเอง");
  t = t.replace(/ลัคนา/g, "ตัวเอง");
  t = t.replace(/จันทร์กำเนิด|อาทิตย์กำเนิด/g, "");
  t = t.replace(/:\s*:/g, ":");
  t = t.replace(/\s+/g, " ").trim();

  return t;
}

function simplifyHeader(text: string): string {
  let t = text;
  t = t.replace(/ตรงกับภพ\s*\d+\s*กัมมะ:?[^·]*/g, "เน้นเรื่อง: การงาน อาชีพ การเรียน และการลงมือทำ");
  t = t.replace(/ตรงกับภพ\s*\d+\s*กฎุมพะ:?[^·]*/g, "เน้นเรื่อง: การเงิน รายได้ และการเจรจาค้าขาย");
  t = t.replace(/ตรงกับภพ\s*\d+\s*สหัชชะ:?[^·]*/g, "เน้นเรื่อง: การเดินทาง เพื่อนฝูง และการสังคม");
  t = t.replace(/ตรงกับภพ\s*\d+\s*พันธุ:?[^·]*/g, "เน้นเรื่อง: บ้าน ครอบครัว และอสังหาริมทรัพย์");
  t = t.replace(/ตรงกับภพ\s*\d+\s*ปุตตะ:?[^·]*/g, "เน้นเรื่อง: ลูก บริวาร โครงการใหม่ๆ");
  t = t.replace(/ตรงกับภพ\s*\d+\s*อริ:?[^·]*/g, "เน้นเรื่อง: ปัญหา อุปสรรค และสุขภาพที่ต้องแก้ไข");
  t = t.replace(/ตรงกับภพ\s*\d+\s*ปัตนิ:?[^·]*/g, "เน้นเรื่อง: ความรัก คู่ครอง และหุ้นส่วน");
  t = t.replace(/ตรงกับภพ\s*\d+\s*มรณะ:?[^·]*/g, "เน้นเรื่อง: การเปลี่ยนแปลงกะทันหัน หรือการจบเรื่องเก่า");
  t = t.replace(/ตรงกับภพ\s*\d+\s*ศุภะ:?[^·]*/g, "เน้นเรื่อง: โชคลาภ ผู้ใหญ่สนับสนุน การเดินทางไกล");
  t = t.replace(/ตรงกับภพ\s*\d+\s*ลาภะ:?[^·]*/g, "เน้นเรื่อง: ลาภผล ความสำเร็จ และผู้เกื้อกูล");
  t = t.replace(/ตรงกับภพ\s*\d+\s*วินาศนะ:?[^·]*/g, "เน้นเรื่อง: เรื่องเบื้องหลัง ค่าใช้จ่ายไม่คาดคิด");

  t = t.replace(/ดาวจรเร็ว\s*ผลระยะสั้น\s*\(วันที่คลาดได้\s*±1\s*วัน\)/g, "(ส่งผลไว ช่วง 1-2 วันนี้)");
  t = t.replace(/ดาวจรช้า\s*ผลระยะยาว[^·]*/g, "(ส่งผลยาวนาน)");
  return t;
}

// -------------------------------------------------------------
// Component กราฟชีวิตรายวัน (Daily Life Graph)
// -------------------------------------------------------------
function DailyLifeChart({ forecast }: { forecast: Section[] }) {
  if (!forecast || forecast.length === 0) return null;

  const dailyPoints: { dateLabel: string; score: number }[] = [];

  forecast.forEach((sec) => {
    sec.items.forEach((item) => {
      let good = 0;
      let warn = 0;

      if (item.tone === "ดี") good += 2;
      else if (item.tone === "ร้าย") warn += 2;
      else if (item.tone === "ผสม") {
        good += 1;
        warn += 1;
      }

      item.sub?.forEach((t) => {
        if (t.includes("ดี:") || t.includes("ส่งแรงหนุน") || t.includes("[ดี]") || t.includes("มุมให้คุณ")) {
          good++;
        }
        if (t.includes("ระวัง:") || t.includes("ส่งแรงกด") || t.includes("[ร้าย]") || t.includes("มุมให้โทษ")) {
          warn++;
        }
      });

      const rawDate = item.head ? item.head.split("·")[0].trim() : sec.title;
      const score = Math.max(20, Math.min(90, 50 + (good * 8) - (warn * 8)));
      dailyPoints.push({ dateLabel: rawDate, score });
    });
  });

  if (dailyPoints.length === 0) return null;

  const width = Math.max(650, dailyPoints.length * 55);
  const height = 200;
  const padding = 40;

  const pointsData = dailyPoints.map((pt, idx) => {
    const x = padding + (idx * (width - padding * 2)) / Math.max(1, dailyPoints.length - 1);
    const y = height - padding - (pt.score / 100) * (height - padding * 2);
    return { ...pt, x, y };
  });

  const pathD = pointsData.reduce(
    (acc, pt, i) => (i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`),
    ""
  );

  return (
    <section className={card}>
      <h2 className="mb-1 text-lg font-bold">📈 กราฟชีวิตรายวัน (Daily Life Graph)</h2>
      <p className="mb-3 text-xs text-neutral-500">
        เกณฑ์คะแนนขึ้นลงตามแรงหนุนดาวจร (คะแนนสูง = จังหวะดวงดี / คะแนนต่ำ = จังหวะต้องระวัง)
      </p>

      <div className="w-full overflow-x-auto pb-2">
        <svg viewBox={`0 0 ${width} ${height}`} style={{ width: `${width}px`, height: `${height}px` }}>
          <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke="#e5e5e5" strokeWidth="1" strokeDasharray="4" />
          <path d={pathD} fill="none" stroke="#8a6d3b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          {pointsData.map((pt, i) => (
            <g key={i}>
              <line x1={pt.x} y1={pt.y} x2={pt.x} y2={height - 25} stroke="#f0f0f0" strokeWidth="1" />
              <circle cx={pt.x} cy={pt.y} r="4.5" fill={pt.score >= 50 ? "#059669" : "#dc2626"} stroke="#ffffff" strokeWidth="1.5" />
              <text x={pt.x} y={pt.y - 8} textAnchor="middle" className="text-[10px] font-bold fill-neutral-700 dark:fill-neutral-300">
                {pt.score}
              </text>
              <text x={pt.x} y={height - 8} textAnchor="middle" className="text-[9px] fill-neutral-500 font-medium">
                {pt.dateLabel.length > 12 ? pt.dateLabel.slice(0, 10) + "..." : pt.dateLabel}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </section>
  );
}

// -------------------------------------------------------------
// Component การ์ด 3 กล่อง (พับ/ยุบเก็บไว้เป็นค่าเริ่มต้นเสมอ ไม่มี open)
// -------------------------------------------------------------
function ItemCardView({ item }: { item: Item }) {
  const goodList: string[] = [];
  const warnList: string[] = [];
  const mixList: string[] = [];

  if (item.sub && item.sub.length > 0) {
    for (const rawText of item.sub) {
      const t = rawText.trim().replace(/^[•\-\*\s]+/, "");

      if (t.startsWith("ดี:")) {
        goodList.push(simplifyText(t.replace(/^ดี:\s*/, "")));
      } else if (t.startsWith("ระวัง:")) {
        warnList.push(simplifyText(t.replace(/^ระวัง:\s*/, "")));
      } else if (t.startsWith("กลาง:") || t.startsWith("ผสม:")) {
        mixList.push(simplifyText(t.replace(/^(กลาง|ผสม):\s*/, "")));
      } else if (t.includes("มุมให้คุณ") || t.includes("ส่งแรงหนุน") || t.startsWith("[ดี]")) {
        goodList.push(simplifyText(t.replace(/^\[ดี\]\s*/, "")));
      } else if (t.includes("มุมให้โทษ") || t.includes("ส่งแรงกด") || t.includes("ระวัง") || t.startsWith("[ร้าย]")) {
        warnList.push(simplifyText(t.replace(/^\[ร้าย\]\s*/, "")));
      } else if (t.startsWith("[ผสม]")) {
        mixList.push(simplifyText(t.replace(/^\[ผสม\]\s*/, "")));
      } else if (t.length > 0) {
        if (item.tone === "ดี") goodList.push(simplifyText(t));
        else if (item.tone === "ร้าย") warnList.push(simplifyText(t));
        else mixList.push(simplifyText(t));
      }
    }
  }

  return (
    <details className="group rounded-xl border border-neutral-200 bg-white p-3.5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <summary className="flex w-full cursor-pointer items-center justify-between font-bold text-neutral-900 list-none dark:text-neutral-100">
        <div>
          {item.head && (
            <div className="text-base font-bold">
              {item.head}
              <ToneBadge tone={item.tone} />
            </div>
          )}
          {item.text && (
            <p className="mt-0.5 text-xs font-medium text-neutral-600 dark:text-neutral-400">
              {simplifyHeader(item.text)}
            </p>
          )}
        </div>
        <span className="ml-2 text-lg text-neutral-400 select-none">
          <span className="inline group-open:hidden">▼</span>
          <span className="hidden group-open:inline">▲</span>
        </span>
      </summary>

      <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-3 border-t border-neutral-100 pt-3 dark:border-neutral-800">
        <div className="flex flex-col rounded-lg border-2 border-emerald-300 bg-emerald-50/60 p-2.5 dark:border-emerald-800 dark:bg-emerald-950/30">
          <div className="mb-1.5">
            <span className="inline-block rounded bg-emerald-600 px-2 py-0.5 text-[11px] font-bold text-white dark:bg-emerald-500">
              ดี (เรื่องที่เด่น)
            </span>
          </div>
          {goodList.length > 0 ? (
            <ul className="space-y-1 text-xs text-emerald-950 dark:text-emerald-100 font-medium">
              {goodList.map((line, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <span className="select-none">•</span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="py-0.5 text-xs font-semibold text-neutral-400 dark:text-neutral-500">ไม่มี</div>
          )}
        </div>

        <div className="flex flex-col rounded-lg border-2 border-amber-300 bg-amber-50/60 p-2.5 dark:border-amber-800 dark:bg-amber-950/30">
          <div className="mb-1.5">
            <span className="inline-block rounded bg-amber-500 px-2 py-0.5 text-[11px] font-bold text-white dark:bg-amber-600">
              ผสม / กลาง (ต้องรอบคอบ)
            </span>
          </div>
          {mixList.length > 0 ? (
            <ul className="space-y-1 text-xs text-amber-950 dark:text-amber-100 font-medium">
              {mixList.map((line, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <span className="select-none">•</span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="py-0.5 text-xs font-semibold text-neutral-400 dark:text-neutral-500">ไม่มี</div>
          )}
        </div>

        <div className="flex flex-col rounded-lg border-2 border-red-300 bg-red-50/60 p-2.5 dark:border-red-800 dark:bg-red-950/30">
          <div className="mb-1.5">
            <span className="inline-block rounded bg-red-600 px-2 py-0.5 text-[11px] font-bold text-white dark:bg-red-500">
              ระวัง (สิ่งที่ควรเลี่ยง)
            </span>
          </div>
          {warnList.length > 0 ? (
            <ul className="space-y-1 text-xs text-red-950 dark:text-red-100 font-medium">
              {warnList.map((line, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <span className="select-none">•</span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="py-0.5 text-xs font-semibold text-neutral-400 dark:text-neutral-500">ไม่มี</div>
          )}
        </div>
      </div>
    </details>
  );
}

function DetailCardView({ item }: { item: Item }) {
  return (
    <details className="group rounded-xl border border-neutral-200 bg-white p-3.5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <summary className="flex w-full cursor-pointer items-center justify-between font-bold text-neutral-900 list-none dark:text-neutral-100">
        <div>
          {item.head && (
            <div className="text-base font-bold">
              {item.head}
              <ToneBadge tone={item.tone} />
            </div>
          )}
          {item.text && <p className="mt-0.5 text-xs font-medium text-neutral-600 dark:text-neutral-400">{item.text}</p>}
        </div>
        <span className="ml-2 text-lg text-neutral-400 select-none">
          <span className="inline group-open:hidden">▼</span>
          <span className="hidden group-open:inline">▲</span>
        </span>
      </summary>

      {item.sub && item.sub.length > 0 && (
        <div className="mt-2.5 border-t border-neutral-100 pt-2.5 dark:border-neutral-800">
          <ul className="space-y-1 text-xs text-neutral-700 dark:text-neutral-300">
            {item.sub.map((t, idx) => (
              <li key={idx} className="flex items-start gap-1.5">
                <span className="select-none text-neutral-400">•</span>
                <span>{simplifyText(t)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </details>
  );
}

// -------------------------------------------------------------
// ตรรกะแยกและรวบกลุ่มข้อมูลเป็น [ปี ➔ เดือน ➔ รายการไอเทม]
// -------------------------------------------------------------
type GroupedYear = {
  yearBE: string;
  months: {
    monthName: string;
    items: Item[];
  }[];
};

function processNestedForecast(forecast: Section[]): GroupedYear[] {
  const yearMap = new Map<string, Map<string, Item[]>>();

  forecast.forEach((sec) => {
    sec.items.forEach((item) => {
      // ดึงปี พ.ศ. จาก item.head หรือ sec.title
      let yearBE = "";
      const yMatch = (item.head || "").match(/พ\.ศ\.\s*(\d+)/) || sec.title.match(/พ\.ศ\.\s*(\d+)/);
      if (yMatch) {
        yearBE = `พ.ศ. ${yMatch[1]}`;
      } else {
        const numMatch = (item.head || "").match(/(\d{4})/);
        yearBE = numMatch ? `พ.ศ. ${numMatch[1]}` : "คำทำนายประจำปี";
      }

      // ดึงเดือน
      let monthName = "";
      for (const m of THAI_MONTHS) {
        if ((item.head || "").includes(m) || sec.title.includes(m)) {
          monthName = `เดือน ${m}`;
          break;
        }
      }
      if (!monthName) monthName = sec.title || "คำทำนายประจำเดือน";

      if (!yearMap.has(yearBE)) {
        yearMap.set(yearBE, new Map());
      }
      const mContainer = yearMap.get(yearBE)!;

      if (!mContainer.has(monthName)) {
        mContainer.set(monthName, []);
      }
      mContainer.get(monthName)!.push(item);
    });
  });

  const structuredList: GroupedYear[] = [];
  yearMap.forEach((mMap, yearBE) => {
    const monthList: { monthName: string; items: Item[] }[] = [];
    mMap.forEach((items, monthName) => {
      monthList.push({ monthName, items });
    });
    structuredList.push({ yearBE, months: monthList });
  });

  return structuredList;
}

export default async function PredictPage({ searchParams }: Props) {
  const sp = await searchParams;
  const hasTime = sp.nt !== "1";
  const gender: Gender = sp.sex === "m" ? "m" : sp.sex === "f" ? "f" : undefined;

  const currentDate = new Date();
  const currentYearBE = currentDate.getFullYear() + 543;
  const currentMonthNum = currentDate.getMonth() + 1;

  const selectedMonth = sp.month ? Number(sp.month) : currentMonthNum;
  const selectedYearBE = sp.year ? Number(sp.year) : currentYearBE;

  const yearOptions = Array.from({ length: 8 }, (_, i) => currentYearBE - 2 + i);

  let natal: ChartResult | null = null;
  let now: ChartResult | null = null;
  let reading: Reading | null = null;
  let forecast: Section[] = [];
  const range = RANGES[sp.range ?? ""] ? (sp.range as string) : "3";
  let error = "";

  if (sp.date) {
    const birth = parseInput({ date: sp.date, time: hasTime ? sp.time || "12:00" : "12:00", place: sp.place });

    const selectedYearAD = selectedYearBE - 543;
    const padMonth = String(selectedMonth).padStart(2, "0");
    const targetDateStr = `${selectedYearAD}-${padMonth}-01`;

    const today = parseInput({ date: targetDateStr, place: sp.place });

    if (!birth || !today) {
      error = "ข้อมูลไม่ถูกต้อง (วันที่ YYYY-MM-DD, เวลา HH:MM)";
    } else {
      try {
        natal = await computeChart(birth.date, birth.time, birth.loc);
        now = await computeChart(today.date, today.time, birth.loc);
        reading = buildReading(natal, now, hasTime, gender);
        const timeline = await computeTimeline(today.date, RANGES[range].days, birth.loc);
        forecast = buildForecast(natal, timeline, hasTime, gender);
      } catch {
        error = "คำนวณไม่ได้ ตรวจสอบวันที่และเวลาเกิดอีกครั้ง";
      }
    }
  }

  // รวบจัดกลุ่มตาม [ปี ➔ เดือน ➔ การ์ดคำทำนาย]
  const nestedForecastData = processNestedForecast(forecast);

  return (
    <main className="mx-auto max-w-3xl p-4 pb-12">
      <h1 className="mb-1 text-xl font-bold">คำทำนายจากวันเกิด</h1>
      <p className="mb-3 text-sm text-neutral-500">
        ระบบโหราศาสตร์พลูหลวง (เกษตรเรือนเดี่ยว) เทียบดวงกำเนิดกับดาวจร ณ ปัจจุบัน ·{" "}
        <Link className="underline" href="/astro">
          กลับหน้าผังดวง
        </Link>
      </p>

      <form method="get" action="/astro/predict" className="mb-4 flex flex-wrap items-end gap-2">
        <label className="flex flex-col gap-0.5 text-sm text-neutral-500">
          วันเกิด
          <input type="date" name="date" defaultValue={sp.date || ""} required className={inputCls} />
        </label>
        <label className="flex flex-col gap-0.5 text-sm text-neutral-500">
          เวลาเกิด (เวลาไทย)
          <input type="time" name="time" defaultValue={sp.time || ""} className={inputCls} />
        </label>
        <label className="flex flex-col gap-0.5 text-sm text-neutral-500">
          สถานที่เกิด
          <select name="place" defaultValue={sp.place || "bangkok"} className={inputCls}>
            {PLACES.map((p) => (
              <option key={p.key} value={p.key} className="text-black">
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-0.5 text-sm text-neutral-500">
          เพศ (ใช้ตีความภพ ๔ และ ๙)
          <select name="sex" defaultValue={sp.sex || ""} className={inputCls}>
            <option value="" className="text-black">
              ไม่ระบุ
            </option>
            <option value="m" className="text-black">
              ชาย
            </option>
            <option value="f" className="text-black">
              หญิง
            </option>
          </select>
        </label>

        <label className="flex flex-col gap-0.5 text-sm text-neutral-500">
          ดูทำนายประจำเดือน
          <select name="month" defaultValue={selectedMonth} className={inputCls}>
            {THAI_MONTHS.map((mName, idx) => (
              <option key={idx + 1} value={idx + 1} className="text-black">
                {mName}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-0.5 text-sm text-neutral-500">
          ดูทำนายประจำปี
          <select name="year" defaultValue={selectedYearBE} className={inputCls}>
            {yearOptions.map((yBE) => (
              <option key={yBE} value={yBE} className="text-black">
                พ.ศ. {yBE}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-0.5 text-sm text-neutral-500">
          พยากรณ์ล่วงหน้า
          <select name="range" defaultValue={range} className={inputCls}>
            {Object.entries(RANGES).map(([k, v]) => (
              <option key={k} value={k} className="text-black">
                {v.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-1.5 py-2 text-sm text-neutral-500">
          <input type="checkbox" name="nt" value="1" defaultChecked={!hasTime} />
          ไม่ทราบเวลาเกิด
        </label>
        <button type="submit" className="rounded-lg bg-[#8a6d3b] px-4 py-2 text-white hover:bg-[#75592c]">
          ดูคำทำนาย
        </button>
      </form>

      {error && <p className="mb-4 text-red-600">{error}</p>}

      {natal && now && reading && (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-neutral-500">
            เกิดวันที่ {thaiDate(natal.datetime_th.split(" ")[0])}
            {hasTime ? ` เวลา ${natal.datetime_th.split(" ")[1].slice(0, 5)} น.` : " (ไม่ทราบเวลา)"} · {natal.location.name}
          </p>

          {/* 1. สรุปภาพรวมดวงชะตา (พับเก็บไว้เป็นค่าเริ่มต้น) */}
          <details className="group rounded-xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
            <summary className="flex w-full cursor-pointer items-center justify-between text-lg font-bold text-neutral-900 list-none dark:text-neutral-100">
              <span>📌 สรุปภาพรวมดวงชะตา (วันนี้ / เดือนนี้ / ปีนี้)</span>
              <span className="ml-2 text-xl text-neutral-400 select-none">
                <span className="inline group-open:hidden">▼</span>
                <span className="hidden group-open:inline">▲</span>
              </span>
            </summary>
            <div className="mt-3 flex flex-col gap-3 border-t border-neutral-100 pt-3 dark:border-neutral-800">
              {reading.summary.map((it, i) => (
                <ItemCardView key={`sum-${i}`} item={it} />
              ))}
            </div>
          </details>

          {/* 2. กราฟชีวิตรายวัน (Daily Life Graph) */}
          <DailyLifeChart forecast={forecast} />

          {/* 3. อนาคตใกล้: ปฏิทินดาวจร (ซ้อนกล่องพับ 2 ชั้นอย่างสมบูรณ์) */}
          <div className="flex flex-col gap-3">
            <h2 className="text-lg font-bold">🌙 อนาคตใกล้: ปฏิทินดาวจร</h2>
            {nestedForecastData.map((yGroup, yIdx) => (
              // กล่องระดับ 1: รวบกลุ่มปี พ.ศ. (พับเก็บไว้เป็นค่าเริ่มต้น)
              <details
                key={`year-${yIdx}`}
                className="group rounded-xl border-2 border-neutral-300 bg-neutral-50/70 p-4 shadow-sm dark:border-neutral-700 dark:bg-neutral-900/50"
              >
                <summary className="flex w-full cursor-pointer items-center justify-between text-lg font-bold text-neutral-900 list-none dark:text-neutral-100">
                  <span>🗓️ คำทำนายประจำ {yGroup.yearBE}</span>
                  <span className="ml-2 text-xl text-neutral-500 select-none">
                    <span className="inline group-open:hidden">▼</span>
                    <span className="hidden group-open:inline">▲</span>
                  </span>
                </summary>

                <div className="mt-3 flex flex-col gap-3 border-t border-neutral-200 pt-3 dark:border-neutral-800">
                  {yGroup.months.map((mGroup, mIdx) => (
                    // กล่องระดับ 2: รวบกลุ่มเดือน (พับเก็บไว้เป็นค่าเริ่มต้น)
                    <details
                      key={`month-${mIdx}`}
                      className="group/month rounded-xl border border-neutral-200 bg-white p-3.5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
                    >
                      <summary className="flex w-full cursor-pointer items-center justify-between text-base font-bold text-neutral-800 list-none dark:text-neutral-200">
                        <span>📅 {mGroup.monthName}</span>
                        <span className="ml-2 text-lg text-neutral-400 select-none">
                          <span className="inline group-open/month:hidden">▼</span>
                          <span className="hidden group-open/month:inline">▲</span>
                        </span>
                      </summary>

                      {/* การ์ดคำทำนายรายวันทั้งหมดจะถูกพับเก็บไว้ข้างในเดือน */}
                      <div className="mt-3 flex flex-col gap-3 border-t border-neutral-100 pt-3 dark:border-neutral-800">
                        {mGroup.items.map((itemObj, itemIdx) => (
                          <ItemCardView key={`item-${yIdx}-${mIdx}-${itemIdx}`} item={itemObj} />
                        ))}
                      </div>
                    </details>
                  ))}
                </div>
              </details>
            ))}
          </div>

          {hasTime && (
            <div className="rounded-xl border border-neutral-200 p-2 dark:border-neutral-800">
              <ThaiWheel chart={natal} />
            </div>
          )}

          {/* 4. รายละเอียดทางโหราศาสตร์เพิ่มเติม (พับเก็บไว้เป็นค่าเริ่มต้น) */}
          <details className="group rounded-xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
            <summary className="flex w-full cursor-pointer items-center justify-between text-lg font-bold text-neutral-900 list-none dark:text-neutral-100">
              <span>📜 รายละเอียดวิเคราะห์โหราศาสตร์พลูหลวง</span>
              <span className="ml-2 text-xl text-neutral-400 select-none">
                <span className="inline group-open:hidden">▼</span>
                <span className="hidden group-open:inline">▲</span>
              </span>
            </summary>

            <div className="mt-3 flex flex-col gap-4 border-t border-neutral-100 pt-3 dark:border-neutral-800">
              {reading.sections.map((sec) => (
                <div key={sec.id} className={card}>
                  <h3 className="text-base font-bold mb-2">{sec.title}</h3>
                  <div className="flex flex-col gap-2.5">
                    {sec.items.map((it, i) => (
                      <DetailCardView key={`${sec.id}-${i}`} item={it} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </details>

          <p className="text-xs text-neutral-500">
            แปลผลตามกฎโหราศาสตร์ระบบพลูหลวงแบบกว้าง ๆ ใช้ประกอบการพิจารณาเท่านั้น ไม่ใช่การยืนยันเหตุการณ์
            และไม่ควรใช้ตัดสินใจเรื่องสุขภาพ กฎหมาย หรือการเงิน · ผลจริงต้องพิจารณาดาวและมุมทั้งหมดร่วมกัน ·
            แบคคัสยังไม่ได้คำนวณ · ดวงปัจจุบันคำนวณจากเวลาไทย ณ ตอนเปิดหน้านี้
          </p>
        </div>
      )}
    </main>
  );
}