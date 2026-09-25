"use client";

import { useState, useEffect } from "react";
import QRCode from "qrcode";
import Link from "next/link";

export default function Home() {
  const [tab, setTab] = useState<"link" | "donate">("link");
  const [text, setText] = useState("https://example.com");
  const [qrUrl, setQrUrl] = useState("");

  // เบอร์พร้อมเพย์กรุงไทยของคุณสำหรับรับบริจาค
  const myPromptPayId = "0888501044"; 

  // ฟอร์ม Feedback
  const [feedback, setFeedback] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // สร้าง QR Code อัตโนมัติจาก Link / ข้อความ
  useEffect(() => {
   async function createQR() {
  try {
    const dataToEncode = text || "https://example.com";
    const url = await QRCode.toDataURL(dataToEncode, {
      width: 300,
      margin: 2,
      color: { dark: "#000000", light: "#ffffff" },
    });
    setQrUrl(url);

    // 🟢 ส่ง Event ไปยัง GA4 เมื่อสร้าง QR Code สำเร็จ
    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("event", "generate_qr", {
        event_category: "engagement",
        event_label: tab, // ระบุแท็บที่ใช้งาน (link / donate)
      });
    }
  } catch (err) {
    setQrUrl("");
  }
}

    if (tab === "link") {
      createQR();
    }
  }, [tab, text]);

  // ฟังก์ชันส่ง Feedback เข้า Google Sheets
  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedback.trim() || isSubmitting) return;

    setIsSubmitting(true);

    // 🔗 นำ Web app URL ที่คัดลอกมาจาก Google Apps Script มาวางแทนที่บรรทัดนี้
    const scriptUrl = "https://script.google.com/macros/s/AKfycbyuRCyObdlaKuYEwJRwvqBle8-Q3sLbw3ixuSHyoAJHwaftIJQPjjibR6u0aQNj4btW/exec";

    try {
      await fetch(scriptUrl, {
        method: "POST",
        mode: "no-cors",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ feedback }),
      });

      setIsSubmitted(true);
      setFeedback("");

      setTimeout(() => {
        setIsSubmitted(false);
      }, 4000);
    } catch (err) {
      console.error("Error submitting feedback:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-sans">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl p-6 text-center">
        <h1 className="text-2xl font-bold text-slate-800 mb-2">
          สร้าง QR Code ฟรี
        </h1>
        <p className="text-sm text-slate-500 mb-6">
          ไม่มีลายน้ำ • ไม่จำกัดจำนวนครั้ง • ปลอดภัย 100%
        </p>

        {/* ปุ่มสลับ Tab */}
        <div className="flex bg-slate-100 p-1 rounded-xl mb-6">
          <button
            onClick={() => setTab("link")}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition ${
              tab === "link"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-slate-600"
            }`}
          >
            สร้าง QR Code (Link)
          </button>
          <button
            onClick={() => setTab("donate")}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition ${
              tab === "donate"
                ? "bg-white text-amber-600 shadow-sm"
                : "text-slate-600"
            }`}
          >
            ☕ สนับสนุนผู้พัฒนา
          </button>
        </div>

        {/* เนื้อหาตาม Tab */}
        {tab === "link" ? (
          <div>
            {/* ฟอร์มกรอก Link */}
            <div className="space-y-4 text-left mb-6">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ใส่ Link หรือ ข้อความ:
                </label>
                <input
                  type="text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="https://yourwebsite.com"
                  className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* แสดงผล QR Code */}
            <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl p-4 min-h-[220px] flex items-center justify-center mb-4">
              {qrUrl ? (
                <img src={qrUrl} alt="Generated QR Code" className="w-48 h-48" />
              ) : (
                <p className="text-xs text-slate-400">กำลังสร้าง QR Code...</p>
              )}
            </div>

            {/* ปุ่มดาวน์โหลด */}
            {qrUrl && (
              <a
                href={qrUrl}
                download="qrcode.png"
                className="block w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-lg text-sm transition mb-6"
              >
                ดาวน์โหลดรูปภาพ (PNG)
              </a>
            )}
          </div>
        ) : (
          /* Tab สนับสนุนผู้พัฒนา */
          <div className="bg-amber-50/60 p-5 rounded-2xl border border-amber-200/60 mb-6">
            <h3 className="font-bold text-amber-800 text-base mb-1">
              ☕ เลี้ยงกาแฟผู้พัฒนา
            </h3>
            <p className="text-xs text-slate-600 mb-4">
              หากเครื่องมือนี้มีประโยชน์ สามารถร่วมสนับสนุนค่ากาแฟ/เซิร์ฟเวอร์ได้ครับ
            </p>
            <div className="flex justify-center mb-2">
              <img
                src={`https://promptpay.io/${myPromptPayId}.png`}
                alt="Donate PromptPay"
                className="w-44 h-44 rounded-xl shadow-md border bg-white p-2"
              />
            </div>
            <p className="text-[11px] text-slate-400">พร้อมเพย์ ธนาคารกรุงไทย</p>
          </div>
        )}

        {/* ฟอร์ม Feedback ขอฟังก์ชันฟรีเพิ่ม */}
        <div className="border-t pt-5 mt-2 text-left">
          <h4 className="text-xs font-bold text-slate-700 mb-1">
            💡 อยากได้เครื่องมือฟรีอะไรเพิ่มอีกไหม?
          </h4>
          <p className="text-[11px] text-slate-500 mb-2">
            พิมพ์เสนอไอเดียหรือฟังก์ชันที่อยากให้ทำเพิ่มได้เลยครับ
          </p>

          <form onSubmit={handleFeedbackSubmit} className="space-y-2">
            <textarea
              rows={2}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="เช่น อยากได้ระบบย่อลิงก์, แปลงไฟล์ PDF..."
              className="w-full p-2.5 text-xs border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-slate-800 hover:bg-slate-900 disabled:bg-slate-400 text-white font-semibold py-2 rounded-lg text-xs transition"
            >
              {isSubmitting ? "กำลังส่ง..." : "ส่งความเห็น"}
            </button>
          </form>

          {isSubmitted && (
            <p className="text-xs text-emerald-600 font-semibold mt-2 text-center animate-fade-in">
              ขอบคุณสำหรับความเห็นครับ! จะนำไปพัฒนาต่อแน่นอนครับ
            </p>
          )}
        </div>

        {/* Footer เพิ่มความน่าเชื่อถือ */}
        <footer className="mt-8 border-t pt-4 text-center text-[11px] text-slate-400 space-y-2">
          <p className="flex items-center justify-center gap-1">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
            ปลอดภัย 100% • ประมวลผลบนเครื่องของคุณ ไม่มีการบันทึกข้อมูลลงเซิร์ฟเวอร์
          </p>
          <div className="flex justify-center gap-4 text-slate-500 font-medium">
            <Link href="/privacy" className="hover:underline hover:text-blue-600">
              นโยบายความเป็นส่วนตัว
            </Link>
            <span>•</span>
            <Link href="/terms" className="hover:underline hover:text-blue-600">
              เงื่อนไขการใช้งาน
            </Link>
            <span>•</span>
            <Link href="/contact" className="hover:underline hover:text-blue-600">
              ติดต่อเรา
            </Link>
          </div>
          <p>© {new Date().getFullYear()} Thai Free Utility Tools. All rights reserved.</p>
        </footer>
      </div>
    </main>
  );
}