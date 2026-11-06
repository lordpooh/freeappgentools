// ตัวแปลผลดวงชะตาไทย ระบบพลูหลวง (อ.ประยูร อุลุชาฎะ) : ดวงกำเนิด + ดาวจรปัจจุบัน
// อ้างอิงหลัก: "กฎเกณฑ์การพิจารณาดวงชะตา ระบบพลูหลวง" (สำนักโหรพลูโต) และเอกสารเนปจูน/พลูโต/มฤตยูที่ผู้ใช้ให้มา
// ข้อมูลทุกอย่างอยู่ในตารางด้านบนของไฟล์ แก้ข้อความหรือกฎให้ตรงกับตำราได้โดยไม่ต้องแตะตรรกะด้านล่าง
// หมายเหตุ: แบคคัส (บ) เป็นดาวในระบบนี้ แต่แอปยังไม่คำนวณตำแหน่ง จึงไม่นำมาแปลผล (ใช้เพียงเป็นดาวเกษตรของราศีพฤษภ)
import { THAI_ZODIACS, isRetrograde, type ChartResult, type DayPos } from "./thai-astro";

export type Tone = "ดี" | "ร้าย" | "ผสม" | "กลาง";
export type Item = { head?: string; text: string; tone?: Tone; sub?: string[] };
export type Section = { id: string; title: string; note?: string; items: Item[] };
export type Reading = { hasTime: boolean; summary: Item[]; sections: Section[] };
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
  N: { name: "เนปจูน", nature: "บาป", signifies: "การสังคม ฝูงชน การโฆษณา สื่อ ทะเลและน้ำ น้ำมัน เคมี น้ำหอม สุรา มหรสพ ไสยศาสตร์ เรื่องเร้นลับ การปิดบัง สถานที่จำกัดเขตหรือห่างไกล" },
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

