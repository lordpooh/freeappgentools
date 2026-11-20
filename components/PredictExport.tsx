"use client";

import { useRef, useState } from "react";
import type { Bucket } from "../lib/house-voice";

export type ExportCard = { head: string; text?: string; tone?: string; bucket: Bucket };
export type ExportItem = { head?: string; text?: string; tone?: string; lines: string[] };
export type ExportSection = { title: string; note?: string; items: ExportItem[] };
export type GraphPoint = { dateLabel: string; score: number };

type Props = {
  title: string;
  subtitle: string;
  cards: ExportCard[]; // วันนี้ / เดือนนี้ / ปีนี้
  graph: GraphPoint[]; // กราฟชีวิตรายวัน
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
  setTimeout(() => URL.revokeObjectURL(url), 3000);
}
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function bucketRows(b: Bucket): { label: string; color: string; lines: string[] }[] {
  return [
    { label: "ดี", color: "#059669", lines: b.good },
    { label: "ปนกัน", color: "#d97706", lines: b.mixed },
    { label: "ระวัง", color: "#dc2626", lines: b.bad },
    { label: "เหมาะกับ", color: "#2563eb", lines: b.suit },
    { label: "ควรเลี่ยง", color: "#6b7280", lines: b.avoid },
  ].filter((r) => r.lines.length > 0);
}

