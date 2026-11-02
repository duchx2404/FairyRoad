import { worldDefinitions } from '../data/local-items';
import { kmPlaceOne, kmRemove } from './kinhmach';
import { kmFillNew } from './kinhmach';
import { PHAPQUYET, pqGrade } from '../data/spirit';
// Dùng vật phẩm, trang bị, luyện hóa, học bí kíp.
import { TAMPHAP, tamGrade, tamEffect, learnReq, skillGrade, PILLS, TECHS, SKILLS, SPECIALS, REFINE_Y, MAX_SKILLS, SLOTS, gearLabel, type Gear } from '../data/items';
import { REALMS, ROOTS, BASIC_EL, STATS, hiddenRootKind, rootKindOf, type StatKey } from '../data/core';
import { s, codexAdd } from './state';
import { effRi, tamList, tamActive, tamSlots, pqList, myLinh, removeItem, pillMult, techAff, bagFree, itemName, count, addItem, skEff, regrowGear } from './char';
import { addProg, addLog, mark } from './core';
import { clamp, pick, ch, fmt } from '../core/util';

export function usePill(id: string, g = 1): string {
  const p = PILLS[id];
  if (!p || !removeItem('p:' + id, 1, g)) return '';
  const m = pillMult(g);
  switch (p.k) {
    case 'cult': {
      if (s.root.k === 0) return 'Thân phàm không giữ nổi dược lực, ngươi đau bụng ba ngày.';
      let eff = p.v * m;
      if (p.tier < effRi()) eff *= Math.pow(0.35, effRi() - p.tier);
      if (p.tier > effRi() + 1) { s.hurt = clamp(s.hurt + 30, 0, 100); return `Dược lực quá mạnh, kinh mạch như muốn nổ tung!` + ' ' + addProg(eff * 0.5); }
      const used = (s.flags.pillTol ||= 0) as number;
      eff *= Math.max(0.3, 1 - used * 0.04);
      s.flags.pillTol = used + 1;
      return `Nuốt ${p.n}. ` + addProg(eff);
    }
    case 'heal':
      s.hurt = clamp(s.hurt - p.v * m, 0, 100);
      return `Nuốt ${p.n}, thương thế đỡ hẳn.`;
    case 'detox':
      s.hurt = clamp(s.hurt - 15 * m, 0, 100);
      s.tamma = clamp(s.tamma - 20 * m, 0, 100);
      return `Nuốt ${p.n}, độc tố và tạp niệm tan bớt.`;
    case 'life': {
      const eff = Math.round(p.v * m * Math.pow(0.5, s.lifePills));
      s.lifePills++;
      s.lifeBonus += eff;
      return eff > 1 ? `Nuốt ${p.n}, thọ nguyên tăng ${eff} năm.` : `Nuốt ${p.n}, nhưng cơ thể đã nhờn thuốc, gần như không còn tác dụng.`;
    }
    case 'stat': {
      const k = p.stat as StatKey;
      const used = ((s.flags.statPill ||= {}) as Record<string, number>);
      if ((used[k] || 0) >= 3) return `Nuốt ${p.n}, nhưng đã dùng quá nhiều, không còn hiệu quả.`;
      used[k] = (used[k] || 0) + 1;
      s.stats[k] += 1;
      return `Nuốt ${p.n}, ${STATS[k].n} +1.`;
    }
    case 'root': {
      if (hiddenRootKind(s.root.k)) return 'Dược lực chạy khắp các hệ rồi tan đi. Không có gì để tẩy — linh căn của ngươi vốn đã viên mãn.';
      if (s.root.k === 0) {
        s.root = { k: 1, els: [...BASIC_EL] };
        mark('Uống Tẩy Tủy Đan, khai mở ngũ linh căn');
        return 'Dược lực như lửa đốt khắp xương tủy. Ngươi lăn lộn ba ngày ba đêm, khi tỉnh lại, linh khí đã chui được vào người. Phế linh căn hóa thành Ngũ linh căn!';
      }
      if (s.root.els.length >= 2 && !hiddenRootKind(s.root.k) && ch(0.6 * m)) {
        const drop = pick(s.root.els);
        s.root.els = s.root.els.filter((e) => e !== drop);
        s.root.k = rootKindOf(s.root.els);
        mark(`Tẩy tủy, linh căn tinh luyện thành ${ROOTS[s.root.k].n}`);
        return `Tạp chất bị đẩy ra theo mồ hôi đen kịt. Linh căn tinh khiết hơn: ${ROOTS[s.root.k].n}!`;
      }
      return 'Dược lực tẩy sạch tạp chất trong xương, nhưng linh căn không đổi.';
    }
    case 'break':
      return 'Đan phá cảnh nên để dành lúc đột phá (chọn khi bấm Đột phá).';
  }
  return '';
}