/** เนปจูนในแต่ละภพ (สังเคราะห์จากเอกสารเนปจูนที่ผู้ใช้ให้มา: สังคม เร้นลับ ทะเล/น้ำ มหรสพ ไสยศาสตร์ การปิดบัง) */
const NEPTUNE_IN: string[] = [
  "ชอบปรากฏตัวในสังคม พูดโน้มน้าวจิตใจคนเก่ง แต่เก็บงำตัวตนจริงไว้ สวมหน้ากากเข้าหาคน หรือไม่ก็เก็บตัวลับลมคมใน มีสัมผัสเร้นลับ สนใจไสยศาสตร์",
  "รายได้เกี่ยวข้องกับสังคม โฆษณา สื่อ น้ำ น้ำมัน น้ำหอม สุรา เคมี หรือมหรสพ แต่การเงินมักคลุมเครือ ไม่เปิดเผย ระวังถูกหลอกหรือคำพูดที่ไม่ตรงไปตรงมาเรื่องเงิน",
  "เพื่อนฝูงและสังคมวงกว้าง ติดต่อสื่อสารกับคนหมู่มาก เช่น สื่อ อินเทอร์เน็ต โฆษณา แต่เพื่อนบางคนไม่จริงใจหรือมีเบื้องหลัง การเดินทางเกี่ยวกับน้ำหรือทะเล",
  "บ้านหรือที่อยู่ใกล้น้ำ ทะเล หรืออยู่ในที่เร้นลับ ห่างไกล มีกฎระเบียบเข้มงวด เรื่องในครอบครัวมีสิ่งปิดบัง หรือบ้านเป็นที่ชุมนุมผู้คน",
  "ชอบกิจกรรมสังคม งานเลี้ยง มหรสพ ศิลปะ ดนตรี บุตรหรือผู้อยู่ใต้บังคับบัญชามีเรื่องปิดบัง ความรักแบบลับ ๆ หรือคลุมเครือ ระวังการเสี่ยงโชคและความลุ่มหลง",
  "ปัญหาอุปสรรค ศัตรู โรคภัยที่แทรกซึมเรื้อรัง รักษาไม่หายขาดโดยง่าย ศัตรูซ่อนเร้นหรือแสดงตนไม่ชัด ระวังสารเคมี น้ำ ยา หรือของมึนเมา",
  "คู่ครองหรือคู่ค้ามีเบื้องหลังหรือไม่เปิดเผยตัวตน ความรักอาจมีความลับ คลุมเครือ หรือถูกหลอก ศัตรูที่แสดงตัวมักใช้วิธีลับหลัง",
  "ระวังภัยเงียบ ความเสียหายที่ค่อยเป็นค่อยไปโดยไม่รู้ตัว เรื่องเกี่ยวกับน้ำ เคมี ยา หรือของมึนเมา มีความลับเรื่องการเงินร่วมกับผู้อื่น สนใจเรื่องวิญญาณและเร้นลับ",
  "สนใจศาสนาหรือไสยศาสตร์ ชอบเดินทางไกลทางทะเลหรืออากาศ มีคนรู้จักต่างแดน แต่ระวังความเชื่อที่ถูกชักจูงง่ายหรือถูกหลอกในต่างแดน",
  "อาชีพที่ต้องปรากฏตัวต่อสาธารณะ เช่น ดารา นักพูด สื่อ โฆษณา มหรสพ หรือเกี่ยวกับทะเล น้ำมัน เคมี ขนส่ง แต่ภาพลักษณ์กับตัวตนจริงมักต่างกัน มีเรื่องส่วนตัวที่ต้องปิดบัง",
  "เพื่อนฝูงและผู้อุปถัมภ์ในวงสังคมกว้าง ได้ลาภจากการสังคม แต่ต้องระวังเพื่อนที่สวมหน้ากาก ผู้สนับสนุนที่มีวาระซ่อนเร้น",
  "ตำแหน่งเรือนวินาศนะเดิมของเนปจูน เด่นเรื่องเร้นลับ ปิดบัง ชอบสันโดษหรือเก็บตัว ระวังศัตรูลับ การแทรกซึมบ่อนทำลายแบบไม่รู้ตัว สถานที่จำกัดเขต เช่น วัง คุก กรมทหาร วัดที่มีกฎเข้มงวด หรือสถานที่ห่างไกล",
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
// คำอธิบายแบบภาษาง่าย (ใช้ในสรุป วันนี้ / เดือนนี้ / ปีนี้) — แก้ถ้อยคำได้ตามต้องการ
// ---------------------------------------------------------------------------
const HOUSE_PLAIN = [
  "ตัวเอง สุขภาพ และภาพลักษณ์",
  "เงินทอง รายได้ การพูดจา",
  "เพื่อนฝูง การติดต่อ การเดินทางใกล้ ๆ",
  "บ้าน ครอบครัว ที่อยู่อาศัย รถ",
  "ลูก ลูกน้อง สัตว์เลี้ยง",
  "ปัญหาจุกจิก คู่แข่ง สุขภาพ",
  "ความรัก คู่ครอง คู่ค้า",
  "ความไม่คาดคิด การสูญเสีย เงินที่เกี่ยวกับคนอื่น",
  "โชคดี ผู้ใหญ่ การเดินทางไกล การเรียนรู้",
  "งาน อาชีพ หน้าที่",
  "ผู้สนับสนุน ลาภผล เพื่อนสนิท",
  "ความลับ ความเหนื่อยล้า ศัตรูลับ การพักผ่อน",
];
const PLAIN_EFFECT: Record<string, string> = {
  "1": "เกียรติยศ หัวหน้า ผู้ใหญ่",
  "2": "อารมณ์และความรู้สึก",
  "3": "ความใจร้อน ทะเลาะ อุบัติเหตุ",
  "4": "การพูดคุย เอกสาร การเจรจา",
  "5": "ผู้ใหญ่ ครูอาจารย์ โอกาสดี ๆ",
  "6": "ความรัก ความสุข การใช้จ่าย",
  "7": "งานหนัก อุปสรรค ความเหนื่อย",
  "8": "ความหลงผิด การถูกหลอกหรือใส่ร้าย ของมึนเมา",
  "9": "เรื่องเก่า ๆ ที่ย้อนมา เรื่องลี้ลับ",
  "0": "เรื่องไม่คาดฝัน การเปลี่ยนแปลงกะทันหัน",
  N: "ความคลุมเครือ ถูกหลอก เรื่องลับ",
  P: "แรงกดดันที่มองไม่เห็น การสูญเสียหรือพลัดพราก",
};
const THAKSA_GOOD = ["เดช", "ศรี", "มูละ", "มนตรี", "อุตสาหะ"]; // ตำแหน่งทักษาที่ถือว่าเป็นวันดี

/** สร้างรายการสรุปภาษาง่าย: ดี / ระวัง / เหมาะกับ / ไม่เหมาะกับ */
function plainItem(head: string, text: string, tone: Tone, goods: string[], bads: string[], suit: string[], avoid: string[]): Item {
  const sec = (title: string, lines: string[], empty: string) => [title, ...(lines.length ? lines : [empty]).map((l) => `• ${l}`)];
  return {
    head,
    text,
    tone,
    sub: [
      ...sec("ดี:", goods, "ยังไม่มีแรงหนุนที่เด่นชัด"),
      ...sec("ระวัง:", bads, "ไม่มีเรื่องที่น่ากังวลเป็นพิเศษ"),
      ...sec("เหมาะกับ:", suit, "ทำงานและใช้ชีวิตตามปกติ"),
      ...sec("ไม่เหมาะกับ:", avoid, "ไม่มีข้อห้ามเป็นพิเศษ"),
    ],
  };
}

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
  const strong: string[] = []; // ดาวมีกำลัง (เกษตร/อุจจ์)
  const weak: string[] = []; // ดาวเสีย (ประ/นิจ)
  let dasaHead = "";
  let dasaRel = "";
  let dasaTone: Tone = "กลาง";
  const hits: { planet: string; target: string; label: string; tone: Tone; text: string }[] = [];

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
    if (dg === "เกษตร" || dg === "อุจจ์") strong.push(`${nameOf(c)} (${dg})`);
    if (dg === "ประ" || dg === "นิจ") weak.push(`${nameOf(c)} (${dg})`);
    const sub: string[] = [];
    sub.push(`ความหมายของดาว: ${PLANET_INFO[c].signifies}`);
    if (hasTime) {
      if (c === "P") sub.push(`พลูโตในภพ${HOUSES[h - 1].name}: ${PLUTO_IN[h - 1]}`);
      else if (c === "0") sub.push(`มฤตยูในภพ${HOUSES[h - 1].name}: ${URANUS_IN[h - 1]}`);
      else if (c === "N") sub.push(`เนปจูนในภพ${HOUSES[h - 1].name}: ${NEPTUNE_IN[h - 1]}`);
      else sub.push(`อยู่ภพ${HOUSES[h - 1].name}: เรื่อง${houseTheme(h, gender)}เป็นจุดที่ดาวนี้เข้าไปเกี่ยวข้อง`);
      if (HOUSES[h - 1].dusthana) sub.push(`ตกภพทุสถานะ (${HOUSES[h - 1].name}) ให้โทษแก่ดาวนั้น`);
      for (const [dh, lords] of lordHouseMap) {
        for (const lc of lords) {
          if (lc !== c && lc !== "B" && signIdx(natal, lc) === s) sub.push(`กุมกับดาวเจ้าเรือน${HOUSES[dh - 1].name} (${nameOf(lc)}) ซึ่งเป็นภพทุสถานะ ให้โทษแก่ดาวนี้`);
        }
      }
    }
    if (c === "N") {
      sub.push("เนปจูนเป็นดาวเจ้าเรือนภพวินาศนะของลัคนาโลก (มีน) คำว่าวินาศนะคือการแทรกซึมบ่อนทำลายแบบค่อยเป็นค่อยไป โรคเรื้อรังรักษายาก และเป็นประธานฝ่ายบาปเคราะห์ในระบบพลูหลวง ผลเมื่อให้โทษมักรุนแรง");
      sub.push("ต่างจากพุธ: เนปจูนสื่อสารกับสังคมกว้างไม่มีเป้าหมายเจาะจง (โฆษณา อินเทอร์เน็ต) ส่วนพุธสื่อสารโดยตรง (จดหมาย การพูดคุย)");
      if (hasTime && (h === 1 || h === 12)) sub.push("เนปจูนกุมหรือนำหน้าลัคนา: ผู้นั้นมักเก็บตัว ลับลมคมใน หรือเข้าสังคมแต่สวมหน้ากาก ไม่เปิดเผยจริงใจ");
      if (hasTime) {
        const lc = lagnaLords.find((x) => x !== "B");
        const tgs: { label: string; sign: number; nature: "ศุภ" | "บาป" | null }[] = [
          { label: "ลัคนา", sign: lagna, nature: null },
          ...(lc ? [{ label: `ดาวเจ้าเรือนลัคน์ (${nameOf(lc)})`, sign: signIdx(natal, lc), nature: natureOf(lc) }] : []),
        ];
        const hurt = tgs.filter((t) => judge("บาป", t.nature, angleOf(s, t.sign)).tone === "ร้าย");
        if (hurt.length) {
          const el = LOCAL_ELEMENT[lagna % 4];
          const labels = hurt.map((t) => `${ANGLE_LABEL[angleOf(s, t.sign)]} ${t.label}`).join(" · ");
          sub.push(
            el === "ไฟ" || el === "ดิน"
              ? `เนปจูนให้โทษแก่${labels} และลัคนาเป็นธาตุ${el} (ฝ่ายขวา): ยากที่จะมีดาวใดคุ้มกันได้`
              : `เนปจูนให้โทษแก่${labels} แต่ลัคนาเป็นธาตุ${el} (ฝ่ายซ้าย): ผลบรรเทาเบาบางลง เพราะเป็นธาตุฝ่ายเดียวกัน`
          );
        }
      }
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
    dasaHead = `${desc(ruler)} · เสวยแทรก ${desc(sub)}`;
    dasaRel = rel;
    dasaTone = tone;
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
        hits.push({ planet: c, target: t.key, label: `${nameOf(c)}จร ${ANGLE_LABEL[ang]} ${t.label}`, tone: j.tone, text: j.text });
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

  // ---------- สรุปผลทำนาย (ระบบพลูหลวง) ----------
  const summary: Item[] = [];
  const keyTargets = hasTime ? ["lagna", "lord"] : ["1", "2"]; // จุดที่ใช้นับคะแนนมุมดาวจร
  const keyHits = hits.filter((h) => keyTargets.includes(h.target));
  const goodHits = keyHits.filter((h) => h.tone === "ดี");
  const badHits = keyHits.filter((h) => h.tone === "ร้าย");
  const jonDust = hasTime && jonHouse > 0 && HOUSES[jonHouse - 1].dusthana;
  const score = goodHits.length - badHits.length + (dasaTone === "ดี" ? 1 : dasaTone === "ร้าย" ? -1 : 0) - (jonDust ? 1 : 0);
  const overall: { tone: Tone; text: string } =
    score >= 2
      ? { tone: "ดี", text: "ช่วงนี้ค่อนข้างราบรื่น มีแรงหนุนมากกว่าแรงกดดัน" }
      : score <= -2
        ? { tone: "ร้าย", text: "ช่วงนี้มีแรงกดดันมากกว่าแรงหนุน ควรระมัดระวังและไม่ใจร้อน" }
        : { tone: "ผสม", text: "ช่วงนี้ผสมผสาน มีทั้งโอกาสและอุปสรรคพอ ๆ กัน" };

  // ๑ ภาพรวมช่วงนี้
  summary.push({
    head: "ภาพรวมช่วงนี้",
    text: overall.text,
    tone: overall.tone,
    sub: [
      `นับจากมุมของดาวจรช้ากับ${hasTime ? "ลัคนาและดาวเจ้าเรือนลัคน์" : "อาทิตย์และจันทร์กำเนิด"}: ให้คุณ ${goodHits.length} จุด · ให้โทษ ${badHits.length} จุด`,
      ...(dasaHead ? [`ดาวเสวยอายุ-เสวยแทรก: ${dasaRel}`] : []),
      ...(jonDust ? [`ลัคนาจรปีนี้เข้าภพทุสถานะ (${HOUSES[jonHouse - 1].name}) จึงลดคะแนนลง`] : []),
      "เป็นการนับแบบหยาบเพื่อให้เห็นแนวโน้ม ไม่ใช่คะแนนที่ตำราให้ไว้",
    ],
  });

  // ๒ ดวงกำเนิด
  {
    const sub: string[] = [];
    let head = "ดวงกำเนิด";
    let tone: Tone = "กลาง";
    if (hasTime) {
      const lc = lagnaLords.find((x) => x !== "B");
      const el = LOCAL_ELEMENT[lagna % 4];
      head = `ดวงกำเนิด: ลัคนา${signName(lagna)} (ธาตุ${el})`;
      if (lc) {
        const ls = signIdx(natal, lc);
        const ldg = dignity(lc, ls);
        const lh = hOf(ls);
        sub.push(`ดาวเจ้าเรือนลัคน์คือ${nameOf(lc)} อยู่ราศี${signName(ls)} ภพ${HOUSES[lh - 1].name}${ldg ? ` (${ldg})` : ""} — ${HOUSES[lh - 1].dusthana ? "ตกภพทุสถานะ ให้โทษแก่ดาวเจ้าเรือนลัคน์" : `ชีวิตผูกพันกับเรื่อง${houseTheme(lh, gender)}`}`);
        tone = HOUSES[lh - 1].dusthana || ldg === "ประ" || ldg === "นิจ" ? "ร้าย" : ldg === "เกษตร" || ldg === "อุจจ์" ? "ดี" : "กลาง";
      }
      const lagnaFinds = angleItems.filter((i) => i.head && !i.head.startsWith("ดาวกุมกัน"));
      const goodF = lagnaFinds.filter((i) => i.tone === "ดี").map((i) => i.head);
      const badF = lagnaFinds.filter((i) => i.tone === "ร้าย").map((i) => i.head);
      sub.push(`จุดเด่น: ${goodF.length ? goodF.join(" · ") : "ไม่มีมุมให้คุณชัดเจนกับลัคนา"}`);
      sub.push(`จุดที่ต้องระวัง: ${badF.length ? badF.join(" · ") : "ไม่มีมุมให้โทษชัดเจนกับลัคนา"}`);
    } else {
      sub.push("ไม่ทราบเวลาเกิด จึงสรุปจากราศีและศักดิ์ของดาวเท่านั้น");
    }
    sub.push(`ดาวมีกำลัง (เกษตร/อุจจ์): ${strong.length ? strong.join(" · ") : "ไม่มี"}`);
    sub.push(`ดาวเสีย (ประ/นิจ): ${weak.length ? weak.join(" · ") : "ไม่มี"}`);
    summary.push({ head, text: "สรุปจากลัคนา ดาวเจ้าเรือนลัคน์ มุมกับลัคนา และศักดิ์ของดาวทั้งหมด", tone, sub });
  }

  // ๓ ปีนี้ (เกณฑ์อายุ)
  if (dasaHead || jonHouse) {
    const sub: string[] = [];
    if (dasaHead) sub.push(`เสวยอายุ: ${dasaHead}`);
    if (dasaRel) sub.push(dasaRel);
    if (jonHouse) sub.push(`ลัคนาจรเข้าภพ${HOUSES[jonHouse - 1].name}: เน้นเรื่อง${houseTheme(jonHouse, gender)}`);
    summary.push({
      head: `ปีนี้ (อายุเต็ม ${age} ปี)`,
      text: jonHouse ? `คำทำนายของปีเน้นเรื่อง${HOUSES[jonHouse - 1].theme}` : "ดูจากดาวเสวยอายุ-เสวยแทรก",
      tone: jonDust ? "ร้าย" : dasaTone,
      sub,
    });
  }

  // ๔ แรงหนุน/แรงกดดันจากดาวจร
  {
    const sub: string[] = [];
    const jp = now.planets["5"];
    const sa = now.planets["7"];
    const jS = signIdx(now, "5");
    const sS = signIdx(now, "7");
    sub.push(
      hasTime
        ? `แรงหนุน: พฤหัสบดีจรภพ${HOUSES[houseOf(jS, lagna) - 1].name} → เรื่อง${houseTheme(houseOf(jS, lagna), gender)}${isRetrograde(jp) ? " (พักร ผลช้า)" : ""}`
        : `พฤหัสบดีจรราศี${signName(jS)}${isRetrograde(jp) ? " (พักร)" : ""}`
    );
    sub.push(
      hasTime
        ? `แรงกดดัน: เสาร์จรภพ${HOUSES[houseOf(sS, lagna) - 1].name} → เรื่อง${houseTheme(houseOf(sS, lagna), gender)}${isRetrograde(sa) ? " (พักร ผลช้า)" : ""}`
        : `เสาร์จรราศี${signName(sS)}${isRetrograde(sa) ? " (พักร)" : ""}`
    );
    if (goodHits.length) sub.push(`มุมให้คุณ: ${goodHits.map((h) => h.label).join(" · ")}`);
    if (badHits.length) sub.push(`มุมให้โทษ: ${badHits.map((h) => h.label).join(" · ")}`);
    summary.push({
      head: "ดาวจรที่กระทบดวงกำเนิดตอนนี้",
      text: `ดาวจร ณ ${nDate} ${nTime.slice(0, 5)} น. เทียบกับดวงกำเนิด`,
      tone: goodHits.length > badHits.length ? "ดี" : badHits.length > goodHits.length ? "ร้าย" : "ผสม",
      sub,
    });
  }

  // ๕ ข้อแนะนำ
  {
    const sub: string[] = [];
    if (overall.tone === "ร้าย") sub.push("ช่วงมีแรงกดดัน: เลี่ยงการตัดสินใจใหญ่แบบเสี่ยง ไม่ก่อศัตรู รักษาสุขภาพ และใช้ความอดทน");
    else if (overall.tone === "ดี") sub.push("ช่วงมีแรงหนุน: เหมาะกับการเริ่มเรื่องสำคัญที่เตรียมไว้แล้ว แต่ไม่ควรประมาท");
    else sub.push("ช่วงผสมผสาน: ทำงานตามแผน ตัดสินใจเรื่องใหญ่ด้วยความรอบคอบ");
    if (jonDust) sub.push(`ลัคนาจรเข้าภพ${HOUSES[jonHouse - 1].name} (ทุสถานะ): ระวังเรื่อง${HOUSES[jonHouse - 1].theme}`);
    if (hasTime && badHits.some((h) => h.planet === "N")) sub.push("เนปจูนเป็นประธานฝ่ายบาปเคราะห์ในระบบพลูหลวง เมื่อให้โทษมักรุนแรง ควรระวังเรื่องการถูกหลอกลวงและเรื่องเร้นลับ");
    sub.push(`วันนี้ (ตำราทั่วไป): เป็นวัน${THAKSA[todayPos].pos}ของคุณ — ${THAKSA[todayPos].advice}`);
    summary.push({ head: "ข้อแนะนำ", text: "แนวทางตามแนวโน้มข้างต้น ใช้ประกอบการตัดสินใจ", tone: "กลาง", sub });
  }

  // ---------- สรุปแบบภาษาง่าย: วันนี้ / เดือนนี้ / ปีนี้ (แสดงไว้บนสุด) ----------
  {
    type Verdict = "ดี" | "ผสม" | "ร้าย";
    const hs = (h: number) => HOUSE_PLAIN[h - 1];
    const dust = (h: number) => HOUSES[h - 1].dusthana;
    const hn = (c: string) => houseOf(signIdx(now, c), lagna); // ใช้เมื่อรู้เวลาเกิดเท่านั้น
    const retroNow = (c: string) => isRetrograde(now.planets[c]);
    const uniq = (list: { planet: string }[]) => new Set(list.map((x) => x.planet)).size;
    const notes = (list: { planet: string }[], kind: "good" | "bad", skip: string[] = []) =>
      Array.from(new Set(list.map((x) => x.planet)))
        .filter((p) => !skip.includes(p))
        .map((p) =>
          kind === "good"
            ? `${nameOf(p)}ส่งแรงหนุน → ${PLAIN_EFFECT[p]}`
            : natureOf(p) === "ศุภ"
              ? `${nameOf(p)}ทำมุมไม่ดี → เรื่อง${PLAIN_EFFECT[p]}อาจไม่ราบรื่น`
              : `${nameOf(p)}ส่งแรงกด → ${PLAIN_EFFECT[p]}`
        );
    const pick = (score: number): Verdict => (score >= 2 ? "ดี" : score <= -2 ? "ร้าย" : "ผสม");

    // --- วันนี้ ---
    const dayHits = ["2", "3", "1", "4", "6"].flatMap((c) =>
      hitsFor(c, signIdx(now, c), targets)
        .filter((h) => keyTargets.includes(h.key))
        .map((h) => ({ ...h, planet: c }))
    );
    const dGood = dayHits.filter((h) => h.tone === "ดี");
    const dBad = dayHits.filter((h) => h.tone === "ร้าย");
    const tk = THAKSA[todayPos];
    const tkGood = THAKSA_GOOD.includes(tk.pos);
    const tkBad = tk.pos === "กาลกิณี";
    const moonH = hasTime ? hn("2") : 0;
    const moonDust = hasTime && dust(moonH);
    const dTone = pick((tkGood ? 1 : 0) - (tkBad ? 1 : 0) + uniq(dGood) - uniq(dBad) - (moonDust ? 1 : 0));
    const dGoods = [
      ...(tkGood ? [`วันนี้เป็นวัน${tk.pos}ของคุณ (ตำราทั่วไป) ถือเป็นวันที่ดี`] : []),
      ...notes(dGood, "good"),
    ];
    const dBads = [
      ...(tkBad || tk.pos === "อายุ" ? [`วันนี้เป็นวัน${tk.pos}ของคุณ (ตำราทั่วไป) — ${tk.advice}`] : []),
      ...(moonDust ? [`จันทร์จรเข้าภพที่มักมีปัญหา (ภพ${HOUSES[moonH - 1].name}) ใจอาจหวั่นไหวหรือเหนื่อยง่าย โดยเฉพาะเรื่อง${hs(moonH)}`] : []),
      ...notes(dBad, "bad"),
    ];
    const dSuit = [
      ...(tkGood || tk.pos === "บริวาร" ? [tk.advice.replace(/^เหมาะกับ/, "")] : []),
      ...(hasTime && !moonDust ? [`เรื่อง${hs(moonH)} (ใจและความสนใจของคุณวันนี้ไปทางนี้)`] : []),
    ];
    const dAvoid = [
      ...(tkBad ? ["เริ่มเรื่องสำคัญใหม่ ๆ"] : []),
      ...(dBad.some((h) => h.planet === "3") ? ["ตัดสินใจตอนอารมณ์ร้อน ขับรถหรือทำงานเสี่ยง"] : []),
      ...(dTone === "ร้าย" ? ["ตัดสินใจเรื่องใหญ่แบบเสี่ยง"] : []),
    ];
    const dayText: Record<Verdict, string> = {
      ดี: "วันนี้ค่อนข้างดี ทำเรื่องสำคัญได้",
      ผสม: "วันนี้ธรรมดา มีทั้งเรื่องดีและเรื่องที่ต้องระวัง",
      ร้าย: "วันนี้ควรระวัง ไม่เหมาะกับการตัดสินใจใหญ่",
    };

    // --- เดือนนี้ (ดูจากอาทิตย์ ศุกร์ พุธ อังคาร ที่เดินเร็วพอจะเห็นผลระดับเดือน) ---
    const mGoods: string[] = [];
    const mBads: string[] = [];
    const mSuit: string[] = [];
    const mAvoid: string[] = [];
    let mScore = 0;
    if (hasTime) {
      const sunH = hn("1");
      if (dust(sunH)) {
        mScore -= 1;
        mBads.push(`จุดเด่นของเดือนอยู่ที่เรื่อง${hs(sunH)} แต่เป็นภพที่มักมีปัญหา ต้องระวัง (อาทิตย์จร)`);
      } else {
        mScore += 1;
        mGoods.push(`จุดเด่นของเดือนอยู่ที่เรื่อง${hs(sunH)} (อาทิตย์จร)`);
        mSuit.push(`เรื่อง${hs(sunH)}`);
      }
      const venH = hn("6");
      if (dust(venH)) {
        mScore -= 1;
        mBads.push(`ความสุขสบายและการใช้จ่ายเรื่อง${hs(venH)}ต้องระวัง (ศุกร์จรภพที่มีปัญหา)`);
      } else {
        mScore += 1;
        mGoods.push(`ความสุข ความรัก ความพอใจ มาทางเรื่อง${hs(venH)} (ศุกร์จร)`);
      }
      const merH = hn("4");
      if (dust(merH)) {
        mScore -= 1;
        mBads.push(`การพูดคุยหรือเอกสารเรื่อง${hs(merH)}อาจติดขัด (พุธจรภพที่มีปัญหา)`);
      } else {
        mScore += 1;
        mGoods.push(`การพูดคุย เจรจา เอกสาร ราบรื่นในเรื่อง${hs(merH)} (พุธจร)`);
        mSuit.push(`เจรจาหรือทำเอกสารเรื่อง${hs(merH)}`);
      }
      const marH = hn("3");
      if (dust(marH)) mScore -= 1;
      mBads.push(`ระวังใจร้อนและความขัดแย้งในเรื่อง${hs(marH)}${dust(marH) ? " (หนักกว่าปกติเพราะเป็นภพที่มักมีปัญหา)" : ""} (อังคารจร)`);
      mAvoid.push(`เถียงหรือตัดสินใจด้วยอารมณ์ในเรื่อง${hs(marH)}`);
    } else {
      for (const c of ["1", "6", "4"]) {
        const dg = dignity(c, signIdx(now, c));
        if (dg === "เกษตร" || dg === "อุจจ์") {
          mScore += 1;
          mGoods.push(`${nameOf(c)}จรมีกำลังดี → เรื่อง${PLAIN_EFFECT[c]}เด่นขึ้น`);
        } else if (dg === "ประ" || dg === "นิจ") {
          mScore -= 1;
          mBads.push(`${nameOf(c)}จรอ่อนกำลัง → เรื่อง${PLAIN_EFFECT[c]}ติดขัด`);
        }
      }
      mBads.push("ระวังใจร้อนและความขัดแย้ง (อังคารจร)");
      mAvoid.push("เถียงหรือตัดสินใจด้วยอารมณ์");
    }
    if (retroNow("4")) mBads.push("พุธพักร: ผลช้าลง เหมาะทบทวนเอกสารมากกว่าเริ่มใหม่");
    if (retroNow("6")) mBads.push("ศุกร์พักร: ผลช้าลง เรื่องความรักและการใช้จ่ายควรทบทวนมากกว่าเริ่มใหม่");
    if (badHits.length > goodHits.length) {
      mScore -= 1;
      mBads.push("เบื้องหลังมีแรงกดดันจากดาวจรช้าอยู่ (ดูหัวข้อ \"ดาวจรที่กระทบดวงกำเนิดตอนนี้\")");
    } else if (goodHits.length > badHits.length) {
      mScore += 1;
      mGoods.push("เบื้องหลังมีแรงหนุนจากดาวจรช้าอยู่");
    }
    const mTone = pick(mScore);
    if (mTone === "ร้าย") mAvoid.push("ตัดสินใจเรื่องใหญ่แบบเร่งรีบ");
    const monthText: Record<Verdict, string> = {
      ดี: "เดือนนี้ค่อนข้างดี เรื่องทั่วไปราบรื่น",
      ผสม: "เดือนนี้ธรรมดา มีทั้งเรื่องดีและเรื่องที่ต้องระวัง",
      ร้าย: "เดือนนี้ต้องระวัง อย่ารีบตัดสินใจเรื่องใหญ่",
    };

    // --- ปีนี้ (ลัคนาจรตามอายุ + ดาวเสวยอายุ + พฤหัสบดี/เสาร์ + ดาวจรช้า) ---
    const yGoods: string[] = [];
    const yBads: string[] = [];
    const ySuit: string[] = [];
    const yAvoid: string[] = [];
    if (hasTime && jonHouse) {
      if (jonDust) {
        yBads.push(`ปีนี้ลัคนาจรเข้าภพ${HOUSES[jonHouse - 1].name} ซึ่งเป็นภพที่ต้องระวัง — ระวังเจ็บไข้ อุบัติเหตุ และการสูญเสีย โดยเฉพาะเรื่อง${hs(jonHouse)}`);
        yAvoid.push(`ตัดสินใจเสี่ยงเรื่อง${hs(jonHouse)}`);
      } else {
        yGoods.push(`ปีนี้เน้นเรื่อง${hs(jonHouse)} (ลัคนาจรภพ${HOUSES[jonHouse - 1].name})`);
        ySuit.push(`ลงแรงกับเรื่อง${hs(jonHouse)}`);
      }
    }
    if (dasaHead && dasaTone === "ดี") yGoods.push("ดาวประจำช่วงอายุปีนี้ส่งเสริมกัน ปีนี้มีแรงส่ง");
    else if (dasaHead && dasaTone === "ร้าย") yBads.push("ดาวประจำช่วงอายุปีนี้ให้ผลหนัก ต้องใช้ความอดทน");
    if (hasTime) {
      const jH = hn("5");
      const sH = hn("7");
      const jBad = badHits.some((h) => h.planet === "5");
      const jGood = goodHits.some((h) => h.planet === "5");
      const jRetro = retroNow("5") ? " (พักร ผลช้า)" : "";
      if (dust(jH)) yBads.push(`พฤหัสบดีจรเข้าภพที่มักมีปัญหา แรงหนุนเรื่อง${hs(jH)}จึงลดลง${jRetro}`);
      else if (jBad) yBads.push(`พฤหัสบดีทำมุมไม่ดีกับตัวคุณ แรงหนุนเรื่อง${hs(jH)}จึงไม่เต็มที่${jRetro}`);
      else {
        yGoods.push(`โอกาสดีและผู้ใหญ่เกื้อหนุนมาทางเรื่อง${hs(jH)} (พฤหัสบดีจร)${jGood ? " และทำมุมดีกับตัวคุณ" : ""}${jRetro}`);
        ySuit.push(`ขอความช่วยเหลือหรือคำแนะนำจากผู้ใหญ่ เรื่อง${hs(jH)}`);
      }
      yBads.push(`ต้องแบกภาระหรือเหนื่อยในเรื่อง${hs(sH)} (เสาร์จร)${dust(sH) ? " — หนักกว่าปกติ" : ""}${retroNow("7") ? " (พักร ผลช้า)" : ""}`);
      yAvoid.push(`หักโหมหรือรับภาระเรื่อง${hs(sH)}เกินตัว`);
    }
    yGoods.push(...notes(goodHits, "good", ["5", "7"]));
    yBads.push(...notes(badHits, "bad", ["5", "7"]));
    if (badHits.some((h) => h.planet === "N")) yAvoid.push("เชื่อหรือเซ็นข้อเสนอที่ไม่ชัดเจน (เนปจูนจร)");
    if (overall.tone === "ร้าย") yAvoid.push("ลงทุนหรือเปลี่ยนแปลงชีวิตแบบเสี่ยง");
    if (overall.tone === "ดี") ySuit.push("เริ่มเรื่องสำคัญที่เตรียมไว้แล้ว");
    const yTone: Verdict = overall.tone === "ดี" ? "ดี" : overall.tone === "ร้าย" ? "ร้าย" : "ผสม";
    const yearText: Record<Verdict, string> = {
      ดี: "ปีนี้ค่อนข้างราบรื่น มีแรงหนุนมากกว่าแรงกด",
      ผสม: "ปีนี้มีทั้งโอกาสและอุปสรรคพอ ๆ กัน",
      ร้าย: "ปีนี้ต้องระวัง มีแรงกดดันมากกว่าแรงหนุน",
    };

    const mHead = `เดือนนี้ · ${MONTHS_TH[Number(nDate.slice(5, 7)) - 1]} ${Number(nDate.slice(0, 4)) + 543}`;
    const yearItem = plainItem(`ปีนี้ · อายุเต็ม ${age} ปี`, yearText[yTone], yTone, yGoods, yBads, ySuit, yAvoid);
    yearItem.sub?.push("หมายเหตุ: สรุปนี้เป็นแนวโน้มแบบง่าย ๆ จากดาวจรและเกณฑ์อายุ ใช้ประกอบการตัดสินใจ ไม่ใช่คำตัดสิน รายละเอียดเต็มอยู่ในหัวข้อด้านล่าง");
    summary.unshift(
      plainItem(`วันนี้ · ${thaiDay(nDate)}`, dayText[dTone], dTone, dGoods, dBads, dSuit, dAvoid),
      plainItem(mHead, monthText[mTone], mTone, mGoods, mBads, mSuit, mAvoid),
      yearItem
    );
  }

  return { hasTime, summary, sections };
}

// ---------------------------------------------------------------------------
// พยากรณ์อนาคตใกล้: ดาวจรล่วงหน้า (ย้ายราศี พักร) เทียบกับดวงกำเนิด ตามกฎมุมของพลูหลวง
// ---------------------------------------------------------------------------
const MONTHS_TH = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
];
const thaiDay = (date: string) => {
  const [y, m, d] = date.split("-").map(Number);
  return `${d} ${MONTHS_TH[m - 1]} ${y + 543}`;
};
const EVENT_CODES = ["1", "3", "4", "5", "6", "7", "8", "9", "0", "N", "P"]; // ดาวที่แจ้งเมื่อย้ายราศี (ไม่รวมจันทร์)
const STATION_CODES = ["3", "4", "5", "6", "7", "0", "N", "P"]; // ดาวที่แจ้งเมื่อเริ่มพักร/กลับเดินหน้า
const SLOW_CODES = ["5", "7", "8", "9", "0", "N", "P"];

