// Bộ biểu tượng nét (24×24) dùng chung cho toàn giao diện, thay cho chữ Hán trước đây.
// Mỗi biểu tượng là danh sách đường path SVG; đường bắt đầu bằng '*' thì tô đặc, còn lại vẽ nét.
// Dùng được ở hai nơi: glyphSvg() trả chuỗi <svg> cho DOM, drawGlyph() vẽ lên canvas (bản đồ).

const C = (cx: number, cy: number, r: number) => `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${r * 2} 0a${r} ${r} 0 1 0 ${-r * 2} 0`;
const DOT = (cx: number, cy: number, r = 1) => '*' + C(cx, cy, r);

export const GLYPH: Record<string, string[]> = {
  // ---- hệ thuộc tính ----
  kim: ['M12 3l2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5z'],
  moc: ['M5 19C5 10 11 5 19 5c0 8-5 14-14 14z', 'M5 19L14 10'],
  thuy: ['M3 9c2-2 4-2 6 0s4 2 6 0 4-2 6 0', 'M3 15c2-2 4-2 6 0s4 2 6 0 4-2 6 0'],
  hoa: ['M12 21c-4 0-6.5-2.6-6.5-6 0-4 4-6 4-11 2 1.5 3.5 3.5 3.5 5.5 1-1 1.5-2 1.5-3 2 2 4 4.5 4 8 0 3.6-2.5 6.5-6.5 6.5z'],
  tho: ['M2 19l6-10 3.5 5L15 7l7 12z'],
  bang: ['M12 3v18M4.2 7.5l15.6 9M19.8 7.5l-15.6 9', 'M9.5 4.5L12 7l2.5-2.5M9.5 19.5L12 17l2.5 2.5'],
  loi: ['M13 2L5 13h6l-2 9 9-12h-6l3-8z'],
  phong: ['M3 8h11a3 3 0 1 0-3-3M3 13h15a3 3 0 1 1-3 3M3 18h7'],
  am: ['M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5z'],
  quang: [C(12, 12, 4.5), 'M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M19.1 4.9l-1.8 1.8M6.7 17.3l-1.8 1.8'],
  yin: [C(12, 12, 9), 'M12 3a4.5 4.5 0 0 1 0 9 4.5 4.5 0 0 0 0 9', DOT(12, 7.5, 1.3)],
  yang: [C(12, 12, 9), 'M12 3a4.5 4.5 0 0 0 0 9 4.5 4.5 0 0 1 0 9', DOT(12, 16.5, 1.3)],
  none: [C(12, 12, 6), DOT(12, 12, 2)],
  // ---- ô trang bị ----
  weapon: ['M20 4L9.5 14.5', 'M6.5 13l4.5 4.5', 'M4 20l3.5-3.5', 'M20 4h-4M20 4v4'],
  armor: ['M6 4l6-1.5L18 4l2 4-2.5 1.5V20H6.5V9.5L4 8z', 'M12 4v16'],
  treasure: ['M7 3h10l4 6-9 12L3 9z', 'M3 9h18M9.5 9L12 21M14.5 9L12 21'],
  ring: [C(12, 15, 6), 'M9 6l3-3 3 3-3 3z'],
  boots: ['M8 3h5v9l5 2.5c1 .5 1.5 1.3 1.5 2.5v2H6V3z', 'M6 15h13'],
  // ---- chân linh / sinh vật ----
  cat: ['M5 10L5.5 4 10 7.5h4L18.5 4 19 10a7 7 0 0 1-14 0z', DOT(9.5, 11.5), DOT(14.5, 11.5), 'M3 13.5h3.5M17.5 13.5H21', 'M12 13.5l-1 1.2h2z'],
  snake: ['M5 19c0-4 4-5 7-5s7-1 7-5-4-5-7-5-5 2-5 4', DOT(5.5, 19, 1.6), 'M19 6l2.5-1.5'],
  rabbit: ['M9 11c-2-4-2.5-8-1-9 1.5-.5 3 3 3.5 8M15 11c2-4 2.5-8 1-9-1.5-.5-3 3-3.5 8', C(12, 15.5, 5.5), DOT(10, 15), DOT(14, 15)],
  wolf: ['M4 5l4 4h8l4-4-1 9c0 4-3 7-7 7s-7-3-7-7z', 'M12 14l-1.5 2.5h3z', DOT(9.5, 11.5), DOT(14.5, 11.5)],
  eagle: ['M12 5c-3 0-5 2-5 5l-5-2c1 4 4 6 7 7l3 4 3-4c3-1 6-3 7-7l-5 2c0-3-2-5-5-5z', 'M12 8l-1.5 2.5h3z'],
  turtle: ['M5 13a7 6 0 0 1 14 0v2H5z', 'M8 8.5l2 4M16 8.5l-2 4M12 7v8', 'M19 13h2.5a1.5 1.5 0 0 1 0 3H19', 'M7 15l-1.5 3M17 15l1.5 3'],
  hawk: ['M12 4l-2 6-7 1 6 3-2 7 5-5 5 5-2-7 6-3-7-1z'],
  fox: ['M4 4l5 5h6l5-5-1.5 8.5c-.5 3-3 5.5-6.5 5.5S6 20.5 5.5 17.5z', 'M12 15l-1.5 2h3z', DOT(9.5, 12), DOT(14.5, 12)],
  qilin: ['M7 20v-5c0-4 2-7 5-8l1.5-4 1 4.5c2.5 1 4 3.5 4 6.5V20', 'M12.5 7L11 3', DOT(14.5, 11), 'M8 11l-2.5 1M8 14l-2.5 1'],
  phoenix: ['M4 18c4 0 7-2 8-6 1-4 4-6 8-6-2 2-3 4-3 6l3 2-4 1c-1 3-4 5-8 5z', 'M4 18l-1.5 3M7 18.5L6 21', DOT(15.5, 8)],
  paw: [DOT(8.5, 7.5, 1.6), DOT(15.5, 7.5, 1.6), DOT(5, 12, 1.5), DOT(19, 12, 1.5), 'M12 11c-3 0-5.5 3-5.5 5.5S8.5 20 12 20s5.5-1 5.5-3.5S15 11 12 11z'],
  demon: ['M6 3l2 5.5h8L18 3', 'M5 8.5h14l-1 8c-1 2.5-3 4.5-6 4.5s-5-2-6-4.5z', 'M9 13l2 1M15 13l-2 1', 'M10 18h4'],
  mortal: [C(12, 7.5, 3.5), 'M5 21c0-4 3-7 7-7s7 3 7 7'],
  cultivator: [C(12, 6.3, 2.8), 'M8 10.5l-4.5 7.5h17L16 10.5', 'M9 18c0-3 1.5-5 3-5s3 2 3 5', 'M3 21h18'],
  // ---- địa điểm trên bản đồ ----
  village: ['M4 11l8-7 8 7', 'M6 10v10h12V10', 'M10 20v-6h4v6'],
  town: ['M3 20V9h3V6h3v3h6V6h3v3h3v11z', 'M10 20v-5h4v5'],
  market: ['M3 9l2-5h14l2 5', 'M3 9c0 2 1.5 3 3 3s3-1 3-3c0 2 1.5 3 3 3s3-1 3-3c0 2 1.5 3 3 3s3-1 3-3', 'M5 12v8h14v-8', 'M9 20v-5h6v5'],
  sect: ['M3 8l9-5 9 5', 'M5 8v3h14V8', 'M7 11v9M17 11v9M12 11v9', 'M4 20h16'],
  wild: ['M2 20l5-9 3.5 5L15 7l7 13z', 'M5 20v-4M5 17l-2-2M5 18l2-2'],
  realm: ['M6 21V10a6 6 0 0 1 12 0v11', 'M9 21v-7a3 3 0 0 1 6 0v7', 'M12 2v2M5 5l1.5 1.5M19 5l-1.5 1.5'],
  mountain: ['M2 20L8 8l3.5 5.5L14 9l8 11z', 'M8 8l1.2 2 1.3-1 1 1.5'],
  north: ['*M12 3l4 9-4-2-4 2z'],
  place: ['M12 21s-6-6-6-11a6 6 0 0 1 12 0c0 5-6 11-6 11z', C(12, 10, 2)],
  // ---- dấu trên bản đồ ----
  bao: ['M4 9h16v10H4z', 'M4 12h16', 'M10 12v3h4v-3', 'M6 9V7a6 6 0 0 1 12 0v2'],
  bi: ['M12 4a4 4 0 0 1 2 7.5L15 18H9l1-6.5A4 4 0 0 1 12 4z', 'M7 21h10'],
  // ---- ấn trên tiêu đề khung ----
  portrait: ['M4 4h16v16H4z', C(12, 10.5, 2.5), 'M7 20c0-3 2.2-5 5-5s5 2 5 5'],
  furnace: ['M7 20V9a5 5 0 0 1 10 0v11', 'M5 20h14', 'M12 17c-1.5 0-2.5-1-2.5-2.5 0-1.5 1.5-2.5 1.5-4.5 1 .8 1.5 1.8 1.5 2.8.5-.5.8-1 .8-1.5 1 1 1.5 2 1.5 3.2 0 1.5-1 2.5-2.8 2.5z'],
  ink: ['M8 20h8l-1.2-8h-5.6z', 'M12 12V5', 'M10 5h4', 'M12 16v1'],
  gavel: ['M14 4l6 6-3 3-6-6z', 'M11 7l-8 8 3 3 8-8', 'M4 21h10'],
  fate: ['M12 12c-4-4-8-3-8 0s4 4 8 0 8-3 8 0-4 4-8 0z', 'M12 12v8M9 18l3 2 3-2'],
  companion: [C(9, 8, 3), C(16.5, 9.5, 2.5), 'M3 20c0-3.5 2.7-6 6-6s6 2.5 6 6', 'M15 15c2.8 0 5.5 2 5.5 5'],
  warn: ['M12 3l10 18H2z', 'M12 10v5', DOT(12, 18)],
  ask: [C(12, 12, 9), 'M9.6 9.2a2.5 2.5 0 1 1 3.4 2.3c-.7.3-1 .9-1 1.6v.6', DOT(12, 17, 0.9)],
  // ---- bảng nhân vật / đồ giám ----
  body: [C(12, 5.5, 2.5), 'M4 13l4-4h8l4 4', 'M8 9v12M16 9v12', 'M4 13l-1 3M20 13l1 3'],
  gate: ['M3 5h18', 'M5 5v15M19 5v15', 'M4 9h16'],
  pagoda: ['M12 2l8 5H4z', 'M6 7v4h12V7', 'M5 11l-1 3h16l-1-3', 'M7 14v6h10v-6'],
  banner: ['M6 3v18', 'M6 4h13l-3 4 3 4H6'],
  holy: [C(12, 12, 9), 'M12 7l1.5 3.3 3.5.4-2.6 2.4.7 3.5L12 15l-3.1 1.6.7-3.5L7 10.7l3.5-.4z'],
  crown: ['M3 18h18', 'M4 18L3 7l5 4 4-6 4 6 5-4-1 11z'],
  root: ['M12 21v-8', 'M12 13c0-4 3-6 7-6 0 4-3 6-7 6z', 'M12 13c0-3-2.5-5-6-5 0 3 2.5 5 6 5z', 'M12 21l-3 1.5M12 21l3 1.5'],
  trophy: ['M8 4h8v5a4 4 0 0 1-8 0z', 'M8 6H5a3 3 0 0 0 3 4.5M16 6h3a3 3 0 0 1-3 4.5', 'M12 13v4M8.5 20.5h7'],
  heart: ['M12 20s-7-4.3-7-9.5C5 7.5 7 6 9 6c1.4 0 2.4.8 3 1.8.6-1 1.6-1.8 3-1.8 2 0 4 1.5 4 4.5C19 15.7 12 20 12 20z'],
  // ---- loại vật phẩm (khi chưa có tranh riêng) ----
  herb: ['M12 21v-9', 'M12 12C8 12 5 9 5 5c4 0 7 3 7 7z', 'M12 12c4 0 7-3 7-7-4 0-7 3-7 7z', 'M12 17c-2 0-4-1-5-3'],
  pill: [C(12, 12, 8), 'M8 9c1-1.5 2.5-2.5 4-2.5'],
  ore: ['M6 20l-3-7 5-8 7-1 6 6-3 10z', 'M8 5l4 7 4-4M12 12l-2 8'],
  talisman: ['M7 2h10v20l-2.5-2-2.5 2-2.5-2L7 22z', 'M10 7h4M10 11h4M12 14v3'],
  book: ['M5 4.5h9a3 3 0 0 1 3 3V20H8a3 3 0 0 1-3-3z', 'M17 20h2V6', 'M8 8h6M8 11h6'],
  skill: ['M12 3l2 5 5 2-5 2-2 5-2-5-5-2 5-2z', 'M19 16l1 2 2 1-2 1-1 2-1-2-2-1 2-1z'],
  special: ['M12 2l2.6 6.4 6.9.5-5.3 4.5 1.7 6.7L12 16.5 6.1 20.1l1.7-6.7L2.5 8.9l6.9-.5z'],
  gear: ['M4 4l12 12M20 4L8 16', 'M14 17l3 3M10 17l-3 3', 'M4 4h3v3M20 4h-3v3'],
  recipe: ['M6 4h10a2 2 0 0 1 2 2v12a2 2 0 0 0 2 2H8a2 2 0 0 1-2-2z', 'M6 4a2 2 0 0 0-2 2v2h2', 'M10 9h5M10 12.5h5'],
  item: ['M3 8l9-4 9 4-9 4z', 'M3 8v9l9 4 9-4V8', 'M12 12v9'],
  token: ['M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6z', 'M12 7v6M9.5 10h5'],
  // ---- giao chiến ----
  log: ['M6 4h11a2 2 0 0 1 2 2v12a2 2 0 0 0 2 2H8a2 2 0 0 1-2-2z', 'M6 4a2 2 0 0 0-2 2v2h2', 'M19 20a2 2 0 0 1-2-2v-1H6', 'M10 9h5M10 12.5h5'],
  win: ['M12 3l2.2 4.6 5 .7-3.6 3.5.9 5-4.5-2.4-4.5 2.4.9-5L4.8 8.3l5-.7z'],
  fled: [C(13, 5.5, 1.5), 'M9.5 20l2-5.5-2.5-2 .8-4.2 3-1.3 2.2 2.5 3 1', 'M9.8 8.3L6 10.5l-1.5 3.2', 'M11.5 14.5l3.2 2 1.3 3.5'],
  draw: ['M12 3v18M5 21h14', 'M4 8h16', 'M6.5 8l-3 6a3 3 0 0 0 6 0zM17.5 8l-3 6a3 3 0 0 0 6 0z'],
  lose: ['M14.5 3.5L6 12l2.5 2.5L17 6z', 'M6 12l-2.5 2.5M8.5 14.5L6 17', 'M4 20l3-3M9.5 16.5l1.5 1.5', 'M15 9l5.5 5.5-2 2L13 11'],
  // ---- màn hình mở đầu / kết thúc ----
  title: ['M2 21L8 10l4 6 4-9 6 14z', C(6, 5, 2.5), 'M9 21c1-3 3-4 3-6'],
  ascend: ['M12 14V4', 'M8 8l4-4 4 4', 'M6 20h11a3 3 0 0 0 0-6 4 4 0 0 0-7.5-1.5A3.5 3.5 0 0 0 6 20z'],
  // Thiên Cơ Lâu: lầu cao ba tầng, trên đỉnh một con mắt nhìn khắp các giới
  tienco: ['M12 2.2 6.8 6.4h10.4z', 'M8 6.4v2.8h8V6.4', 'M6 9.2 4.6 12.4h14.8L18 9.2', 'M7 12.4v3.4h10v-3.4', 'M5.6 15.8 4.4 18.6h15.2l-1.2-2.8', 'M6.4 18.6V22h11.2v-3.4', 'M10.4 22v-2.4h3.2V22', 'M9.6 4.9c.8-.9 1.6-1.3 2.4-1.3s1.6.4 2.4 1.3c-.8.9-1.6 1.3-2.4 1.3s-1.6-.4-2.4-1.3z', DOT(12, 4.9, 0.7)],
  // ---- thanh tab góc trên ----
  navChar: [C(12, 7.5, 3.2), 'M4.2 20c.5-4.1 3.3-6.3 7.8-6.3s7.3 2.2 7.8 6.3z', 'M8.8 14.2l3.2 2.1 3.2-2.1'],
  navBag: [
    'M9 5.5V4.8a3 3 0 0 1 6 0v.7',
    'M5.5 10.5C5.5 7.7 8.4 6 12 6s6.5 1.7 6.5 4.5v9a2 2 0 0 1-2 2h-9a2 2 0 0 1-2-2z',
    'M5.5 11 3.8 12.5v5.8l1.7 1',
    'M18.5 11l1.7 1.5v5.8l-1.7 1',
    'M7.4 14.5c0-1.1.9-2 2-2h5.2c1.1 0 2 .9 2 2v3.2c0 1.1-.9 2-2 2H9.4c-1.1 0-2-.9-2-2z',
    'M9 15.5h6',
    'M10 17.3v.1',
  ],
  navKm: [
    'M1.3 12 5.9 8 9.8 11.5 14.4 14M14.4 14l2.2 5.5M14.4 14l7.4-4.2M21.8 9.8l.7 9.2M16.6 19.5l5.9-.5',
    C(1.3, 12, 0.75), C(5.9, 8, 0.75), C(9.8, 11.5, 0.75), C(14.4, 14, 0.85),
    C(16.6, 19.5, 0.75), C(22.5, 19, 0.75), C(21.8, 9.8, 0.75),
    'M1.3 9.8v4.4M.2 12h2.2M5.9 6.6v2.8M4.5 8h2.8M14.4 12.5v3M12.9 14h3',
  ],
  navRel: [C(8, 7.7, 2.7), C(16.8, 8.5, 2.2), 'M2.8 20c.3-3.7 2.1-5.7 5.2-5.7s4.9 2 5.2 5.7z', 'M14 14.8c3.9-.9 6.8 1.1 7.2 5.2h-5.4'],
  navTower: ['M12 2.5 8.8 5h6.4z', 'M9.7 5v4H14.3V5', 'M8.2 9v3.7h7.6V9', 'M6.8 12.7v3.8h10.4v-3.8', 'M5.3 16.5v4h13.4v-4', 'M10.5 20.5v-4h3v4', 'M8.8 6.8h6.4M8.2 10.8h7.6M6.8 14.6h10.4M5.3 18.5h13.4'],
  navLog: ['M7 3.5h8l3 3v14H7z', 'M15 3.8v3h3', 'M9.5 11h6M9.5 14.5h6M9.5 18h4', 'M4 6.5v14h3'],
  navHist: ['M7 3.5h10M7 20.5h10', 'M8 4c0 3.9 8 4 8 8s-8 4.1-8 8', 'M16 4c0 3.9-8 4-8 8s8 4.1 8 8', 'M9.2 8.2h5.6M9.2 15.8h5.6', DOT(12, 12, 1)],
  navAch: ['M8 3.5h8v5.3a4 4 0 0 1-8 0z', 'M8 5.5H4.8v2a3.2 3.2 0 0 0 3.8 3.1M16 5.5h3.2v2a3.2 3.2 0 0 1-3.8 3.1', 'M12 12.8v4.1M8.5 20.5h7', 'M12 5.2l.8 1.4 1.6.2-1.2 1.1.3 1.6-1.5-.8-1.5.8.3-1.6-1.2-1.1 1.6-.2z'],
  navSet: ['M9.3 3h5.4l.5 2.2a7.5 7.5 0 0 1 1.5.9l2.2-.7 2.7 4.7-1.7 1.5a7.5 7.5 0 0 1 0 1.8l1.7 1.5-2.7 4.7-2.2-.7a7.5 7.5 0 0 1-1.5.9l-.5 2.2H9.3l-.5-2.2a7.5 7.5 0 0 1-1.5-.9l-2.2.7-2.7-4.7 1.7-1.5a7.5 7.5 0 0 1 0-1.8l-1.7-1.5 2.7-4.7 2.2.7a7.5 7.5 0 0 1 1.5-.9z', C(12, 12, 3)],
  navHelp: [C(12, 12, 9), 'M9.5 9.1a2.6 2.6 0 1 1 3.7 2.4c-.9.4-1.2 1-1.2 2v.6', DOT(12, 17.4, 0.9), 'M12 1.5v1.2M22.5 12h-1.2M12 22.5v-1.2M1.5 12h1.2'],
  end: ['M9 10h6v11H9z', 'M12 10V7', 'M12 2c-1.2 1.5-2 2.5-2 3.5a2 2 0 0 0 4 0c0-1-.8-2-2-3.5z', 'M6 21h12'],
};

