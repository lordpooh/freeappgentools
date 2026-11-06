// lib/tarot.ts
// ฟังก์ชันเปิดไพ่ทาโร่ 78 ใบ: สเปรด 4 ใบ และ 10 ใบ (Celtic Cross)
// รูปแบบผลลัพธ์ toItems() เข้ากับ Item { head, text, tone, sub } ของ predict.ts

export type Tone = "ดี" | "กลาง" | "ร้าย"; // ถ้า predict.ts export Tone อยู่แล้ว ให้ import มาแทน
export type SpreadKind = "four" | "ten";
export type Topic = "today" | "work" | "money" | "study" | "love";

export type Item = { head: string; text: string; tone: Tone; sub: string[] };

export type Card = {
  id: number;
  name: string; // ชื่อไทย
  en: string;
  arcana: "major" | "minor";
  suit?: "wands" | "cups" | "swords" | "pentacles";
  up: string; // ความหมายไพ่ตรง
  rev: string; // ความหมายไพ่กลับหัว
  toneUp: Tone;
  toneRev: Tone;
};

export type DrawnCard = {
  card: Card;
  reversed: boolean;
  position: string; // ชื่อตำแหน่ง
  hint: string; // ตำแหน่งนี้หมายถึงอะไร
  meaning: string;
  tone: Tone;
  topicNote: string; // คำอธิบายเฉพาะหัวข้อ (งาน/เงิน/เรียน/รัก/วันนี้)
};

export type SpreadResult = {
  kind: SpreadKind;
  topic: Topic;
  title: string;
  question?: string;
  cards: DrawnCard[];
  summary: string;
  tone: Tone;
};

/* ───────────── ข้อมูลไพ่ ───────────── */

// [ไทย, อังกฤษ, ตรง, กลับ, toneตรง, toneกลับ]
const MAJOR: [string, string, string, string, Tone, Tone][] = [
  ["เดอะฟูล", "The Fool", "จุดเริ่มต้นใหม่ กล้าลอง อิสระ", "ประมาท ตัดสินใจเร็วเกินไป", "ดี", "กลาง"],
  ["เดอะเมจิเชียน", "The Magician", "ความสามารถ ลงมือทำให้เป็นจริง", "ใช้ความสามารถผิดทาง หลอกลวง", "ดี", "ร้าย"],
  ["เดอะไฮเพรสเตส", "The High Priestess", "สัญชาตญาณ ความลับ ปัญญาภายใน", "ปิดกั้นตัวเอง ความลับถูกเปิดเผย", "กลาง", "กลาง"],
  ["เดอะเอมเพรส", "The Empress", "ความอุดมสมบูรณ์ ความรัก การเติบโต", "พึ่งพาเกินไป ความเฉื่อยชา", "ดี", "กลาง"],
  ["เดอะเอมเพอเรอร์", "The Emperor", "อำนาจ ความมั่นคง โครงสร้าง", "เผด็จการ ยึดติดกฎเกินไป", "ดี", "ร้าย"],
  ["เดอะไฮเยโรแฟนท์", "The Hierophant", "ประเพณี คำแนะนำจากผู้ใหญ่ ระบบ", "ฝ่าฝืนกรอบ ไม่ยอมรับคำสอน", "กลาง", "กลาง"],
  ["เดอะเลิฟเวอร์ส", "The Lovers", "ความรัก ความลงตัว การเลือกจากหัวใจ", "ไม่ลงรอย เลือกผิด ลังเล", "ดี", "ร้าย"],
  ["เดอะแชเรียต", "The Chariot", "ชัยชนะ ความมุ่งมั่น ควบคุมทิศทาง", "เสียการควบคุม ขาดทิศทาง", "ดี", "ร้าย"],
  ["สเตรงท์", "Strength", "ความกล้าหาญ ความอดทน เมตตา", "ขาดความมั่นใจ อ่อนล้า", "ดี", "กลาง"],
  ["เดอะเฮอร์มิต", "The Hermit", "ไตร่ตรอง หาคำตอบจากภายใน", "โดดเดี่ยวเกินไป หลีกหนี", "กลาง", "กลาง"],
  ["วีลออฟฟอร์จูน", "Wheel of Fortune", "โชคเปลี่ยน จังหวะชีวิตหมุนมาทางดี", "โชคขัดขวาง วัฏจักรซ้ำเดิม", "ดี", "กลาง"],
  ["จัสติส", "Justice", "ความยุติธรรม เหตุและผล ข้อตกลง", "ไม่เป็นธรรม หลบเลี่ยงความรับผิดชอบ", "กลาง", "ร้าย"],
  ["เดอะแฮงด์แมน", "The Hanged Man", "หยุดพัก มองต่างมุม เสียสละ", "ติดค้าง เสียเวลาโดยไม่ได้อะไร", "กลาง", "กลาง"],
  ["เดธ", "Death", "การสิ้นสุดเพื่อเริ่มใหม่ เปลี่ยนแปลงครั้งใหญ่", "ฝืนยึดของเก่า ต่อต้านการเปลี่ยนแปลง", "กลาง", "ร้าย"],
  ["เทมเพอแรนซ์", "Temperance", "สมดุล ความพอดี การเยียวยา", "เสียสมดุล สุดโต่ง", "ดี", "กลาง"],
  ["เดอะเดวิล", "The Devil", "พันธนาการ สิ่งเสพติด ความหลงใหลเกินพอดี", "เริ่มหลุดพ้นจากพันธนาการ", "ร้าย", "กลาง"],
  ["เดอะทาวเวอร์", "The Tower", "เหตุการณ์พลิกผัน สิ่งเก่าพังทลาย", "หนีไม่พ้นวิกฤต ผลกระทบยืดเยื้อ", "ร้าย", "ร้าย"],
  ["เดอะสตาร์", "The Star", "ความหวัง แรงบันดาลใจ การเยียวยา", "สิ้นหวัง ขาดศรัทธา", "ดี", "กลาง"],
  ["เดอะมูน", "The Moon", "ความไม่ชัดเจน ความกลัว ภาพลวง", "ความจริงเริ่มปรากฏ หายสับสน", "ร้าย", "กลาง"],
  ["เดอะซัน", "The Sun", "ความสำเร็จ ความสุข พลังบวก", "ความสุขล่าช้า มองโลกในแง่ดีเกินไป", "ดี", "กลาง"],
  ["จัดจ์เมนท์", "Judgement", "การตื่นรู้ ตัดสินใจครั้งสำคัญ เริ่มบทใหม่", "ลังเล ไม่ยอมเรียนรู้จากอดีต", "ดี", "กลาง"],
  ["เดอะเวิลด์", "The World", "ความสมบูรณ์ สำเร็จครบวงจร", "ใกล้สำเร็จแต่ยังขาดบางอย่าง", "ดี", "กลาง"],
];

