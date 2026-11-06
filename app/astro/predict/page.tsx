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

// บรรทัดย่อยที่ขึ้นต้นด้วย [ดี]/[ร้าย]/[ผสม] แสดงเป็นป้ายสี
function SubLine({ text }: { text: string }) {
  const m = text.match(/^\[(ดี|ร้าย|ผสม)\]\s*(.*)$/);
  if (!m) return <li>{text}</li>;
  return (
    <li>
      <ToneBadge tone={m[1] as Tone} />
      {m[2]}
    </li>
  );
}

function ItemView({ item }: { item: Item }) {
  return (
    <li className="border-b border-neutral-200 pb-2 last:border-0 dark:border-neutral-800">
      {item.head && (
        <div className="font-semibold">
          {item.head}
          <ToneBadge tone={item.tone} />
        </div>
      )}
      <div className="text-sm">{item.text}</div>
      {item.sub && item.sub.length > 0 && (
        <details className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
          <summary className="cursor-pointer text-xs text-neutral-500">รายละเอียด ({item.sub.length})</summary>
          <ul className="mt-1 list-disc space-y-1 pl-5">
            {item.sub.map((t) => (
              <SubLine key={t} text={t} />
            ))}
          </ul>
        </details>
      )}
    </li>
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
      <p className="mb-3 text-sm">
        <Link className="underline" href="/astro">
          กลับหน้าแรก →
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

          <section className={card}>
            <h2 className="mb-2 text-lg font-bold">สรุปผลทำนาย</h2>
            <ul className="space-y-2">
              {reading.summary.map((it, i) => (
                <ItemView key={`sum-${i}`} item={it} />
              ))}
            </ul>
          </section>

          {forecast.map((sec) => (
            <section key={sec.id} className={card}>
              <h2 className="text-lg font-bold">{sec.title}</h2>
              {sec.note && <p className="mb-2 text-xs text-neutral-500">{sec.note}</p>}
              <ul className="mt-2 space-y-2">
                {sec.items.map((it, i) => (
                  <ItemView key={`${sec.id}-${i}`} item={it} />
                ))}
              </ul>
            </section>
          ))}

          {hasTime && (
            <div className="rounded-xl border border-neutral-200 p-2 dark:border-neutral-800">
              <ThaiWheel chart={natal} />
            </div>
          )}

          {reading.sections.map((sec) => (
            <section key={sec.id} className={card}>
              <h2 className="text-lg font-bold">{sec.title}</h2>
              {sec.note && <p className="mb-2 text-xs text-neutral-500">{sec.note}</p>}
              <ul className="mt-2 space-y-2">
                {sec.items.map((it, i) => (
                  <ItemView key={`${sec.id}-${i}`} item={it} />
                ))}
              </ul>
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