/** กราฟชีวิตรายวันเป็น SVG string (ใช้ทั้งในรูป PNG, PDF และรายงาน HTML) */
function graphSvg(points: GraphPoint[], w = 720): string {
  const h = 230;
  const padX = 34;
  const top = 28;
  const bottom = 46;
  const n = points.length;
  if (n === 0) return "";
  const xs = (i: number) => (n === 1 ? w / 2 : padX + (i * (w - padX * 2)) / (n - 1));
  const ys = (s: number) => h - bottom - (s / 100) * (h - bottom - top);
  const step = Math.max(1, Math.ceil(n / Math.floor((w - padX * 2) / 62)));
  const path = points.map((p, i) => `${i === 0 ? "M" : "L"}${xs(i).toFixed(1)} ${ys(p.score).toFixed(1)}`).join(" ");
  const dots = points
    .map((p, i) => {
      const x = xs(i).toFixed(1);
      const y = ys(p.score).toFixed(1);
      const c = p.score >= 50 ? "#059669" : "#dc2626";
      const showVal = n <= 24 || i % step === 0;
      const lab = i % step === 0 || i === n - 1 ? p.dateLabel.replace(/\s*พ\.ศ\.?\s*\d+|\s+\d{4}$/, "") : "";
      return `<circle cx="${x}" cy="${y}" r="4.5" fill="${c}" stroke="#fff" stroke-width="1.5"/>${
        showVal ? `<text x="${x}" y="${(Number(y) - 9).toFixed(1)}" text-anchor="middle" font-size="11" font-weight="700" fill="#374151">${p.score}</text>` : ""
      }${lab ? `<text x="${x}" y="${h - 22}" text-anchor="middle" font-size="10" fill="#6b7280">${esc(lab.length > 12 ? lab.slice(0, 11) + "…" : lab)}</text>` : ""}`;
    })
    .join("");
  const mid = ys(50).toFixed(1);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" style="font-family:${FONT.replace(/"/g, "'")}">
  <rect width="${w}" height="${h}" fill="#fffdf7"/>
  <line x1="${padX}" y1="${mid}" x2="${w - padX}" y2="${mid}" stroke="#d6c9a8" stroke-dasharray="4"/>
  <text x="${padX}" y="${Number(mid) - 4}" font-size="10" fill="#9ca3af">50 = กลาง</text>
  <path d="${path}" fill="none" stroke="#8a6d3b" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>${dots}
  <text x="${w / 2}" y="${h - 4}" text-anchor="middle" font-size="10" fill="#9ca3af">คะแนนสูง = จังหวะดี · คะแนนต่ำ = ควรระวัง</text></svg>`;
}

function buildReportHtml({ title, subtitle, cards, sections, graph }: Props) {
  const css = `
  body{font-family:${FONT};max-width:820px;margin:24px auto;padding:0 16px;color:#1f2937;line-height:1.7}
  h1{color:#5b3f10;margin-bottom:0} .sub{color:#6b7280;margin-top:4px}
  h2{border-bottom:2px solid #8a6d3b;padding-bottom:4px;color:#5b3f10;margin-top:32px}
  .card{border:1px solid #d6c9a8;border-radius:10px;padding:12px 16px;margin:12px 0;break-inside:avoid;background:#fffdf7}
  .tag{display:inline-block;border-radius:4px;padding:0 8px;font-size:12px;font-weight:700;margin-left:8px}
  .row b{display:inline-block;min-width:76px}
  .item{margin:10px 0;padding-left:12px;border-left:3px solid #d6c9a8;break-inside:avoid}
  .muted{color:#6b7280;font-size:14px} ul{margin:4px 0 4px 20px;padding:0}
  .foot{margin-top:32px;font-size:12px;color:#6b7280} svg{max-width:100%;height:auto}
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
  const graphHtml = graph.length ? `<h2>กราฟชีวิตรายวัน</h2><div class="card">${graphSvg(graph, 760)}</div>` : "";
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
  <h2>สรุปภาพรวม</h2>${cardHtml}${graphHtml}${secHtml}
  <p class="foot">แปลผลตามกฎโหราศาสตร์ระบบพลูหลวงแบบกว้าง ๆ ใช้ประกอบการพิจารณาเท่านั้น ไม่ใช่การยืนยันเหตุการณ์ และไม่ควรใช้ตัดสินใจเรื่องสุขภาพ กฎหมาย หรือการเงิน</p>
  </body></html>`;
}

// ---------- ชิ้นส่วนที่ใช้ถ่ายเป็นรูป (inline style ล้วน) ----------
const WRAP: React.CSSProperties = { width: 720, padding: 24, background: "#fffaf0", fontFamily: FONT, color: "#1f2937", boxSizing: "border-box" };

function ToneTag({ tone }: { tone?: string }) {
  if (!tone || tone === "กลาง") return null;
  const tc = TONE_COLOR[tone] ?? TONE_COLOR["กลาง"];
  return <span style={{ background: tc.bg, color: tc.fg, borderRadius: 6, padding: "1px 10px", fontWeight: 700, fontSize: 14, marginLeft: 8 }}>{tone}</span>;
}

function CardShot({ c }: { c: ExportCard }) {
  return (
    <div style={{ border: "1.5px solid #8a6d3b", borderRadius: 14, background: "#fffdf7", padding: 16, marginBottom: 12 }}>
      <div style={{ fontSize: 20, fontWeight: 700 }}>
        {c.head}
        <ToneTag tone={c.tone} />
      </div>
      <div style={{ fontSize: 16, fontWeight: 600, margin: "6px 0 10px" }}>{c.bucket.verdict || c.text}</div>
      {bucketRows(c.bucket).map((r, j) => (
        <div key={j} style={{ display: "flex", gap: 10, marginBottom: 6, fontSize: 14.5, lineHeight: 1.5 }}>
          <div style={{ minWidth: 76, fontWeight: 700, color: r.color }}>{r.label}</div>
          <div>{r.lines.slice(0, 4).join(" · ")}</div>
        </div>
      ))}
    </div>
  );
}

function GraphShot({ graph }: { graph: GraphPoint[] }) {
  return (
    <div style={{ border: "1.5px solid #8a6d3b", borderRadius: 14, background: "#fffdf7", padding: 12, marginBottom: 12 }}>
      <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>📈 กราฟชีวิตรายวัน</div>
      <div dangerouslySetInnerHTML={{ __html: graphSvg(graph, 670) }} />
    </div>
  );
}

function Head({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <>
      <div style={{ fontSize: 26, fontWeight: 800, color: "#5b3f10" }}>{title}</div>
      <div style={{ fontSize: 14, color: "#6b7280", marginBottom: 14 }}>{subtitle}</div>
    </>
  );
}
const Foot = () => (
  <div style={{ fontSize: 12, color: "#8a7a58", textAlign: "center", marginTop: 6 }}>โหราศาสตร์ไทย ระบบพลูหลวง · ใช้ประกอบการพิจารณาเท่านั้น</div>
);

export default function PredictExport(props: Props) {
  const { title, subtitle, cards, graph, sections, fileBase } = props;
  const shots = useRef<HTMLDivElement>(null);
  const pdfRoot = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function run(label: string, fn: () => Promise<void>) {
    setBusy(true);
    setErr("");
    setStatus(label);
    try {
      if (document.fonts?.ready) await document.fonts.ready;
      await fn();
    } catch (e) {
      console.error(e);
      setErr("สร้างไฟล์ไม่สำเร็จ ลองใหม่อีกครั้ง");
    } finally {
      setBusy(false);
      setStatus("");
    }
  }

  const saveImages = (only?: "all") =>
    run("กำลังสร้างรูป...", async () => {
      const { toPng } = await import("html-to-image");
      const nodes = Array.from(shots.current?.querySelectorAll<HTMLElement>("[data-shot]") ?? []).filter((n) => (only === "all" ? n.dataset.shot === "รวม" : n.dataset.shot !== "รวม"));
      for (let i = 0; i < nodes.length; i++) {
        setStatus(`กำลังสร้างรูป ${i + 1}/${nodes.length}...`);
        const url = await toPng(nodes[i], { pixelRatio: 2, cacheBust: true, backgroundColor: "#fffaf0" });
        const a = document.createElement("a");
        a.href = url;
        a.download = `${fileBase}-${nodes[i].dataset.shot}.png`;
        a.click();
        await sleep(400); // เว้นระยะให้เบราว์เซอร์รับหลายไฟล์
      }
    });

  const savePdf = () =>
    run("กำลังสร้าง PDF...", async () => {
      const [{ toJpeg }, { jsPDF }] = await Promise.all([import("html-to-image"), import("jspdf")]);
      const blocks = Array.from(pdfRoot.current?.querySelectorAll<HTMLElement>("[data-blk]") ?? []);
      const pdf = new jsPDF({ unit: "pt", format: "a4" });
      const PW = pdf.internal.pageSize.getWidth();
      const PH = pdf.internal.pageSize.getHeight();
      const M = 28;
      const cw = PW - M * 2;
      let y = M;
      for (let i = 0; i < blocks.length; i++) {
        setStatus(`กำลังสร้าง PDF ${i + 1}/${blocks.length}...`);
        const el = blocks[i];
        const w = el.offsetWidth;
        const h = el.offsetHeight;
        if (!w || !h) continue;
        const img = await toJpeg(el, { pixelRatio: 1.6, quality: 0.92, backgroundColor: "#ffffff", cacheBust: true });
        const hh = (h / w) * cw;
        if (y + hh > PH - M && y > M) {
          pdf.addPage();
          y = M;
        }
        pdf.addImage(img, "JPEG", M, y, cw, Math.min(hh, PH - M * 2));
        y += hh + 6;
        if (i % 8 === 7) await sleep(0);
      }
      pdf.save(`${fileBase}-report.pdf`);
    });

  const saveHtml = () => download(new Blob([buildReportHtml(props)], { type: "text/html;charset=utf-8" }), `${fileBase}-report.html`);

  const btn =
    "rounded-lg border border-[#8a6d3b] px-3 py-2 text-sm font-semibold text-[#8a6d3b] hover:bg-[#8a6d3b] hover:text-white disabled:opacity-50";

  return (
    <div className="rounded-xl border border-neutral-200 p-3 dark:border-neutral-800">
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => saveImages("all")} disabled={busy} className={btn}>
          🖼️ รูปรวม (สรุป + กราฟ)
        </button>
        <button type="button" onClick={() => saveImages()} disabled={busy} className={btn}>
          🖼️ รูปแยกทีละใบ
        </button>
        <button type="button" onClick={savePdf} disabled={busy} className={btn}>
          📕 ดาวน์โหลด PDF
        </button>
        <button type="button" onClick={saveHtml} disabled={busy} className={btn}>
          📄 รายงาน HTML
        </button>
      </div>
      <p className="mt-2 text-xs text-neutral-500">รูปแยกทีละใบ = วันนี้ / เดือนนี้ / ปีนี้ / กราฟชีวิต (เบราว์เซอร์อาจถามอนุญาตดาวน์โหลดหลายไฟล์)</p>
      {status && <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">{status}</p>}
      {err && <p className="mt-2 text-sm text-red-600">{err}</p>}

      {/* พื้นที่ถ่ายรูป: วางนอกจอ */}
      <div style={{ position: "fixed", left: -10000, top: 0, pointerEvents: "none" }} aria-hidden>
        <div ref={shots}>
          <div data-shot="รวม" style={WRAP}>
            <Head title={title} subtitle={subtitle} />
            {cards.map((c, i) => (
              <CardShot key={i} c={c} />
            ))}
            {graph.length > 0 && <GraphShot graph={graph} />}
            <Foot />
          </div>
          {cards.map((c, i) => (
            <div key={i} data-shot={["วันนี้", "เดือนนี้", "ปีนี้"][i] ?? `การ์ด${i + 1}`} style={WRAP}>
              <Head title={title} subtitle={subtitle} />
              <CardShot c={c} />
              <Foot />
            </div>
          ))}
          {graph.length > 0 && (
            <div data-shot="กราฟชีวิต" style={WRAP}>
              <Head title={title} subtitle={subtitle} />
              <GraphShot graph={graph} />
              <Foot />
            </div>
          )}
        </div>

        {/* เนื้อหา PDF: แบ่งเป็นบล็อก ๆ เพื่อตัดหน้าไม่กลางข้อความ */}
        <div ref={pdfRoot} style={{ width: 720, fontFamily: FONT, color: "#1f2937", background: "#fff" }}>
          <div data-blk style={{ padding: "4px 8px", background: "#fff" }}>
            <Head title={title} subtitle={subtitle} />
          </div>
          {cards.map((c, i) => (
            <div key={`c${i}`} data-blk style={{ padding: "0 8px", background: "#fff" }}>
              <CardShot c={c} />
            </div>
          ))}
          {graph.length > 0 && (
            <div data-blk style={{ padding: "0 8px", background: "#fff" }}>
              <GraphShot graph={graph} />
            </div>
          )}
          {sections.map((s, si) => (
            <div key={`s${si}`}>
              <div data-blk style={{ padding: "10px 8px 2px", background: "#fff" }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#5b3f10", borderBottom: "2px solid #8a6d3b", paddingBottom: 4 }}>{s.title}</div>
                {s.note && <div style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>{s.note}</div>}
              </div>
              {s.items.map((it, ii) => (
                <div key={ii} data-blk style={{ padding: "4px 8px", background: "#fff" }}>
                  <div style={{ borderLeft: "3px solid #d6c9a8", paddingLeft: 10 }}>
                    {it.head && (
                      <div style={{ fontSize: 15, fontWeight: 700 }}>
                        {it.head}
                        <ToneTag tone={it.tone} />
                      </div>
                    )}
                    {it.text && <div style={{ fontSize: 13, color: "#6b7280" }}>{it.text}</div>}
                    {it.lines.length > 0 && (
                      <ul style={{ margin: "3px 0 0 18px", padding: 0, fontSize: 13.5, lineHeight: 1.55 }}>
                        {it.lines.map((l, k) => (
                          <li key={k}>{l}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ))}
          <div data-blk style={{ padding: "10px 8px", fontSize: 11.5, color: "#6b7280", background: "#fff" }}>
            แปลผลตามกฎโหราศาสตร์ระบบพลูหลวงแบบกว้าง ๆ ใช้ประกอบการพิจารณาเท่านั้น ไม่ใช่การยืนยันเหตุการณ์ และไม่ควรใช้ตัดสินใจเรื่องสุขภาพ กฎหมาย หรือการเงิน
          </div>
        </div>
      </div>
    </div>
  );
}