export function useSpecial(key: string): string {
  const sp = SPECIALS[key];
  if (!sp || !sp.use) return 'Vật này không dùng trực tiếp được.';
  if (!removeItem('x:' + key, 1)) return '';
  switch (key) {
    case 'tuitruvat':
      s.flags.bagExtra = (s.flags.bagExtra || 0) + 6;
      return 'Túi đồ rộng thêm 6 ô.';
    case 'ngocgian': {
      const pool = worldDefinitions('sk').filter((k) => !k.peak && k.tier <= Math.ceil((effRi() + 1) / 2) && !s.known.includes(k.id));
      if (pool.length && ch(0.55)) { const k = pick(pool); learn(k.id); return `Thần thức chìm vào ngọc giản. Ngươi lĩnh ngộ ${k.n}!`; }
      s.stats.ngo += 1;
      return 'Ngọc giản ghi chép tâm đắc của một tu sĩ vô danh. Đọc xong, ngộ tính +1.';
    }
    case 'linhthach_trung': s.money += 100; return 'Đổi được 100 linh thạch.';
    case 'linhthach_thuong': s.money += 10000; return 'Đổi được 10.000 linh thạch.';
    case 'linhtuyen': return 'Linh tuyền mát lạnh chảy xuống đan điền. ' + addProg(50);
    case 'thanhoa': s.flags.flame = true; mark('Luyện hóa linh hỏa'); return 'Đốm lửa chui vào lòng bàn tay, từ nay luyện đan luyện khí đều có linh hỏa trợ lực.';
    case 'phatnganh': s.flags.bodhi = true; s.tamma = 0; s.stats.tam += 1; return 'Vị đắng chát lan khắp miệng rồi hóa ngọt. Tâm tĩnh như nước, đạo tâm +1. Lần đột phá tới sẽ dễ hơn.';
  }
  return '';
}

function learn(k: string) {
  if (s.known.includes(k)) return;
  s.known.push(k);
  if (s.skills.length < MAX_SKILLS) s.skills.push(k);
}

/** Đọc bí kíp: trả về mô tả; nếu switch=true thì đổi công pháp chính. */
export function readScroll(id: string, sw: boolean): string {
  if (id.startsWith('tp:')) {
    const k = id.slice(3);
    const tp = TAMPHAP[k];
    if (tamList().includes(k)) return 'Đã lĩnh hội tâm pháp này rồi.';
    if (effRi() < learnReq(tp.tier)) return `Cảnh giới chưa đủ: ${tamGrade(tp)} cần ${REALMS[learnReq(tp.tier)].n} mới lĩnh hội được.`;
    removeItem(id, 1);
    tamList().push(k);
    const auto = tamActive().length < tamSlots();
    if (auto) tamActive().push(k);
    addLog(`Lĩnh hội tâm kinh ${tp.n}.`, 'good');
    return `Ngươi nhập định đọc ${tp.n}. Khi mở mắt, tâm cảnh đã khác: ${tamEffect(tp)}.${auto ? ' Đang vận hành.' : ' Các ô vận hành đã đầy — vào trang Nhân vật để thay.'}`;
  }
  if (id.startsWith('fq:')) {
    const k = id.slice(3);
    const x = PHAPQUYET[k];
    if (pqList().includes(k)) return 'Đã tinh thông pháp quyết này.';
    if (effRi() < learnReq(x.tier)) return `Cảnh giới chưa đủ: ${pqGrade(x)} cần ${REALMS[learnReq(x.tier)].n}.`;
    removeItem(id, 1);
    pqList().push(k);
    addLog(`Học được pháp quyết ${x.n}.`, 'good');
    return `Ngươi luyện ${x.n} tới thuần thục. ${x.d}`;
  }
  if (id.startsWith('sk:')) {
    const k = id.slice(3);
    if (s.known.includes(k)) return 'Đã học thuật này rồi.';
    if (effRi() < learnReq(SKILLS[k].tier)) return `Cảnh giới chưa đủ: ${skillGrade(SKILLS[k])} cần ${REALMS[learnReq(SKILLS[k].tier)].n} mới lĩnh hội được.`;
    removeItem(id, 1);
    learn(k);
    return `Lĩnh hội ${SKILLS[k].n}.`;
  }
  const t = TECHS[id.slice(3)];
  if (!sw) return '';
  removeItem(id, 1);
  const old = s.tech;
  s.tech = t.id;
  s.techM = Math.round(s.techM * 0.3);
  for (const k of t.skills) learn(k);
  codexAdd('tech', t.id);
  addLog(`Chuyển tu ${t.n}.`, 'good');
  return `Ngươi tán công cũ${old ? ` (${TECHS[old].n})` : ''}, chuyển tu ${t.n}. Độ hợp với linh căn: ${Math.round(techAff(t.id) * 100)}%.`;
}

