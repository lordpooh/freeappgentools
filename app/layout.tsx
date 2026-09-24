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
  title: "FreeAppGenTools - สร้าง QR Code ฟรี ไม่ต้องลงทะเบียน ไม่ต้องสมัครสมาชิก",
  description: "เครื่องมือสร้าง QR Code ออนไลน์ฟรี 100% ไม่ต้องลงทะเบียน ไม่ติดลายน้ำ ใช้งานได้ทันที ปลอดภัย ไม่จำกัดจำนวนครั้ง",
  keywords: [
    "สร้าง QR Code ฟรี", 
    "สร้าง QR Code ไม่ต้องลงทะเบียน", 
    "สร้าง QR Code ไม่ต้องสมัครสมาชิก", 
    "free qr code generator no signup", 
    "FreeAppGenTools"
  ],
  openGraph: {
    title: "FreeAppGenTools - สร้าง QR Code ฟรี ไม่ต้องลงทะเบียน",
    description: "ใช้งานเครื่องมือออนไลน์ฟรี ไม่ต้องสมัครสมาชิก ไม่ติดลายน้ำ สร้างเสร็จดาวน์โหลดได้ทันที",
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