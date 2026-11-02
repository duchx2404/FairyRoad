// NPC trôi theo thời gian: tu luyện, đột phá, kỳ ngộ đồng hành, già chết.
// Tách khỏi core.ts để core không phải import party.ts (tránh vòng core → party → core).
import { s, type NPC } from './state';
import { REALMS, BREAK_BASE } from '../data/core';
import { SECTS } from '../data/world';
import { addLog, mark } from './core';
import { compCultMul, compAdventure, outfit, inParty } from './party';
import { slots } from './slots';
import { allyRealmUp } from './ally';
import { ch, clamp, pick, rf } from '../core/util';
/** NPC mang Hỗn Độn Đạo Thai (nữ chính, một số thánh nữ): đột phá luôn thành công như người chơi. */
const hondonNpc = (n: NPC) => n.bio?.body === 'Hỗn Độn Đạo Thai';

export function npcTick(n: NPC, y: number) {
  if (!n.alive) return;
  if (n.r > 0 || n.talent > 0) {
    let left = y;
    while (left > 0) {
      const per = (REALMS[n.r].turn * 12) / (Math.max(0.2, n.talent) * compCultMul(n));
      const step = Math.min(left, per);
      left -= step;
      (n as any).p = ((n as any).p || 0) + step / per;
      if ((n as any).p >= 1) {
        (n as any).p = 0;
        if (n.r > 0 && n.st < 3) n.st++;
        else if (n.r < 8 && (hondonNpc(n) || ch(Math.min(0.95, (BREAK_BASE[n.r + 1] || 0.05) + 0.12 + (n.luck ?? 0) * 0.01)))) { // Hỗn Độn Đạo Thai: luôn thành công
          n.r++;
          n.st = 0;
          n.life = Math.max(n.life, Math.round(REALMS[n.r].life * rf(0.9, 1.15)));
          if (Math.abs(n.rel) >= 40 || n.tag === 'daolu' || n.tag === 'master') addLog(`${n.name} đột phá ${REALMS[n.r].n}.`);
          if (inParty(n.id)) outfit(n, 'lên cảnh giới');
          allyRealmUp(n); // người theo ngươi vào thế lực: chức vụ theo cảnh giới
        } else (n as any).p = 0.5;
      }
    }
  }
  compAdventure(n, y);
  const a = s.year - n.born;
  const sectTier = n.sect ? (SECTS[n.sect]?.tier ?? 0) : 0;
  const protectedProdigy = sectTier >= 3 && n.talent >= 1.7;
  // nhân vật cốt truyện (hôn thê, người có hồ sơ riêng): không chết vì tai nạn ngẫu nhiên, chỉ thọ tận hoặc do sự kiện / trận đấu
  const storyNpc = !!n.bio || ((s.flags.dhBrides as string[] | undefined) || []).includes(n.id);
  if (a > n.life || (!protectedProdigy && !storyNpc && ch(0.0015 * y * (n.r === 0 ? 2 : 1) / (1 + (n.luck ?? 0) * 0.05)))) {
    n.alive = false;
    n.died = s.year;
    n.cause = a > n.life ? 'thọ tận' : pick(['bỏ mạng trong hiểm địa', 'tẩu hỏa nhập ma', 'bị kẻ thù ám sát', ...(hondonNpc(n) ? [] : ['đột phá thất bại'])]);
    if (Math.abs(n.rel) >= 30 || ['daolu', 'master', 'kin', 'disciple', 'rival'].includes(n.tag)) {
      addLog(`Tin dữ: ${n.name} đã ${n.cause}, hưởng thọ ${Math.floor(a)} tuổi.`, n.rel > 0 ? 'bad' : undefined);
      if (n.tag === 'daolu') {
        if (!s.npcs.some((x) => x.alive && x.tag === 'daolu')) s.flags.daolu_bonus = false;
        s.tamma = clamp(s.tamma + 20, 0, 100);
        mark(`Đạo lữ ${n.name} qua đời`);
      }
    }
  }
}
slots.npcTick = npcTick;