type Target = { key: string; label: string; sign: number; nature: "ศุภ" | "บาป" | null };

function makeTargets(natal: ChartResult, hasTime: boolean) {
  const lagna = hasTime ? THAI_ZODIACS.indexOf(natal.lagna.zodiac) : -1;
  const lordC = hasTime ? KASET[lagna].find((x) => x !== "B") : undefined;
  const targets: Target[] = [];
  if (hasTime) {
    targets.push({ key: "lagna", label: "ลัคนา", sign: lagna, nature: null });
    if (lordC) targets.push({ key: "lord", label: `ดาวเจ้าเรือนลัคน์ (${nameOf(lordC)})`, sign: signIdx(natal, lordC), nature: natureOf(lordC) });
  }
  targets.push({ key: "1", label: "อาทิตย์กำเนิด", sign: signIdx(natal, "1"), nature: "ศุภ" });
  targets.push({ key: "2", label: "จันทร์กำเนิด", sign: signIdx(natal, "2"), nature: "ศุภ" });
  return { lagna, targets, keyTargets: hasTime ? ["lagna", "lord"] : ["1", "2"] };
}

function hitsFor(c: string, sign: number, targets: Target[]) {
  return targets.map((t) => {
    const ang = angleOf(sign, t.sign);
    const j = judge(natureOf(c), t.nature, ang);
    return { key: t.key, tone: j.tone, text: j.text, label: `${nameOf(c)}จร ${ANGLE_LABEL[ang]} ${t.label}` };
  });
}

