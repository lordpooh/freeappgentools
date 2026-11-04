// ตัวแปลผลดวงชะตาไทยแบบอิงกฎ (rule-based): ดวงกำเนิด + ดาวจรปัจจุบัน
// ข้อความทั้งหมดอยู่ในตารางข้อมูลด้านบนของไฟล์ แก้ให้ตรงกับสำนัก/ตำราที่ใช้ได้โดยไม่ต้องแตะตรรกะ
import { THAI_ZODIACS, isRetrograde, type ChartResult, type PlanetInfo } from "./thai-astro";

// ---------------------------------------------------------------------------
// ตารางข้อมูล (แก้ข้อความได้ตามต้องการ)
// ---------------------------------------------------------------------------

/** ๑๒ ภพ นับจากราศีลัคนา (ตนุ กดุมภะ สหัชชะ พันธุ ปุตตะ อริ ปัตนิ มรณะ ศุภะ กัมมะ ลาภะ วินาศ) */
export const HOUSES = [
  { name: "ตนุ", theme: "ตัวตน บุคลิก สุขภาพ" },
  { name: "กดุมภะ", theme: "การเงิน ทรัพย์สิน การพูดจา" },
  { name: "สหัชชะ", theme: "พี่น้อง การสื่อสาร การเดินทางใกล้" },
  { name: "พันธุ", theme: "บ้าน ครอบครัว ที่ดิน ยานพาหนะ" },
  { name: "ปุตตะ", theme: "บุตร ความรัก การเรียน สติปัญญา" },
  { name: "อริ", theme: "ศัตรู ปัญหาจุกจิก โรคภัย หนี้สิน งานประจำ" },
  { name: "ปัตนิ", theme: "คู่ครอง หุ้นส่วน การเจรจา" },
  { name: "มรณะ", theme: "วิกฤต การเปลี่ยนแปลงใหญ่ มรดก เรื่องลับ" },
  { name: "ศุภะ", theme: "โชคลาภ ครูอาจารย์ การเดินทางไกล ศาสนา" },
  { name: "กัมมะ", theme: "การงาน หน้าที่ ชื่อเสียง" },
  { name: "ลาภะ", theme: "รายได้ ลาภผล มิตรสหาย" },
  { name: "วินาศ", theme: "การสูญเสีย ค่าใช้จ่าย การพลัดพราก" },
] as const;

/** ลักษณะผู้เกิดลัคนาแต่ละราศี (ภาพกว้าง) */
export const LAGNA_TRAITS = [
  "กล้าหาญ ตรงไปตรงมา ชอบเริ่มต้นสิ่งใหม่ ใจร้อนได้ง่าย",
  "อดทน รักความมั่นคง ชอบสิ่งสวยงามและความสบาย ค่อนข้างยึดมั่น",
  "ช่างพูด ช่างคิด ปรับตัวไว สนใจหลายเรื่อง",
  "อ่อนไหว รักครอบครัว ผูกพันกับบ้านและคนใกล้ชิด",
  "มั่นใจ มีบารมี ชอบเป็นผู้นำ รักศักดิ์ศรี",
  "ละเอียด รอบคอบ ช่างวิเคราะห์ ชอบความเป็นระเบียบ",
  "รักความสมดุลและความยุติธรรม ประนีประนอม ชอบสังคม",
  "เก็บความรู้สึก เด็ดขาด ใจสู้ มีพลังลึกและสัญชาตญาณแรง",
  "รักอิสระ มองโลกกว้าง ชอบการเรียนรู้และเดินทาง",
  "จริงจัง รับผิดชอบ มีวินัย มุ่งความสำเร็จระยะยาว",
  "คิดนอกกรอบ รักเพื่อนฝูง ให้ความสำคัญกับอิสระทางความคิด",
  "อ่อนโยน เห็นอกเห็นใจ จินตนาการสูง รับอารมณ์คนรอบข้างง่าย",
];

type PInfo = {
  name: string;
  nature: "ศุภ" | "ปาป" | "กลาง"; // ศุภเคราะห์ / ปาปเคราะห์ / กลาง
  signifies: string; // ดาวนี้เป็นตัวแทนเรื่องอะไรในดวงกำเนิด
  transit: string; // เมื่อเป็นดาวจร ให้ผลแนวไหน
  own: number[]; // ราศีเกษตร (เมษ = 0)
  exalt?: number; // ราศีอุจจ์
  fall?: number; // ราศีนิจ
};