const SUITS: Record<NonNullable<Card["suit"]>, { th: string; en: string; theme: string }> = {
  wands: { th: "ไม้เท้า", en: "Wands", theme: "งาน พลังขับเคลื่อน ความทะเยอทะยาน" },
  cups: { th: "ถ้วย", en: "Cups", theme: "ความรู้สึก ความรัก ความสัมพันธ์" },
  swords: { th: "ดาบ", en: "Swords", theme: "ความคิด การสื่อสาร ความขัดแย้ง" },
  pentacles: { th: "เหรียญ", en: "Pentacles", theme: "เงิน การงาน ความมั่นคง" },
};

// [ไทย, อังกฤษ, ตรง, กลับ, tone ตรง]
const RANKS: [string, string, string, string, Tone][] = [
  ["เอซ", "Ace", "โอกาสใหม่ เมล็ดพันธุ์ของสิ่งใหม่", "โอกาสพลาด เริ่มช้า", "ดี"],
  ["สอง", "Two", "ทางเลือก สมดุล ความร่วมมือ", "ลังเล เสียสมดุล", "กลาง"],
  ["สาม", "Three", "การเติบโต ความร่วมมือเริ่มเห็นผล", "ขาดความร่วมมือ ล่าช้า", "ดี"],
  ["สี่", "Four", "ความมั่นคง พักตั้งหลัก", "นิ่งเกินไป ยึดติด", "กลาง"],
  ["ห้า", "Five", "ความท้าทาย ความขัดแย้ง การสูญเสีย", "เริ่มผ่านพ้นความขัดแย้ง", "ร้าย"],
  ["หก", "Six", "การเปลี่ยนผ่าน ความช่วยเหลือ ฟื้นตัว", "ยังก้าวไม่พ้นอดีต", "ดี"],
  ["เจ็ด", "Seven", "การประเมิน ความพยายามต่อสู้ การป้องกัน", "ท้อ ถอดใจ กลยุทธ์ผิดพลาด", "กลาง"],
  ["แปด", "Eight", "การเคลื่อนไหว ความมุ่งมั่น ลงมือทำซ้ำ", "ติดขัด ล่าช้า รู้สึกถูกกัก", "กลาง"],
  ["เก้า", "Nine", "ใกล้ถึงเป้า ความอดทน ผลสะสม", "อ่อนล้า กังวลเกินไป", "กลาง"],
  ["สิบ", "Ten", "จุดสิ้นสุดของวัฏจักร ผลเต็มที่", "แบกภาระหนักเกินไป", "กลาง"],
  ["เพจ", "Page", "ข่าวสาร การเรียนรู้ ก้าวแรก", "ข่าวล่าช้า ขาดความจริงจัง", "ดี"],
  ["ไนท์", "Knight", "การเคลื่อนไหวเร็ว ลงมือทำ", "ใจร้อน ขาดแผน", "กลาง"],
  ["ควีน", "Queen", "ความเข้าใจ เติบโตจากภายใน ดูแลผู้อื่น", "อารมณ์แปรปรวน พึ่งพาเกินไป", "ดี"],
  ["คิง", "King", "ความเชี่ยวชาญ ควบคุมสถานการณ์ได้", "ใช้อำนาจผิดทาง เข้มงวดเกินไป", "ดี"],
];

