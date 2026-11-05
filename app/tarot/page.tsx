import Link from "next/link";

export default function Tarot() {
  return (
    <main className="min-h-screen bg-slate-100 p-6 flex justify-center font-sans">
      <div className="bg-white max-w-2xl w-full rounded-2xl shadow-md p-8 text-slate-700 space-y-4">
        <h1 className="text-2xl font-bold text-slate-900 border-b pb-3">
         กำลังพัฒนา... (Under Construction)
        </h1>
       

        <div className="pt-6 border-t text-center">
          <Link href="/" className="text-sm font-bold text-blue-600 hover:underline">
            ← กลับสู่หน้าหลัก
          </Link>
        </div>
      </div>
    </main>
  );
}