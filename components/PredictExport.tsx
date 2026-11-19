"use client";

import { useRef, useState } from "react";
import type { Bucket } from "../lib/house-voice";

export type ExportCard = { head: string; text?: string; tone?: string; bucket: Bucket };
export type ExportItem = { head?: string; text?: string; tone?: string; lines: string[] };
export type ExportSection = { title: string; note?: string; items: ExportItem[] };

type Props = {
  title: string;
  subtitle: string;
  cards: ExportCard[]; // วันนี้ / เดือนนี้ / ปีนี้
  sections: ExportSection[]; // รายงานฉบับเต็ม
  fileBase: string;
};

const TONE_COLOR: Record<string, { bg: string; fg: string }> = {
  ดี: { bg: "#d1fae5", fg: "#065f46" },
  ร้าย: { bg: "#fee2e2", fg: "#991b1b" },
  ผสม: { bg: "#fef3c7", fg: "#92400e" },
  กลาง: { bg: "#e5e7eb", fg: "#374151" },
};
const FONT = '"Noto Sans Thai","Leelawadee UI",Sarabun,Tahoma,sans-serif';

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

function bucketRows(b: Bucket): { label: string; color: string; lines: string[] }[] {
  return [
    { label: "ดี", color: "#059669", lines: b.good },
    { label: "ปนกัน", color: "#d97706", lines: b.mixed },
    { label: "ระวัง", color: "#dc2626", lines: b.bad },
    { label: "เหมาะกับ", color: "#2563eb", lines: b.suit },
    { label: "ควรเลี่ยง", color: "#6b7280", lines: b.avoid },
  ].filter((r) => r.lines.length > 0);
}

function buildReportHtml({ title, subtitle, cards, sections }: Props) {
  const css = `
  body{font-family:${FONT};max-width:820px;margin:24px auto;padding:0 16px;color:#1f2937;line-height:1.7}
  h1{color:#5b3f10;margin-bottom:0} .sub{color:#6b7280;margin-top:4px}
  h2{border-bottom:2px solid #8a6d3b;padding-bottom:4px;color:#5b3f10;margin-top:32px}
  .card{border:1px solid #d6c9a8;border-radius:10px;padding:12px 16px;margin:12px 0;break-inside:avoid;background:#fffdf7}
  .tag{display:inline-block;border-radius:4px;padding:0 8px;font-size:12px;font-weight:700;margin-left:8px}
  .row b{display:inline-block;min-width:76px}
  .item{margin:10px 0;padding-left:12px;border-left:3px solid #d6c9a8;break-inside:avoid}
  .muted{color:#6b7280;font-size:14px} ul{margin:4px 0 4px 20px;padding:0}
  .foot{margin-top:32px;font-size:12px;color:#6b7280}
  @media print{body{margin:0}}`;
  const tag = (t?: string) => {
    if (!t || t === "กลาง") return "";
    const c = TONE_COLOR[t] ?? TONE_COLOR["กลาง"];
    return `<span class="tag" style="background:${c.bg};color:${c.fg}">${esc(t)}</span>`;
  };
  const cardHtml = cards
    .map(
      (c) => `<div class="card"><h3 style="margin:0">${esc(c.head)}${tag(c.tone)}</h3>
      <p style="margin:4px 0 8px"><b>${esc(c.bucket.verdict || c.text || "")}</b></p>
      ${bucketRows(c.bucket)
        .map((r) => `<div class="row"><b style="color:${r.color}">${r.label}</b><ul style="display:inline-block;vertical-align:top;margin:0">${r.lines.map((l) => `<li>${esc(l)}</li>`).join("")}</ul></div>`)
        .join("")}</div>`
    )
    .join("");
  const secHtml = sections
    .map(
      (s) => `<h2>${esc(s.title)}</h2>${s.note ? `<p class="muted">${esc(s.note)}</p>` : ""}
      ${s.items
        .map(
          (i) => `<div class="item">${i.head ? `<b>${esc(i.head)}</b>${tag(i.tone)}` : ""}
          ${i.text ? `<div class="muted">${esc(i.text)}</div>` : ""}
          ${i.lines.length ? `<ul>${i.lines.map((l) => `<li>${esc(l)}</li>`).join("")}</ul>` : ""}</div>`
        )
        .join("")}`
    )
    .join("");
  return `<!doctype html><html lang="th"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title><style>${css}</style></head><body>
  <h1>${esc(title)}</h1><p class="sub">${esc(subtitle)}</p>
  <h2>สรุปภาพรวม</h2>${cardHtml}${secHtml}
  <p class="foot">แปลผลตามกฎโหราศาสตร์ระบบพลูหลวงแบบกว้าง ๆ ใช้ประกอบการพิจารณาเท่านั้น ไม่ใช่การยืนยันเหตุการณ์ และไม่ควรใช้ตัดสินใจเรื่องสุขภาพ กฎหมาย หรือการเงิน</p>
  </body></html>`;
}