function buildDeck(): Card[] {
  const deck: Card[] = MAJOR.map(([name, en, up, rev, toneUp, toneRev], i) => ({
    id: i, name, en, arcana: "major" as const, up, rev, toneUp, toneRev,
  }));
  let id = 22;
  for (const suit of Object.keys(SUITS) as (keyof typeof SUITS)[]) {
    const s = SUITS[suit];
    for (const [rTh, rEn, up, rev, tone] of RANKS) {
      // ดาบ: เลข 3,5,7,8,9,10 ค่อนไปทางหนัก
      const heavy = suit === "swords" && ["สาม", "ห้า", "เจ็ด", "แปด", "เก้า", "สิบ"].includes(rTh);
      const toneUp: Tone = heavy ? "ร้าย" : tone;
      const toneRev: Tone = toneUp === "ร้าย" ? "กลาง" : toneUp === "ดี" ? "กลาง" : "ร้าย";
      deck.push({
        id: id++,
        name: `${rTh}${s.th}`,
        en: `${rEn} of ${s.en}`,
        arcana: "minor",
        suit,
        up: `${up} (เรื่อง${s.theme})`,
        rev: `${rev} (เรื่อง${s.theme})`,
        toneUp,
        toneRev,
      });
    }
  }
  return deck;
}

export const DECK: Card[] = buildDeck(); // 78 ใบ

/* ───────────── สุ่ม / สับไพ่ ───────────── */

