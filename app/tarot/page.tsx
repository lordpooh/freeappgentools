import type { Metadata } from "next";
import TarotClient from "./TarotClient";

export const metadata: Metadata = {
  title: "ดูดวงไพ่ทาโร่ออนไลน์ฟรี เปิดไพ่ยิปซี 4 ใบ / Celtic Cross 10 ใบ",
  description:
    "ดูดวงไพ่ทาโร่ออนไลน์ฟรี สับไพ่เอง เปิดไพ่ยิปซี 4 ใบหรือ Celtic Cross 10 ใบ ทำนายความรัก การงาน การเงิน พร้อมตอบคำถามและทำนายโอกาส ไม่ต้องสมัครสมาชิก",
  keywords: [
    "ดูดวงไพ่ทาโร่",
    "ดูดวงไพ่ทาโร่ออนไลน์ฟรี",
    "เปิดไพ่ยิปซี",
    "ไพ่ยิปซีออนไลน์",
    "ดูดวงไพ่ยิปซี Celtic Cross",
    "ทำนายไพ่ทาโร่",
    "ดูดวงความรัก ไพ่ทาโร่",
  ],
  alternates: { canonical: "/tarot" },
  openGraph: {
    title: "ดูดวงไพ่ทาโร่ออนไลน์ฟรี | FreeAppGenTools",
    description:
      "สับไพ่เอง เปิดไพ่ยิปซี 4 ใบหรือ 10 ใบ ทำนายความรัก การงาน การเงิน ฟรี ไม่ต้องสมัครสมาชิก",
    url: "/tarot",
    siteName: "FreeAppGenTools",
    type: "website",
    locale: "th_TH",
  },
  robots: { index: true, follow: true },
};export default function TarotPage() {
  return <TarotClient />;
}