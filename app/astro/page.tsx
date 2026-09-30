import type { Metadata } from "next";
import ThaiChart from "../../components/ThaiChart";
import { computeChart } from "../../lib/ephemeris";
import { DISPLAY_ORDER, parseInput, planetSymbol } from "../../lib/thai-astro";

export const metadata: Metadata = {
  title: "ผังดวงชะตาไทย",
  description: "คำนวณตำแหน่งดาวระบบนิรายนะ (ลาหิรี) และแสดงบนผังดวงไทย",
};

type Props = {
  searchParams: Promise<{ date?: string; time?: string }>;
};

export default async function AstroPage({ searchParams }: Props) {
  const sp = await searchParams;
  const input = parseInput(sp.date, sp.time);

  if (!input) {
    return (
      <main className="mx-auto max-w-3xl p-4">
        <h1 className="text-xl font-bold">ผังดวงชะตาไทย</h1>
        <p className="mt-4 text-red-600">
          รูปแบบวันที่/เวลาไม่ถูกต้อง (date=YYYY-MM-DD, time=HH:MM)
        </p>
        <a className="underline" href="/astro">กลับ</a>
      </main>
    );
  }

  const chart = await computeChart(input.date, input.time);

  return (
    <main className="mx-auto max-w-3xl p-4 pb-12">
      <h1 className="mb-3 text-xl font-bold">ผังดวงชะตาไทย</h1>

      <form method="get" action="/astro" className="mb-4 flex flex-wrap items-end gap-2">
        <label className="flex flex-col gap-0.5 text-sm text-neutral-500">
          วันที่
          <input
            type="date"
            name="date"
            defaultValue={input.date}
            required
            className="rounded-lg border border-neutral-300 bg-transparent px-3 py-2 text-base text-inherit dark:border-neutral-700"
          />
        </label>
        <label className="flex flex-col gap-0.5 text-sm text-neutral-500">
          เวลา (เวลาไทย)
          <input
            type="time"
            name="time"
            defaultValue={input.time.slice(0, 5)}
            required
            className="rounded-lg border border-neutral-300 bg-transparent px-3 py-2 text-base text-inherit dark:border-neutral-700"
          />
        </label>
        <button
          type="submit"
          className="rounded-lg bg-[#8a6d3b] px-4 py-2 text-white hover:bg-[#75592c]"
        >
          แสดงดวง
        </button>
      </form>

      <div className="rounded-xl border border-neutral-200 p-2 dark:border-neutral-800">
        <ThaiChart chart={chart} />
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
        <a className="underline" href={`/api/astro?date=${input.date}&time=${input.time}`}>
          ข้อมูล JSON
        </a>
      </p>
    </main>
  );
}