// seed: ใส่ string เพื่อให้ได้ผลเดิมทุกครั้ง (เช่น ชื่อ+วันเกิด+คำถาม) / ไม่ใส่ = สุ่มจริง
function makeRng(seed?: string): () => number {
  if (seed) {
    let h = 1779033703 ^ seed.length;
    for (let i = 0; i < seed.length; i++) {
      h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
      h = (h << 13) | (h >>> 19);
    }
    let a = h >>> 0;
    return () => {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    return () => crypto.getRandomValues(new Uint32Array(1))[0] / 4294967296;
  }
  return Math.random;
}

export function shuffleDeck(rng: () => number = makeRng()): Card[] {
  const d = [...DECK];
  for (let i = d.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [d[i], d[j]] = [d[j], d[i]];
  }
  return d;
}

/* ───────────── หัวข้อคำถาม ───────────── */

type Slot = { position: string; hint: string };
type Suit = NonNullable<Card["suit"]>;

export const TOPICS: Record<
  Topic,
  {
    label: string;
    short: string;
    emoji: string;
    example: string;
    suits: Suit[]; // ชุดไพ่ที่เกี่ยวข้องโดยตรงกับหัวข้อนี้
    lens: Record<Tone, string>;
    four: Slot[];
  }
> = {
  today: {
    label: "ภาพรวมวันนี้",
    short: "วันนี้",
    emoji: "🌤️",
    example: "เช่น วันนี้ควรระวังอะไร",
    suits: [],
    lens: {
      ดี: "วันนี้พลังค่อนข้างบวก เหมาะกับการเริ่มเรื่องสำคัญหรือพบปะผู้คน",
      กลาง: "วันนี้เป็นวันธรรมดา ใช้ชีวิตตามจังหวะของตัวเองและเก็บรายละเอียดให้ดี",
      ร้าย: "วันนี้ควรระวังอารมณ์และการตัดสินใจที่รีบร้อน เรื่องใหญ่ขอชะลอไว้ก่อน",
    },
    four: [
      { position: "พลังของวันนี้", hint: "บรรยากาศโดยรวมของวัน" },
      { position: "ข้อควรระวัง", hint: "สิ่งที่อาจสะดุดระหว่างวัน" },
      { position: "คำแนะนำของวัน", hint: "สิ่งที่ควรทำวันนี้" },
      { position: "ปิดท้ายวัน", hint: "แนวโน้มช่วงเย็นถึงค่ำ" },
    ],
  },
  work: {
    label: "งาน",
    short: "งาน",
    emoji: "💼",
    example: "เช่น งานใหม่ที่กำลังสมัครจะเป็นอย่างไร",
    suits: ["wands", "pentacles"],
    lens: {
      ดี: "งานมีแนวโน้มก้าวหน้า ควรใช้โอกาสนี้เสนอผลงาน ขอตำแหน่ง หรือสมัครงานใหม่",
      กลาง: "งานทรงตัว ใช้ช่วงนี้วางแผนและเก็บรายละเอียดให้แน่นก่อนขยับ",
      ร้าย: "ระวังความผิดพลาด ความขัดแย้งในทีม หรือภาระงานที่หนักเกินไป อย่าเพิ่งตัดสินใจใหญ่",
    },
    four: [
      { position: "สถานการณ์งาน", hint: "สิ่งที่เป็นอยู่ในงานตอนนี้" },
      { position: "อุปสรรคในงาน", hint: "สิ่งที่ขวางหรือยังมองไม่เห็น" },
      { position: "คำแนะนำด้านงาน", hint: "แนวทางที่ควรทำ" },
      { position: "ผลลัพธ์ด้านงาน", hint: "แนวโน้มที่จะเกิดขึ้น" },
    ],
  },
  money: {
    label: "การเงิน",
    short: "เงิน",
    emoji: "💰",
    example: "เช่น ควรลงทุนหรือเก็บเงินไว้ก่อน",
    suits: ["pentacles"],
    lens: {
      ดี: "การเงินมีโอกาสดี รายได้หรือโชคลาภอาจเข้ามา แต่ยังควรวางแผนใช้จ่ายให้รอบคอบ",
      กลาง: "การเงินทรงตัว ทบทวนรายรับรายจ่ายและเก็บออมสม่ำเสมอ",
      ร้าย: "ระวังรายจ่ายเกินตัว การลงทุนเสี่ยง หรือการยืมให้ยืม ควรเก็บเงินสำรองไว้",
    },
    four: [
      { position: "สถานะการเงิน", hint: "ภาพรวมการเงินตอนนี้" },
      { position: "จุดรั่วไหล / ความเสี่ยง", hint: "สิ่งที่ทำให้เงินติดขัด" },
      { position: "แนวทางจัดการเงิน", hint: "สิ่งที่ควรทำกับเงิน" },
      { position: "แนวโน้มการเงิน", hint: "ทิศทางที่จะเป็นไป" },
    ],
  },
  study: {
    label: "การเรียน",
    short: "เรียน",
    emoji: "📚",
    example: "เช่น การสอบรอบนี้จะเป็นอย่างไร",
    suits: ["swords"],
    lens: {
      ดี: "การเรียนไปได้ดี สมาธิและความเข้าใจดี เหมาะกับการสอบหรือเริ่มเรียนเรื่องใหม่",
      กลาง: "ต้องใช้ความสม่ำเสมอ ทบทวนจุดอ่อนก่อนเดินหน้าต่อ",
      ร้าย: "ระวังความฟุ้งซ่าน การเลื่อนงาน หรือกดดันตัวเองเกินไป ลองแบ่งงานเป็นส่วนเล็ก ๆ",
    },
    four: [
      { position: "สถานการณ์การเรียน", hint: "ความพร้อมและสภาพตอนนี้" },
      { position: "จุดที่ติดขัด", hint: "สิ่งที่ทำให้ไปไม่ถึงเป้า" },
      { position: "วิธีที่ควรทำ", hint: "แนวทางการเรียน/อ่านหนังสือ" },
      { position: "ผลลัพธ์การเรียน", hint: "แนวโน้มผลที่จะได้" },
    ],
  },
  love: {
    label: "ความรัก",
    short: "รัก",
    emoji: "💗",
    example: "เช่น ความสัมพันธ์นี้ไปต่อได้ไหม",
    suits: ["cups"],
    lens: {
      ดี: "ความสัมพันธ์อบอุ่น มีโอกาสเข้าใจกันมากขึ้น หรืออาจได้พบคนที่ใช่ถ้ายังโสด",
      กลาง: "ยังต้องใช้เวลา ลองเปิดใจและสื่อสารตรงไปตรงมา",
      ร้าย: "ระวังความเข้าใจผิดและอารมณ์ชั่ววูบ ลองฟังอีกฝ่ายก่อนตัดสินใจ",
    },
    four: [
      { position: "สถานการณ์ความรัก", hint: "สิ่งที่เป็นอยู่ในความสัมพันธ์/ใจคุณ" },
      { position: "อุปสรรคในใจ/ความสัมพันธ์", hint: "สิ่งที่ขวางหรือซ่อนอยู่" },
      { position: "คำแนะนำด้านความรัก", hint: "สิ่งที่ควรทำ" },
      { position: "แนวโน้มความรัก", hint: "ทิศทางที่จะเป็นไป" },
    ],
  },
};

function topicNote(card: Card, tone: Tone, topic: Topic): string {
  const t = TOPICS[topic];
  const parts = [t.lens[tone]];
  if (card.suit && t.suits.includes(card.suit)) {
    parts.push(`ไพ่ชุด${SUITS[card.suit].th}เกี่ยวข้องกับเรื่องนี้โดยตรง ให้น้ำหนักเป็นพิเศษ`);
  } else if (card.arcana === "major") {
    parts.push("ไพ่เมเจอร์ บ่งชี้เรื่องสำคัญที่มีน้ำหนักกว่าปกติ");
  }
  return parts.join(" ");
}

/* ───────────── รูปแบบการเปิดไพ่ ───────────── */

export const SPREADS: Record<SpreadKind, { title: string; slots: Slot[] }> = {
  four: {
    title: "ไพ่ 4 ใบ",
    slots: TOPICS.today.four, // ค่าเริ่มต้น (จริง ๆ ใช้ตามหัวข้อใน drawSpread)
  },
  ten: {
    title: "ไพ่ 10 ใบ (Celtic Cross)",
    slots: [
      { position: "1. ปัจจุบัน", hint: "หัวใจของเรื่องในตอนนี้" },
      { position: "2. อุปสรรค", hint: "สิ่งที่มาทับ/ขวางอยู่" },
      { position: "3. รากฐาน", hint: "ต้นเหตุหรือรากของเรื่อง" },
      { position: "4. อดีตที่ผ่านมา", hint: "สิ่งที่เพิ่งผ่านไปและยังส่งผล" },
      { position: "5. เป้าหมาย / ความคาดหวัง", hint: "สิ่งที่คุณมุ่งหวังหรือสิ่งที่เป็นไปได้สูงสุด" },
      { position: "6. อนาคตอันใกล้", hint: "สิ่งที่กำลังจะเข้ามา" },
      { position: "7. ตัวคุณ", hint: "ท่าที/มุมมองของคุณต่อเรื่องนี้" },
      { position: "8. สภาพแวดล้อม", hint: "คนรอบข้างและปัจจัยภายนอก" },
      { position: "9. ความหวังและความกลัว", hint: "ความรู้สึกลึก ๆ ที่ซ่อนอยู่" },
      { position: "10. ผลลัพธ์", hint: "บทสรุปถ้าทุกอย่างดำเนินต่อไป" },
    ],
  },
};

const SCORE: Record<Tone, number> = { ดี: 1, กลาง: 0, ร้าย: -1 };

function overallTone(cards: DrawnCard[]): Tone {
  const total = cards.reduce((n, c) => n + SCORE[c.tone], 0);
  const avg = total / cards.length;
  return avg > 0.25 ? "ดี" : avg < -0.25 ? "ร้าย" : "กลาง";
}

function buildSummary(kind: SpreadKind, cards: DrawnCard[], tone: Tone, topic: Topic): string {
  const t = TOPICS[topic];
  const major = cards.filter((c) => c.card.arcana === "major").length;
  const rev = cards.filter((c) => c.reversed).length;
  const direct = cards.filter((c) => c.card.suit && t.suits.includes(c.card.suit)).length;
  const parts: string[] = [];

  const last = cards[cards.length - 1];
  parts.push(
    `ปลายทางของ${t.label}คือ ${last.card.name}${last.reversed ? " (กลับหัว)" : ""}: ${last.meaning}`,
  );

  if (kind === "four") {
    const advice = cards[2];
    parts.push(`คำแนะนำหลักจาก ${advice.card.name}: ${advice.meaning}`);
  } else {
    const [now, block] = cards;
    parts.push(`เรื่องนี้เริ่มจาก ${now.card.name} แต่มี ${block.card.name} เป็นตัวขวาง`);
  }

  if (direct >= 2) {
    parts.push(`มีไพ่ชุดที่ตรงกับ${t.label}ถึง ${direct} ใบ แสดงว่าเป็นประเด็นหลักของคำถามนี้จริง ๆ`);
  }
  if (major >= Math.ceil(cards.length / 2)) {
    parts.push("ไพ่เมเจอร์เยอะ แปลว่าเรื่องนี้มีน้ำหนักและเกี่ยวกับจุดเปลี่ยนสำคัญ");
  } else if (major === 0) {
    parts.push("ไม่มีไพ่เมเจอร์เลย เป็นเรื่องในชีวิตประจำวัน แก้ได้ด้วยการลงมือทำ");
  }
  if (rev > cards.length / 2) {
    parts.push("ไพ่กลับหัวเกินครึ่ง พลังยังติดขัดหรือถูกกดไว้ภายใน");
  }

  parts.push(`โดยรวมโน้มไปทาง "${tone}": ${t.lens[tone]}`);
  return parts.join(" · ");
}

/* ───────────── ฟังก์ชันหลัก ───────────── */

export type DrawOptions = {
  topic?: Topic; // ค่าเริ่มต้น "today"
  question?: string;
  seed?: string; // ใส่เพื่อให้ผลซ้ำได้
  allowReversed?: boolean; // ค่าเริ่มต้น true
  deck?: Card[]; // สำรับที่สับไว้แล้ว (ไม่ใส่ = สับใหม่ให้ในฟังก์ชัน)
};

export function drawSpread(kind: SpreadKind, opts: DrawOptions = {}): SpreadResult {
  const { topic = "today", question, seed, allowReversed = true, deck: givenDeck } = opts;
  const rng = makeRng(seed);
  const spread = SPREADS[kind];
  const slots = kind === "four" ? TOPICS[topic].four : spread.slots;
  const deck = givenDeck ?? shuffleDeck(rng);

  const cards: DrawnCard[] = slots.map((slot, i) => {
    const card = deck[i];
    const reversed = allowReversed && rng() < 0.5;
    const tone = reversed ? card.toneRev : card.toneUp;
    return {
      card,
      reversed,
      position: slot.position,
      hint: slot.hint,
      meaning: reversed ? card.rev : card.up,
      tone,
      topicNote: topicNote(card, tone, topic),
    };
  });

  const tone = overallTone(cards);
  return {
    kind,
    topic,
    title: `${spread.title} · ${TOPICS[topic].label}`,
    question,
    cards,
    summary: buildSummary(kind, cards, tone, topic),
    tone,
  };
}

export const drawFour = (opts?: DrawOptions) => drawSpread("four", opts);
export const drawTen = (opts?: DrawOptions) => drawSpread("ten", opts);

/* ───────────── แปลงเป็น Item ให้เข้ากับ predict.ts ───────────── */

export function toItems(r: SpreadResult): Item[] {
  return r.cards.map((c) => ({
    head: `${c.position} · ${c.card.name}${c.reversed ? " (กลับหัว)" : ""}`,
    text: c.meaning,
    tone: c.tone,
    sub: [c.card.en, `ตำแหน่งนี้: ${c.hint}`, `${TOPICS[r.topic].label}: ${c.topicNote}`],
  }));
}