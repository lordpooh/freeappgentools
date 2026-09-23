import Link from "next/link";

export default function PrivacyPolicy() {
  return (
    <main className="min-h-screen bg-slate-100 p-6 flex justify-center font-sans">
      <div className="bg-white max-w-2xl w-full rounded-2xl shadow-md p-8 text-slate-700 space-y-4">
        <h1 className="text-2xl font-bold text-slate-900 border-b pb-3">
          นโยบายความเป็นส่วนตัว (Privacy Policy)
        </h1>
        
        <p className="text-sm leading-relaxed">
          เว็บไซต์นี้ให้ความสำคัญกับความเป็นส่วนตัวของผู้ใช้งานเป็นอย่างยิ่ง 
          นโยบายความเป็นส่วนตัวนี้อธิบายถึงวิธีการจัดการและปกป้องข้อมูลของคุณ
        </p>

        <h2 className="text-base font-bold text-slate-800 pt-2">1. การเก็บรวบรวมข้อมูล</h2>
        <p className="text-sm leading-relaxed">
          เครื่องมือสร้าง QR Code ของเราประมวลผลผ่านเว็บเบราว์เซอร์ของคุณโดยตรง (Client-side Processing) 
          เรา <strong className="font-semibold text-slate-900">ไม่มีการบันทึก เก็บรวบรวม หรือส่งต่อ</strong> ข้อความ ลิงก์ หรือข้อมูลใดๆ ที่คุณกรอกเข้าสู่เซิร์ฟเวอร์ของเรา
        </p>

        <h2 className="text-base font-bold text-slate-800 pt-2">2. คุกกี้และเทคโนโลยีการติดตาม (Cookies)</h2>
        <p className="text-sm leading-relaxed">
          เราอาจใช้บริการวิเคราะห์ทราฟฟิก (เช่น Google Analytics หรือ Cloudflare Analytics) และบริการโฆษณา (เช่น Google AdSense) 
          ซึ่งอาจมีการใช้ คุกกี้ (Cookies) เพื่อเก็บสถิติการเข้าชมเว็บแบบไม่ระบุตัวตน เพื่อปรับปรุงประสบการณ์การใช้งานและการแสดงโฆษณาที่เหมาะสม
        </p>

        <h2 className="text-base font-bold text-slate-800 pt-2">3. ลิงก์ไปยังเว็บไซต์ภายนอก</h2>
        <p className="text-sm leading-relaxed">
          เว็บไซต์ของเราอาจมีลิงก์เชื่อมโยงไปยังเว็บไซต์อื่น เราไม่มีส่วนรับผิดชอบต่อเนื้อหาหรือนโยบายความเป็นส่วนตัวของเว็บไซต์ภายนอกเหล่านั้น
        </p>

        <div className="pt-6 border-t text-center">
          <Link href="/" className="text-sm font-bold text-blue-600 hover:underline">
            ← กลับสู่หน้าหลัก
          </Link>
        </div>
      </div>
    </main>
  );
}