export const PLANET_INFO: Record<string, PInfo> = {
  "1": { name: "อาทิตย์", nature: "ปาป", signifies: "บิดา ผู้ใหญ่ อำนาจ ความมั่นใจ", transit: "เรื่องอำนาจ ผู้ใหญ่ และความมั่นใจเด่นขึ้น", own: [4], exalt: 0, fall: 6 },
  "2": { name: "จันทร์", nature: "ศุภ", signifies: "จิตใจ มารดา ครอบครัว", transit: "อารมณ์และเรื่องใกล้ตัวเปลี่ยนเร็ว", own: [3], exalt: 1, fall: 7 },
  "3": { name: "อังคาร", nature: "ปาป", signifies: "พลังงาน ความกล้า พี่น้อง", transit: "พลังงานสูง ใจร้อน มีการแข่งขันหรือถกเถียง ควรระวังอุบัติเหตุและอารมณ์", own: [0, 7], exalt: 9, fall: 3 },
  "4": { name: "พุธ", nature: "กลาง", signifies: "สติปัญญา การสื่อสาร การค้า", transit: "การสื่อสาร เจรจา เอกสาร และการเรียนรู้คึกคัก", own: [2, 5], exalt: 5, fall: 11 },
  "5": { name: "พฤหัสบดี", nature: "ศุภ", signifies: "ครูอาจารย์ โอกาส ที่ปรึกษา ความเจริญ", transit: "โอกาสและแรงสนับสนุนเปิดทาง ขยายผลได้ดี", own: [8, 11], exalt: 3, fall: 9 },
  "6": { name: "ศุกร์", nature: "ศุภ", signifies: "ความรัก เสน่ห์ ศิลปะ การเงิน", transit: "ความสัมพันธ์ ความสุข และเรื่องเงินคล่องตัวขึ้น", own: [1, 6], exalt: 11, fall: 5 },
  "7": { name: "เสาร์", nature: "ปาป", signifies: "ภาระ วินัย ผู้สูงอายุ งานหนัก", transit: "ถูกทดสอบด้วยภาระและความล่าช้า ต้องอดทน แต่ผลที่ได้มั่นคง", own: [9, 10], exalt: 6, fall: 0 },
  "8": { name: "ราหู", nature: "ปาป", signifies: "ความทะเยอทะยาน สิ่งแปลกใหม่ ความผันผวน", transit: "ความผันผวนและเรื่องไม่คาดคิด ความอยากได้ใคร่ดีสูง ต้องมีสติ", own: [] },
  "9": { name: "เกตุ", nature: "ปาป", signifies: "การปล่อยวาง การสิ้นสุด เรื่องจิตวิญญาณ", transit: "การสิ้นสุด การปล่อยวาง หรือการเปลี่ยนมุมมองบางเรื่อง", own: [] },
};

/** ดาวที่นำมาแปลผล (มฤตยู เนปจูน พลูโต ไม่อยู่ในตำราดั้งเดิมที่ใช้ที่นี่ จึงแสดงในผังแต่ไม่แปลผล) */
const READ_CODES = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];
const SLOW_CODES = ["3", "5", "7", "8", "9"]; // ดาวจรช้า (นับความสัมพันธ์กับดวงกำเนิด)
const FAST_CODES = ["1", "4", "6"]; // ดาวจรเร็ว (ผลระยะสั้น)

// ทักษา: ลำดับดาวตามตำรา อาทิตย์ จันทร์ อังคาร พุธ เสาร์ พฤหัสบดี ราหู ศุกร์
const THAKSA_ORDER = ["1", "2", "3", "4", "7", "5", "8", "6"];
export const THAKSA = [
  { pos: "บริวาร", meaning: "ลูกน้อง ผู้ติดตาม คนรอบตัว", advice: "เหมาะกับงานที่ต้องพึ่งทีมหรือขอความช่วยเหลือจากคนใกล้ตัว" },
  { pos: "อายุ", meaning: "สุขภาพ อารมณ์ ความยืนยาว", advice: "ควรดูแลสุขภาพและสภาพจิตใจเป็นพิเศษ" },
  { pos: "เดช", meaning: "อำนาจ บารมี", advice: "เหมาะกับการตัดสินใจ เจรจา หรือแสดงความเป็นผู้นำ" },
  { pos: "ศรี", meaning: "ความอ่อนโยน ความรัก เสน่ห์", advice: "เหมาะกับเรื่องมงคล ความรัก การพบปะผู้คน" },
  { pos: "มูละ", meaning: "การเงิน ทรัพย์สิน", advice: "เหมาะกับเรื่องเงินทอง ทรัพย์สิน การลงทุนที่คิดมาดีแล้ว" },
  { pos: "อุตสาหะ", meaning: "ความอดทน ความเพียร", advice: "เหมาะกับงานที่ต้องใช้ความเพียรและทำต่อเนื่อง" },
  { pos: "มนตรี", meaning: "ผู้อุปถัมภ์ ผู้ใหญ่ที่ช่วยเหลือ", advice: "เหมาะกับการขอคำปรึกษาหรือความอุปถัมภ์จากผู้ใหญ่" },
  { pos: "กาลกิณี", meaning: "สิ่งที่ไม่เป็นมงคล", advice: "ควรเลี่ยงการเริ่มเรื่องสำคัญ ทำงานเบา ๆ และระมัดระวัง" },
] as const;

