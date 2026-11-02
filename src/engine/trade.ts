import { worldDefinitions } from '../data/local-items';
import { localItemId, localRecipeId } from '../data/local-items';
import { RMAX } from '../data/core';
import { PHAPQUYET } from '../data/spirit';
// Cửa tiệm, bán đồ, nhà đấu giá, học nghề.
import { PILLS, HERBS, MATS, TALIS, TECHS, SKILLS, SPECIALS, mkGear, gearPrice, type Gear } from '../data/items';
import { LOCS, REGIONS } from '../data/world';
import { s } from './state';
import { effRi, itemPrice, itemName, addItem, addGear, buyMult, sellMult, removeItem, bagFree } from './char';
import { addLog, passTime } from './core';
import { isExclusiveTech, skillOwners } from './sect';
import { clamp, seeded, hashStr } from '../core/util';

/** Cấp đan đột phá theo bậc (tier): thấp = Khai Mạch, Trúc Cơ · trung = Kết Kim, Hóa Anh, Ngưng Thần · cao = Phá Hư, Hợp Nguyên, Đại Thừa. */
export const BREAK_TIER = { lo: [1, 2], mid: [3, 5], hi: [6, 8] } as const;
/** Thành trì lớn: tên Thành / Kinh / Đô; thành trì nhỏ: tên Trấn. */
export const isBigTown = (name: string) => !/\sTrấn$/.test(name.trim());

export interface Ware {
  key: string; // khóa duy nhất trong tiệm
  id: string; // id vật phẩm, hoặc 'gear', 'recipe:<id>', 'craft:<k>'
  n: string;
  price: number;
  qty: number;
  g?: number;
  gear?: Gear;
  d?: string;
}

const bought = () => (s.flags.bought ||= {}) as Record<string, number>;
const stockKey = () => `${s.loc}:${Math.floor(s.year)}`;

