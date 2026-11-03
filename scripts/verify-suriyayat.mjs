import { calculateThaiHoroscope } from "thai-astrology";

const EXPECTED = [
  ["sun", "อาทิตย์", 6, 2, 28, false],
  ["moon", "จันทร์", 9, 28, 56, false],
  ["mars", "อังคาร", 3, 18, 49, false],
  ["mercury", "พุธ", 6, 9, 14, true],
  ["jupiter", "พฤหัสบดี", 4, 0, 5, false],
  ["venus", "ศุกร์", 6, 19, 10, true],
  ["saturn", "เสาร์", 11, 9, 11, true],
  ["rahu", "ราหู", 10, 1, 42, false],
  ["ketu", "เกตุ", 6, 26, 47, false],
  ["uranus", "มฤตยู", 1, 18, 26, true],
];
const TOL = 2;
const input = (day) => ({
  date: { year: 2026, era: "CE", month: 10, day },
  time: { hour: 0, minute: 18 },
  location: { province: "กรุงเทพมหานคร" },
});
const now = calculateThaiHoroscope(input(21));
const next = calculateThaiHoroscope(input(22));
const arc = (s, d, m) => s * 1800 + d * 60 + m;
const diff = (a, b) => {
  let d = b - a;
  if (d > 10800) d -= 21600;
  if (d <= -10800) d += 21600;
  return d;
};
let bad = 0;
for (const [key, name, s, d, m, retro] of EXPECTED) {
  const p = now.points[key];
  const delta = diff(arc(s, d, m), p.longitudeArcMinutes);
  const speed = diff(p.longitudeArcMinutes, next.points[key].longitudeArcMinutes);
  const gotRetro = key !== "rahu" && key !== "ketu" && speed < 0;
  const ok = Math.abs(delta) <= TOL && gotRetro === retro;
  if (!ok) bad++;
  console.log(`${name.padEnd(10)} ได้ ${p.signName} ${p.degrees}°${Math.floor(p.minutes)}′ | ต่าง ${delta} ลิปดา | พักร ${gotRetro}/${retro} ${ok ? "OK" : "<-- ไม่ตรง"}`);
}
const a = now.points.ascendant;
console.log("ลัคนา:", a.signName, a.degrees + "°", Math.floor(a.minutes) + "′");
console.log("หรคุณ:", now.calendar?.horakhun);
console.log(bad === 0 ? "ผ่านทุกดาว" : `ไม่ผ่าน ${bad} ดวง`);