/** Cất chiêu đã học trở lại thành thuật thư trong túi: quên chiêu, gỡ khỏi kinh mạch. Đọc lại sách thì học lại. */
export function stowSkill(k: string): string {
  const sk = SKILLS[k];
  if (!sk || !s.known.includes(k)) return '';
  if (bagFree() <= 0 && !count('sk:' + k)) return 'Túi đồ đã đầy, không còn chỗ cất thuật thư.';
  const i = s.skills.indexOf(k);
  if (i >= 0) { s.skills.splice(i, 1); kmRemove('sk:' + k); }
  s.known.splice(s.known.indexOf(k), 1);
  addItem('sk:' + k, 1);
  addLog(`Chép ${sk.n} lại thành thuật thư, cất vào túi.`);
  return `Ngươi chép ${sk.n} lại thành thuật thư, cất vào túi. Đọc lại sách để học lại.`;
}
/** Chiêu đã học, xếp theo phẩm hiển thị: giai cao trước, rồi phẩm, rồi tên. */
export const knownByGrade = () => s.known.filter((k) => SKILLS[k]).sort((a, b) => {
  const x = skEff(a), y = skEff(b);
  return y.tier - x.tier || y.pq - x.pq || SKILLS[a].n.localeCompare(SKILLS[b].n, 'vi');
});

export function toggleSkill(k: string): string {
  const i = s.skills.indexOf(k);
  if (i >= 0) { s.skills.splice(i, 1); kmRemove('sk:' + k); return ''; }
  s.skills.push(k);
  if (!kmPlaceOne('sk:' + k)) {
    s.skills.pop();
    kmRemove('sk:' + k);
    return 'Kinh mạch hết chỗ vừa với chiêu này. Mở bảng Kinh mạch để xếp lại, cất bớt chiêu, hoặc xung kích kinh mạch mở thêm ô.';
  }
  return '';
}