function dasaPairOf(age: number) {
  const n = Math.max(1, age);
  if (n > 100) return null;
  const p = Math.floor((n - 1) / 10);
  const k = ((n - 1) % 10) + 1;
  return { ruler: AGE_ORDER[p], sub: AGE_ORDER[(p + k - 1) % 10] };
}

function dasaRelation(ruler: string, sub: string, natal: ChartResult): { tone: Tone; rel: string } {
  if (ruler === sub) return { tone: dignityTone(dignity(ruler, signIdx(natal, ruler))), rel: "ดาวเสวยอายุและเสวยแทรกเป็นดวงเดียวกัน ผลเด่นชัดตามดาวนั้น" };
  if (isPair(ENEMY_PAIRS, ruler, sub)) return { tone: "ร้าย", rel: "ดาวเสวยอายุและเสวยแทรกเป็นคู่ศัตรูกัน มีแนวโน้มขัดแย้งหรือเจออุปสรรค" };
  if (isPair(FRIEND_PAIRS, ruler, sub)) return { tone: "ดี", rel: "ดาวเสวยอายุและเสวยแทรกเป็นคู่มิตรกัน ส่งเสริมกัน" };
  if (natureOf(ruler) === "ศุภ" && natureOf(sub) === "ศุภ") return { tone: "ดี", rel: "ทั้งคู่เป็นศุภเคราะห์ ให้คุณ" };
  if (natureOf(ruler) === "บาป" && natureOf(sub) === "บาป") return { tone: "ร้าย", rel: "ทั้งคู่เป็นบาปเคราะห์ ต้องอดทนและระมัดระวัง" };
  return { tone: "ผสม", rel: "ศุภเคราะห์กับบาปเคราะห์ ผลปนกัน" };
}