const WEEKDAYS = ["อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์"];
const WEEKDAY_CODE = ["1", "2", "3", "4", "5", "6", "7"];

/** ฤกษ์ 27 ดวง (ลำดับตามปฏิทินโหราศาสตร์ไทย: ๑ อัศวินี ... ๒๓ ธนิษฐา ... ๒๗ เรวดี) */
export const RUEK = [
  "อัศวินี", "ภรณี", "กฤติกา", "โรหิณี", "มฤคศิระ", "อารทรา", "ปุนัพสุ", "ปุษยะ", "อาศเลษา",
  "มาฆะ", "บุรพผลคุนี", "อุตรผลคุนี", "หัตถ", "จิตรา", "สวาติ", "วิสาขะ", "อนุราธะ",
  "เชษฐะ", "มูละ", "บุรพาษาฒ", "อุตราษาฒ", "ศรวณะ", "ธนิษฐา", "สตภิษัช", "ปุรพภัทรบท",
  "อุตรภัทรบท", "เรวดี",
];

/** นับฤกษ์ของวันเทียบกับฤกษ์เกิด เป็นรอบละ ๙ (ตารา) */
const TARA = [
  { name: "ชนมะ", tone: "กลาง", text: "วันที่ใกล้เคียงกับตัวตนของคุณ ใช้ทำเรื่องส่วนตัวหรือทบทวนตนเองได้" },
  { name: "สัมปัต", tone: "ดี", text: "เหมาะกับเรื่องทรัพย์สินและผลประโยชน์" },
  { name: "วิปัต", tone: "ไม่ดี", text: "มีโอกาสเจออุปสรรคหรือความผิดพลาด ควรรอบคอบ" },
  { name: "เกษมะ", tone: "ดี", text: "ปลอดภัย ราบรื่น เหมาะกับการเริ่มเรื่องที่ต้องการความมั่นคง" },
  { name: "ประตยะ", tone: "ไม่ดี", text: "มีแนวโน้มติดขัดหรือถูกขัดขวาง ไม่ควรฝืนเร่งงานสำคัญ" },
  { name: "สาธกะ", tone: "ดี", text: "เหมาะกับการทำให้สำเร็จ ลงมือทำสิ่งที่ตั้งใจ" },
  { name: "ไนธนะ", tone: "ไม่ดี", text: "พลังงานตกหรือเสื่อมถอย ควรเลี่ยงการตัดสินใจใหญ่" },
  { name: "มิตร", tone: "ดี", text: "ได้รับความช่วยเหลือจากมิตรสหายและคนรอบข้าง" },
  { name: "ปรมมิตร", tone: "ดีมาก", text: "ได้รับการสนับสนุนดีมาก เหมาะกับเรื่องสำคัญที่ต้องอาศัยผู้อื่น" },
];

// ---------------------------------------------------------------------------
// ตัวช่วยคำนวณ
// ---------------------------------------------------------------------------
const signOf = (p: PlanetInfo) => THAI_ZODIACS.indexOf(p.zodiac);
const house = (planetSign: number, lagnaSign: number) => ((planetSign - lagnaSign + 12) % 12) + 1;

function dignity(code: string, sign: number): "อุจจ์" | "เกษตร" | "นิจ" | null {
  const info = PLANET_INFO[code];
  if (!info) return null;
  if (info.exalt === sign) return "อุจจ์";
  if (info.fall === sign) return "นิจ";
  if (info.own.includes(sign)) return "เกษตร";
  return null;
}

const DIGNITY_TEXT = {
  อุจจ์: "อยู่ราศีอุจจ์ ให้ผลเต็มกำลัง",
  เกษตร: "อยู่ราศีเกษตร ให้ผลมั่นคง",
  นิจ: "อยู่ราศีนิจ กำลังอ่อน ผลไม่เต็มที่",
};

function ruekIndex(longitude: number) {
  return Math.floor(Math.floor(longitude * 60 + 1e-6) / 800) % 27; // ฤกษ์ละ 13°20′ = 800 ลิปดา
}

