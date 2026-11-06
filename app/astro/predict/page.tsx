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
  searchParams: Promise<{ date?: string; time?: string; nt?: string; place?: string; sex?: string; range?: string }>;
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
// 1. การ์ดสรุปภาพรวมดวงชะตา (เริ่มต้นพับไว้ ยุบทุกช่อง)
// -------------------------------------------------------------
function SummaryCardView({ item }: { item: Item }) {
  const goodList: string[] = [];
  const warnList: string[] = [];
  const mixList: string[] = [];

  if (item.sub && item.sub.length > 0) {
    for (const rawText of item.sub) {
      const t = rawText.trim().replace(/^[•\-\*\s]+/, "");

      if (t.startsWith("ดี:")) {
        goodList.push(t.replace(/^ดี:\s*/, ""));
      } else if (t.startsWith("ระวัง:")) {
        warnList.push(t.replace(/^ระวัง:\s*/, ""));
      } else if (t.startsWith("กลาง:") || t.startsWith("ผสม:")) {
        mixList.push(t.replace(/^(กลาง|ผสม):\s*/, ""));
      } else if (t.includes("มุมให้คุณ") || t.includes("ส่งแรงหนุน") || t.startsWith("[ดี]")) {
        goodList.push(t.replace(/^\[ดี\]\s*/, ""));
      } else if (t.includes("มุมให้โทษ") || t.includes("ส่งแรงกด") || t.includes("ระวัง") || t.startsWith("[ร้าย]")) {
        warnList.push(t.replace(/^\[ร้าย\]\s*/, ""));
      } else if (t.startsWith("[ผสม]")) {
        mixList.push(t.replace(/^\[ผสม\]\s*/, ""));
      } else if (t.length > 0) {
        if (item.tone === "ดี") goodList.push(t);
        else if (item.tone === "ร้าย") warnList.push(t);
        else mixList.push(t);
      }
    }
  }

  return (
    // ถอน open ออก เพื่อให้หุบ/ยุบไว้ตั้งแต่เริ่มต้นตามสั่ง
    <details className="group rounded-xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <summary className="flex w-full cursor-pointer items-center justify-between font-bold text-neutral-900 list-none dark:text-neutral-100">
        <div>
          {item.head && (
            <div className="text-lg font-bold">
              {item.head}
              <ToneBadge tone={item.tone} />
            </div>
          )}
          {item.text && <p className="mt-0.5 text-sm font-medium text-neutral-600 dark:text-neutral-400">{item.text}</p>}
        </div>
        {/* ลูกศร: พับอยู่ชี้ลง (▼) / กางออกชี้ขึ้น (▲) */}
        <span className="ml-2 text-xl text-neutral-400 select-none">
          <span className="inline group-open:hidden">▼</span>
          <span className="hidden group-open:inline">▲</span>
        </span>
      </summary>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3 border-t border-neutral-100 pt-3 dark:border-neutral-800">
        {/* กล่องดี (เขียว) */}
        <div className="flex flex-col rounded-lg border-2 border-emerald-300 bg-emerald-50/60 p-3 dark:border-emerald-800 dark:bg-emerald-950/30">
          <div className="mb-2">
            <span className="inline-block rounded bg-emerald-600 px-2.5 py-0.5 text-xs font-bold text-white dark:bg-emerald-500">
              ดี (มุมให้คุณ)
            </span>
          </div>
          {goodList.length > 0 ? (
            <ul className="space-y-1.5 text-sm text-emerald-950 dark:text-emerald-100 font-medium">
              {goodList.map((line, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="select-none">•</span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="py-1 text-sm font-semibold text-neutral-400 dark:text-neutral-500">ไม่มี</div>
          )}
        </div>

        {/* กล่องผสม / กลาง (เหลือง) */}
        <div className="flex flex-col rounded-lg border-2 border-amber-300 bg-amber-50/60 p-3 dark:border-amber-800 dark:bg-amber-950/30">
          <div className="mb-2">
            <span className="inline-block rounded bg-amber-500 px-2.5 py-0.5 text-xs font-bold text-white dark:bg-amber-600">
              ผสม / กลาง
            </span>
          </div>
          {mixList.length > 0 ? (
            <ul className="space-y-1.5 text-sm text-amber-950 dark:text-amber-100 font-medium">
              {mixList.map((line, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="select-none">•</span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="py-1 text-sm font-semibold text-neutral-400 dark:text-neutral-500">ไม่มี</div>
          )}
        </div>

        {/* กล่องระวัง (แดง) */}
        <div className="flex flex-col rounded-lg border-2 border-red-300 bg-red-50/60 p-3 dark:border-red-800 dark:bg-red-950/30">
          <div className="mb-2">
            <span className="inline-block rounded bg-red-600 px-2.5 py-0.5 text-xs font-bold text-white dark:bg-red-500">
              ระวัง (มุมให้โทษ)
            </span>
          </div>
          {warnList.length > 0 ? (
            <ul className="space-y-1.5 text-sm text-red-950 dark:text-red-100 font-medium">
              {warnList.map((line, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="select-none">•</span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="py-1 text-sm font-semibold text-neutral-400 dark:text-neutral-500">ไม่มี</div>
          )}
        </div>
      </div>
    </details>
  );
}

// -------------------------------------------------------------
// 2. การ์ดแนวโน้มรายเดือน (เริ่มต้นพับไว้ ยุบทุกช่อง)
// -------------------------------------------------------------
function ForecastCardView({ item }: { item: Item }) {
  const goodList: string[] = [];
  const warnList: string[] = [];
  const mixList: string[] = [];
  const eventsList: string[] = [];

  if (item.sub && item.sub.length > 0) {
    for (const rawText of item.sub) {
      const t = rawText.trim().replace(/^[•\-\*\s]+/, "");

      if (t.includes("มุมให้คุณ:")) {
        const parts = t.split("มุมให้คุณ:");
        if (parts[1]) {
          parts[1].split("·").forEach((subItem) => {
            if (subItem.trim()) goodList.push(subItem.trim());
          });
        }
      } else if (t.includes("มุมให้โทษ:")) {
        const parts = t.split("มุมให้โทษ:");
        if (parts[1]) {
          parts[1].split("·").forEach((subItem) => {
            if (subItem.trim()) warnList.push(subItem.trim());
          });
        }
      } else if (t.startsWith("เหตุการณ์ในเดือนนี้") || t.match(/^\d+\s+[ก-ฮ]+/)) {
        eventsList.push(t);
      } else {
        const m = t.match(/^\[(ดี|ร้าย|ผสม)\]\s*(.*)$/);
        if (m) {
          if (m[1] === "ดี") goodList.push(m[2]);
          else if (m[1] === "ร้าย") warnList.push(m[2]);
          else mixList.push(m[2]);
        } else if (t.includes("คำนวณจากตำแหน่งดาว") || t.includes("มุมให้คุณ")) {
          goodList.push(t);
        } else if (t.includes("มุมให้โทษ") || t.includes("ระวัง")) {
          warnList.push(t);
        } else {
          mixList.push(t);
        }
      }
    }
  }

  return (
    <details className="group rounded-xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <summary className="flex w-full cursor-pointer items-center justify-between font-bold text-neutral-900 list-none dark:text-neutral-100">
        <div>
          {item.head && (
            <div className="text-lg font-bold">
              {item.head}
              <ToneBadge tone={item.tone} />
            </div>
          )}
          {item.text && <p className="mt-0.5 text-sm font-medium text-neutral-600 dark:text-neutral-400">{item.text}</p>}
        </div>
        <span className="ml-2 text-xl text-neutral-400 select-none">
          <span className="inline group-open:hidden">▼</span>
          <span className="hidden group-open:inline">▲</span>
        </span>
      </summary>

      <div className="mt-4 flex flex-col gap-3 border-t border-neutral-100 pt-3 dark:border-neutral-800">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {/* กล่องดี */}
          <div className="flex flex-col rounded-lg border-2 border-emerald-300 bg-emerald-50/60 p-3 dark:border-emerald-800 dark:bg-emerald-950/30">
            <div className="mb-2">
              <span className="inline-block rounded bg-emerald-600 px-2.5 py-0.5 text-xs font-bold text-white dark:bg-emerald-500">
                ดี (มุมให้คุณ)
              </span>
            </div>
            {goodList.length > 0 ? (
              <ul className="space-y-1.5 text-sm text-emerald-950 dark:text-emerald-100 font-medium">
                {goodList.map((line, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="select-none">•</span>
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="py-1 text-sm font-semibold text-neutral-400 dark:text-neutral-500">ไม่มี</div>
            )}
          </div>

          {/* กล่องผสม / กลาง */}
          <div className="flex flex-col rounded-lg border-2 border-amber-300 bg-amber-50/60 p-3 dark:border-amber-800 dark:bg-amber-950/30">
            <div className="mb-2">
              <span className="inline-block rounded bg-amber-500 px-2.5 py-0.5 text-xs font-bold text-white dark:bg-amber-600">
                ผสม / กลาง
              </span>
            </div>
            {mixList.length > 0 ? (
              <ul className="space-y-1.5 text-sm text-amber-950 dark:text-amber-100 font-medium">
                {mixList.map((line, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="select-none">•</span>
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="py-1 text-sm font-semibold text-neutral-400 dark:text-neutral-500">ไม่มี</div>
            )}
          </div>

          {/* กล่องระวัง */}
          <div className="flex flex-col rounded-lg border-2 border-red-300 bg-red-50/60 p-3 dark:border-red-800 dark:bg-red-950/30">
            <div className="mb-2">
              <span className="inline-block rounded bg-red-600 px-2.5 py-0.5 text-xs font-bold text-white dark:bg-red-500">
                ระวัง (มุมให้โทษ)
              </span>
            </div>
            {warnList.length > 0 ? (
              <ul className="space-y-1.5 text-sm text-red-950 dark:text-red-100 font-medium">
                {warnList.map((line, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="select-none">•</span>
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="py-1 text-sm font-semibold text-neutral-400 dark:text-neutral-500">ไม่มี</div>
            )}
          </div>
        </div>

        {eventsList.length > 0 && (
          <div className="rounded-lg border border-neutral-200 bg-neutral-50/50 p-3 dark:border-neutral-800 dark:bg-neutral-800/30">
            <div className="mb-1.5 text-xs font-bold text-neutral-500">เหตุการณ์สำคัญประจำเดือน</div>
            <ul className="space-y-1 text-xs text-neutral-700 dark:text-neutral-300">
              {eventsList.map((ev, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <span className="select-none text-neutral-400">•</span>
                  <span>{ev}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </details>
  );
}

// -------------------------------------------------------------
// 3. การ์ดรายละเอียดทางโหราศาสตร์ (เริ่มต้นพับไว้ ยุบทุกช่อง)
// -------------------------------------------------------------
function DetailCardView({ item }: { item: Item }) {
  return (
    <details className="group rounded-xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <summary className="flex w-full cursor-pointer items-center justify-between font-bold text-neutral-900 list-none dark:text-neutral-100">
        <div>
          {item.head && (
            <div className="text-lg font-bold">
              {item.head}
              <ToneBadge tone={item.tone} />
            </div>
          )}
          {item.text && <p className="mt-0.5 text-sm font-medium text-neutral-600 dark:text-neutral-400">{item.text}</p>}
        </div>
        <span className="ml-2 text-xl text-neutral-400 select-none">
          <span className="inline group-open:hidden">▼</span>
          <span className="hidden group-open:inline">▲</span>
        </span>
      </summary>

      {item.sub && item.sub.length > 0 && (
        <div className="mt-3 border-t border-neutral-100 pt-3 dark:border-neutral-800">
          <ul className="space-y-1 text-sm text-neutral-700 dark:text-neutral-300">
            {item.sub.map((t, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="select-none text-neutral-400">•</span>
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </details>
  );
}

export default async function PredictPage({ searchParams }: Props) {
  const sp = await searchParams;
  const hasTime = sp.nt !== "1";
  const gender: Gender = sp.sex === "m" ? "m" : sp.sex === "f" ? "f" : undefined;

  let natal: ChartResult | null = null;
  let now: ChartResult | null = null;
  let reading: Reading | null = null;
  let forecast: Section[] = [];
  const range = RANGES[sp.range ?? ""] ? (sp.range as string) : "3";
  let error = "";

  if (sp.date) {
    const birth = parseInput({ date: sp.date, time: hasTime ? sp.time || "12:00" : "12:00", place: sp.place });
    const today = parseInput({ place: sp.place });
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

          {/* 1. สรุปภาพรวมดวงชะตา */}
          <section className={card}>
            <h2 className="mb-3 text-lg font-bold">สรุปภาพรวมดวงชะตา</h2>
            <div className="flex flex-col gap-3">
              {reading.summary.map((it, i) => (
                <SummaryCardView key={`sum-${i}`} item={it} />
              ))}
            </div>
          </section>

          {/* 2. อนาคตใกล้: แนวโน้มรายเดือน */}
          {forecast.map((sec) => (
            <section key={sec.id} className={card}>
              <h2 className="text-lg font-bold">{sec.title}</h2>
              {sec.note && <p className="mb-2 text-xs text-neutral-500">{sec.note}</p>}
              <div className="mt-3 flex flex-col gap-3">
                {sec.items.map((it, i) => (
                  <ForecastCardView key={`${sec.id}-${i}`} item={it} />
                ))}
              </div>
            </section>
          ))}

          {hasTime && (
            <div className="rounded-xl border border-neutral-200 p-2 dark:border-neutral-800">
              <ThaiWheel chart={natal} />
            </div>
          )}

          {/* 3. รายละเอียดทางโหราศาสตร์ */}
          {reading.sections.map((sec) => (
            <section key={sec.id} className={card}>
              <h2 className="text-lg font-bold">{sec.title}</h2>
              {sec.note && <p className="mb-2 text-xs text-neutral-500">{sec.note}</p>}
              <div className="mt-3 flex flex-col gap-3">
                {sec.items.map((it, i) => (
                  <DetailCardView key={`${sec.id}-${i}`} item={it} />
                ))}
              </div>
            </section>
          ))}

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