const toneOfHits = (hs: { key: string; tone: Tone }[], keys: string[]): Tone => {
  const k = hs.filter((h) => keys.includes(h.key));
  const g = k.filter((h) => h.tone === "ดี").length;
  const b = k.filter((h) => h.tone === "ร้าย").length;
  return g > b ? "ดี" : b > g ? "ร้าย" : "ผสม";
};

/**
 * days = ไทม์ไลน์รายวันจาก computeTimeline (วันแรก = วันนี้)
 * คืนส่วน "แนวโน้มรายเดือน" และ "ปฏิทินดาวจรล่วงหน้า"
 */
export function buildForecast(natal: ChartResult, days: DayPos[], hasTime: boolean, gender: Gender = undefined): Section[] {
  if (days.length < 3) return [];
  const { lagna, targets, keyTargets } = makeTargets(natal, hasTime);
  const signAt = (d: DayPos, c: string) => Math.floor(d.arc[c] / 1800) % 12;
  const diff = (a: number, b: number) => {
    let x = b - a;
    if (x > 10800) x -= 21600;
    if (x <= -10800) x += 21600;
    return x;
  };
  const retroAt = (i: number, c: string) => diff(days[i].arc[c], days[i + 1].arc[c]) < 0;

  // ---------- แนวโน้มรายเดือน (ใช้ดาวจรช้า ณ กลางเดือนของแต่ละเดือน) ----------
  const groups = new Map<string, number[]>();
  days.forEach((d, i) => {
    const key = d.date.slice(0, 7);
    groups.set(key, [...(groups.get(key) ?? []), i]);
  });
  const monthItems: Item[] = [];
  const monthKeys: string[] = [];
  for (const [key, idxs] of groups) {
    const i = idxs[Math.floor(idxs.length / 2)];
    const d = days[i];
    const all = [...SLOW_CODES, "3"].flatMap((c) => hitsFor(c, signAt(d, c), targets).map((h) => ({ ...h, planet: c })));
    const k = all.filter((h) => keyTargets.includes(h.key));
    const g = k.filter((h) => h.tone === "ดี");
    const b = k.filter((h) => h.tone === "ร้าย");
    const score = g.length - b.length;
    const tone: Tone = score >= 2 ? "ดี" : score <= -2 ? "ร้าย" : "ผสม";
    const [y, m] = key.split("-").map(Number);
    const sub: string[] = [`คำนวณจากตำแหน่งดาวจรช้าและอังคาร ณ ${thaiDay(d.date)} · มุมให้คุณ ${g.length} จุด · มุมให้โทษ ${b.length} จุด`];
    if (hasTime) {
      for (const c of ["5", "7"]) {
        const h = houseOf(signAt(d, c), lagna);
        sub.push(`${nameOf(c)}จรภพ${HOUSES[h - 1].name}: เรื่อง${houseTheme(h, gender)}`);
      }
    }
    if (g.length) sub.push(`มุมให้คุณ: ${g.map((h) => h.label).join(" · ")}`);
    if (b.length) sub.push(`มุมให้โทษ: ${b.map((h) => h.label).join(" · ")}`);
    monthKeys.push(key);
    monthItems.push({
      head: `${MONTHS_TH[m - 1]} ${y + 543}`,
      text: tone === "ดี" ? "แรงหนุนมากกว่าแรงกดดัน" : tone === "ร้าย" ? "แรงกดดันมากกว่าแรงหนุน ควรระมัดระวัง" : "ผสมผสาน มีทั้งโอกาสและอุปสรรค",
      tone,
      sub,
    });
  }

  // ---------- ปฏิทินเหตุการณ์ ----------
  type Ev = { date: string; item: Item };
  const events: Ev[] = [];
  const tagSlow = (c: string) => (SLOW_CODES.includes(c) ? "ดาวจรช้า ผลระยะยาว" : "ดาวจรเร็ว ผลระยะสั้น");

  for (let i = 0; i < days.length - 1; i++) {
    for (const c of EVENT_CODES) {
      const s0 = signAt(days[i], c);
      const s1 = signAt(days[i + 1], c);
      if (s0 === s1) continue;
      const back = diff(days[i].arc[c], days[i + 1].arc[c]) < 0;
      const hs = hitsFor(c, s1, targets);
      const dg = dignity(c, s1);
      const sub: string[] = [`${nameOf(c)} หมายถึง ${PLANET_INFO[c].signifies}`];
      if (dg) sub.push(DIGNITY_TEXT[dg]);
      if (hasTime) {
        const h = houseOf(s1, lagna);
        if (HOUSES[h - 1].dusthana) sub.push(`เข้าภพทุสถานะ (${HOUSES[h - 1].name}) ${natureOf(c) === "ศุภ" ? "ศุภเคราะห์ให้คุณน้อยลง" : "บาปเคราะห์ให้โทษหนักขึ้น"}`);
      }
      for (const h of hs) sub.push(`[${h.tone}] ${h.label}: ${h.text}`);
      const house = hasTime ? houseOf(s1, lagna) : 0;
      events.push({
        date: days[i + 1].date,
        item: {
          head: `${thaiDay(days[i + 1].date)} · ${nameOf(c)}${back ? "ถอยกลับเข้า" : "ย้ายเข้า"}ราศี${signName(s1)}`,
          text: `${hasTime ? `ตรงกับภพ ${house} ${HOUSES[house - 1].name}: เรื่อง${houseTheme(house, gender)} · ` : ""}${tagSlow(c)} (วันที่คลาดได้ ±1 วัน)`,
          tone: toneOfHits(hs, keyTargets),
          sub,
        },
      });
    }
    // พักร / กลับเดินหน้า
    if (i >= 1 && i < days.length - 2) {
      for (const c of STATION_CODES) {
        const was = retroAt(i - 1, c);
        const is = retroAt(i, c);
        if (was === is) continue;
        const s = signAt(days[i], c);
        const h = hasTime ? houseOf(s, lagna) : 0;
        events.push({
          date: days[i].date,
          item: {
            head: `${thaiDay(days[i].date)} · ${nameOf(c)}${is ? "เริ่มพักร (ถอยหลัง)" : "กลับเดินหน้า"}ในราศี${signName(s)}`,
            text: is
              ? `ผลของ${nameOf(c)}ช้าลง เหมาะทบทวนเรื่องเดิมมากกว่าเริ่มใหม่${hasTime ? ` · เรื่อง${houseTheme(h, gender)}` : ""} · ${tagSlow(c)}`
              : `เรื่องที่ค้างคาเกี่ยวกับ${nameOf(c)}เริ่มคลี่คลาย${hasTime ? ` · เรื่อง${houseTheme(h, gender)}` : ""} · ${tagSlow(c)}`,
            tone: "กลาง",
          },
        });
      }
    }
  }

  // วันเกิด: ลัคนาจรเปลี่ยนภพ และดาวเสวยอายุ-แทรกเปลี่ยน
  const [by, bm, bd] = natal.datetime_th.split(" ")[0].split("-").map(Number);
  const first = days[0].date;
  const last = days[days.length - 1].date;
  for (let y = Number(first.slice(0, 4)); y <= Number(last.slice(0, 4)); y++) {
    const day = bm === 2 && bd === 29 && !(y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0)) ? 28 : bd;
    const date = `${String(y).padStart(4, "0")}-${String(bm).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    if (date <= first || date > last || y <= by) continue;
    const age = y - by;
    const sub: string[] = [];
    let tone: Tone = "กลาง";
    let text = `ครบอายุเต็ม ${age} ปี`;
    if (hasTime) {
      const jon = age === 0 ? 1 : ((age - 1) % 12) + 1;
      const js = (lagna + jon - 1) % 12;
      sub.push(`ลัคนาจรเข้าภพ${HOUSES[jon - 1].name} (ราศี${signName(js)}): เน้นเรื่อง${houseTheme(jon, gender)}`);
      const occ = CODES.filter((c) => signIdx(natal, c) === js);
      sub.push(occ.length ? `ดาวเดิมในภพนี้: ${occ.map(nameOf).join(" ")}` : "ไม่มีดาวเดิมในภพนี้");
      if (HOUSES[jon - 1].dusthana) { sub.push("เป็นภพทุสถานะ ปีนี้ควรระวังเรื่องเจ็บไข้ อุบัติเหตุ การสูญเสียหรือพลัดพราก"); tone = "ร้าย"; }
      text += ` · ลัคนาจรเปลี่ยนเป็นภพ${HOUSES[jon - 1].name}`;
    }
    const dp = dasaPairOf(age);
    if (dp) {
      const r = dasaRelation(dp.ruler, dp.sub, natal);
      sub.push(`ดาวเสวยอายุ ${nameOf(dp.ruler)} · เสวยแทรก ${nameOf(dp.sub)}: ${r.rel}`);
      if (tone !== "ร้าย") tone = r.tone;
    }
    events.push({ date, item: { head: `${thaiDay(date)} · วันเกิดครบ ${age} ปี`, text, tone, sub } });
  }

  events.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  monthItems.forEach((mi, i) => {
    const evs = events.filter((e) => e.date.slice(0, 7) === monthKeys[i]);
    if (evs.length) mi.sub = [...(mi.sub ?? []), `เหตุการณ์ในเดือนนี้ (${evs.length}):`, ...evs.map((e) => `• ${e.item.head}`)];
  });

  return [
    {
      id: "forecast-month",
      title: "อนาคตใกล้: แนวโน้มรายเดือน",
      note: `ช่วง ${thaiDay(first)} ถึง ${thaiDay(last)} · นับมุมของดาวจรช้าและอังคารกับ${hasTime ? "ลัคนาและดาวเจ้าเรือนลัคน์" : "อาทิตย์และจันทร์กำเนิด"} (กติกานับแบบหยาบเพื่อดูแนวโน้ม)`,
      items: monthItems,
    },
    {
      id: "forecast-events",
      title: "อนาคตใกล้: ปฏิทินดาวจร",
      note: "ตำแหน่งดาวคำนวณวันละครั้งเวลา 12:00 น. วันที่ย้ายราศีหรือเปลี่ยนทิศทางจึงคลาดได้ราว ±1 วัน",
      items: events.length ? events.map((e) => e.item) : [{ text: "ไม่มีดาวย้ายราศีหรือเปลี่ยนทิศทางในช่วงนี้" }],
    },
  ];
}