function relation(transitSign: number, natalSign: number): "ทับ" | "เล็ง" | "ตรีโกณ" | "จตุรัส" | null {
  const d = (transitSign - natalSign + 12) % 12;
  if (d === 0) return "ทับ";
  if (d === 6) return "เล็ง";
  if (d === 4 || d === 8) return "ตรีโกณ";
  if (d === 3 || d === 9) return "จตุรัส";
  return null;
}

function weekdayCode(dateStr: string, timeStr: string, nightRule: boolean) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const t = new Date(0);
  t.setUTCFullYear(y, m - 1, d);
  const wd = t.getUTCDay();
  const hour = Number(timeStr.split(":")[0]);
  // พุธกลางคืน (ตั้งแต่ 18:00) = ราหู
  if (nightRule && wd === 3 && hour >= 18) return { wd, code: "8" };
  return { wd, code: WEEKDAY_CODE[wd] };
}

// ---------------------------------------------------------------------------
// ผลลัพธ์
// ---------------------------------------------------------------------------
export type Reading = {
  hasTime: boolean;
  birth: { weekday: string; planetCode: string; planetName: string; night: boolean; ruekNo: number; ruekName: string; lagnaSign?: string; lagnaTrait?: string };
  thaksa: { pos: string; planetName: string; meaning: string }[];
  natal: { code: string; name: string; sign: string; houseText?: string; dignity?: string; text: string }[];
  today: { weekday: string; thaksaPos: string; thaksaAdvice: string; ruekNo: number; ruekName: string; taraName: string; taraTone: string; taraText: string };
  summary: string[];
  transits: { code: string; name: string; sign: string; retro: boolean; text: string; relations: string[] }[];
  shortTerm: { code: string; name: string; sign: string; retro: boolean; text: string }[];
};

/**
 * natal = ดวงกำเนิด, now = ดวง ณ ปัจจุบัน (ดาวจร)
 * hasTime = false เมื่อไม่ทราบเวลาเกิด: ไม่ใช้ลัคนา/ภพ และไม่ใช้กฎพุธกลางคืน
 */
