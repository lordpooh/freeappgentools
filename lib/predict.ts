// ตัวแปลผลดวงชะตาไทย ระบบพลูหลวง (อ.ประยูร อุลุชาฎะ) : ดวงกำเนิด + ดาวจรปัจจุบัน
// อ้างอิงหลัก: "กฎเกณฑ์การพิจารณาดวงชะตา ระบบพลูหลวง" (สำนักโหรพลูโต) และเอกสารเนปจูน/พลูโต/มฤตยูที่ผู้ใช้ให้มา
// ข้อมูลทุกอย่างอยู่ในตารางด้านบนของไฟล์ แก้ข้อความหรือกฎให้ตรงกับตำราได้โดยไม่ต้องแตะตรรกะด้านล่าง
// หมายเหตุ: แบคคัส (บ) เป็นดาวในระบบนี้ แต่แอปยังไม่คำนวณตำแหน่ง จึงไม่นำมาแปลผล (ใช้เพียงเป็นดาวเกษตรของราศีพฤษภ)
import { THAI_ZODIACS, isRetrograde, type ChartResult } from "./thai-astro";

export type Tone = "ดี" | "ร้าย" | "ผสม" | "กลาง";
export type Item = { head?: string; text: string; tone?: Tone; sub?: string[] };
export type Section = { id: string; title: string; note?: string; items: Item[] };
export type Reading = { hasTime: boolean; summary: string[]; sections: Section[] };
export type Gender = "m" | "f" | undefined;

// ---------------------------------------------------------------------------
// ตารางข้อมูล (แก้ได้)
// ---------------------------------------------------------------------------
const CODES = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "N", "P"]; // ดาวที่มีตำแหน่งในดวง
const LOCAL_ELEMENT = ["ไฟ", "ดิน", "ลม", "น้ำ"]; // ราศี index % 4 (เมษ=ไฟ พฤษภ=ดิน เมถุน=ลม กรกฎ=น้ำ ...)

type PInfo = { name: string; nature: "ศุภ" | "บาป"; signifies: string };
export const PLANET_INFO: Record<string, PInfo> = {
  "1": { name: "อาทิตย์", nature: "ศุภ", signifies: "เกียรติยศ การถือตน ผู้เป็นหัวหน้า บิดา สามี งานราชการ" },
  "2": { name: "จันทร์", nature: "ศุภ", signifies: "รูปร่างจริต อารมณ์อ่อนไหว ชอบเดินทาง ภรรยา มารดา" },
  "3": { name: "อังคาร", nature: "บาป", signifies: "ความกล้า ความขยัน การวิวาท โทสะ อุบัติเหตุ ทหาร บาดเจ็บ" },
  "4": { name: "พุธ", nature: "ศุภ", signifies: "การเจรจา หนังสือ การประพันธ์ ปรับตัวง่าย อารมณ์รวนเร" },
  "5": { name: "พฤหัสบดี", nature: "ศุภ", signifies: "ผู้ใหญ่ ครูอาจารย์ ปัญญา วัด โรงเรียน ความอุดมสมบูรณ์" },
  "6": { name: "ศุกร์", nature: "ศุภ", signifies: "ความรัก ศิลปะ โภคสมบัติ ความฟุ่มเฟือย คู่ครอง การแต่งงาน" },
  "7": { name: "เสาร์", nature: "บาป", signifies: "ความทุกข์ยาก อุปสรรค การพลัดพราก งานหนัก เจ็บไข้" },
  "8": { name: "ราหู", nature: "บาป", signifies: "ความลุ่มหลงมัวเมา ต่างชาติต่างภาษา การใส่ร้าย สิ่งเสพติด อบายมุข" },
  "9": { name: "เกตุ", nature: "บาป", signifies: "อายุ ของเก่า สิ่งศักดิ์สิทธิ์ วิญญาณ คนแก่ เรื่องอาถรรพณ์ อาเพท" },
  "0": { name: "มฤตยู", nature: "บาป", signifies: "การคิดค้นสิ่งใหม่ การเดินทาง การเสี่ยงโชค ต่างแดน ความสนใจทางจิต" },
  N: { name: "เนปจูน", nature: "บาป", signifies: "การสังคม การชุมนุม ทะเลและน้ำ มหรสพ ไสยศาสตร์ เรื่องเร้นลับ" },
  P: { name: "พลูโต", nature: "บาป", signifies: "ความเงียบขรึม การสะสม โบราณคดี แพทย์ โหราศาสตร์ วิญญาณ" },
  B: { name: "แบคคัส", nature: "ศุภ", signifies: "การเงิน หลักทรัพย์ โชคลาภ มรดก" },
};
const nameOf = (c: string) => PLANET_INFO[c].name;
const natureOf = (c: string) => PLANET_INFO[c].nature;

// ดาวเกษตร (เรือนเดี่ยว) / ประ / มหาอุจจ์ / นิจ ประจำราศี (เมษ = 0 ... มีน = 11)  ระบบพลูหลวง
const KASET: string[][] = [["P"], ["B"], ["8", "9"], ["2"], ["1"], ["4"], ["6"], ["3"], ["5"], ["7"], ["0"], ["N"]];
const PRA: string[][] = [["6"], ["3"], ["5"], ["7"], ["0"], ["N"], ["P"], ["B"], ["8", "9"], ["2"], ["1"], ["4"]];
const UJJ: string[][] = [["1"], ["2"], ["0"], ["5"], ["8", "9"], ["4"], ["7"], ["N"], ["P"], ["3"], ["B"], ["6"]];
const NIJ: string[][] = [["7"], ["N"], ["P"], ["3"], ["B"], ["6"], ["1"], ["2"], ["0"], ["5"], ["8", "9"], ["4"]];

const FRIEND_PAIRS = [["1", "5"], ["2", "4"], ["6", "3"], ["7", "8"]]; // คู่มิตร
const ENEMY_PAIRS = [["1", "3"], ["2", "5"], ["4", "8"], ["6", "7"]]; // คู่ศัตรู

