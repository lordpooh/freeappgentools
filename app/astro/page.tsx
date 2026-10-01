import type { Metadata } from "next";
import ThaiWheel from "../../components/ThaiWheel";
import { computeChart } from "../../lib/ephemeris";
import { DISPLAY_ORDER, PLACES, parseInput, planetSymbol } from "../../lib/thai-astro";

export const metadata: Metadata = {
  title: "ผังดวงชะตาไทย",
  description: "คำนวณตำแหน่งดาวและลัคนาระบบนิรายนะ (ลาหิรี) แสดงบนผังดวงไทยแบบวงกลม",
};

type Props = {
  searchParams: Promise<{ date?: string; time?: string; place?: string; lat?: string; lon?: string }>;
};

const inputCls =
  "rounded-lg border border-neutral-300 bg-transparent px-3 py-2 text-base text-inherit dark:border-neutral-700";

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

  const chart = await computeChart(input.date, input.time, input.loc);
  const customCoords = Boolean(sp.lat && sp.lon);
  const qs = new URLSearchParams({ date: input.date, time: input.time.slice(0, 5) });
  if (customCoords) {
    qs.set("lat", String(sp.lat));
    qs.set("lon", String(sp.lon));
  } else if (sp.place) {
    qs.set("place", sp.place);
  }

  return (
    <main className="mx-auto max-w-3xl p-4 pb-12">
      <h1 className="mb-3 text-xl font-bold">ผังดวงชะตาไทย</h1>

      <form method="get" action="/astro" className="mb-4 flex flex-wrap items-end gap-2">
        <label className="flex flex-col gap-0.5 text-sm text-neutral-500">
          วันที่
          <input type="date" name="date" defaultValue={input.date} required className={inputCls} />
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
        <button type="submit" className="rounded-lg bg-[#8a6d3b] px-4 py-2 text-white hover:bg-[#75592c]">
          แสดงดวง
        </button>
      </form>

      <p className="mb-2 text-sm text-neutral-500">
        สถานที่: {chart.location.name} · ลัคนา{" "}
        <span className="font-semibold text-[#0f766e] dark:text-[#5eead4]">{chart.lagna.formatted}</span>
      </p>

      <div className="rounded-xl border border-neutral-200 p-2 dark:border-neutral-800">
        <ThaiWheel chart={chart} />
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-neutral-300 text-left dark:border-neutral-700">
              <th className="px-2 py-1.5">รหัส</th>
              <th className="px-2 py-1.5">ดาว</th>
              <th className="px-2 py-1.5">ตำแหน่ง</th>
              <th className="px-2 py-1.5">สถานะ</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-neutral-200 font-semibold text-[#0f766e] dark:border-neutral-800 dark:text-[#5eead4]">
              <td className="px-2 py-1.5">ล</td>
              <td className="px-2 py-1.5">ลัคนา</td>
              <td className="px-2 py-1.5">{chart.lagna.formatted}</td>
              <td className="px-2 py-1.5">—</td>
            </tr>
            {DISPLAY_ORDER.map((code) => {
              const p = chart.planets[code];
              return (
                <tr key={code} className="border-b border-neutral-200 dark:border-neutral-800">
                  <td className="px-2 py-1.5 font-bold">{planetSymbol(code)}</td>
                  <td className="px-2 py-1.5">{p.name}</td>
                  <td className="px-2 py-1.5">{p.formatted}</td>
                  <td className="px-2 py-1.5">{p.status}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-sm text-neutral-500">
        <a className="underline" href={`/api/astro?${qs.toString()}`}>
          ข้อมูล JSON
        </a>
      </p>
      <p className="mt-2 text-xs text-neutral-500">
        คำนวณจากเวลามาตรฐานไทย (UTC+7) ทุกวันที่ หากเป็นดวงก่อน พ.ศ. 2463 ซึ่งไทยยังใช้เวลาท้องถิ่น
        เวลาที่ใช้ต้องปรับเอง
      </p>
    </main>
  );
}