/** Biểu tượng cho hệ thuộc tính. */
export const elGlyph = (el: string | null | undefined) => (el && GLYPH[el] ? el : 'none');
/** Biểu tượng ô trang bị theo thứ tự SLOTS. */
export const SLOT_GLYPH = ['weapon', 'armor', 'treasure', 'ring', 'boots', 'furnace', 'ink', 'furnace'];
/** Biểu tượng cấp tông môn (1–4); tà phái dùng 'demon'. */
export const SECT_GLYPH = ['', 'gate', 'pagoda', 'banner', 'holy'];
/** Biểu tượng loại vật phẩm theo tiền tố id. */
export const ITEM_KIND_GLYPH: Record<string, string> = { h: 'herb', p: 'pill', m: 'ore', t: 'talisman', cp: 'book', sk: 'skill', x: 'special', gear: 'gear', recipe: 'recipe', craft: 'furnace' };

/** Chuỗi <svg> nét theo màu chữ hiện hành (currentColor). */
export function glyphSvg(name: string, size = 20, sw = 1.8, cls = ''): string {
  const ps = GLYPH[name] || GLYPH.none;
  const body = ps.map((d) => (d.startsWith('*') ? `<path d="${d.slice(1)}" fill="currentColor" stroke="none"/>` : `<path d="${d}"/>`)).join('');
  return `<svg class="gl${cls ? ' ' + cls : ''}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
}
/** Phần ruột để nhúng vào một tranh SVG khác: đặt biểu tượng vào ô vuông (x, y, size). */
export function glyphInner(name: string, x: number, y: number, size: number, color: string, sw = 1.8): string {
  const ps = GLYPH[name] || GLYPH.none;
  const k = size / 24;
  const body = ps.map((d) => (d.startsWith('*') ? `<path d="${d.slice(1)}" fill="${color}" stroke="none"/>` : `<path d="${d}"/>`)).join('');
  return `<g transform="translate(${x} ${y}) scale(${k})" fill="none" stroke="${color}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${body}</g>`;
}
const P2D = new Map<string, Path2D>();
/** Vẽ biểu tượng lên canvas, tâm tại gốc toạ độ hiện tại, cỡ `size`. */
export function drawGlyph(ctx: CanvasRenderingContext2D, name: string, size: number, color: string, sw = 1.8) {
  const ps = GLYPH[name] || GLYPH.none;
  ctx.save();
  ctx.scale(size / 24, size / 24);
  ctx.translate(-12, -12);
  ctx.lineWidth = sw;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  for (const d of ps) {
    const fill = d.startsWith('*');
    const key = fill ? d.slice(1) : d;
    let p = P2D.get(key);
    if (!p) { p = new Path2D(key); P2D.set(key, p); }
    if (fill) ctx.fill(p); else ctx.stroke(p);
  }
  ctx.restore();
}
