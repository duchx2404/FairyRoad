import { LAST_WORLD, npcCap, worldName, REALMS, EL, type El } from '../data/core';
import { worldPack, type Beast } from '../data/world';
import { BEAST_INNATE_SKILLS, SKILLS } from '../data/items';
import {
  getBeastWorldReq,
  getSpeciesLineagePath,
  getAvailableEvolutionBranches,
  type BeastReq,
  type EvolutionBranch,
} from '../data/beast-lineage';
import type { State } from './state';

export interface BeastEvolution { from: string; to?: string; milestone: number }

export { getBeastWorldReq, getSpeciesLineagePath, getAvailableEvolutionBranches, type BeastReq, type EvolutionBranch } from '../data/beast-lineage';

/** Tổng số cảnh giới từ Phàm nhân (r=0) đến Đại Đạo (r=21). */
export const TOTAL_REALMS = REALMS.length; // 22

/** One ancestral step per completed realm; the pinnacle of Chaos completes the lineage. */
export function beastEvolution(beast: string | undefined, world: number, r: number, st: number, previous?: BeastEvolution) {
  if (!beast || st < 3) return;
  const milestone = world * 100 + r;
  if (previous && previous.milestone >= milestone) return;
  const beasts = worldPack(world).beasts;
  let current = beasts.find(b => b.n === beast);
  const pinnacle = world === LAST_WORLD && r >= npcCap(world);
  const seen = new Set<string>();
  while (current?.anc && !seen.has(current.n)) {
    seen.add(current.n);
    const parent = beasts.find(b => b.n === current!.anc);
    if (!parent) break;
    const req = getBeastWorldReq(parent.n);
    if (world < req.minWorld || r < req.minRealm) break;
    if (!parent.anc && !pinnacle) break;
    current = parent;
    if (!pinnacle) break;
  }
  if (!current || current.n === beast) return;
  return { beast: current.n, el: current.el, blood: `Đã thoát biến từ ${beast} thành ${current.n} · huyết mạch thuần`,
    evolution: { from: beast, to: current.n, milestone } };
}

export interface EvolveResult {
  ok: boolean;
  from: string;
  to?: string;
  el?: El;
  text: string;
  blocked?: string;
  requiresChoice?: boolean;
  branches?: EvolutionBranch[];
  chosenBranch?: EvolutionBranch;
}

/** Áp dụng con đường tiến hóa đã chọn (khóa nhánh huyết mạch vào con đường này). */
export function applyEvolutionChoice(st: State, branch: EvolutionBranch): string {
  const oldBeast = st.beast || 'Yêu thú';
  const targetName = branch.targetName;
  const targetEl = branch.targetEl;
  const w = st.world ?? 0;
  const r = st.r;
  const milestone = w * 100 + r;

  st.beast = targetName;
  // Khóa nhánh huyết mạch vào con đường này
  st.flags.beastNodeId = branch.targetNodeId;

  // Cập nhật hệ nguyên tố
  if (targetEl && targetEl !== 'none') {
    if (st.root.els.length === 0 || st.root.els.includes('none')) {
      st.root.els = [targetEl];
    } else if (!st.root.els.includes(targetEl)) {
      st.root.els.push(targetEl);
    }
  }

  st.flags.beastEvolution = { from: oldBeast, to: targetName, milestone };
  const elName = targetEl !== 'none' ? EL[targetEl].n : 'Vô tính';
  st.flags.beastBlood = `Đã thoát biến từ ${oldBeast} thành ${targetName} (${elName} hệ) · Đạo lộ ${branch.ultimateAncestor}`;

  // Thức tỉnh thần thông bản mệnh mới theo hệ
  let skMsg = '';
  if (targetEl && targetEl !== 'none') {
    const newSkillId = BEAST_INNATE_SKILLS[targetEl];
    if (newSkillId && !st.known.includes(newSkillId)) {
      st.known.push(newSkillId);
      if (st.skills.length < 5) st.skills.push(newSkillId);
      skMsg = ` Thần thông bản mệnh mới «${SKILLS[newSkillId]?.n || newSkillId}» đã thức tỉnh!`;
    }
  }

  return `【Huyết Mạch Thoát Biến】Yêu Đan thăng hoa, nhục thân lột xác! Ngươi đã chọn con đường tiến hóa thành 【${targetName}】 (${elName} hệ), hướng tới đỉnh cao 【${branch.ultimateAncestor}】!${skMsg}`;
}

