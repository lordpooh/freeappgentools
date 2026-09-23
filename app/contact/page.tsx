import Link from "next/link";

export default function Contact() {
  const myEmail = "lordpoohmaple@gmail.com"; // เปลี่ยนเป็นอีเมลของคุณ

  return (
    <main className="min-h-screen bg-slate-100 p-6 flex justify-center items-center font-sans">
      <div className="bg-white max-w-md w-full rounded-2xl shadow-md p-6 text-slate-700 space-y-4 text-left">
        <h1 className="text-xl font-bold text-slate-900 border-b pb-3">
          📬 ติดต่อเรา (Contact Us)
        </h1>

        <p className="text-xs leading-relaxed text-slate-600">
          หากพบปัญหาการใช้งาน มีข้อสงสัย หรือต้องการเสนอแนะฟังก์ชันใหม่ๆ สามารถส่งอีเมลถึงผู้พัฒนาได้โดยตรงครับ
        </p>

        {/* กล่องคำแนะนำและช่องทางติดต่อ */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
          <div>
            <p className="text-xs font-bold text-slate-800 mb-1">อีเมลผู้พัฒนา:</p>
            <p className="text-sm font-mono font-semibold text-blue-600 break-all">
              {myEmail}
            </p>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 text-[11px] text-amber-800 leading-relaxed">
            📌 <strong>คำแนะนำสำหรับการส่งอีเมล:</strong>
            <ul className="list-disc list-inside mt-1 space-y-0.5 text-slate-600">
              <li>กรณีส่งผ่านเว็บ Gmail กรุณา <strong>เข้าสู่ระบบ (Login)</strong> บัญชี Google ก่อนใช้งาน</li>
              <li>หากใช้งานบนสมาร์ตโฟน ระบบจะเปิดแอป Mail ในเครื่องให้อัตโนมัติ</li>
            </ul>
          </div>

          {/* ปุ่มกดส่งอีเมล */}
          <div className="pt-2 flex flex-col gap-2">
            <a
              href={`https://mail.google.com/mail/?view=cm&fs=1&to=${myEmail}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg text-xs transition"
            >
              ส่งอีเมลผ่าน Gmail (ต้อง Login ก่อน)
            </a>
            <a
              href={`mailto:${myEmail}`}
              className="w-full text-center bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold py-2 rounded-lg text-xs transition"
            >
              เปิดผ่านแอป Mail ในเครื่อง
            </a>
          </div>
        </div>

        <div className="pt-4 border-t text-center">
          <Link href="/" className="text-xs font-bold text-blue-600 hover:underline">
            ← กลับสู่หน้าหลัก
          </Link>
        </div>
      </div>
    </main>
  );
}