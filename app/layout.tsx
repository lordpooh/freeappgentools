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
  title: "FreeAppGenTools - สร้าง QR Code ฟรี & เช็กดวงชะติตามลัคนาเกิด ไม่ต้องสมัครสมาชิก",
  description: "เครื่องมือออนไลน์ฟรี 100% ทั้งสร้าง QR Code ไม่ติดลายน้ำ และคำนวณผูกดวงหาลัคนาเกิดจริง ทำนายดวงชะตาล่วงหน้า 1 เดือนถึง 1 ปี ไม่ต้องลงทะเบียน ใช้งานได้ทันที ปลอดภัย",
  keywords: [
    "สร้าง QR Code ฟรี", 
    "สร้าง QR Code ไม่ต้องลงทะเบียน", 
    "สร้าง QR Code ไม่ต้องสมัครสมาชิก", 
    "free qr code generator no signup", 
    "เช็กดวงชะติตามลัคนาเกิด",
    "หาลัคนาเกิดจริง",
    "ทำนายดวงล่วงหน้า",
    "ทำนายดวงล่วงหน้า 1 เดือน",
    "ทำนายดวงล่วงหน้า 1 ปี",
    "ดูดวงฟรีไม่ต้องสมัครสมาชิก",
    "FreeAppGenTools"
  ],
  openGraph: {
    title: "FreeAppGenTools - สร้าง QR Code ฟรี & ค้นหาลัคนาเกิด ทำนายดวงล่วงหน้า",
    description: "รวมเครื่องมือออนไลน์ฟรี ไม่ว่าจะเป็นการสร้าง QR Code หรือคำนวณลัคนาเกิดตามเวลาจริง พร้อมทำนายดวงชะตาล่วงหน้า 1 เดือน - 1 ปี ไม่ต้องลงทะเบียน ดาวน์โหลด/ใช้งานได้ทันที",
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