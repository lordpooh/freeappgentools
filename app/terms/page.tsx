import Link from "next/link";

export default function TermsOfService() {
  return (
    <main className="min-h-screen bg-slate-100 p-6 flex justify-center font-sans">
      <div className="bg-white max-w-2xl w-full rounded-2xl shadow-md p-8 text-slate-700 space-y-4">
        <h1 className="text-2xl font-bold text-slate-900 border-b pb-3">
          ข้อกำหนดและเงื่อนไขการใช้งาน (Terms of Service)
        </h1>

        <p className="text-sm leading-relaxed">
          ยินดีต้อนรับสู่เว็บไซต์ของเรา การเข้าใช้บริการถือว่าคุณได้ยอมรับข้อกำหนดและเงื่อนไขดังต่อไปนี้
        </p>

        <h2 className="text-base font-bold text-slate-800 pt-2">1. การใช้งานบริการ</h2>
        <p className="text-sm leading-relaxed">
          บริการสร้าง QR Code นี้เปิดให้ใช้งานได้ฟรีโดยไม่มีค่าใช้จ่าย คุณสามารถนำ QR Code ที่สร้างไปใช้ในเชิงพาณิชย์ หรือส่วนตัวได้โดยไม่มีข้อจำกัด และไม่มีลายน้ำติดไปกับรูปภาพ
        </p>

        <h2 className="text-base font-bold text-slate-800 pt-2">2. ข้อจำกัดความรับผิดชอบ</h2>
        <p className="text-sm leading-relaxed">
          ผู้ใช้ต้องตรวจสอบความถูกต้องของ Link หรือข้อมูลใน QR Code ก่อนนำไปใช้งานจริง ทางผู้พัฒนาจะไม่รับผิดชอบต่อความเสียหายใดๆ ที่เกิดขึ้นจากการนำ QR Code ไปใช้งานผิดพลาด
        </p>

        <h2 className="text-base font-bold text-slate-800 pt-2">3. การปรับปรุงบริการ</h2>
        <p className="text-sm leading-relaxed">
          ผู้พัฒนาขอสงวนสิทธิ์ในการปรับปรุง เปลี่ยนแปลง หรือหยุดให้บริการบางส่วนหรือทั้งหมด โดยไม่ต้องแจ้งให้ทราบล่วงหน้า
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