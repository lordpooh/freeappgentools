import { readFile } from "node:fs/promises";
import path from "node:path";
import SwissEPH from "sweph-wasm";
import createSwissModule from "sweph-wasm/wasm/swisseph";
import {
  THAI_PLANETS,
  THAI_ZODIACS,
  type ChartResult,
  type PlanetInfo,
} from "./thai-astro";

const MEAN_SPEEDS: Record<number, number> = {
  0: 0.9856, 1: 13.1764, 4: 0.524, 2: 1.3833, 5: 0.0831, 3: 1.2,
  6: 0.0335, 11: -0.0529, 7: 0.007, 8: 0.0036, 9: 0.002,
};

function getMotionStatus(planetId: number, speed: number): string {
  if (planetId === 11) return speed > 0 ? "เสริฐ (เดินหน้าผิดปกติ)" : "ปกติ";
  if (planetId === 0 || planetId === 1) {
    return speed > MEAN_SPEEDS[planetId] * 1.03 ? "เสริฐ (Fast)" : "ปกติ";
  }
  const mean = MEAN_SPEEDS[planetId] || 1.0;
  if (speed < 0) return "พักร (Retrograde)";
  if (speed === 0 || speed < mean * 0.4) return "มนต์ (Stationary)";
  if (speed > mean * 1.2) return "เสริฐ (Fast)";
  return "ปกติ";
}

// ---------------------------------------------------------------------------
// โหลด wasm: SwissEPH.init() ของ sweph-wasm ใช้ fetch(url) ซึ่งอ่านไฟล์ในเครื่องไม่ได้
// จึงเรียก Emscripten factory ตรง ๆ แล้วส่ง instance ผ่าน instantiateWasm
// เก็บไว้ที่ globalThis เพื่อไม่ให้ init ซ้ำเวลา hot reload ตอน dev
// ---------------------------------------------------------------------------
const g = globalThis as unknown as { __swePromise?: Promise<SwissEPH> };

const WASM_PATH = path.join(
  process.cwd(),
  "node_modules",
  "sweph-wasm",
  "dist",
  "wasm",
  "swisseph.wasm"
);

function getSwe(): Promise<SwissEPH> {
  if (!g.__swePromise) {
    g.__swePromise = (async () => {
      const bytes = await readFile(WASM_PATH);
      const wasmModule = await WebAssembly.compile(bytes);

      let rejectInstantiate: (e: unknown) => void = () => {};
      const failed = new Promise<never>((_, reject) => {
        rejectInstantiate = reject;
      });

      const wasm = await Promise.race([
        createSwissModule({
          instantiateWasm(
            imports: WebAssembly.Imports,
            onSuccess: (instance: WebAssembly.Instance, module: WebAssembly.Module) => void
          ) {
            WebAssembly.instantiate(wasmModule, imports)
              .then((instance) => onSuccess(instance, wasmModule))
              .catch(rejectInstantiate);
            return {};
          },
        }),
        failed,
      ]);

      const swe = new SwissEPH(wasm);
      swe.swe_set_sid_mode(1, 0, 0); // Lahiri
      return swe;
    })().catch((err) => {
      g.__swePromise = undefined; // ให้ลองใหม่ได้ถ้าครั้งแรกล้มเหลว
      throw err;
    });
  }
  return g.__swePromise;
}

function splitLongitude(long: number) {
  const zIdx = Math.floor(long / 30);
  const degInSign = long % 30;
  const degree = Math.floor(degInSign);
  const minFloat = (degInSign - degree) * 60;
  const minute = Math.floor(minFloat);
  const second = Math.floor((minFloat - minute) * 60);
  return { zodiac: THAI_ZODIACS[zIdx], degree, minute, second };
}

export async function computeChart(date: string, time: string): Promise<ChartResult> {
  const swe = await getSwe();

  const [year, month, day] = date.split("-").map(Number);
  const [hh = 0, mm = 0, ss = 0] = time.split(":").map(Number);

  // เวลาไทย (UTC+7) -> UTC
  const utc = new Date(Date.UTC(year, month - 1, day, hh - 7, mm, ss));
  const jd = swe.swe_julday(
    utc.getUTCFullYear(),
    utc.getUTCMonth() + 1,
    utc.getUTCDate(),
    utc.getUTCHours() + utc.getUTCMinutes() / 60 + utc.getUTCSeconds() / 3600,
    1
  );

  // MOSEPH (4) | SPEED (256) | SIDEREAL (65536) — Moshier ไม่ต้องใช้ไฟล์ .se1
  const flags = 4 | 256 | 65536;
  const planets: Record<string, PlanetInfo> = {};

  for (const p of THAI_PLANETS) {
    // swe_calc_ut คืน array: [lon, lat, dist, lonSpeed, latSpeed, distSpeed]
    const res = swe.swe_calc_ut(jd, p.id, flags);
    const long = res[0] as number;
    const speed = res[3] as number;
    const s = splitLongitude(long);
    planets[p.code] = {
      code: p.code,
      name: p.name,
      longitude: Number(long.toFixed(4)),
      ...s,
      formatted: `${s.zodiac} ${s.degree}° ${s.minute}' ${s.second}"`,
      speed_per_day: Number(speed.toFixed(4)),
      status: getMotionStatus(p.id, speed),
    };
  }

  // เกตุ = ราหู + 180°
  const rahu = planets["8"];
  const ketuLong = (rahu.longitude + 180) % 360;
  const k = splitLongitude(ketuLong);
  planets["9"] = {
    code: "9",
    name: "เกตุ",
    longitude: Number(ketuLong.toFixed(4)),
    ...k,
    formatted: `${k.zodiac} ${k.degree}° ${k.minute}' ${k.second}"`,
    speed_per_day: Number((-rahu.speed_per_day).toFixed(4)),
    status: "ปกติ",
  };

  return {
    datetime_th: `${date} ${time}`,
    julian_day: jd,
    system: "Sidereal (Lahiri Ayanamsa)",
    ayanamsa: swe.swe_get_ayanamsa_ut(jd),
    planets,
  };
}
