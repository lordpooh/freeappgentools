// คำนวณสมผุสดาวและลัคนาตามคัมภีร์สุริยยาตร์ (ระบบเดียวกับปฏิทินโหราศาสตร์ไทย)
// ใช้ไลบรารี thai-astrology (MIT) เป็นแกนคำนวณ: หรคุณ -> มัชฌิม -> สมผุส -> ลัคนา
// ไฟล์นี้ทำหน้าที่แปลงผลของไลบรารีให้เป็น ChartResult ที่หน้าเว็บใช้
import { calculateThaiHoroscope } from "thai-astrology";
import { computeModernPlanets } from "./modern-planets";
import {
  MODERN_PLANETS,
  THAI_PLANETS,
  THAI_ZODIACS,
  type ChartResult,
  type Location,
  type PlanetInfo,
} from "./thai-astro";

// เฉพาะฟิลด์ที่เราใช้จาก points ของไลบรารี (ตามคู่มือ API)
type RawPoint = {
  sign: number; // 0 = เมษ ... 11 = มีน
  degrees: number;
  minutes: number; // ดาวเป็นจำนวนเต็ม ลัคนาอาจมีทศนิยม
  longitudeDegrees: number;
  longitudeArcMinutes: number;
};
type RawChart = {
  points: Record<string, RawPoint>;
  calendar?: { julianDayNumber?: number; horakhun?: number };
};

// กรอบเวลาสมผุสดาวของปฏิทินโหราศาสตร์ไทย: UTC+06:42:04 (เวลาท้องถิ่นกรุงเทพฯ)
const CIVIL_UTC_SECONDS = 7 * 3600; // ข้อมูลที่กรอกเป็นเวลาไทย UTC+7
const PLANETARY_FRAME_SECONDS = 6 * 3600 + 42 * 60 + 4;

type Ymd = { year: number; month: number; day: number };

function parseYmd(date: string): Ymd {
  const [year, month, day] = date.split("-").map(Number);
  return { year, month, day };
}

function addDays({ year, month, day }: Ymd, n: number): Ymd {
  const t = new Date(0);
  t.setUTCFullYear(year, month - 1, day + n);
  return { year: t.getUTCFullYear(), month: t.getUTCMonth() + 1, day: t.getUTCDate() };
}

function run(ymd: Ymd, hour: number, minute: number, loc: Location): RawChart {
  const base = {
    date: { year: ymd.year, era: "CE" as const, month: ymd.month, day: ymd.day },
    time: { hour, minute },
  };

  // จังหวัดในไทย: ไลบรารีหาอาทิตย์ขึ้น (สำหรับลัคนา) และ UTC ตามวันเวลาให้เอง
  if (loc.province) {
    try {
      return calculateThaiHoroscope({ ...base, location: { province: loc.province } }) as unknown as RawChart;
    } catch {
      // ชื่อจังหวัดที่ไลบรารีไม่รู้จัก -> ใช้พิกัดแทนด้านล่าง
    }
  }

  // พิกัดกำหนดเอง: อาทิตย์ขึ้น ณ พิกัดนั้น + แปลงเวลาเข้ากรอบสมผุสดาว +06:42:04
  return calculateThaiHoroscope({
    ...base,
    ascendantReference: {
      method: "sunrise" as const,
      latitude: loc.lat,
      longitude: loc.lon,
      utcOffsetHours: 7,
      timePrecision: "minute" as const,
    },
    planetaryTimeReference: {
      civilUtcOffsetSeconds: CIVIL_UTC_SECONDS,
      referenceUtcOffsetSeconds: PLANETARY_FRAME_SECONDS,
    },
  }) as unknown as RawChart;
}

function splitPoint(p: RawPoint) {
  const zIdx = ((p.sign % 12) + 12) % 12;
  const degree = Math.floor(p.degrees);
  const minute = Math.floor(p.minutes + 1e-9);
  const second = Math.max(0, Math.min(59, Math.floor((p.minutes - minute) * 60 + 1e-9)));
  return { zodiac: THAI_ZODIACS[zIdx], degree, minute, second };
}

const fmt = (s: ReturnType<typeof splitPoint>) => `${s.zodiac} ${s.degree}° ${s.minute}′`;

// ผลต่างลิปดา (b - a) ปรับให้อยู่ในช่วง (-180°, 180°]
function diffArcMinutes(a: number, b: number) {
  let d = b - a;
  if (d > 10800) d -= 21600;
  if (d <= -10800) d += 21600;
  return d;
}

export async function computeChart(date: string, time: string, loc: Location): Promise<ChartResult> {
  const ymd = parseYmd(date);
  const [hh = 0, mm = 0] = time.split(":").map(Number);

  const now = run(ymd, hh, mm, loc);
  // เวลาเดียวกันของวันถัดไป ใช้ดูทิศการเคลื่อน (พักร = ถอยหลัง)
  const next = run(addDays(ymd, 1), hh, mm, loc);

  const planets: Record<string, PlanetInfo> = {};
  for (const pl of THAI_PLANETS) {
    const p = now.points[pl.key];
    const q = next.points[pl.key];
    const s = splitPoint(p);
    const speed = diffArcMinutes(p.longitudeArcMinutes, q.longitudeArcMinutes) / 60; // องศา/วัน
    const isNode = pl.key === "rahu" || pl.key === "ketu";
    planets[pl.code] = {
      code: pl.code,
      name: pl.name,
      longitude: p.longitudeDegrees,
      ...s,
      formatted: fmt(s),
      speed_per_day: Number(speed.toFixed(4)),
      // ปฏิทินโหราศาสตร์ไทยไม่ทำเครื่องหมายพักรให้ราหู/เกตุ
      status: !isNode && speed < 0 ? "พักร (Retrograde)" : "ปกติ",
    };
  }

  // เนปจูน/พลูโต (นิรายนะ) ไม่อยู่ในสุริยยาตร์
  const modern = await computeModernPlanets(date, time);
  for (const m of MODERN_PLANETS) {
    const { longitude, speed } = modern[m.code];
    const zIdx = Math.floor(longitude / 30);
    const inSign = longitude - zIdx * 30;
    const degree = Math.floor(inSign);
    const minF = (inSign - degree) * 60;
    const minute = Math.floor(minF);
    const second = Math.floor((minF - minute) * 60);
    planets[m.code] = {
      code: m.code,
      name: m.name,
      longitude,
      zodiac: THAI_ZODIACS[zIdx],
      degree,
      minute,
      second,
      formatted: `${THAI_ZODIACS[zIdx]} ${degree}° ${minute}′`,
      speed_per_day: Number(speed.toFixed(4)),
      status: speed < 0 ? "พักร (Retrograde)" : "ปกติ",
    };
  }

  const asc = now.points.ascendant;
  const l = splitPoint(asc);

  return {
    datetime_th: `${date} ${time}`,
    julian_day: now.calendar?.julianDayNumber ?? null,
    horakhun: now.calendar?.horakhun ?? null,
    system: "สุริยยาตร์ (ปฏิทินโหราศาสตร์ไทย) + เนปจูน/พลูโตนิรายนะ",
    location: loc,
    lagna: { longitude: asc.longitudeDegrees, ...l, formatted: fmt(l) },
    planets,
  };
}
