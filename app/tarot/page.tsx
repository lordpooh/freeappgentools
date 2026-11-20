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
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebApplication",
      name: "ดูดวงไพ่ทาโร่ออนไลน์",
      url: "https://freeappgentools.com/tarot",
      applicationCategory: "EntertainmentApplication",
      operatingSystem: "Web",
      inLanguage: "th",
      offers: { "@type": "Offer", price: "0", priceCurrency: "THB" },
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "หน้าแรก", item: "https://freeappgentools.com" },
        { "@type": "ListItem", position: 2, name: "ดูดวงไพ่ทาโร่", item: "https://freeappgentools.com/tarot" },
      ],
    },
  ],
};

export default function TarotPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <TarotClient />

      {/* เนื้อหาข้อความให้ Google อ่าน (render ฝั่งเซิร์ฟเวอร์) */}
      <section className="bg-slate-100 px-4 pb-12">
        <div className="mx-auto max-w-3xl rounded-2xl bg-white p-6 text-sm leading-relaxed text-slate-700 shadow">
          <h2 className="mb-2 text-base font-bold text-slate-800">
            ดูดวงไพ่ทาโร่ออนไลน์ฟรี ทำนายแม่นแค่ไหน?
          </h2>
          <p className="mb-4">
            ไพ่ทาโร่ (ไพ่ยิปซี) เป็นเครื่องมือสำหรับสะท้อนความคิดและมองสถานการณ์ในหลายมุม
            เหมาะกับการใช้เป็นแนวทางประกอบการตัดสินใจเรื่องความรัก การงาน การเงิน และดวงรายวัน
            เว็บนี้ให้คุณสับไพ่เอง เปิดไพ่ทีละใบ และอ่านคำทำนายได้ทันที ไม่ต้องสมัครสมาชิก
          </p>

          <h2 className="mb-2 text-base font-bold text-slate-800">
            เลือกวิธีเปิดไพ่ได้ 2 แบบ
          </h2>
          <ul className="mb-4 list-disc space-y-1 pl-5">
            <li>
              <strong>ไพ่ 4 ใบ</strong> ดูภาพรวมเร็ว: สถานการณ์ อุปสรรค คำแนะนำ และผลลัพธ์
            </li>
            <li>
              <strong>ไพ่ 10 ใบ (Celtic Cross)</strong> ลงลึกอดีต ปัจจุบัน อนาคต และความรู้สึกลึก ๆ
            </li>
          </ul>

          <h2 className="mb-2 text-base font-bold text-slate-800">วิธีดูดวงไพ่ทาโร่</h2>
          <ol className="mb-4 list-decimal space-y-1 pl-5">
            <li>เลือกหัวข้อที่อยากรู้ เช่น ความรัก การงาน การเงิน หรือดวงวันนี้</li>
            <li>พิมพ์คำถาม (ไม่ใส่ก็ได้) แล้วตั้งสมาธิกับเรื่องนั้น</li>
            <li>กดสับไพ่จนรู้สึกพอ แล้วกด “เริ่มเปิดไพ่”</li>
            <li>แตะเปิดไพ่ทีละใบ อ่านความหมาย คำตอบ และการทำนายโอกาส</li>
          </ol>

          <h2 className="mb-2 text-base font-bold text-slate-800">คำถามที่พบบ่อย</h2>
          <h3 className="font-semibold text-slate-800">ใช้ฟรีจริงไหม ต้องสมัครสมาชิกหรือเปล่า?</h3>
          <p className="mb-2">ฟรีทั้งหมด ไม่ต้องสมัครสมาชิกหรือเข้าสู่ระบบ</p>
          <h3 className="font-semibold text-slate-800">ไพ่กลับหัวหมายความว่าอย่างไร?</h3>
          <p className="mb-2">
            ไพ่กลับหัวมักสื่อถึงพลังที่ติดขัด ล่าช้า หรือควรระวัง ระบบจะแสดงความหมายของแต่ละใบให้
          </p>
          <h3 className="font-semibold text-slate-800">เซฟผลทำนายได้ไหม?</h3>
          <p>เซฟเป็นรูป A4 พิมพ์/เซฟ PDF หรือดาวน์โหลดเป็นไฟล์ข้อความได้</p>
        </div>
      </section>
    </>
  );
}