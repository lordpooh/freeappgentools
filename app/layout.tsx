import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
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
  metadataBase: new URL("https://freeappgentools.com"),
  title: {
    default: "FreeAppGenTools - สร้าง QR Code ฟรี, เช็กดวงลัคนาเกิด & ดูดวงไพ่ทาโร่",
    template: "%s | FreeAppGenTools",
  },
  description:
    "เครื่องมือออนไลน์ฟรี 100% สร้าง QR Code ไม่ติดลายน้ำ คำนวณผูกดวงหาลัคนาเกิดจริง ทำนายดวงล่วงหน้า และดูดวงไพ่ทาโร่ออนไลน์ ไม่ต้องสมัครสมาชิก ใช้งานได้ทันที",
  keywords: [
    "สร้าง QR Code ฟรี",
    "สร้าง QR Code ไม่ต้องลงทะเบียน",
    "สร้าง QR Code ไม่ต้องสมัครสมาชิก",
    "free qr code generator no signup",
    "เช็กดวงชะตาตามลัคนาเกิด",
    "หาลัคนาเกิดจริง",
    "ทำนายดวงล่วงหน้า",
    "ทำนายไพ่ทาโร่",
    "ดูดวงไพ่ทาโร่ออนไลน์ฟรี",
    "เปิดไพ่ยิปซี",
    "ดูดวงฟรีไม่ต้องสมัครสมาชิก",
    "FreeAppGenTools",
  ],
  openGraph: {
    title: "FreeAppGenTools - สร้าง QR Code ฟรี, ค้นหาลัคนาเกิด & ทำนายไพ่ทาโร่",
    description:
      "รวมเครื่องมือออนไลน์ฟรี สร้าง QR Code คำนวณลัคนาเกิด และทำนายดวงไพ่ทาโร่ออนไลน์ ไม่ต้องลงทะเบียน ใช้งานได้ทันที",
    url: "https://freeappgentools.com",
    siteName: "FreeAppGenTools",
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="th"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <GoogleAnalytics gaId="G-KYKHVFKJEH" />
      </body>
    </html>
  );
}