/** Hàng hóa: cố định theo nơi + năm, đã mua thì trừ đi. */
export function stock(): Ware[] {
  const l = LOCS[s.loc];
  const rnd = seeded(hashStr(stockKey() + s.id));
  const pickR = <T,>(a: T[]) => a[Math.floor(rnd() * a.length)];
  const out: Ware[] = [];
  const reg = REGIONS[l.reg];
  const hi = l.reg === 'tienchau' ? 6 : l.island ? 4 : l.type === 'market' ? 3 : 2;
  const lo = Math.max(1, Math.min(hi, effRi()) - 1);
  const tierOk = (t: number) => t >= lo - 1 && t <= Math.min(hi, effRi() + 1);
  const add = (w: Omit<Ware, 'key'>) => {
    if (w.id.startsWith('recipe:')) { const id = localRecipeId(w.id.slice(7)); w.id = 'recipe:' + id; w.n = (PILLS[id] ? 'Đan phương: ' + PILLS[id].n : 'Phù phương: ' + TALIS[id].n); }
    else { const id = localItemId(w.id); if (id !== w.id) { w.id = id; w.n = itemName(id, w.g); w.price = Math.round(itemPrice(id, w.g) * mul * 1.4); } }
    out.push({ ...w, key: `${w.id}#${w.g ?? ''}#${out.length}` });
  };
  const mul = buyMult();

  // đan đột phá ở thành trì: thành lớn (Thành/Kinh/Đô) bày đủ mọi cấp, kể cả cấp cao; thành nhỏ (Trấn) bày đủ cấp thấp và cấp trung
  const town = l.type === 'town';
  if (town) {
    const maxT = isBigTown(l.n) ? BREAK_TIER.hi[1] : BREAK_TIER.mid[1];
    for (const p of worldDefinitions('p').filter((x) => x.k === 'break' && x.tier <= maxT).sort((a, b) => a.tier - b.tier)) {
      const id = 'p:' + p.id;
      add({ id, n: itemName(id), price: Math.round(itemPrice(id) * mul * 1.4), qty: 1 + (rnd() < 0.4 ? 1 : 0), g: 1 });
    }
  }
  // đan dược
  const pills = worldDefinitions('p').filter((p) => tierOk(p.tier) && (l.type === 'market' || p.tier <= 2) && p.k !== 'root' && !(town && p.k === 'break'));
  for (let i = 0; i < (l.type === 'market' ? 8 : 5) && pills.length; i++) {
    const p = pickR(pills);
    const id = 'p:' + p.id;
    if (out.some((o) => o.id === id)) continue;
    const isBreak = p.k === 'break';
    add({ id, n: itemName(id), price: Math.round(itemPrice(id) * mul * 1.4), qty: isBreak ? 1 : 3 + Math.floor(rnd() * 4), g: 1 });
  }
  // linh thảo theo vùng
  const herbs = Object.values(HERBS).filter((h) => h.reg.includes(reg.id) && tierOk(h.tier));
  for (const h of herbs.slice(0, 7)) add({ id: 'h:' + h.id, n: h.n, price: Math.round(itemPrice('h:' + h.id) * mul * 1.3), qty: 2 + Math.floor(rnd() * 5) });
  // vật liệu
  // giấy bút chế phù: thành nào cũng có
  for (const id of ['phuchi', 'chusa']) add({ id: 'm:' + id, n: MATS[id].n, price: Math.round(itemPrice('m:' + id) * mul * 1.2), qty: 6 + Math.floor(rnd() * 10) });
  const mats = Object.values(MATS).filter((m) => m.id !== 'phuchi' && m.id !== 'chusa' && (tierOk(m.tier) || m.id === 'huyenthiet' || m.id === 'dayeu'));
  for (let i = 0; i < (l.forge ? 9 : 6) && mats.length; i++) {
    const m = pickR(mats);
    if (out.some((o) => o.id === 'm:' + m.id)) continue;
    add({ id: 'm:' + m.id, n: m.n, price: Math.round(itemPrice('m:' + m.id) * mul * 1.3), qty: 3 + Math.floor(rnd() * 6) });
  }
  // phù lục
  const tl = worldDefinitions('t').filter((t) => !t.co && tierOk(t.tier) && t.tier <= 3);
  for (let i = 0; i < 6 && tl.length; i++) {
    const t = pickR(tl);
    if (out.some((o) => o.id === 't:' + t.id)) continue;
    add({ id: 't:' + t.id, n: itemName('t:' + t.id, 1), price: Math.round(itemPrice('t:' + t.id) * mul * 1.3), qty: 2 + Math.floor(rnd() * 4), g: 1 });
  }
  // sách: chỉ phường thị
  if (l.type === 'market') {
    const sks = worldDefinitions('sk').filter((k) => !k.peak && k.tier <= Math.min(hi - 1, Math.ceil((effRi() + 1) / 2)) && !skillOwners(k.id).length);
    for (let i = 0; i < 2 && sks.length; i++) {
      const k = pickR(sks);
      if (out.some((o) => o.id === 'sk:' + k.id)) continue;
      add({ id: 'sk:' + k.id, n: itemName('sk:' + k.id), price: Math.round(itemPrice('sk:' + k.id) * mul * 1.5), qty: 1 });
    }
    const tcs = worldDefinitions('cp').filter((t) => !t.blood && t.tier <= Math.min(2 + (hi >= 4 ? 1 : 0), Math.ceil((effRi() + 1) / 2)) && !t.evil && !isExclusiveTech(t.id));
    if (tcs.length && rnd() < 0.7) {
      const t = pickR(tcs);
      add({ id: 'cp:' + t.id, n: itemName('cp:' + t.id), price: Math.round(itemPrice('cp:' + t.id) * mul * 1.6), qty: 1 });
    }
    const pqs = worldDefinitions('fq').filter((x) => x.tier <= Math.min(2, Math.ceil((effRi() + 1) / 2)));
    if (pqs.length && rnd() < 0.5) { const x = pickR(pqs); add({ id: 'fq:' + x.id, n: itemName('fq:' + x.id), price: Math.round(itemPrice('fq:' + x.id) * mul * 1.5), qty: 1 }); }
    // đan phương / phù phương
    const rec = [...worldDefinitions('p').filter((p) => p.tier <= Math.max(1, s.craft.alch + 1) && !s.recipes.includes(p.id)).map((p) => ({ id: p.id, n: `Đan phương: ${p.n}`, tier: p.tier })),
      ...worldDefinitions('t').filter((t) => !t.co && t.tier <= Math.max(1, s.craft.talis + 1) && !s.recipes.includes(t.id)).map((t) => ({ id: t.id, n: `Phù phương: ${t.n}`, tier: t.tier }))];
    for (let i = 0; i < 3 && rec.length; i++) {
      const r = pickR(rec);
      if (out.some((o) => o.id === 'recipe:' + r.id)) continue;
      add({ id: 'recipe:' + r.id, n: r.n, price: Math.round(40 * Math.pow(3.2, r.tier - 1) * mul), qty: 1 });
    }
    // học nghề
    for (const k of ['alch', 'talis', 'forge'] as const) {
      if (s.craft[k] === 0) add({ id: 'craft:' + k, n: `Học nghề ${k === 'alch' ? 'luyện đan' : k === 'talis' ? 'chế phù' : 'luyện khí'}`, price: Math.round(60 * mul), qty: 1, d: 'Một tán tu già nhận dạy ngươi nhập môn.' });
    }
    add({ id: 'x:tuitruvat', n: SPECIALS.tuitruvat.n, price: Math.round(SPECIALS.tuitruvat.price * (1 + (s.flags.bagExtra || 0) / 6) * mul), qty: 1 });
  }
  // trang bị
  const gearN = l.type === 'market' ? 3 : l.forge ? 4 : 2;
  for (let i = 0; i < gearN; i++) {
    const lv = clamp(Math.min(effRi(), hi + 1) - (rnd() < 0.4 ? 1 : 0), 0, RMAX());
    const g = rnd() < 0.15 ? 2 : rnd() < 0.6 ? 1 : 0;
    const saved = Math.random;
    Math.random = rnd; // mkGear dùng Math.random → tạm thay để cố định
    const gr = mkGear(lv, l.type === 'town' && !l.forge ? Math.min(g, 1) : g);
    Math.random = saved;
    gr.uid = `shop${i}${stockKey()}`;
    add({ id: 'gear', n: gr.n, price: Math.round(gearPrice(gr) * mul * 1.5), qty: 1, gear: gr });
  }
  // trừ hàng đã mua
  const b = bought();
  return out
    .map((w) => ({ ...w, qty: w.qty - (b[stockKey() + w.key] || 0) }))
    .filter((w) => w.qty > 0);
}

