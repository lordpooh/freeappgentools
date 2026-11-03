import type { Metadata } from "next";
import ThaiWheel from "../../components/ThaiWheel";
import { computeChart } from "../../lib/ephemeris";
import {
  DISPLAY_ORDER,
  PLACES,
  THAI_ZODIACS,
  parseInput,
  planetSymbol,
  type ChartResult,
} from "../../lib/thai-astro";

export const metadata: Metadata = {
  title: "ผังดวงชะตาไทย",
  description: "คำนวณตำแหน่งดาวและลัคนาตามคัมภีร์สุริยยาตร์ แสดงบนผังดวงไทยแบบวงกลม",
};

type Props = {
  searchParams: Promise<{ date?: string; time?: string; place?: string; lat?: string; lon?: string; cal?: string }>;
};

const inputCls =
  "rounded-lg border border-neutral-300 bg-transparent px-3 py-2 text-base text-inherit dark:border-neutral-700";

const THAI_MONTHS = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
];
// ตัวย่อราศีแบบปฏิทิน (เมษ = 00)
const SIGN_ABBR = ["มษ", "พภ", "มถ", "กฎ", "สห", "กน", "ตล", "พจ", "ธน", "มก", "กภ", "มน"];

const pad2 = (n: number) => String(n).padStart(2, "0");

