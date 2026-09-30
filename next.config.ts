import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ให้ Node โหลด sweph-wasm ตรง ๆ จาก node_modules แทนการ bundle
  serverExternalPackages: ["sweph-wasm"],
  // ให้ไฟล์ .wasm ถูกรวมไปกับ deploy (เช่น Vercel) เพราะเราอ่านด้วย fs
  outputFileTracingIncludes: {
    "/api/astro": ["./node_modules/sweph-wasm/dist/wasm/swisseph.wasm"],
    "/astro": ["./node_modules/sweph-wasm/dist/wasm/swisseph.wasm"],
  },
};

export default nextConfig;