export function buildReading(natal: ChartResult, now: ChartResult, hasTime: boolean): Reading {
  const [bDate, bTimeFull] = natal.datetime_th.split(" ");
  const [nDate, nTimeFull] = now.datetime_th.split(" ");
  const lagnaSign = hasTime ? THAI_ZODIACS.indexOf(natal.lagna.zodiac) : -1;

  // --- วันเกิดและทักษา ---
  const bday = weekdayCode(bDate, bTimeFull, hasTime);
  const start = THAKSA_ORDER.indexOf(bday.code);
  const thaksa = THAKSA.map((t, k) => ({
    pos: t.pos,
    planetName: PLANET_INFO[THAKSA_ORDER[(start + k) % 8]].name,
    meaning: t.meaning,
  }));

  const tday = weekdayCode(nDate, nTimeFull, true);
  const todayPos = (THAKSA_ORDER.indexOf(tday.code) - start + 8) % 8;

  // --- ฤกษ์ ---
  const bRuek = ruekIndex(natal.planets["2"].longitude);
  const nRuek = ruekIndex(now.planets["2"].longitude);
  const tara = TARA[(((nRuek - bRuek + 27) % 27) % 9)];

  // --- ดวงกำเนิดรายดาว ---
  const natalRows = READ_CODES.map((code) => {
    const p = natal.planets[code];
    const s = signOf(p);
    const dg = dignity(code, s);
    const info = PLANET_INFO[code];
    const h = hasTime ? HOUSES[house(s, lagnaSign) - 1] : null;
    const hn = hasTime ? house(s, lagnaSign) : 0;
    const text =
      `${info.name} (${info.signifies})` +
      (h ? ` อยู่ภพ${h.name}: เรื่อง${h.theme}เป็นจุดที่ดาวนี้เข้าไปเกี่ยวข้อง` : ` อยู่ราศี${p.zodiac}`) +
      (dg ? ` · ${DIGNITY_TEXT[dg]}` : "") +
      (isRetrograde(p) ? " · พักร: ผลมักช้าหรือวนกลับมาทบทวน" : "");
    return {
      code,
      name: info.name,
      sign: p.zodiac,
      houseText: h ? `ภพ ${hn} ${h.name}` : undefined,
      dignity: dg ?? undefined,
      text,
    };
  });

  // --- ดาวจร ---
  function transitLine(code: string) {
    const p = now.planets[code];
    const s = signOf(p);
    const info = PLANET_INFO[code];
    const dg = dignity(code, s);
    const retro = isRetrograde(p);
    const h = hasTime ? HOUSES[house(s, lagnaSign) - 1] : null;
    const text =
      `${info.name}จรอยู่ราศี${p.zodiac}` +
      (h ? ` ซึ่งตรงกับภพ${h.name}ของคุณ: ${info.transit} ผลเน้นเรื่อง${h.theme}` : `: ${info.transit}`) +
      (dg ? ` (${DIGNITY_TEXT[dg]})` : "") +
      (retro ? " · พักร: ผลช้าลง เหมาะทบทวนของเดิมมากกว่าเริ่มใหม่" : "");
    return { code, name: info.name, sign: p.zodiac, retro, text, p, s, info };
  }

  const natalPoints: { name: string; signifies: string; sign: number }[] = [];
  if (hasTime) natalPoints.push({ name: "ลัคนา", signifies: "ตัวตน ภาพลักษณ์ สุขภาพ", sign: lagnaSign });
  natalPoints.push(
    { name: "อาทิตย์", signifies: PLANET_INFO["1"].signifies, sign: signOf(natal.planets["1"]) },
    { name: "จันทร์", signifies: PLANET_INFO["2"].signifies, sign: signOf(natal.planets["2"]) }
  );

  const transits = SLOW_CODES.map((code) => {
    const t = transitLine(code);
    const benefic = t.info.nature === "ศุภ";
    const relations: string[] = [];
    for (const np of natalPoints) {
      const rel = relation(t.s, np.sign);
      if (!rel) continue;
      let tone: string;
      if (benefic) tone = rel === "จตุรัส" ? "ผลปนกัน มีโอกาสแต่ต้องลงแรง" : "เกื้อหนุน";
      else tone = rel === "ตรีโกณ" ? "ผลปนกัน ต้องอดทนแล้วจะคลี่คลาย" : "กดดัน ควรระมัดระวัง";
      relations.push(`${t.info.name}จร${rel}${np.name}กำเนิด (${np.signifies}): ${tone}`);
    }
    return { code, name: t.name, sign: t.sign, retro: t.retro, text: t.text, relations };
  });

  const shortTerm = FAST_CODES.map((code) => {
    const t = transitLine(code);
    return { code, name: t.name, sign: t.sign, retro: t.retro, text: t.text };
  });

  // --- สรุปภาพรวมช่วงนี้ ---
  const summary: string[] = [];
  if (hasTime) {
    summary.push(`ลัคนา${natal.lagna.zodiac}: ${LAGNA_TRAITS[lagnaSign]}`);
    const j = now.planets["5"];
    const sa = now.planets["7"];
    const hj = HOUSES[house(signOf(j), lagnaSign) - 1];
    const hs = HOUSES[house(signOf(sa), lagnaSign) - 1];
    summary.push(`ช่วงนี้แรงหนุนอยู่ที่เรื่อง${hj.theme} (พฤหัสบดีจรภพ${hj.name})`);
    summary.push(`เรื่องที่ต้องใช้ความอดทนและความรับผิดชอบคือ${hs.theme} (เสาร์จรภพ${hs.name})`);
  } else {
    summary.push("ไม่ทราบเวลาเกิด จึงไม่ใช้ลัคนาและภพ คำทำนายด้านล่างเป็นภาพกว้างจากราศีของดาวเท่านั้น");
  }
  summary.push(`วันนี้เป็นวัน${THAKSA[todayPos].pos}ของคุณ (${THAKSA[todayPos].meaning}) และจันทร์จรฤกษ์${RUEK[nRuek]} นับเป็นตารา${tara.name} (${tara.tone})`);

  return {
    hasTime,
    birth: {
      weekday: WEEKDAYS[bday.wd],
      planetCode: bday.code,
      planetName: PLANET_INFO[bday.code].name,
      night: bday.code === "8",
      ruekNo: bRuek + 1,
      ruekName: RUEK[bRuek],
      lagnaSign: hasTime ? natal.lagna.zodiac : undefined,
      lagnaTrait: hasTime ? LAGNA_TRAITS[lagnaSign] : undefined,
    },
    thaksa,
    natal: natalRows,
    today: {
      weekday: WEEKDAYS[tday.wd] + (tday.code === "8" ? " (กลางคืน)" : ""),
      thaksaPos: THAKSA[todayPos].pos,
      thaksaAdvice: THAKSA[todayPos].advice,
      ruekNo: nRuek + 1,
      ruekName: RUEK[nRuek],
      taraName: tara.name,
      taraTone: tara.tone,
      taraText: tara.text,
    },
    summary,
    transits,
    shortTerm,
  };
}