// ---------- Trang bị ----------
export function startRefine(uid: string): string {
  const g = s.gearBag.find((x) => x.uid === uid);
  if (!g) return '';
  if (g.refined) return 'Đã luyện hóa.';
  if (s.refining) return 'Đang luyện hóa món khác. Mỗi lần chỉ một món.';
  if (g.lv > effRi() + 1) return 'Cảnh giới quá thấp, thần thức không áp chế nổi món này.';
  s.refining = { uid, left: REFINE_Y[g.g] };
  return `Bắt đầu luyện hóa ${g.n}. Cần khoảng ${REFINE_Y[g.g] < 1 ? Math.round(REFINE_Y[g.g] * 12) + ' tháng' : REFINE_Y[g.g] + ' năm'} (tự tiến triển theo thời gian).`;
}
export function equip(uid: string): string {
  const i = s.gearBag.findIndex((x) => x.uid === uid);
  if (i < 0) return '';
  const g = s.gearBag[i];
  if (!Number.isInteger(g.slot) || g.slot < 0 || g.slot >= SLOTS.length) return 'Loại trang bị không hợp lệ.';
  if (!g.refined) return 'Phải luyện hóa trước khi mang.';
  const old = s.gear[g.slot];
  s.gearBag.splice(i, 1);
  s.gear[g.slot] = g;
  if (old) s.gearBag.push(old);
  return `Mang ${g.n}.`;
}
export function unequip(slot: number): string {
  if (!Number.isInteger(slot) || slot < 0 || slot >= SLOTS.length) return '';
  const g = s.gear[slot];
  if (!g) return '';
  if (bagFree() <= 0) return 'Túi đầy.';
  s.gear[slot] = null;
  s.gearBag.push(g);
  return `Tháo ${g.n}.`;
}
/** Hỗn Độn Tàn Kiếm chưa sửa ("tàn khuyết" là trạng thái, không phải tên). */
export const isChaosBroken = (g: Gear | null | undefined) => !!g?.grow && g.n.includes('(tàn khuyết)');
/** Sửa Hỗn Độn Tàn Kiếm bằng Hỗn Độn Thạch: bỏ chữ tàn khuyết, tăng tỷ lệ trưởng thành và chỉ số. */
export function repairChaosSword(uid: string): string {
  const g = [...s.gear, ...s.gearBag].find((x) => x?.uid === uid);
  if (!g || !isChaosBroken(g)) return '';
  if (!count('m:hondonthach')) return 'Cần một khối Hỗn Độn Thạch, chỉ tìm được ở Hỗn Độn giới.';
  removeItem('m:hondonthach', 1);
  const old = g.growMul ?? 1;
  g.n = 'Hỗn Độn Kiếm';
  g.growMul = 1.8;
  g.luck += 4;
  g.cult = Math.max(g.cult, 12);
  regrowGear();
  addLog('Hỗn Độn Thạch dung vào thân kiếm: Hỗn Độn Kiếm trở lại nguyên vẹn.', 'good');
  return `Khối Hỗn Độn Thạch tan vào vết nứt trên thân kiếm. Kiếm rung lên một tiếng dài, những vết khuyết liền lại. Hỗn Độn Kiếm đã nguyên vẹn: tỷ lệ trưởng thành ×${old.toFixed(1)} → ×1.8, có thêm thủ, khí vận +4, tu luyện +12%.`;
}
export function gearLine(g: Gear): string {
  const p: string[] = [];
  if (g.atk) p.push(`Công +${fmt(g.atk)}`);
  if (g.def) p.push(`Thủ +${fmt(g.def)}`);
  if (g.hp) p.push(`Huyết +${fmt(g.hp)}`);
  if (g.cult) p.push(`Tu luyện +${g.cult}%`);
  if (g.luck) p.push(`Khí vận +${g.luck}`);
  if (g.cap) p.push(`Túi +${g.cap} ô`);
  if (g.grow) p.push(`Trưởng thành ×${(g.growMul ?? 1).toFixed(1)}`);
  return p.join(' · ');
}
export const gearGrade = (g: Gear) => gearLabel(g);
export function discard(id: string, g?: number) {
  if (id === 'x:ngocboidoi') return 'Nửa ngọc bội này luôn theo ngươi, không thể vứt bỏ.';
  removeItem(id, count(id, g), g);
  return `Vứt bỏ ${itemName(id, g)}.`;
}
export function discardGear(uid: string) {
  const i = s.gearBag.findIndex((x) => x.uid === uid);
  if (i >= 0) {
    if (s.refining?.uid === uid) s.refining = null;
    return `Vứt bỏ ${s.gearBag.splice(i, 1)[0].n}.`;
  }
  return '';
}

/** Thiên hạ biết ngươi là Thập / Hỗn Độn linh căn. */
export function revealThap(): void {
  if (!hiddenRootKind(s.root.k) || s.flags.thapKnown) return;
  s.flags.thapKnown = true;
  s.fame += 100;
  mark('Thân phận ' + ROOTS[s.root.k].n + ' bị thiên hạ biết tới');
}

export function toggleTam(id: string): string {
  const a = tamActive();
  const i = a.indexOf(id);
  if (i >= 0) { a.splice(i, 1); return `Ngừng vận hành ${TAMPHAP[id].n}.`; }
  if (a.length >= tamSlots()) return `Chỉ vận hành được ${tamSlots()} tâm kinh ở cảnh giới này.`;
  a.push(id);
  kmFillNew();
  return `Vận hành ${TAMPHAP[id].n}.`;
}
/** Đổi tọa kỵ (chân linh) giữa xuất chiến và chỉ để cưỡi. Xuất chiến chiếm một suất trong đội; cưỡi thì vẫn đi đường nhanh. */
export function toggleLinhRide(maxActive: number, activeNow: number): string {
  const c = myLinh();
  if (!c) return '';
  if (c.ride) {
    if (activeNow >= maxActive) return `Đội xuất trận đã đủ ${maxActive} suất — rút bớt một đồng hành về dự bị trước.`;
    c.ride = false;
    return `${c.name} sẽ cùng ngươi xuất chiến.`;
  }
  c.ride = true;
  return `${c.name} chỉ làm tọa kỵ, không vào trận nữa (vẫn chở ngươi đi đường).`;
}
export function releaseLinh(): string {
  const c = myLinh();
  if (!c) return '';
  s.flags.chanlinh = null;
  mark(`Thả ${c.name} về rừng`);
  return `${c.name} quay đầu nhìn ngươi rất lâu, rồi biến vào rừng sâu.`;
}