/** ภพ ๑๒ (ระบบพลูหลวง) ; dusthana = ภพทุสถานะ (อริ มรณะ วินาศนะ) */
export const HOUSES = [
  { name: "ลัคนา", theme: "ตัวตน รูปร่าง นิสัยใจคอ และเป็นภพที่ใช้พยากรณ์ทุกเรื่องที่เข้ามาสู่เจ้าชะตา", dusthana: false },
  { name: "กฎุมพะ", theme: "เศรษฐกิจ การเงิน รายได้ ฐานะ การพูด การเจรจา การทำสัญญา", dusthana: false },
  { name: "สหัชชะ", theme: "เพื่อนฝูง ญาติมิตร วงสังคม การไปมาหาสู่ การเดินทางระยะใกล้", dusthana: false },
  { name: "พันธุ", theme: "บ้านเรือน ที่อยู่อาศัย การโยกย้าย ญาติสายโลหิต ยานพาหนะ", dusthana: false },
  { name: "ปุตตะ", theme: "บุตร บริวาร สัตว์เลี้ยง ผู้อยู่ใต้บังคับบัญชา ผู้อ่อนอาวุโส", dusthana: false },
  { name: "อริ", theme: "ปัญหาอุปสรรค ศัตรู โรคภัยไข้เจ็บ ความยากลำบากในการดำเนินชีวิต", dusthana: true },
  { name: "ปัตนิ", theme: "ความรัก คู่ครอง การแต่งงาน ศัตรูที่เปิดเผย", dusthana: false },
  { name: "มรณะ", theme: "การพลัดพราก สูญเสีย สิ้นหวัง พังทลาย ความล้มเหลว การเปลี่ยนสถานะ", dusthana: true },
  { name: "ศุภะ", theme: "วาสนาบารมี คุณงามความดี ความสำเร็จ ศาสนา การเดินทางไกล ต่างแดน การเลื่อนยศ", dusthana: false },
  { name: "กัมมะ", theme: "การกระทำหรือกรรม การศึกษา การงานอาชีพ การดำเนินชีวิตประจำวัน (สำคัญเทียบเท่าลัคนา)", dusthana: false },
  { name: "ลาภะ", theme: "ลาภผล ผู้สนับสนุนเกื้อกูล ผู้อุปถัมภ์ เพื่อนสนิท", dusthana: false },
  { name: "วินาศนะ", theme: "สิ่งเร้นลับ ไม่เปิดเผย สิ่งที่ห่างไกล สถานที่จำกัดเขตหรือหวงห้าม", dusthana: true },
] as const;

/** มารดา/บิดาในภพ ๔ และ ๙ ขึ้นกับเพศเจ้าชะตา */
function houseTheme(h: number, g: Gender) {
  const base = HOUSES[h - 1].theme;
  if (h === 4) return base + (g === "m" ? " มารดา" : g === "f" ? " บิดา" : " มารดา(ดวงชาย) บิดา(ดวงหญิง)");
  if (h === 9) return base + (g === "m" ? " บิดา" : g === "f" ? " มารดา" : " บิดา(ดวงชาย) มารดา(ดวงหญิง)");
  return base;
}

/** พลูโตในแต่ละภพ (สรุปจากเอกสารที่ผู้ใช้ให้มา) */
const PLUTO_IN: string[] = [
  "รูปร่างสูงใหญ่หรือสันทัด จิตใจเที่ยงธรรม ซื่อสัตย์ ยึดมั่นความคิดตนเอง ชอบศึกษาทั้งทางโลกและทางธรรม ชอบสะสม ชีวิตรักมักพลัดพราก ไม่สมหวังง่าย มีสัมผัสเร้นลับ ชอบแพทย์ โหราศาสตร์ ศาสตร์เร้นลับ",
  "นิสัยแบบพลูโตกุมลัคน์ หาเงินหรือสะสมเงินเก่งแต่ใช้จ่ายเก่ง มักถูกโกงหรือมีหนี้ผูกพัน ควรระวังธุรกรรมการเงิน พูดโผงผางตรงไปตรงมา ต้องระวังคำพูด",
  "มีพรรคพวก เพื่อนฝูง ญาติมิตรวงกว้าง ขาดเพื่อนไม่ค่อยได้ มักเดือดร้อนเพราะเพื่อนฝูง ทำคุณคนไม่ขึ้น ไม่ควรทำตัวเด่นในวงงานเพราะจะเจอคนอิจฉา",
  "พี่น้องหรือวงศาคณาญาติมาก แต่พึ่งพากันไม่ได้ มักอาภัพพ่อแม่หรือไม่ได้อยู่กับพ่อแม่ บ้านไม่สงบสุข ย้ายที่อยู่บ่อย การเดินทางมักพบอุบัติเหตุหรืออุปสรรค",
  "นิสัยคล้ายพลูโตกุมลัคน์แต่เจือจางกว่า ชอบเสี่ยงโชคหรือการพนันซึ่งมักเสียมากกว่าได้ พลัดพรากคนรัก อกหักบ่อย บุตร บริวาร สัตว์เลี้ยงมักนำความเดือดร้อนหรือพลัดพราก",
  "ปัญหาอุปสรรค ศัตรู โรคภัยเบียดเบียนอยู่เสมอ ทำสิ่งใดไม่สำเร็จง่าย ไม่ค่อยได้รับความร่วมมือ ให้ดูบาปเคราะห์ในภพมรณะด้วย ถ้ามีต้องระวังอุบัติเหตุและการถูกลอบทำร้าย (มุมปลายหอก)",
  "มักพลัดพรากจากคนรักหรือคู่ครอง ชีวิตรักระทมขมขื่น อาจเลิกร้าง คู่มักทำตามใจตน บางรายเปลี่ยนคู่หรือหาคู่ไม่ได้ คู่ที่เหมาะคือผู้มีนิสัยและความคิดเข้ากันกับตนมากที่สุด",
  "ไม่ดีเหมือนภพอริ กล้าได้กล้าเสีย ไม่คำนึงผลที่ตามมา ทำให้ตนเองและคนรอบข้างเดือดร้อนบ่อย หลายรายอายุไม่ยืนหรือสุขภาพไม่สมบูรณ์ ไม่ควรก่อศัตรูเพราะอาจถูกลอบทำร้าย",
  "นิสัยคล้ายพลูโตกุมลัคน์แต่เจือจางกว่า สุขภาพเอาแน่ไม่ได้ ภายนอกแข็งแรงแต่ภายในอาจผุกร่อน เมื่อป่วยมักหนัก ควรไม่ประมาทเรื่องสุขภาพ รักเกียรติศักดิ์ศรีและความดีงาม มีโอกาสก้าวหน้าและมีชื่อเสียง",
  "ลักษณะแบบพลูโตกุมลัคน์ ชีวิตข้องแวะกับวิชาการต่าง ๆ มักเป็นแพทย์ นักจิตศาสตร์ นักโหราศาสตร์ เอาจริงเอาจังกับงานจึงมักสำเร็จทุกด้าน แต่มักผิดหวังหรือทุกข์ใจเรื่องความรัก",
  "ได้ลาภผลจากเพื่อนฝูง ญาติมิตร วงสังคมอย่างต่อเนื่อง ไม่ขาดทรัพย์หรือผู้สนับสนุน มักได้รับความคุ้มครองจากสิ่งศักดิ์สิทธิ์ แต่ต้องระวังเพื่อนสนิทที่ไว้ใจ โดยเฉพาะเรื่องรักใคร่",
  "ชีวิตไม่ราบรื่น มักถูกกดถูกบีบจากสังคมทั้งงานและเรื่องส่วนตัว ต้องต่อสู้กับอุปสรรคที่มองไม่เห็นหรือเข้ามาอย่างไม่คาดคิด ไม่ควรทำตัวเด่นดัง",
];

