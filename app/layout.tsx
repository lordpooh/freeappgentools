import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
// 1. import GoogleAnalytics เข้ามา
import { GoogleAnalytics } from "@next/third-parties/google";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "รวมเครื่องมือออนไลน์ฟรี ไม่ต้องสมัครสมาชิก | FreeAppGenTools",
  description: "รวมเครื่องมือช่วยเหลือออนไลน์ใช้งานฟรี 100% สร้าง QR Code, แปลงไฟล์, เครื่องมือ Developer สะดวก รวดเร็ว ปลอดภัย",
  keywords: ["เครื่องมือออนไลน์ฟรี", "สร้าง QR Code ฟรี", "free online tools", "freeappgentools"],
  openGraph: {
    title: "รวมเครื่องมือออนไลน์ฟรี | FreeAppGenTools",
    description: "ใช้งานเครื่องมือออนไลน์ฟรี ไม่ติดลายน้ำ ไม่ต้องสมัครสมาชิก",
    url: "https://freeappgentools.com",
    siteName: "FreeAppGenTools",
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        {/* 2. แทรกส่วนนี้เข้าไปก่อนปิด </body> (อย่าลืมเปลี่ยน G-XXXXXXXXXX เป็น ID จริง) */}
        <GoogleAnalytics gaId="G-KYKHVFKJEH" />
      </body>
    </html>
  );
}