export default function PredictExport(props: Props) {
  const { title, subtitle, cards, fileBase } = props;
  const shot = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function savePng() {
    if (!shot.current) return;
    setBusy(true);
    setErr("");
    try {
      const { toPng } = await import("html-to-image");
      if (document.fonts?.ready) await document.fonts.ready;
      const url = await toPng(shot.current, { pixelRatio: 2, cacheBust: true, backgroundColor: "#fffaf0" });
      const a = document.createElement("a");
      a.href = url;
      a.download = `${fileBase}-summary.png`;
      a.click();
    } catch {
      setErr("สร้างรูปไม่สำเร็จ ลองใหม่อีกครั้ง");
    } finally {
      setBusy(false);
    }
  }

  const saveReport = () =>
    download(new Blob([buildReportHtml(props)], { type: "text/html;charset=utf-8" }), `${fileBase}-report.html`);

  function printReport() {
    const w = window.open("", "_blank");
    if (!w) return setErr("เบราว์เซอร์บล็อกหน้าต่างใหม่ กรุณาอนุญาต pop-up");
    w.document.open();
    w.document.write(buildReportHtml(props));
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 400);
  }

  const btn =
    "rounded-lg border border-[#8a6d3b] px-3 py-2 text-sm font-semibold text-[#8a6d3b] hover:bg-[#8a6d3b] hover:text-white disabled:opacity-50";

  return (
    <div className="rounded-xl border border-neutral-200 p-3 dark:border-neutral-800">
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={savePng} disabled={busy} className={btn}>
          {busy ? "กำลังสร้างรูป..." : "🖼️ ดาวน์โหลดรูปสรุป (PNG)"}
        </button>
        <button type="button" onClick={saveReport} className={btn}>
          📄 ดาวน์โหลดรายงาน (HTML)
        </button>
        <button type="button" onClick={printReport} className={btn}>
          🖨️ พิมพ์ / บันทึกเป็น PDF
        </button>
      </div>
      {err && <p className="mt-2 text-sm text-red-600">{err}</p>}

      {/* การ์ดสำหรับถ่ายเป็นรูป: วางนอกจอ ใช้ inline style เพื่อให้ได้ภาพเหมือนกันทุกธีม */}
      <div style={{ position: "fixed", left: -10000, top: 0, pointerEvents: "none" }} aria-hidden>
        <div ref={shot} style={{ width: 720, padding: 28, background: "#fffaf0", fontFamily: FONT, color: "#1f2937" }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#5b3f10" }}>{title}</div>
          <div style={{ fontSize: 15, color: "#6b7280", marginBottom: 16 }}>{subtitle}</div>
          {cards.map((c, i) => {
            const tc = TONE_COLOR[c.tone ?? "กลาง"] ?? TONE_COLOR["กลาง"];
            return (
              <div key={i} style={{ border: "1.5px solid #8a6d3b", borderRadius: 14, background: "#fffdf7", padding: 16, marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                  <div style={{ fontSize: 20, fontWeight: 700 }}>{c.head}</div>
                  {c.tone && c.tone !== "กลาง" && (
                    <div style={{ background: tc.bg, color: tc.fg, borderRadius: 6, padding: "2px 12px", fontWeight: 700, fontSize: 15 }}>{c.tone}</div>
                  )}
                </div>
                <div style={{ fontSize: 16, fontWeight: 600, margin: "6px 0 10px" }}>{c.bucket.verdict || c.text}</div>
                {bucketRows(c.bucket)
                  .slice(0, 5)
                  .map((r, j) => (
                    <div key={j} style={{ display: "flex", gap: 10, marginBottom: 6, fontSize: 14.5, lineHeight: 1.5 }}>
                      <div style={{ minWidth: 76, fontWeight: 700, color: r.color }}>{r.label}</div>
                      <div>{r.lines.slice(0, 3).join(" · ")}</div>
                    </div>
                  ))}
              </div>
            );
          })}
          <div style={{ fontSize: 12, color: "#8a7a58", textAlign: "center", marginTop: 8 }}>
            โหราศาสตร์ไทย ระบบพลูหลวง · ใช้ประกอบการพิจารณาเท่านั้น
          </div>
        </div>
      </div>
    </div>
  );
}