/** มฤตยูในแต่ละภพ (สรุปจากเอกสารที่ผู้ใช้ให้มา) */
const URANUS_IN: string[] = [
  "บุคลิกพิเศษ ความคิดล้ำสมัย ลางสังหรณ์แม่น มีเสน่ห์ลึกลับ วิถีชีวิตไม่เหมือนใคร รักอิสระ มักมีเหตุให้เปลี่ยนบุคลิกครั้งใหญ่",
  "การเงินขึ้นลงเร็ว มีโอกาสได้ลาภลอยก้อนใหญ่หรือหาเงินจากนวัตกรรมเทคโนโลยี แต่ต้องวางแผนสำรองเพราะทรัพย์อาจพังทลาย",
  "มีเพื่อนเป็นนักคิดหรือนักวิทยาศาสตร์ ข่าวสารที่ได้รับมักสร้างความประหลาดใจ",
  "ครอบครัวมีแบบแผนแปลก หรือย้ายที่อยู่แบบปุบปับ บ้านมักล้ำสมัยหรือมีประวัติศาสตร์เก่าแก่",
  "ความรักแปลกแตกต่างหรือพบรักแบบสายฟ้าแลบ บุตรมักอัจฉริยะแต่เดาใจยาก",
  "ระวังโรคที่หาสาเหตุไม่พบ โดยเฉพาะระบบประสาทและหัวใจ ศัตรูมักเป็นผู้มีความรู้สูงและรับมือยาก",
  "มักได้คู่ต่างถิ่น ต่างชาติ หรือมีแนวคิดล้ำยุค ความสัมพันธ์ที่ต่างฝ่ายต่างเป็นอิสระจะมั่นคงกว่า",
  "ตำแหน่งที่มฤตยูทำงานแรงที่สุด เกี่ยวกับมรดกที่มาจากการสูญเสีย หรือการรอดพ้นวิกฤตแบบปาฏิหาริย์",
  "ส่งเสริมความสำเร็จในต่างแดนหรือจากการแสวงหาความรู้ลี้ลับ วิทยาศาสตร์ ปรัชญาชั้นสูง",
  "สำเร็จในอาชีพที่เป็นการปฏิรูปหรือสร้างสิ่งใหม่ให้สังคม เป็นผู้นำการเปลี่ยนแปลง",
  "โชคลาภแบบส้มหล่นจากการเสี่ยงที่คนอื่นมองข้าม หรือจากการค้นพบสิ่งยิ่งใหญ่",
  "อาจมีความลับหรือความหลังฝังใจ หากดาวอยู่ในตำแหน่งดีจะมีความสามารถทางจิตเข้มแข็ง",
];

// ดาวเสวยอายุ: เรียงตามระยะห่างจากดวงอาทิตย์ (ระบบพลูหลวง) ช่วงละ ๑๐ ปี
const AGE_ORDER = ["1", "4", "6", "2", "3", "5", "7", "0", "N", "P"];

// ทักษา (ตำราทั่วไป ใช้เป็นส่วนเสริม): ลำดับดาว อาทิตย์ จันทร์ อังคาร พุธ เสาร์ พฤหัสบดี ราหู ศุกร์
const THAKSA_ORDER = ["1", "2", "3", "4", "7", "5", "8", "6"];
const THAKSA = [
  { pos: "บริวาร", advice: "เหมาะกับงานที่ต้องพึ่งทีมหรือคนรอบตัว" },
  { pos: "อายุ", advice: "ควรดูแลสุขภาพและสภาพจิตใจเป็นพิเศษ" },
  { pos: "เดช", advice: "เหมาะกับการตัดสินใจ เจรจา แสดงความเป็นผู้นำ" },
  { pos: "ศรี", advice: "เหมาะกับเรื่องมงคล ความรัก การพบปะผู้คน" },
  { pos: "มูละ", advice: "เหมาะกับเรื่องเงินทองและทรัพย์สิน" },
  { pos: "อุตสาหะ", advice: "เหมาะกับงานที่ต้องใช้ความเพียร" },
  { pos: "มนตรี", advice: "เหมาะกับการขอคำปรึกษาหรือความอุปถัมภ์จากผู้ใหญ่" },
  { pos: "กาลกิณี", advice: "ควรเลี่ยงการเริ่มเรื่องสำคัญ" },
];
const WEEKDAYS = ["อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์"];
const WEEKDAY_CODE = ["1", "2", "3", "4", "5", "6", "7"];
const RUEK = [
  "อัศวินี", "ภรณี", "กฤติกา", "โรหิณี", "มฤคศิระ", "อารทรา", "ปุนัพสุ", "ปุษยะ", "อาศเลษา",
  "มาฆะ", "บุรพผลคุนี", "อุตรผลคุนี", "หัตถ", "จิตรา", "สวาติ", "วิสาขะ", "อนุราธะ",
  "เชษฐะ", "มูละ", "บุรพาษาฒ", "อุตราษาฒ", "ศรวณะ", "ธนิษฐา", "สตภิษัช", "ปุรพภัทรบท",
  "อุตรภัทรบท", "เรวดี",
];

