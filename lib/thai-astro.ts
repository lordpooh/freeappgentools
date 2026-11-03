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

/** province = ชื่อจังหวัดเต็มตามที่ไลบรารี thai-astrology รู้จัก (ถ้ามี) ใช้หาอาทิตย์ขึ้นและเวลาท้องถิ่น */
export type Location = { name: string; lat: number; lon: number; province?: string };

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
  julian_day: number | null;
  horakhun: number | null;
  system: string;
  location: Location;
  lagna: Lagna;
  planets: Record<string, PlanetInfo>;
};

// รหัสดาวตรงกับเลขดาวไทย: ๑ อาทิตย์ ๒ จันทร์ ๓ อังคาร ๔ พุธ ๕ พฤหัสบดี ๖ ศุกร์ ๗ เสาร์ ๘ ราหู ๙ เกตุ ๐ มฤตยู
// key ตรงกับ points ของ thai-astrology
export const THAI_PLANETS = [
  { code: "1", key: "sun", name: "อาทิตย์" },
  { code: "2", key: "moon", name: "จันทร์" },
  { code: "3", key: "mars", name: "อังคาร" },
  { code: "4", key: "mercury", name: "พุธ" },
  { code: "5", key: "jupiter", name: "พฤหัสบดี" },
  { code: "6", key: "venus", name: "ศุกร์" },
  { code: "7", key: "saturn", name: "เสาร์" },
  { code: "8", key: "rahu", name: "ราหู" },
  { code: "9", key: "ketu", name: "เกตุ" },
  { code: "0", key: "uranus", name: "มฤตยู" },
] as const;

// ดาวสุริยยาตร์ ๑๐ ดวง + เนปจูน (N) พลูโต (P) ซึ่งคำนวณแยกด้วย Swiss Ephemeris (นิรายนะ)
export const MODERN_PLANETS = [
  { code: "N", name: "เนปจูน" },
  { code: "P", name: "พลูโต" },
] as const;
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

// นวางค์: แบ่งราศีละ 9 ส่วน ส่วนละ 3°20′ เริ่มนับจากราศีตามธาตุ
// ไฟ (เมษ สิงห์ ธนู) เริ่มเมษ / ดิน (พฤษภ กันย์ มังกร) เริ่มมังกร / ลม (เมถุน ตุลย์ กุมภ์) เริ่มตุลย์ / น้ำ (กรกฎ พิจิก มีน) เริ่มกรกฎ
// คืนค่าเลขราศี 0-11 (เมษ = 0)
const NAVAMSA_START = [0, 9, 6, 3];
export function navamsaSign(longitude: number): number {
  const arcMin = Math.floor(longitude * 60 + 1e-6); // ลิปดาจากเมษ 0°
  const sign = ((Math.floor(arcMin / 1800) % 12) + 12) % 12;
  const part = Math.floor((arcMin % 1800) / 200); // 200 ลิปดา = 3°20′
  return (NAVAMSA_START[sign % 4] + part) % 12;
}

export function isRetrograde(p: PlanetInfo): boolean {
  return p.status.startsWith("พักร");
}

// สถานที่ให้เลือก (พิกัดโดยประมาณของตัวเมือง) province ใช้กับ thai-astrology
export const PLACES: (Location & { key: string; province: string })[] = [
  { key: "bangkok", name: "กรุงเทพมหานคร", province: "กรุงเทพมหานคร", lat: 13.7563, lon: 100.5018 },
  { key: "chiangmai", name: "เชียงใหม่", province: "เชียงใหม่", lat: 18.7883, lon: 98.9853 },
  { key: "chiangrai", name: "เชียงราย", province: "เชียงราย", lat: 19.9105, lon: 99.8406 },
  { key: "lampang", name: "ลำปาง", province: "ลำปาง", lat: 18.2888, lon: 99.4908 },
  { key: "phitsanulok", name: "พิษณุโลก", province: "พิษณุโลก", lat: 16.8211, lon: 100.2659 },
  { key: "nakhonsawan", name: "นครสวรรค์", province: "นครสวรรค์", lat: 15.7047, lon: 100.1372 },
  { key: "ayutthaya", name: "พระนครศรีอยุธยา", province: "พระนครศรีอยุธยา", lat: 14.3532, lon: 100.5689 },
  { key: "kanchanaburi", name: "กาญจนบุรี", province: "กาญจนบุรี", lat: 14.0228, lon: 99.5328 },
  { key: "ratchaburi", name: "ราชบุรี", province: "ราชบุรี", lat: 13.5283, lon: 99.8134 },
  { key: "chonburi", name: "ชลบุรี", province: "ชลบุรี", lat: 13.3611, lon: 100.9847 },
  { key: "rayong", name: "ระยอง", province: "ระยอง", lat: 12.6814, lon: 101.2816 },
  { key: "korat", name: "นครราชสีมา", province: "นครราชสีมา", lat: 14.9799, lon: 102.0978 },
  { key: "khonkaen", name: "ขอนแก่น", province: "ขอนแก่น", lat: 16.4322, lon: 102.8236 },
  { key: "udon", name: "อุดรธานี", province: "อุดรธานี", lat: 17.4138, lon: 102.787 },
  { key: "ubon", name: "อุบลราชธานี", province: "อุบลราชธานี", lat: 15.2287, lon: 104.8564 },
  { key: "nakhonsi", name: "นครศรีธรรมราช", province: "นครศรีธรรมราช", lat: 8.4304, lon: 99.9631 },
  { key: "suratthani", name: "สุราษฎร์ธานี", province: "สุราษฎร์ธานี", lat: 9.1382, lon: 99.3217 },
  { key: "phuket", name: "ภูเก็ต", province: "ภูเก็ต", lat: 7.8804, lon: 98.3923 },
  { key: "hatyai", name: "หาดใหญ่ (สงขลา)", province: "สงขลา", lat: 7.0086, lon: 100.4747 },
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
  // ค่าเริ่มต้น = วันและเวลาปัจจุบันตามเวลาไทย (UTC+7)
  const nowTh = new Date(Date.now() + 7 * 3600_000).toISOString();
  const date = p.date || nowTh.slice(0, 10);
  const t = p.time || nowTh.slice(11, 16);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}(:\d{2})?$/.test(t)) return null;

  let loc: Location = PLACES[0];
  const preset = PLACES.find((x) => x.key === p.place);
  if (preset) loc = preset;

  // พิกัดที่กรอกเองมีความสำคัญกว่าจังหวัดที่เลือก (และไม่ใช้ province)
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