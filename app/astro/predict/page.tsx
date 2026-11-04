import type { Metadata } from "next";
import ThaiWheel from "../../../components/ThaiWheel";
import { computeChart } from "../../../lib/ephemeris";
import { buildReading, type Reading } from "../../../lib/predict";
import { PLACES, parseInput, type ChartResult } from "../../../lib/thai-astro";

export const metadata: Metadata = {
  title: "คำทำนายจากวันเกิด",
  description: "ดวงกำเนิดตามคัมภีร์สุริยยาตร์ เทียบกับดาวจรปัจจุบัน ทักษา และฤกษ์เกิด",
};

type Props = {
  searchParams: Promise<{ date?: string; time?: string; nt?: string; place?: string }>;
};

const inputCls =
  "rounded-lg border border-neutral-300 bg-transparent px-3 py-2 text-base text-inherit dark:border-neutral-700";
const card = "rounded-xl border border-neutral-200 p-4 dark:border-neutral-800";
const h2 = "mb-2 text-lg font-bold";

const THAI_MONTHS = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
];
function thaiDate(date: string) {
  const [y, m, d] = date.split("-").map(Number);
  return `${d} ${THAI_MONTHS[m - 1] ?? ""} พ.ศ.${y + 543}`;
}

export default async function PredictPage({ searchParams }: Props) {
  const sp = await searchParams;
  const hasTime = sp.nt !== "1";

  let natal: ChartResult | null = null;
  let now: ChartResult | null = null;
  let reading: Reading | null = null;
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
        reading = buildReading(natal, now, hasTime);
      } catch {
        error = "คำนวณไม่ได้ ตรวจสอบวันที่และเวลาเกิดอีกครั้ง";
      }
    }
  }

  return (
    <main className="mx-auto max-w-3xl p-4 pb-12">
      <h1 className="mb-1 text-xl font-bold">คำทำนายจากวันเกิด</h1>
      <p className="mb-3 text-sm text-neutral-500">
        เทียบดวงกำเนิดกับดาวจร ณ ปัจจุบัน ตามคัมภีร์สุริยยาตร์ ·{" "}
        <a className="underline" href="/astro">
          กลับหน้าผังดวง
        </a>
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
            เกิดวัน{reading.birth.weekday}
            {reading.birth.night ? " (กลางคืน)" : ""} ที่ {thaiDate(natal.datetime_th.split(" ")[0])}
            {hasTime ? ` เวลา ${natal.datetime_th.split(" ")[1].slice(0, 5)} น.` : " (ไม่ทราบเวลา)"} · {natal.location.name}
          </p>

          <section className={card}>
            <h2 className={h2}>สรุปภาพรวม</h2>
            <ul className="list-disc space-y-1 pl-5 text-sm">
              {reading.summary.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </section>

          {hasTime && (
            <div className="rounded-xl border border-neutral-200 p-2 dark:border-neutral-800">
              <ThaiWheel chart={natal} />
            </div>
          )}

          <section className={card}>
            <h2 className={h2}>ดวงกำเนิด</h2>
            {reading.birth.lagnaSign && (
              <p className="mb-2 text-sm">
                <b>ลัคนา{reading.birth.lagnaSign}</b> — {reading.birth.lagnaTrait}
              </p>
            )}
            <p className="mb-3 text-sm">
              <b>ฤกษ์เกิด</b> (ตามจันทร์): ฤกษ์ที่ {reading.birth.ruekNo} {reading.birth.ruekName}
            </p>
            <h3 className="mb-1 font-semibold">ทักษาตามวันเกิด (เกิดวัน{reading.birth.planetName})</h3>
            <div className="mb-3 overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <tbody>
                  {reading.thaksa.map((t) => (
                    <tr key={t.pos} className="border-b border-neutral-200 dark:border-neutral-800">
                      <td className="px-2 py-1 font-semibold">{t.pos}</td>
                      <td className="px-2 py-1">{t.planetName}</td>
                      <td className="px-2 py-1 text-neutral-500">{t.meaning}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <h3 className="mb-1 font-semibold">ดาวในดวงกำเนิด</h3>
            <ul className="space-y-1.5 text-sm">
              {reading.natal.map((n) => (
                <li key={n.code}>
                  <span className="font-semibold">{n.name}</span> · {n.sign}
                  {n.houseText ? ` · ${n.houseText}` : ""}
                  {n.dignity ? ` · ${n.dignity}` : ""}
                  <div className="text-neutral-500">{n.text}</div>
                </li>
              ))}
            </ul>
          </section>

          <section className={card}>
            <h2 className={h2}>ดวงปัจจุบัน เทียบกับดวงกำเนิด</h2>
            <p className="mb-3 text-xs text-neutral-500">
              ดาวจร ณ {thaiDate(now.datetime_th.split(" ")[0])} เวลา {now.datetime_th.split(" ")[1].slice(0, 5)} น.
            </p>

            <h3 className="mb-1 font-semibold">วันนี้ (วัน{reading.today.weekday})</h3>
            <ul className="mb-3 list-disc space-y-1 pl-5 text-sm">
              <li>
                ทักษา: วัน{reading.today.thaksaPos}ของคุณ — {reading.today.thaksaAdvice}
              </li>
              <li>
                ฤกษ์: จันทร์จรฤกษ์ที่ {reading.today.ruekNo} {reading.today.ruekName} นับจากฤกษ์เกิดเป็นตารา
                {reading.today.taraName} ({reading.today.taraTone}) — {reading.today.taraText}
              </li>
            </ul>

            <h3 className="mb-1 font-semibold">ดาวจรช้า (ผลระยะยาว)</h3>
            <ul className="mb-3 space-y-2 text-sm">
              {reading.transits.map((t) => (
                <li key={t.code}>
                  {t.text}
                  {t.relations.length > 0 && (
                    <ul className="mt-1 list-disc space-y-0.5 pl-5 text-neutral-500">
                      {t.relations.map((r) => (
                        <li key={r}>{r}</li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>

            <h3 className="mb-1 font-semibold">ดาวจรเร็ว (ผลระยะสั้น ไม่กี่สัปดาห์)</h3>
            <ul className="space-y-1.5 text-sm">
              {reading.shortTerm.map((t) => (
                <li key={t.code}>{t.text}</li>
              ))}
            </ul>
          </section>

          <p className="text-xs text-neutral-500">
            คำทำนายนี้เป็นการแปลผลตามกฎโหราศาสตร์แบบกว้าง ๆ ใช้ประกอบการพิจารณาเท่านั้น ไม่ใช่การยืนยันเหตุการณ์
            และไม่ควรใช้ตัดสินใจเรื่องสุขภาพ กฎหมาย หรือการเงิน · มฤตยู เนปจูน พลูโต แสดงในผังแต่ไม่นำมาแปลผล ·
            เกิดวันพุธตั้งแต่ 18:00 น. นับเป็นพุธกลางคืน (ราหู)
          </p>
        </div>
      )}
    </main>
  );
}