// ---------------------------------------------------------------------------
// ตัวช่วย
// ---------------------------------------------------------------------------
const signIdx = (chart: ChartResult, c: string) => THAI_ZODIACS.indexOf(chart.planets[c].zodiac);
const houseOf = (sign: number, lagna: number) => ((sign - lagna + 12) % 12) + 1;
const signName = (s: number) => THAI_ZODIACS[s];

type Dignity = "เกษตร" | "อุจจ์" | "ประ" | "นิจ";
function dignity(c: string, s: number): Dignity | null {
  if (KASET[s].includes(c)) return "เกษตร";
  if (UJJ[s].includes(c)) return "อุจจ์";
  if (PRA[s].includes(c)) return "ประ";
  if (NIJ[s].includes(c)) return "นิจ";
  return null;
}
const DIGNITY_TEXT: Record<Dignity, string> = {
  เกษตร: "อยู่ราศีเกษตร (อุดมสมบูรณ์ ให้คุณกับดวง)",
  อุจจ์: "อยู่ราศีมหาอุจจ์ (ศักดิ์สูง ให้คุณ)",
  ประ: "เป็นดาวประ (แตกขาด ทำลาย ให้โทษ และทำให้ดาวที่กุมเสื่อมคุณภาพ)",
  นิจ: "เป็นดาวนิจ (ศักดิ์ต่ำ ไม่มีกำลัง ให้โทษ)",
};
const dignityTone = (d: Dignity | null): Tone => (d === "เกษตร" || d === "อุจจ์" ? "ดี" : d ? "ร้าย" : "กลาง");

function isPair(pairs: string[][], a: string, b: string) {
  return pairs.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
}

// ความสัมพันธ์เชิงมุมของดาว A (อยู่ราศี a) กับจุด B (ราศี b) : d = (a - b) mod 12
type Angle = "กุม" | "ศูนยพาหะ" | "ตามหลัง" | "โยคหน้า" | "โยคหลัง" | "จตุโกณ" | "ตรีโกณ" | "ปลายหอก" | "เล็ง";
function angleOf(a: number, b: number): Angle {
  const d = (a - b + 12) % 12;
  return ([
    "กุม", "ตามหลัง", "โยคหน้า", "จตุโกณ", "ตรีโกณ", "ปลายหอก",
    "เล็ง", "ปลายหอก", "ตรีโกณ", "จตุโกณ", "โยคหลัง", "ศูนยพาหะ",
  ] as Angle[])[d];
}
const ANGLE_LABEL: Record<Angle, string> = {
  กุม: "กุม/ทับ",
  ศูนยพาหะ: "นำหน้า (ศูนยพาหะ)",
  ตามหลัง: "ตามหลัง (ก้ามปู)",
  โยคหน้า: "โยคหน้า",
  โยคหลัง: "โยคหลัง",
  จตุโกณ: "จตุโกณ (กากบาท)",
  ตรีโกณ: "ตรีโกณ",
  ปลายหอก: "ปลายหอก",
  เล็ง: "เล็ง",
};

/** ตัดสินผลของมุม ตามกฎ ๗ มุมของพลูหลวง ; targetNature = null เมื่อเป็นลัคนา */
function judge(aNature: "ศุภ" | "บาป", targetNature: "ศุภ" | "บาป" | null, ang: Angle): { tone: Tone; text: string } {
  const good = aNature === "ศุภ";
  switch (ang) {
    case "กุม":
      if (good) return targetNature === "บาป" ? { tone: "ผสม", text: "ศุภเคราะห์กุมบาปเคราะห์ ผลปนกัน" } : { tone: "ดี", text: "ศุภเคราะห์กุม ให้คุณ" };
      return targetNature === "บาป" ? { tone: "ร้าย", text: "บาปเคราะห์กุมกันเอง ให้โทษแต่เบากว่า (ร้ายเจอร้าย)" } : { tone: "ร้าย", text: "บาปเคราะห์กุม ให้โทษ" };
    case "ตรีโกณ":
      return good ? { tone: "ดี", text: "ศุภเคราะห์ตรีโกณ ให้คุณมาก" } : { tone: "ผสม", text: "บาปเคราะห์ตรีโกณ ให้คุณแต่มักมีโทษตามมา" };
    case "โยคหน้า":
    case "โยคหลัง":
      return good ? { tone: "ดี", text: "ศุภเคราะห์ทำมุมโยค ให้คุณยิ่งขึ้น" } : { tone: "ผสม", text: "บาปเคราะห์ทำมุมโยค ให้คุณน้อยลง อาจมีโทษไม่รุนแรง" };
    case "เล็ง":
      return good ? { tone: "ผสม", text: "ศุภเคราะห์เล็ง ไม่แน่นอน มักให้โทษมากกว่าคุณ" } : { tone: "ร้าย", text: "บาปเคราะห์เล็ง ให้โทษ" };
    case "จตุโกณ":
      return good ? { tone: "ผสม", text: "ศุภเคราะห์มุมกากบาท ให้คุณไม่เต็มที่ อาจมีโทษตามมา" } : { tone: "ร้าย", text: targetNature === "ศุภ" ? "บาปเคราะห์มุมกากบาท เบียนศุภเคราะห์ ให้โทษ" : "บาปเคราะห์มุมกากบาท ให้โทษ" };
    case "ปลายหอก":
      return { tone: "ร้าย", text: "มุมปลายหอก ให้โทษอย่างเดียว" };
    case "ศูนยพาหะ":
      return good ? { tone: "ดี", text: "ดาวที่นำหน้าเป็นศุภเคราะห์ ส่งอิทธิพลดีมาให้" } : { tone: "ร้าย", text: "ดาวที่นำหน้าเป็นบาปเคราะห์ ส่งอิทธิพลร้ายมาให้" };
    case "ตามหลัง":
      return good ? { tone: "ผสม", text: "ดาวที่ตามหลังเป็นศุภเคราะห์ แต่มุมบีบปกติให้โทษ" } : { tone: "ร้าย", text: "ดาวที่ตามหลังเป็นตัวบ่อนทำลาย (วินาศนะ) เป็นบาปเคราะห์จึงให้โทษ" };
  }
}

function weekdayCode(date: string, time: string, nightRule: boolean) {
  const [y, m, d] = date.split("-").map(Number);
  const t = new Date(0);
  t.setUTCFullYear(y, m - 1, d);
  const wd = t.getUTCDay();
  const hour = Number(time.split(":")[0]);
  if (nightRule && wd === 3 && hour >= 18) return { wd, code: "8" }; // พุธกลางคืน = ราหู
  return { wd, code: WEEKDAY_CODE[wd] };
}

