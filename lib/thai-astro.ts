// ค่าคงที่และ type สำหรับโหราศาสตร์ไทย (ไม่มีโค้ดฝั่ง server จึงใช้ได้ทั้ง client/server)

export type PlanetInfo = {
  code: string;
  name: string;
  longitude: number;
  zodiac: string;
  degree: number;
  minute: number;
  second: number;
  formatted: string;
  speed_per_day: number;
  status: string;
};

export type Location = { name: string; lat: number; lon: number };

export type Lagna = {
  longitude: number;
  zodiac: string;
  degree: number;
  minute: number;
  second: number;
  formatted: string;
};

export type ChartResult = {
  datetime_th: string;
  julian_day: number;
  system: string;
  ayanamsa: number;
  location: Location;
  lagna: Lagna;
  planets: Record<string, PlanetInfo>;
};

export const THAI_PLANETS = [
  { code: "1", name: "อาทิตย์", id: 0 },
  { code: "2", name: "จันทร์", id: 1 },
  { code: "3", name: "อังคาร", id: 4 },
  { code: "4", name: "พุธ", id: 2 },
  { code: "5", name: "พฤหัสบดี", id: 5 },
  { code: "6", name: "ศุกร์", id: 3 },
  { code: "7", name: "เสาร์", id: 6 },
  { code: "8", name: "ราหู", id: 11 },
  { code: "0", name: "มฤตยู", id: 7 },
  { code: "N", name: "เนปจูน", id: 8 },
  { code: "P", name: "พลูโต", id: 9 },
] as const;

// ลำดับการแสดงในช่องราศี (เกตุ = รหัส 9)
export const DISPLAY_ORDER = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "N", "P"];

export const THAI_ZODIACS = [
  "เมษ", "พฤษภ", "เมถุน", "กรกฎ", "สิงห์", "กันย์",
  "ตุลย์", "พิจิก", "ธนู", "มังกร", "กุมภ์", "มีน",
];

const THAI_DIGITS = ["๐", "๑", "๒", "๓", "๔", "๕", "๖", "๗", "๘", "๙"];

export function planetSymbol(code: string): string {
  if (/^\d$/.test(code)) return THAI_DIGITS[Number(code)];
  return code === "N" ? "น" : code === "P" ? "พ" : code;
}

export function isRetrograde(p: PlanetInfo): boolean {
  return p.status.startsWith("พักร");
}

// สถานที่ให้เลือก (พิกัดโดยประมาณของตัวเมือง) ใช้คำนวณลัคนา
export const PLACES: (Location & { key: string })[] = [
  { key: "bangkok", name: "กรุงเทพมหานคร", lat: 13.7563, lon: 100.5018 },
  { key: "chiangmai", name: "เชียงใหม่", lat: 18.7883, lon: 98.9853 },
  { key: "chiangrai", name: "เชียงราย", lat: 19.9105, lon: 99.8406 },
  { key: "lampang", name: "ลำปาง", lat: 18.2888, lon: 99.4908 },
  { key: "phitsanulok", name: "พิษณุโลก", lat: 16.8211, lon: 100.2659 },
  { key: "nakhonsawan", name: "นครสวรรค์", lat: 15.7047, lon: 100.1372 },
  { key: "ayutthaya", name: "พระนครศรีอยุธยา", lat: 14.3532, lon: 100.5689 },
  { key: "kanchanaburi", name: "กาญจนบุรี", lat: 14.0228, lon: 99.5328 },
  { key: "ratchaburi", name: "ราชบุรี", lat: 13.5283, lon: 99.8134 },
  { key: "chonburi", name: "ชลบุรี", lat: 13.3611, lon: 100.9847 },
  { key: "rayong", name: "ระยอง", lat: 12.6814, lon: 101.2816 },
  { key: "korat", name: "นครราชสีมา", lat: 14.9799, lon: 102.0978 },
  { key: "khonkaen", name: "ขอนแก่น", lat: 16.4322, lon: 102.8236 },
  { key: "udon", name: "อุดรธานี", lat: 17.4138, lon: 102.787 },
  { key: "ubon", name: "อุบลราชธานี", lat: 15.2287, lon: 104.8564 },
  { key: "nakhonsi", name: "นครศรีธรรมราช", lat: 8.4304, lon: 99.9631 },
  { key: "suratthani", name: "สุราษฎร์ธานี", lat: 9.1382, lon: 99.3217 },
  { key: "phuket", name: "ภูเก็ต", lat: 7.8804, lon: 98.3923 },
  { key: "hatyai", name: "หาดใหญ่ (สงขลา)", lat: 7.0086, lon: 100.4747 },
];

type RawInput = {
  date?: string | null;
  time?: string | null;
  place?: string | null;
  lat?: string | null;
  lon?: string | null;
};

/** ตรวจ date=YYYY-MM-DD, time=HH:MM[:SS], place=<key> หรือ lat/lon (กรอกคู่กัน) */
export function parseInput(p: RawInput) {
  const date = p.date || new Date(Date.now() + 7 * 3600_000).toISOString().slice(0, 10);
  const t = p.time || "07:00:00";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}(:\d{2})?$/.test(t)) return null;

  let loc: Location = PLACES[0];
  const preset = PLACES.find((x) => x.key === p.place);
  if (preset) loc = preset;

  // พิกัดที่กรอกเองมีความสำคัญกว่าจังหวัดที่เลือก
  if (p.lat && p.lon) {
    const lat = Number(p.lat);
    const lon = Number(p.lon);
    // ลัคนาคำนวณไม่ได้ใกล้ขั้วโลก จึงจำกัดละติจูดไว้ที่ ±66°
    if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 66 || Math.abs(lon) > 180) {
      return null;
    }
    loc = { name: `พิกัด ${lat.toFixed(4)}, ${lon.toFixed(4)}`, lat, lon };
  }

  return { date, time: t.length === 5 ? `${t}:00` : t, loc };
}
