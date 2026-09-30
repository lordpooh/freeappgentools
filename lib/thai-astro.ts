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

export type ChartResult = {
  datetime_th: string;
  julian_day: number;
  system: string;
  ayanamsa: number;
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

/** ตรวจรูปแบบ date=YYYY-MM-DD และ time=HH:MM[:SS] */
export function parseInput(date?: string | null, time?: string | null) {
  const d = date || new Date(Date.now() + 7 * 3600_000).toISOString().slice(0, 10);
  const t = time || "07:00:00";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d) || !/^\d{2}:\d{2}(:\d{2})?$/.test(t)) return null;
  return { date: d, time: t.length === 5 ? `${t}:00` : t };
}