export function buy(w: Ware): string {
  if (s.money < w.price) return 'Không đủ linh thạch.';
  if (w.id.startsWith('recipe:')) {
    s.recipes.push(w.id.slice(7));
  } else if (w.id.startsWith('craft:')) {
    const k = w.id.slice(6) as 'alch' | 'talis' | 'forge';
    s.craft[k] = 1;
    if (k === 'alch') s.recipes.push('hoixuandan', 'tukhi');
    if (k === 'talis') { s.recipes.push('hoaphu', 'kimcangphu'); addItem('m:phuchi', 5); addItem('m:chusa', 3); }
    passTime(0.5);
  } else if (w.id === 'gear') {
    if (!addGear({ ...w.gear!, uid: Math.random().toString(36).slice(2, 10) })) return 'Túi đầy.';
  } else if (w.id === 'x:tuitruvat') {
    s.flags.bagExtra = (s.flags.bagExtra || 0) + 6;
  } else {
    if (bagFree() <= 0 && !s.bag.some((b) => b.id === w.id)) return 'Túi đầy.';
    addItem(w.id, 1, w.g);
  }
  s.money -= w.price;
  const b = bought();
  b[stockKey() + w.key] = (b[stockKey() + w.key] || 0) + 1;
  // dọn khóa cũ
  for (const k of Object.keys(b)) if (!k.includes(`:${Math.floor(s.year)}`)) delete b[k];
  return `Mua ${w.n}.`;
}