function completedAge(birth: string, now: string) {
  const [by, bm, bd] = birth.split("-").map(Number);
  const [ny, nm, nd] = now.split("-").map(Number);
  let a = ny - by;
  if (nm < bm || (nm === bm && nd < bd)) a -= 1;
  return Math.max(0, a);
}

const ruekIndex = (lon: number) => Math.floor(Math.floor(lon * 60 + 1e-6) / 800) % 27;

// ---------------------------------------------------------------------------
// ตัวแปลผลหลัก
// ---------------------------------------------------------------------------
export function buildReading(natal: ChartResult, now: ChartResult, hasTime: boolean, gender: Gender = undefined): Reading {
  const [bDate, bTime] = natal.datetime_th.split(" ");
  const [nDate, nTime] = now.datetime_th.split(" ");
  const lagna = hasTime ? THAI_ZODIACS.indexOf(natal.lagna.zodiac) : -1;
  const hOf = (s: number) => (hasTime ? houseOf(s, lagna) : 0);

  // ดาวเจ้าเรือนของภพ h (h = 1..12) : เกษตรของราศีที่เป็นภพนั้น
  const lordsOfHouse = (h: number) => KASET[(lagna + h - 1) % 12];
  const lagnaLords = hasTime ? lordsOfHouse(1) : [];

  const sections: Section[] = [];
  const summary: string[] = [];

  // ---------- ๑. ลัคนาและดาวเจ้าเรือนลัคน์ ----------
  if (hasTime) {
    const el = LOCAL_ELEMENT[lagna % 4];
    const sex = el === "ไฟ" || el === "ดิน" ? "ชาย" : "หญิง";
    const items: Item[] = [
      { head: `ลัคนาราศี${signName(lagna)}`, text: `ราศีธาตุ${el} เพศ${sex}` },
    ];
    for (const lc of lagnaLords) {
      if (lc === "B") {
        items.push({ head: "ดาวเจ้าเรือนลัคน์: แบคคัส", text: `${PLANET_INFO.B.signifies} (แอปยังไม่คำนวณตำแหน่งแบคคัส จึงยังไม่วิเคราะห์สถานะ)` });
        continue;
      }
      const s = signIdx(natal, lc);
      const dg = dignity(lc, s);
      const h = hOf(s);
      const sub = [`ดาวนี้เป็นตัวแทนของ ${PLANET_INFO[lc].signifies}`];
      if (HOUSES[h - 1].dusthana) sub.push(`ตกภพทุสถานะ (ภพ${HOUSES[h - 1].name}) ให้โทษแก่ดาวเจ้าเรือนลัคน์ ชีวิตมักเจอแรงกดดันในเรื่อง${HOUSES[h - 1].theme}`);
      else sub.push(`ไปสถิตภพ${HOUSES[h - 1].name}: ชีวิตมักผูกพันกับเรื่อง${houseTheme(h, gender)}`);
      if (dg) sub.push(DIGNITY_TEXT[dg]);
      items.push({
        head: `ดาวเจ้าเรือนลัคน์: ${nameOf(lc)} อยู่ราศี${signName(s)} (ภพ ${h} ${HOUSES[h - 1].name})`,
        text: `ลัคนาและดาวเจ้าเรือนลัคน์ใช้พิจารณาทุกเรื่องที่เข้ามาสู่เจ้าชะตา ทั้งนิสัยใจคอ ความเป็นความตาย การเจ็บไข้ วาสนา ความสมหวังผิดหวัง`,
        tone: dignityTone(dg),
        sub,
      });
    }
    sections.push({ id: "lagna", title: "ลัคนาและดาวเจ้าเรือนลัคน์", items });
  }

  // ---------- ๒. ดาวในดวงกำเนิด ----------
  const lordHouseMap = new Map<number, string[]>(); // ภพ -> ดาวเจ้าเรือน (ใช้หา "กุมเจ้าเรือนทุสถานะ")
  if (hasTime) for (const h of [6, 8, 12]) lordHouseMap.set(h, lordsOfHouse(h));

  const natalItems: Item[] = [];
  for (const c of CODES) {
    const s = signIdx(natal, c);
    const dg = dignity(c, s);
    const h = hOf(s);
    const retro = isRetrograde(natal.planets[c]);
    const sub: string[] = [];
    sub.push(`ความหมายของดาว: ${PLANET_INFO[c].signifies}`);
    if (hasTime) {
      if (c === "P") sub.push(`พลูโตในภพ${HOUSES[h - 1].name}: ${PLUTO_IN[h - 1]}`);
      else if (c === "0") sub.push(`มฤตยูในภพ${HOUSES[h - 1].name}: ${URANUS_IN[h - 1]}`);
      else sub.push(`อยู่ภพ${HOUSES[h - 1].name}: เรื่อง${houseTheme(h, gender)}เป็นจุดที่ดาวนี้เข้าไปเกี่ยวข้อง`);
      if (HOUSES[h - 1].dusthana) sub.push(`ตกภพทุสถานะ (${HOUSES[h - 1].name}) ให้โทษแก่ดาวนั้น`);
      for (const [dh, lords] of lordHouseMap) {
        for (const lc of lords) {
          if (lc !== c && lc !== "B" && signIdx(natal, lc) === s) sub.push(`กุมกับดาวเจ้าเรือน${HOUSES[dh - 1].name} (${nameOf(lc)}) ซึ่งเป็นภพทุสถานะ ให้โทษแก่ดาวนี้`);
        }
      }
    }
    if (c === "N") {
      sub.push("เนปจูนเป็นดาวเจ้าเรือนภพวินาศนะของลัคนาโลก (มีน) เกี่ยวกับสังคม ความเร้นลับ การปิดบัง และเป็นประธานฝ่ายบาปเคราะห์ในระบบพลูหลวง ผลเมื่อให้โทษมักรุนแรง");
      if (hasTime && (h === 1 || h === 12)) sub.push(`เนปจูนกุมหรือนำหน้าลัคนา: ผู้นั้นมักเก็บตัว ลับลมคมใน หรือเข้าสังคมแต่สวมหน้ากาก ไม่เปิดเผยจริงใจ`);
    }
    if (retro) sub.push("ดาวพักร: ผลมักช้าหรือวนกลับมาทบทวน");
    natalItems.push({
      head: `${nameOf(c)} · ราศี${signName(s)}${hasTime ? ` · ภพ ${h} ${HOUSES[h - 1].name}` : ""}${dg ? ` · ${dg}` : ""}`,
      text: dg ? DIGNITY_TEXT[dg] : "ไม่ได้อยู่ในตำแหน่งเกษตร/ประ/อุจจ์/นิจ",
      tone: dignityTone(dg),
      sub,
    });
  }
  sections.push({
    id: "natal",
    title: "ดาวในดวงกำเนิด",
    note: hasTime ? "แต่ละดาวดูตามภพที่อยู่และศักดิ์ (เกษตร ประ อุจจ์ นิจ) ผลจริงต้องดูมุมกับดาวอื่นประกอบ" : "ไม่ทราบเวลาเกิด จึงดูเฉพาะราศีและศักดิ์ของดาว ไม่ใช้ภพ",
    items: natalItems,
  });

  // ---------- ๓. มุมให้คุณ-ให้โทษในดวงกำเนิด ----------
  const angleItems: Item[] = [];
  if (hasTime) {
    const inHouse = (h: number) => CODES.filter((c) => c !== "B" && hOf(signIdx(natal, c)) === h);
    const evil = (h: number) => inHouse(h).filter((c) => natureOf(c) === "บาป");
    const good = (h: number) => inHouse(h).filter((c) => natureOf(c) === "ศุภ");
    const list = (cs: string[]) => cs.map(nameOf).join(" ");

    const one = inHouse(1);
    if (one.length)
      for (const c of one) {
        const j = judge(natureOf(c), null, "กุม");
        angleItems.push({ head: `${nameOf(c)}กุมลัคนา`, text: j.text, tone: j.tone });
      }
    if (evil(4).length && evil(10).length)
      angleItems.push({ head: "บาปเคราะห์มุมกากบาทกับลัคนา", text: `มีบาปเคราะห์ทั้งภพพันธุ (${list(evil(4))}) และภพกัมมะ (${list(evil(10))}) ทำมุมกากบาท ให้โทษหนักแก่ลัคนา ชีวิตมีโอกาสหักโค่นล้มหากไม่มีส่วนอื่นหนุน`, tone: "ร้าย" });
    if (evil(6).length && evil(8).length)
      angleItems.push({ head: "บาปเคราะห์ปลายหอกทั้งสองจุด", text: `มีบาปเคราะห์ทั้งภพอริ (${list(evil(6))}) และภพมรณะ (${list(evil(8))}) ให้โทษแก่ลัคนาและดาวเจ้าเรือนลัคน์ ควรระวังเรื่องอุบัติเหตุและการเจ็บไข้`, tone: "ร้าย" });
    if (evil(12).length && evil(2).length)
      angleItems.push({ head: "ลัคนาถูกบาปเคราะห์บีบหน้าหลัง", text: `บาปเคราะห์ทั้งภพวินาศนะ (${list(evil(12))}) และภพกฎุมพะ (${list(evil(2))}) บีบลัคนา อาจตกอับหรือเข้าตาจนได้ ต้องใช้ความอดทนฟันฝ่า`, tone: "ร้าย" });
    else if (good(12).length && good(2).length)
      angleItems.push({ head: "ลัคนามีศุภเคราะห์ล้อมหน้าหลัง", text: `ศุภเคราะห์ทั้งภพวินาศนะและภพกฎุมพะ ถือว่าอยู่ในแวดล้อมที่ดี แต่ปกติมุมบีบให้โทษ กว่าจะได้ดีอาจต้องฟันฝ่า`, tone: "ผสม" });
    if (good(5).length && good(9).length)
      angleItems.push({ head: "ศุภเคราะห์ตรีโกณกับลัคนา", text: `มีศุภเคราะห์ทั้งภพปุตตะ (${list(good(5))}) และภพศุภะ (${list(good(9))}) ให้คุณมาก`, tone: "ดี" });
    else {
      for (const h of [5, 9]) for (const c of inHouse(h)) {
        const j = judge(natureOf(c), null, "ตรีโกณ");
        angleItems.push({ head: `${nameOf(c)}ตรีโกณลัคนา (ภพ${HOUSES[h - 1].name})`, text: j.text, tone: j.tone });
      }
    }
    for (const c of inHouse(7)) {
      const j = judge(natureOf(c), null, "เล็ง");
      angleItems.push({ head: `${nameOf(c)}เล็งลัคนา (ภพปัตนิ)`, text: j.text, tone: j.tone });
    }
  }
  // ดาวกุมกันเองในดวง
  const bySign = new Map<number, string[]>();
  for (const c of CODES) {
    const s = signIdx(natal, c);
    bySign.set(s, [...(bySign.get(s) ?? []), c]);
  }
  for (const [s, cs] of bySign) {
    if (cs.length < 2) continue;
    const evilN = cs.filter((c) => natureOf(c) === "บาป").length;
    const tone: Tone = evilN === 0 ? "ดี" : evilN === cs.length ? "ร้าย" : "ผสม";
    const text =
      evilN === 0 ? "ศุภเคราะห์กุมกัน ให้คุณ" : evilN === cs.length ? "บาปเคราะห์กุมกันเอง ให้โทษแต่เบากว่า (ร้ายเจอร้าย)" : "ศุภเคราะห์กุมบาปเคราะห์ ผลปนกัน บาปเคราะห์มักเบียนศุภเคราะห์";
    angleItems.push({ head: `ดาวกุมกันในราศี${signName(s)}: ${cs.map(nameOf).join(" ")}`, text, tone });
  }
  if (angleItems.length)
    sections.push({ id: "angles", title: "มุมให้คุณ-ให้โทษในดวงกำเนิด", note: "ตามกฎมุมของพลูหลวง (กุม ตรีโกณ โยค เล็ง จตุโกณ ปลายหอก ก้ามปู)", items: angleItems });

  // ---------- ๔. ดาวเสวยอายุ-เสวยแทรก ----------
  const age = completedAge(bDate, nDate);
  const n = Math.max(1, age);
  if (n <= 100) {
    const p = Math.floor((n - 1) / 10);
    const k = ((n - 1) % 10) + 1;
    const ruler = AGE_ORDER[p];
    const sub = AGE_ORDER[(p + k - 1) % 10];
    const desc = (c: string) => {
      const s = signIdx(natal, c);
      const dg = dignity(c, s);
      return `${nameOf(c)} (${natureOf(c)}เคราะห์) อยู่ราศี${signName(s)}${hasTime ? ` ภพ${HOUSES[hOf(s) - 1].name}` : ""}${dg ? ` · ${dg}` : ""}`;
    };
    let tone: Tone;
    let rel: string;
    if (ruler === sub) { tone = dignityTone(dignity(ruler, signIdx(natal, ruler))); rel = "ดาวเสวยอายุและเสวยแทรกเป็นดวงเดียวกัน ผลเด่นชัดตามดาวนั้น"; }
    else if (isPair(ENEMY_PAIRS, ruler, sub)) { tone = "ร้าย"; rel = "ดาวเสวยอายุและเสวยแทรกเป็นคู่ศัตรูกัน ปีนี้มีแนวโน้มขัดแย้งหรือเจออุปสรรค"; }
    else if (isPair(FRIEND_PAIRS, ruler, sub)) { tone = "ดี"; rel = "ดาวเสวยอายุและเสวยแทรกเป็นคู่มิตรกัน ส่งเสริมกัน"; }
    else if (natureOf(ruler) === "ศุภ" && natureOf(sub) === "ศุภ") { tone = "ดี"; rel = "ทั้งคู่เป็นศุภเคราะห์ ให้คุณ"; }
    else if (natureOf(ruler) === "บาป" && natureOf(sub) === "บาป") { tone = "ร้าย"; rel = "ทั้งคู่เป็นบาปเคราะห์ ต้องอดทนและระมัดระวัง"; }
    else { tone = "ผสม"; rel = "ศุภเคราะห์กับบาปเคราะห์ ผลปนกัน"; }
    sections.push({
      id: "dasa",
      title: "ดาวเสวยอายุ-เสวยแทรก (ระบบพลูหลวง)",
      note: `ใช้อายุเต็ม ${age} ปี (ช่วงละ ๑๐ ปี เรียงดาวตามระยะห่างจากดวงอาทิตย์)`,
      items: [
        { head: `เสวยอายุ: ${desc(ruler)}`, text: `ครองช่วงอายุ ${p * 10 + 1}–${p * 10 + 10} ปี ${PLANET_INFO[ruler].signifies}` },
        { head: `เสวยแทรก: ${desc(sub)}`, text: `แทรกในปีนี้ ${PLANET_INFO[sub].signifies}` },
        { head: "ภาพรวมปีนี้", text: rel, tone },
      ],
    });
  }

  // ---------- ๕. ลัคนาจรตามภพ ----------
  let jonHouse = 0;
  if (hasTime) {
    jonHouse = age === 0 ? 1 : ((age - 1) % 12) + 1;
    const js = (lagna + jonHouse - 1) % 12;
    const occupants = CODES.filter((c) => signIdx(natal, c) === js);
    const hh = HOUSES[jonHouse - 1];
    const sub: string[] = [];
    sub.push(`ปีนี้ลัคนาจรเข้าภพ${hh.name} (ราศี${signName(js)}) คำทำนายของปีเน้นเรื่อง${houseTheme(jonHouse, gender)}`);
    sub.push(occupants.length ? `ดาวเดิมในภพนี้: ${occupants.map(nameOf).join(" ")}` : "ไม่มีดาวเดิมในภพนี้");
    for (const lc of lordsOfHouse(jonHouse)) {
      if (lc === "B") continue;
      const s = signIdx(natal, lc);
      const dg = dignity(lc, s);
      sub.push(`ดาวเจ้าเรือน${hh.name}: ${nameOf(lc)} อยู่ภพ${HOUSES[hOf(s) - 1].name}${dg ? ` (${dg})` : ""}`);
    }
    if (hh.dusthana) sub.push("เป็นภพทุสถานะ ปีนี้ควรระวังเรื่องเจ็บไข้ อุบัติเหตุ การสูญเสียหรือพลัดพราก");
    if (jonHouse === 1) sub.push("ลัคนาจรกลับมาทับลัคนาเดิม เป็นจุดเริ่มรอบใหม่");
    sections.push({
      id: "jon",
      title: "ลัคนาจรตามภพ (เกณฑ์อายุ)",
      note: "นับตามกฎในตำรา: อายุเต็ม ๑ ปีอยู่ภพลัคนา แล้วเลื่อนไปภพถัดไปปีละภพ ครบ ๑๒ ภพขึ้นรอบใหม่",
      items: [{ head: `อายุเต็ม ${age} ปี → ภพ ${jonHouse} ${hh.name}`, text: "ใช้เป็นแนวโน้มหลักของปี แล้วดูดาวจรที่มากระทบดาวเดิมประกอบ", tone: hh.dusthana ? "ร้าย" : "กลาง", sub }],
    });
  }

  // ---------- ๖. ดาวจร ----------
  const SLOW = ["5", "7", "8", "9", "0", "N", "P"];
  const targets: { key: string; label: string; sign: number; nature: "ศุภ" | "บาป" | null }[] = [];
  if (hasTime) {
    targets.push({ key: "lagna", label: "ลัคนา", sign: lagna, nature: null });
    const lc = lagnaLords.find((x) => x !== "B");
    if (lc) targets.push({ key: "lord", label: `ดาวเจ้าเรือนลัคน์ (${nameOf(lc)})`, sign: signIdx(natal, lc), nature: natureOf(lc) });
  }
  targets.push({ key: "1", label: "อาทิตย์กำเนิด", sign: signIdx(natal, "1"), nature: "ศุภ" });
  targets.push({ key: "2", label: "จันทร์กำเนิด", sign: signIdx(natal, "2"), nature: "ศุภ" });

  function transitItem(c: string, withAngles: boolean): Item {
    const s = signIdx(now, c);
    const dg = dignity(c, s);
    const retro = isRetrograde(now.planets[c]);
    const nat = natureOf(c);
    const sub: string[] = [];
    let text = `ดาวจร${nameOf(c)} (${nat}เคราะห์) อยู่ราศี${signName(s)}`;
    if (hasTime) {
      const h = houseOf(s, lagna);
      text += ` ตรงกับภพ ${h} ${HOUSES[h - 1].name} ของคุณ: เรื่อง${houseTheme(h, gender)}`;
      if (HOUSES[h - 1].dusthana) sub.push(`เป็นภพทุสถานะ ${nat === "ศุภ" ? "ศุภเคราะห์มาอยู่จึงให้คุณน้อยลง" : "บาปเคราะห์มาอยู่ ให้โทษหนักขึ้น"}`);
    }
    sub.push(`${nameOf(c)} หมายถึง ${PLANET_INFO[c].signifies}`);
    if (dg) sub.push(DIGNITY_TEXT[dg]);
    if (retro) sub.push("พักร: ผลช้าลง เหมาะทบทวนของเดิมมากกว่าเริ่มใหม่");
    // ศุภเคราะห์: ศักดิ์ดี = ดี ศักดิ์เสีย = ร้าย ; บาปเคราะห์: มีกำลัง (เกษตร/อุจจ์) หรือเสีย (ประ/นิจ) ก็ยังเป็นผสม ไม่ถือว่าดี
    let tone: Tone = !dg ? "กลาง" : nat === "ศุภ" ? dignityTone(dg) : "ผสม";
    if (nat === "บาป" && dg && (dg === "เกษตร" || dg === "อุจจ์")) sub.push("บาปเคราะห์ที่มีกำลังดี ผลของดาวนี้จะชัดและแรงขึ้น (ทั้งส่วนที่เป็นคุณและโทษ)");
    if (withAngles) {
      for (const t of targets) {
        const ang = angleOf(s, t.sign);
        const j = judge(nat, t.nature, ang);
        sub.push(`[${j.tone}] ${nameOf(c)}จร ${ANGLE_LABEL[ang]} ${t.label}: ${j.text}`);
      }
    }
    return { head: `${nameOf(c)}จร · ราศี${signName(s)}`, text, tone, sub };
  }

  sections.push({
    id: "transit",
    title: "ดวงปัจจุบัน เทียบกับดวงกำเนิด (ดาวจรช้า)",
    note: `ดาวจร ณ ${nDate} ${nTime.slice(0, 5)} น. · มุมเทียบกับ${hasTime ? "ลัคนา ดาวเจ้าเรือนลัคน์ " : ""}อาทิตย์และจันทร์ในดวงกำเนิด · ดาวบาปเคราะห์ในตำรามี อังคาร เสาร์ ราหู เกตุ มฤตยู เนปจูน พลูโต`,
    items: SLOW.map((c) => transitItem(c, true)),
  });
  sections.push({
    id: "transit-fast",
    title: "ดาวจรเร็ว (ผลระยะสั้น ไม่กี่สัปดาห์)",
    items: ["3", "1", "4", "6"].map((c) => transitItem(c, false)),
  });

  // ---------- ๗. เสริมจากตำราทั่วไป ----------
  const bDay = weekdayCode(bDate, bTime, hasTime);
  const start = THAKSA_ORDER.indexOf(bDay.code);
  const tDay = weekdayCode(nDate, nTime, true);
  const todayPos = (THAKSA_ORDER.indexOf(tDay.code) - start + 8) % 8;
  const bRuek = ruekIndex(natal.planets["2"].longitude);
  const nRuek = ruekIndex(now.planets["2"].longitude);
  sections.push({
    id: "extra",
    title: "เสริม: ทักษาและฤกษ์ (ตำราทั่วไป)",
    note: "ส่วนนี้ไม่ได้มาจากตำราพลูหลวง ใช้ประกอบเท่านั้น",
    items: [
      {
        head: `ทักษาตามวันเกิด (เกิดวัน${nameOf(bDay.code)}${bDay.code === "8" ? " กลางคืน" : ""})`,
        text: THAKSA.map((t, i) => `${t.pos}=${nameOf(THAKSA_ORDER[(start + i) % 8])}`).join(" · "),
      },
      { head: `วันนี้ (วัน${WEEKDAYS[tDay.wd]}${tDay.code === "8" ? " กลางคืน" : ""})`, text: `เป็นวัน${THAKSA[todayPos].pos}ของคุณ — ${THAKSA[todayPos].advice}`, tone: todayPos === 7 ? "ร้าย" : "กลาง" },
      { head: "ฤกษ์", text: `ฤกษ์เกิด (ตามจันทร์): ฤกษ์ที่ ${bRuek + 1} ${RUEK[bRuek]} · จันทร์จรปัจจุบัน: ฤกษ์ที่ ${nRuek + 1} ${RUEK[nRuek]}` },
    ],
  });

  // ---------- สรุป ----------
  if (hasTime) {
    const lc = lagnaLords.find((x) => x !== "B");
    if (lc) {
      const s = signIdx(natal, lc);
      const dg = dignity(lc, s);
      summary.push(`ลัคนา${signName(lagna)}: ดาวเจ้าเรือนลัคน์คือ${nameOf(lc)} อยู่ภพ${HOUSES[hOf(s) - 1].name}${dg ? ` (${dg})` : ""}`);
    } else summary.push(`ลัคนา${signName(lagna)}`);
    summary.push(`ปีนี้ลัคนาจรเข้าภพ${HOUSES[jonHouse - 1].name}: เน้นเรื่อง${HOUSES[jonHouse - 1].theme}`);
  } else {
    summary.push("ไม่ทราบเวลาเกิด จึงไม่ใช้ลัคนาและภพ ผลด้านล่างเป็นภาพกว้างจากราศีและศักดิ์ของดาวเท่านั้น");
  }
  const dasa = sections.find((x) => x.id === "dasa");
  if (dasa) summary.push(`${dasa.items[0].head} · ${dasa.items[1].head} → ${dasa.items[2].text}`);
  const tr = sections.find((x) => x.id === "transit");
  if (tr) {
    const bad = tr.items.flatMap((i) => i.sub ?? []).filter((t) => t.startsWith("[ร้าย]") && (t.includes("ลัคนา") || t.includes("เจ้าเรือนลัคน์"))).length;
    const good = tr.items.flatMap((i) => i.sub ?? []).filter((t) => t.startsWith("[ดี]") && (t.includes("ลัคนา") || t.includes("เจ้าเรือนลัคน์"))).length;
    if (hasTime) summary.push(`ดาวจรช้าที่ทำมุมกับลัคนา/ดาวเจ้าเรือนลัคน์ในตอนนี้: มุมให้คุณ ${good} จุด · มุมให้โทษ ${bad} จุด`);
  }

  return { hasTime, summary, sections };
}