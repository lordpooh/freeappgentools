// เนปจูน (N) และพลูโต (P): ไม่มีในคัมภีร์สุริยยาตร์ จึงคำนวณด้วย Swiss Ephemeris (Moshier)
// แล้วลบ ayanamsa เพื่อให้เป็นระบบนิรายนะเช่นเดียวกับดาวอื่นในผัง
// ปรับ ayanamsa ที่ใช้ได้ที่ NP_SIDEREAL_MODE ด้านล่าง
import { readFile } from "node:fs/promises";
import path from "node:path";
import SwissEPH from "sweph-wasm";
import createSwissModule from "sweph-wasm/wasm/swisseph";

/** รหัส sidereal mode ของ Swiss Ephemeris: 1 = ลาหิรี (ค่าเริ่มต้น) ถ้าต้องการอย่างอื่น แก้ตรงนี้ */
export const NP_SIDEREAL_MODE = 1;

const g = globalThis as unknown as { __swePromise?: Promise<SwissEPH> };

const WASM_PATH = path.join(process.cwd(), "node_modules", "sweph-wasm", "dist", "wasm", "swisseph.wasm");

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
      swe.swe_set_sid_mode(NP_SIDEREAL_MODE, 0, 0);
      return swe;
    })().catch((err) => {
      g.__swePromise = undefined;
      throw err;
    });
  }
  return g.__swePromise;
}

/** เวลาไทย (UTC+7) -> ลองจิจูดนิรายนะและความเร็ว (องศา/วัน) ของเนปจูน (8) และพลูโต (9) */
export async function computeModernPlanets(date: string, time: string) {
  const swe = await getSwe();
  const [year, month, day] = date.split("-").map(Number);
  const [hh = 0, mm = 0, ss = 0] = time.split(":").map(Number);
  const utc = new Date(0);
  utc.setUTCFullYear(year, month - 1, day);
  utc.setUTCHours(hh - 7, mm, ss, 0);
  const jd = swe.swe_julday(
    utc.getUTCFullYear(),
    utc.getUTCMonth() + 1,
    utc.getUTCDate(),
    utc.getUTCHours() + utc.getUTCMinutes() / 60 + utc.getUTCSeconds() / 3600,
    1
  );
  const flags = 4 | 256 | 65536; // MOSEPH | SPEED | SIDEREAL
  const out: Record<"N" | "P", { longitude: number; speed: number }> = {
    N: { longitude: 0, speed: 0 },
    P: { longitude: 0, speed: 0 },
  };
  for (const [code, id] of [["N", 8], ["P", 9]] as const) {
    const res = swe.swe_calc_ut(jd, id, flags);
    out[code] = { longitude: res[0] as number, speed: res[3] as number };
  }
  return out;
}