export const sellPrice = (id: string, g?: number) => Math.max(1, Math.round(itemPrice(id, g) * sellMult()));
export const sellGearPrice = (gr: Gear) => Math.max(1, Math.round(gearPrice(gr) * sellMult()));
/** Thuật thư chân truyền (của phong chủ) không bán. */
export const unsellable = (id: string) => id.startsWith('sk:') && !!SKILLS[id.slice(3)]?.peak;
export function sellItem(id: string, g: number | undefined, n = 1): string {
  if (unsellable(id)) return 'Chân truyền của sư môn, không thể đem bán.';
  if (!removeItem(id, n, g)) return '';
  const p = sellPrice(id, g) * n;
  s.money += p;
  return `Bán ${itemName(id, g)}${n > 1 ? ' ×' + n : ''}, được ${p} linh thạch.`;
}
export function sellGear(uid: string): string {
  const i = s.gearBag.findIndex((g) => g.uid === uid);
  if (i < 0) return '';
  const gr = s.gearBag[i];
  if (s.refining?.uid === uid) s.refining = null;
  s.gearBag.splice(i, 1);
  const p = sellGearPrice(gr);
  s.money += p;
  return `Bán ${gr.n}, được ${p} linh thạch.`;
}

// ---------- Đấu giá ----------
export interface Lot {
  key: string;
  id: string; // id vật phẩm hoặc 'gear'
  n: string;
  g?: number;
  gear?: Gear;
  start: number;
  rivalMax: number;
  rival: string;
  sold?: boolean;
}
export const auctionHeld = () => Math.floor(s.year) % 2 === 0;
export const nextAuction = () => Math.floor(s.year) + (Math.floor(s.year) % 2 === 0 ? 2 : 1);
const RIVALS = ['Lão giả áo xám', 'Thiếu chủ Tiêu gia', 'Nữ tu che mặt', 'Hòa thượng béo', 'Phòng bao số ba', 'Thương nhân Tây Lương', 'Một đạo đồng', 'Ma tu đeo mặt nạ'];
export function lots(): Lot[] {
  const l = LOCS[s.loc];
  if (!l.auction) return [];
  const key = `auc:${s.loc}:${Math.floor(s.year)}`;
  const rnd = seeded(hashStr(key + s.id));
  const pickR = <T,>(a: T[]) => a[Math.floor(rnd() * a.length)];
  const out: Lot[] = [];
  const tier = clamp(effRi() + 1, 1, 8);
  const sold = (s.flags.aucSold ||= {}) as Record<string, boolean>;
  const pushLot = (id: string, n: string, base: number, g?: number, gear?: Gear) => {
    const local = localItemId(id);
    if (local !== id) { id = local; n = itemName(id, g); base = itemPrice(id, g); }
    const k = `${key}#${out.length}`;
    out.push({ key: k, id, n, g, gear, start: Math.round(base * 1.2), rivalMax: Math.round(base * (1.3 + rnd() * 1.6)), rival: pickR(RIVALS), sold: !!sold[k] });
  };
  const brk = worldDefinitions('p').filter((p) => p.k === 'break' && Math.abs(p.tier - tier) <= 1);
  if (brk.length) { const p = pickR(brk); pushLot('p:' + p.id, p.n, itemPrice('p:' + p.id, 2), 2); }
  const life = worldDefinitions('p').filter((p) => (p.k === 'life' || p.k === 'root' || p.k === 'stat') && p.tier <= tier + 1);
  if (life.length) { const p = pickR(life); pushLot('p:' + p.id, p.n, itemPrice('p:' + p.id, 1), 1); }
  const tcs = worldDefinitions('cp').filter((t) => !t.blood && t.tier >= 2 && t.tier <= Math.min(4, Math.ceil(tier / 2) + 1));
  if (tcs.length) { const t = pickR(tcs); pushLot('cp:' + t.id, itemName('cp:' + t.id), itemPrice('cp:' + t.id)); }
  for (let i = 0; i < 2; i++) {
    const saved = Math.random;
    Math.random = rnd;
    const gr = mkGear(clamp(effRi(), 0, RMAX()), clamp((rnd() < 0.25 ? 3 : 2) + (effRi() >= 6 ? 2 : effRi() >= 4 ? 1 : 0), 0, 6));
    Math.random = saved;
    pushLot('gear', gr.n, gearPrice(gr), undefined, gr);
  }
  const sp = pickR(['x:thanhoa', 'x:phatnganh', 'x:kiemlenh', 'x:linhtuyen', 'x:tuitruvat']);
  pushLot(sp, SPECIALS[sp.slice(2)].n, SPECIALS[sp.slice(2)].price * (1 + effRi() * 0.6));
  const hb = Object.values(HERBS).filter((h) => h.tier === clamp(tier, 1, 6));
  if (hb.length) { const h = pickR(hb); pushLot('h:' + h.id, h.n, itemPrice('h:' + h.id) * 3); }
  return out;
}
export function winLot(lot: Lot, price: number): string {
  if (s.money < price) return 'Không đủ linh thạch!';
  if (lot.id === 'gear') {
    if (!addGear({ ...lot.gear!, uid: Math.random().toString(36).slice(2, 10) })) return 'Túi đầy, không nhận được.';
  } else if (lot.id === 'x:tuitruvat') {
    s.flags.bagExtra = (s.flags.bagExtra || 0) + 6;
  } else if (!addItem(lot.id, 1, lot.g)) return 'Túi đầy, không nhận được.';
  s.money -= price;
  (s.flags.aucSold ||= {})[lot.key] = true;
  addLog(`Đấu giá được ${lot.n} với giá ${price} linh thạch.`, 'good');
  return `Búa gõ ba tiếng. ${lot.n} thuộc về ngươi với giá ${price} linh thạch.`;
}
/** Ký gửi bán qua nhà đấu giá: giá cao hơn bán tiệm, mất phí. */
export function consign(id: string, g: number | undefined): string {
  if (!removeItem(id, 1, g)) return '';
  const p = Math.round(itemPrice(id, g) * (0.9 + Math.random() * 0.8));
  s.money += p;
  return `${itemName(id, g)} được bán qua đấu giá với giá ${p} linh thạch (đã trừ phí).`;
}
export function consignGear(uid: string): string {
  const i = s.gearBag.findIndex((g) => g.uid === uid);
  if (i < 0) return '';
  const gr = s.gearBag.splice(i, 1)[0];
  const p = Math.round(gearPrice(gr) * (0.9 + Math.random() * 0.8));
  s.money += p;
  return `${gr.n} được bán qua đấu giá với giá ${p} linh thạch (đã trừ phí).`;
}

/** Danh mục cửa tiệm. */
export const SHOP_CATS = ['Công pháp', 'Pháp khí', 'Đan dược', 'Phù lục', 'Vật liệu luyện đan', 'Vật liệu luyện khí', 'Vật liệu chế phù'] as const;
const FORGE_MATS = new Set(['huyenthiet', 'tinhkim', 'hanngoc', 'thienthach', 'longlan', 'linhmoc', 'hukhongthach', 'yeudan', 'dayeu', 'longthu']);
export function wareCat(w: Ware): number {
  const [k, key] = w.id.split(':');
  if (w.id === 'gear' || w.id === 'x:tuitruvat') return 1;
  if (k === 'cp' || k === 'sk' || k === 'tp' || k === 'fq') return 0;
  if (k === 'p') return 2;
  if (k === 't') return 3;
  if (k === 'h') return 4;
  if (k === 'recipe') return PILLS[key] ? 4 : 6;
  if (k === 'craft') return key === 'alch' ? 4 : key === 'forge' ? 5 : 6;
  if (k === 'm') return key === 'phuchi' || key === 'chusa' ? 6 : FORGE_MATS.has(key) ? 5 : 4;
  return 1;
}