/**
 * Cơ duyên biến dị huyết mạch:
 * Dùng khi người chơi gặp kỳ ngộ đặc biệt, ăn đan dược dị bảo, hoặc vào Huyết Trì biến dị
 * để phá vỡ con đường cũ, cho phép rẽ sang nhánh tiến hóa khác!
 */
export function mutateBeastLineageBranch(st: State, newTargetBranchNodeId?: string): string {
  if (newTargetBranchNodeId) {
    st.flags.beastNodeId = newTargetBranchNodeId;
    return `【Biến Dị Huyết Mạch】Huyết mạch trong cơ thể ngươi đã nghịch chuyển, rẽ sang con đường tiến hóa mới!`;
  } else {
    delete st.flags.beastNodeId;
    if (st.beast) {
      const branches = getAvailableEvolutionBranches(st.beast, undefined);
      const eligible = branches.filter(b => st.r >= b.minRealm);
      if (eligible.length > 1) {
        st.flags.pendingBeastBranches = eligible;
        return `【Huyết Mạch Trọng Tố】Dược lực Dị Hóa Niết Bàn Đan tẩy sạch xiềng xích gông cùm! Huyết mạch của ngươi đã mở ra các ngã rẽ tiến hóa mới, hãy chọn lại con đường đạo lộ!`;
      }
    }
    return `【Huyết Mạch Trọng Tố】Xiềng xích huyết mạch đã bị phá vỡ! Ở lần đột phá tiếp theo, ngươi có thể tự do lựa chọn lại con đường tiến hóa!`;
  }
}

/** Đột phá đại cảnh giới / phi thăng: Yêu thú người chơi thoát biến tiến hóa lên loài cao hơn theo cây gia phả. */
export function tryEvolvePlayerBeast(st: State, _beasts?: Beast[]): EvolveResult | null {
  if (st.race !== 'Yêu tộc' && !st.beast && !st.perks.includes('yeudan')) return null;
  const currentBeastName = st.beast;
  if (!currentBeastName) return null;

  // Lấy các nhánh tiến hóa khả dĩ (dựa theo node đã khóa, hoặc tất cả các nhánh nếu chưa khóa)
  const branches = getAvailableEvolutionBranches(currentBeastName, st.flags.beastNodeId);
  if (branches.length === 0) return null;

  const w = st.world ?? 0;
  const r = st.r;
  const milestone = w * 100 + r;
  const prevMilestone = st.flags.beastEvolution?.milestone ?? -1;
  if (prevMilestone >= milestone) return null;

  // Trường hợp 1: Có nhiều nhánh khả dĩ và người chơi chưa khóa vào một con đường cụ thể
  if (branches.length > 1 && !st.flags.beastNodeId) {
    // Lọc các nhánh mà cảnh giới hiện tại đã đủ điều kiện minRealm
    const eligibleBranches = branches.filter(b => r >= b.minRealm);
    if (eligibleBranches.length === 0) return null; // Chưa đủ cảnh giới để tiến hóa nhánh nào

    return {
      ok: false,
      requiresChoice: true,
      from: currentBeastName,
      branches: eligibleBranches,
      text: `Huyết mạch ${currentBeastName} của ngươi cuộn trào dữ dội trước các ngã rẽ tiến hóa! Hãy lựa chọn con đường thoát biến:`
    };
  }

  // Trường hợp 2: Chỉ có 1 nhánh (đã khóa hoặc loài chỉ có 1 con đường duy nhất)
  const branch = branches[0];

  // 1. Kiểm tra giới hạn thế giới (World Cap)
  if (w < branch.minWorld) {
    const curWName = worldName(w);
    const reqWName = worldName(branch.minWorld);
    const blocked = `Huyết mạch ${currentBeastName} trong người ngươi cuộn trào dữ dội, muốn thoát biến thành 【${branch.targetName}】 nhưng bị gông cùm quy tắc của ${curWName} gắt gao áp chế. Cần phi thăng lên 【${reqWName}】 mới có thể phá vỡ xiềng xích thiên địa!`;
    return { ok: false, from: currentBeastName, to: branch.targetName, el: branch.targetEl, text: blocked, blocked };
  }

  // 2. Kiểm tra cảnh giới tối thiểu
  if (r < branch.minRealm) {
    return null; // Chưa đủ cảnh giới để nhục thân chịu đựng lần thoát biến này
  }

  // Thỏa mãn điều kiện -> Tiến hóa thành công theo con đường đã chọn
  const text = applyEvolutionChoice(st, branch);
  return {
    ok: true,
    from: currentBeastName,
    to: branch.targetName,
    el: branch.targetEl,
    text,
    chosenBranch: branch,
  };
}