export default async function AstroPage({ searchParams }: Props) {
  const sp = await searchParams;
  const input = parseInput(sp);

  if (!input) {
    return (
      <main className="mx-auto max-w-3xl p-4">
        <h1 className="text-xl font-bold">ผังดวงชะตาไทย</h1>
        <p className="mt-4 text-red-600">
          ข้อมูลไม่ถูกต้อง (วันที่ YYYY-MM-DD, เวลา HH:MM, ละติจูดไม่เกิน ±66, ลองจิจูดไม่เกิน ±180)
        </p>
        <a className="underline" href="/astro">กลับ</a>
      </main>
    );
  }

  let chart: ChartResult;
  try {
    chart = await computeChart(input.date, input.time, input.loc);
  } catch {
    return (
      <main className="mx-auto max-w-3xl p-4">
        <h1 className="text-xl font-bold">ผังดวงชะตาไทย</h1>
        <p className="mt-4 text-red-600">คำนวณไม่ได้ ตรวจสอบวันที่และเวลาอีกครั้ง (เช่น วันที่ต้องมีอยู่จริงในปฏิทิน)</p>
        <a className="underline" href="/astro">กลับ</a>
      </main>
    );
  }

  const customCoords = Boolean(sp.lat && sp.lon);
  const qs = new URLSearchParams({ date: input.date, time: input.time.slice(0, 5) });
  if (customCoords) {
    qs.set("lat", String(sp.lat));
    qs.set("lon", String(sp.lon));
  } else if (sp.place) {
    qs.set("place", sp.place);
  }

  const [y, m, d] = (input.calendarDate ?? input.date).split("-").map(Number);
  const dateText = `วันที่ ${d} ${THAI_MONTHS[m - 1] ?? ""} พ.ศ.${y + 543}`;

  return (
    <main className="mx-auto max-w-5xl p-4 pb-12">
      <h1 className="mb-3 text-xl font-bold">ผังดวงชะตาไทย</h1>

      <form method="get" action="/astro" className="mb-2 flex flex-wrap items-end gap-2">
        <label className="flex flex-col gap-0.5 text-sm text-neutral-500">
          วันที่
          <input type="date" name="date" defaultValue={input.calendarDate ?? input.date} required className={inputCls} />
        </label>
        <label className="flex flex-col gap-0.5 text-sm text-neutral-500">
          เวลา (เวลาไทย)
          <input type="time" name="time" defaultValue={input.time.slice(0, 5)} required className={inputCls} />
        </label>
        <label className="flex flex-col gap-0.5 text-sm text-neutral-500">
          สถานที่ (คำนวณลัคนา)
          <select name="place" defaultValue={sp.place || "bangkok"} className={inputCls}>
            {PLACES.map((p) => (
              <option key={p.key} value={p.key} className="text-black">
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <details className="text-sm text-neutral-500" open={customCoords}>
          <summary className="cursor-pointer py-2">หรือกรอกพิกัดเอง</summary>
          <div className="flex gap-2">
            <label className="flex flex-col gap-0.5">
              ละติจูด
              <input
                type="number"
                step="any"
                min={-66}
                max={66}
                name="lat"
                defaultValue={sp.lat || ""}
                placeholder="13.7563"
                className={`${inputCls} w-28`}
              />
            </label>
            <label className="flex flex-col gap-0.5">
              ลองจิจูด
              <input
                type="number"
                step="any"
                min={-180}
                max={180}
                name="lon"
                defaultValue={sp.lon || ""}
                placeholder="100.5018"
                className={`${inputCls} w-28`}
              />
            </label>
          </div>
        </details>
        <label className="flex items-center gap-1.5 py-2 text-sm text-neutral-500">
          <input type="checkbox" name="cal" value="1" defaultChecked={Boolean(input.calendarDate)} />
          ตามปฏิทิน (24:00 น.)
        </label>
        <button type="submit" className="rounded-lg bg-[#8a6d3b] px-4 py-2 text-white hover:bg-[#75592c]">
          แสดงดวง
        </button>
        <a className="px-1 py-2 text-sm underline" href="/astro">
          ใช้เวลาปัจจุบัน
        </a>
      </form>
      <p className="mb-4 text-xs text-neutral-500">
        ติ๊ก &quot;ตามปฏิทิน&quot; เพื่อให้ตรงกับหน้าปฏิทินโหราศาสตร์ที่แสดงสมผุส ณ เวลา 24:00น. ของวันที่เลือก (ไม่ใช้ช่องเวลา)
      </p>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
        <section>
          <h2 className="text-lg font-bold">{dateText}</h2>
          <p className="mb-2 text-sm text-neutral-500">
            {input.calendarDate
              ? "สมผุส ณ เวลา 24:00น. (ตามปฏิทิน)"
              : `สมผุส ณ เวลา ${input.time.slice(0, 5)} น. (เวลาไทย)`}{" "}
            · สถานที่ {chart.location.name}
          </p>

          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-neutral-300 text-left dark:border-neutral-700">
                <th className="px-1.5 py-1.5">ดาว</th>
                <th className="px-1.5 py-1.5">ราศี</th>
                <th className="px-1.5 py-1.5 text-right">°</th>
                <th className="px-1.5 py-1.5 text-right">′</th>
                <th className="px-1.5 py-1.5" />
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-neutral-200 font-semibold text-[#0f766e] dark:border-neutral-800 dark:text-[#5eead4]">
                <td className="px-1.5 py-1.5">ล. ลัคนา</td>
                <td className="px-1.5 py-1.5 whitespace-nowrap">
                  {pad2(THAI_ZODIACS.indexOf(chart.lagna.zodiac))} : {SIGN_ABBR[THAI_ZODIACS.indexOf(chart.lagna.zodiac)]}
                </td>
                <td className="px-1.5 py-1.5 text-right">{pad2(chart.lagna.degree)}</td>
                <td className="px-1.5 py-1.5 text-right">{pad2(chart.lagna.minute)}</td>
                <td className="px-1.5 py-1.5" />
              </tr>
              {DISPLAY_ORDER.map((code) => {
                const p = chart.planets[code];
                const zIdx = THAI_ZODIACS.indexOf(p.zodiac);
                const retro = p.status.startsWith("พักร");
                const slow = p.status.startsWith("มนต์");
                return (
                  <tr
                    key={code}
                    className={`border-b border-neutral-200 dark:border-neutral-800 ${code === "N" ? "border-t-2 border-t-neutral-300 dark:border-t-neutral-700" : ""}`}
                  >
                    <td className="px-1.5 py-1.5 whitespace-nowrap">
                      <span className="font-bold">{planetSymbol(code)}.</span> {p.name}
                    </td>
                    <td className="px-1.5 py-1.5 whitespace-nowrap">
                      {pad2(zIdx)} : {SIGN_ABBR[zIdx]}
                    </td>
                    <td className="px-1.5 py-1.5 text-right">{pad2(p.degree)}</td>
                    <td className="px-1.5 py-1.5 text-right">{pad2(p.minute)}</td>
                    <td className="px-1.5 py-1.5 font-semibold text-red-600 dark:text-[#ff8a7a]">
                      {retro ? "พ." : slow ? <span className="text-amber-600 dark:text-amber-400">ม.</span> : ""}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="mt-2 text-xs text-neutral-500">
            พ. = พักร (ถอยหลัง) · ม. = มนต์ (เดินช้า) · เนปจูนและพลูโตคำนวณแบบนิรายนะลาหิรี ไม่อยู่ในคัมภีร์สุริยยาตร์
          </p>
        </section>

        <div>
          <div className="rounded-xl border border-neutral-200 p-2 dark:border-neutral-800">
            <ThaiWheel chart={chart} />
          </div>
          <p className="mt-2 text-xs text-neutral-500">
            ตรงกลาง: วงใน = ผังราศี, วงนอก = ผังนวางค์ (ล = ลัคนา) · กลางสุด = องศาอาทิตย์ · พ. = พักร, ม. = มนต์
          </p>
        </div>
      </div>

      <p className="mt-3 text-sm text-neutral-500">
        <a className="underline" href={`/api/astro?${qs.toString()}`}>
          ข้อมูล JSON
        </a>
      </p>
      <p className="mt-2 text-xs text-neutral-500">
        คำนวณตามคัมภีร์สุริยยาตร์ จากเวลาไทย (UTC+7) แปลงเข้ากรอบเวลา +06:42 ของปฏิทินโหราศาสตร์ไทย
        ลัคนาคำนวณจากอาทิตย์ขึ้นตามสถานที่ที่เลือก ยังไม่ได้ตรวจสอบกับดวงก่อน พ.ศ. 2463
      </p>
      <p className="mt-2 text-xs text-neutral-500">
        <a className="underline" href="./" rel="noopener noreferrer">
          กลับหน้าแรก
        </a>
      </p>
    </main>
  );
}