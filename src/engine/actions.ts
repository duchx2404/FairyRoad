import { canSongTu, songTuOutcome } from './songtu';
import { baseItemKey } from '../data/local-items';
// Hành động của người chơi. Mỗi hành động trả về một Scene để UI hiển thị.
import { childScene, engageScene, needEngageScene } from '../events/diephd';
import { LAST_WORLD, RMAX, worldName, REALMS, STAGES, BREAK_PILL, ROOTS, DAI_DAO, DAO_HOLDER, EL } from '../data/core';
import { DIA_THE, LOCS, LOC_TYPE, SECTS, type Loc } from '../data/world';
import { HERBS, PILLS, PILL_GRADE } from '../data/items';
import { s, type Pin } from './state';
import { wedDaolu } from './relationships';
import { moneyScale, effRi, pqSum, cultRate, atBottleneck, addItem, has, stat, root, M, itemName, maxHp, itemPrice, removeItem, stageName, perfectBody, myLinh } from './char';
import { missionProg, trucCoKind, cultivateTurn, passTime, btChance, failBonus, breakthrough, pillBonusOf, addLog, addProg, mark, setLoc, travelYears, travelBlock, needsShip, shipFare, dist, travelSpeed, spawnPin, nearestLoc, mkNpc, addNpc, relChange, findNpc, npcRealm, daolu, realmOpen, nextOpen } from './core';
import { stoneForRealm, STONE_NAMES, STONE_VALUE } from './stones';
import { EVENTS, pickEvent, markSeen, evTitle, type Choice, type GameEvent, type Where } from './events';
import { fight, fightSummary, beastFoe, dangerLabel, fightLogs, type FightResult, type FoeSpec } from './combat';
import { canJoin, joinSect, missionPool, sect, promote, promoInfo } from './sect';
import { transcend, ascend } from './life';
import { daoGate, canLord, DAO_FOR_LORD, daoOptions, contemplate, laws, daos, daoOf, daoKindLabel } from './dao';
import { ch, clamp, pick, ri, rf, wpick, yearsTxt, fmt, seeded, hashStr } from '../core/util';
import { fengshenTriggerReached } from '../events/fengshen';

export interface Scene {
  title: string;
  text: string;
  choices?: Choice[];
  fights?: FightResult[];
  ev?: string; // id sự kiện (cho AI viết lại)
  kind?: 'event' | 'info';
  aiContext?: string;
  /** AI viết riêng đoạn và lời thoại mới cho từng nhân vật (cảnh định đoạt hôn ước). Mặc định chỉ kể lại gọn. */
  aiCast?: boolean;
  /** Cảnh hiện tiếp sau khi cảnh này đóng (vd. kết quả hành động sau cảnh bắt buộc). */
  then?: Scene;
}

export function eventScene(e: GameEvent): Scene {
  markSeen(e);
  return { title: evTitle(e), text: e.text(), choices: e.ch(), ev: e.id, kind: 'event' };
}
function tryEvent(where: Where, p = 1): Scene | null {
  if ((s.world ?? 0) === 0 && s.evSeen.tc_sao_bang === undefined) {
    const meteor = EVENTS.find((e) => e.id === 'tc_sao_bang');
    if (meteor) return eventScene(meteor);
  }
  if (!ch(p)) return null;
  const e = pickEvent(where);
  return e ? eventScene(e) : null;
}
export const drainFights = () => fightLogs.splice(0, fightLogs.length);

// ---------- Bế quan ----------
export function cultivate(n: number, stoneCount = 0): Scene {
  if (s.flags.childhood) return childScene();
  if (needEngageScene()) return engageScene();
  if (root().m === 0 && !has('yeudan') && s.race !== 'Yêu tộc' && !s.beast) return { title: 'Ngồi thiền', text: 'Ngươi ngồi cả ngày cố cảm nhận linh khí. Chỉ thấy tê chân. Phế linh căn không thể tu luyện — trừ phi tìm được kỳ ngộ hoặc Tẩy Tủy Đan.' + (passTime(0.25), '') };
  if (atBottleneck()) return { title: 'Bình cảnh', text: 'Tu vi đã chạm bình cảnh, bế quan thêm cũng vô ích. Hãy đột phá.' };

  const startR = `${s.r}.${s.st}.${s.flags.tang ?? 1}`;
  let total = 0;
  let turns = 0;
  const y0 = s.year;

  // Hấp thu linh thạch hỗ trợ tu luyện
  let stoneUsed = 0;
  let stoneProgGain = 0;
  let stoneName = '';
  if (stoneCount > 0 && !atBottleneck()) {
    const g = stoneForRealm(s.r);
    stoneName = STONE_NAMES[g];
    const val = STONE_VALUE[g];
    const maxAfford = Math.floor(s.money / val);
    stoneUsed = Math.max(0, Math.min(stoneCount, maxAfford));
    if (stoneUsed > 0) {
      s.money -= stoneUsed * val;
      stoneProgGain = stoneUsed;
      addProg(stoneProgGain);
    }
  }

  for (let i = 0; i < n; i++) {
    if (atBottleneck() || s.dead) break;
    const r = cultivateTurn();
    total += r.gain;
    turns++;
    if (atBottleneck() || s.dead) break;
    if (fengshenTriggerReached()) break;
    if (r.stageUp && s.body === 'thiendo' && s.r === 1 && n > 5) break; // Thiên Đố: dừng khi lên tầng mới
    const ev = tryEvent('cult', 0.07);
    if (ev) {
      ev.text = `(Bế quan ${yearsTxt(s.year - y0)}, tu vi +${Math.round(total)}%${stoneUsed ? `, luyện hóa ${stoneUsed} ${stoneName}` : ''}.)\n\n` + ev.text;
      return ev;
    }
    if (pendingDeathSoon() || needEngageScene()) break; // tới mười sáu tuổi: dừng để hiện định đoạt hôn ước
  }

  let text = n > 0
    ? `Bế quan ${yearsTxt(s.year - y0)}. Tu vi tăng ${Math.round(total)}% (${Math.round(cultRate())}%/lượt).`
    : `Tĩnh tọa luyện hóa linh thạch.`;

  if (stoneUsed > 0) {
    text += ` Đã tiêu hao ${stoneUsed.toLocaleString('vi-VN')} viên ${stoneName}, tinh thuần linh lực giúp tu vi tăng thêm +${stoneProgGain}%.`;
  }

  if (`${s.r}.${s.st}.${s.flags.tang ?? 1}` !== startR) text += ` Tinh tiến tới ${stageName()}.`;
  if (atBottleneck()) text += s.r === 0 ? ' Linh khí trong người đã đầy, có thể thử đả thông kinh mạch bước vào Luyện Khí.' : ' Đã chạm bình cảnh, có thể thử đột phá.';
  if (!s.tech && s.r === 0 && !has('yeudan') && s.race !== 'Yêu tộc') text += ' (Không có công pháp, tu luyện như mò kim đáy biển. Hãy tìm một bộ công pháp.)';
  const isYaoChar = s.race === 'Yêu tộc' || !!s.beast || has('yeudan');
  return { title: isYaoChar ? 'Ngưng đan luyện thể' : 'Bế quan', text, kind: 'info' };
}
const pendingDeathSoon = () => false;

export function breakthroughScene(): Scene {
  if (s.body === 'thiendo' && s.r === 1 && atBottleneck()) return tribulationScene();
  if (s.body === 'thiendo' && s.r === 1) return { title: 'Thiên Đố Chi Thể', text: `Trời đất đố kỵ thân thể này: đạo cơ vĩnh viễn không đúc thành. Ngươi không thể trúc cơ — nhưng luyện khí cũng không có tầng cuối. Cứ bế quan, mỗi khi tu vi đầy là lên một tầng. Hiện tại: Luyện Khí tầng ${s.flags.tang ?? 1}.` };
  const nr = s.r + 1;
  if (nr > RMAX()) return tribulationScene();
  if (nr === DAI_DAO) return daiDaoScene();
  const gate = daoGate(nr);
  if (gate) return { title: `Đột phá ${REALMS[nr].n}`, text: `Tu vi đã viên mãn, nhưng cửa chưa mở. ${gate}`, choices: [{ t: 'Tham ngộ ngay', cls: 'prime', fn: () => daoScene() as unknown as string }, { t: 'Chưa vội', fn: () => 'Ngươi lui về.' }] };
  const pills = s.bag.filter((b) => b.id.startsWith('p:') && PILLS[b.id.slice(2)]?.k === 'break');
  const base = btChance();
  const choices: Choice[] = [];
  const want = BREAK_PILL[nr];
  for (const b of pills) {
    const id = b.id.slice(2);
    const bonus = pillBonusOf(id, b.g) * (PILLS[id].tier < nr ? 0.35 : 1);
    choices.push({ t: `Dùng ${itemName(b.id, b.g)}`, hint: `Tỉ lệ ${Math.round(btChance(bonus) * 100)}%${baseItemKey(id) === want ? ' (đúng loại)' : ''}`, cls: baseItemKey(id) === want ? 'prime' : undefined, fn: () => breakthrough({ id, g: b.g ?? 1 }).text });
  }
  choices.push({ t: 'Đột phá tay không', hint: `Tỉ lệ ${Math.round(base * 100)}%`, cls: pills.length ? undefined : 'prime', fn: () => breakthrough().text });
  choices.push({ t: 'Chưa vội', fn: () => 'Ngươi quyết định chuẩn bị thêm.' });
  const wantN = want && PILLS[want] ? PILLS[want].n : '';
  let tc = '';
  if (nr === 2) {
    const k = trucCoKind();
    tc = k === 'menh'
      ? '\n\nNgươi mang đại khí vận — Thiên mệnh trúc cơ: chắc chắn thành công, đạt Hoàn mỹ đạo cơ.'
      : k === 'the'
      ? `\n\nNơi đây có ${DIA_THE[s.loc]} — Địa thế trúc cơ: khó hơn một chút, nhưng nếu thành công sẽ đạt Cực phẩm đạo cơ.`
      : `\n\nTrúc cơ thường: tối đa chỉ đạt Thượng phẩm đạo cơ. Muốn Cực phẩm đạo cơ phải tới nơi có thiên địa chi thế (${Object.keys(DIA_THE).filter((id) => LOCS[id]).slice(0, 4).map((id) => LOCS[id].n).join(', ') || 'những đỉnh núi, vực sâu mang thế trời đất'}…).`;
    if (k === 'menh') choices.splice(0, choices.length - 1, { t: 'Trúc cơ', cls: 'prime', hint: 'Tỉ lệ 100% · Hoàn mỹ đạo cơ', fn: () => breakthrough().text });
  }
  // Hỗn Độn Đạo Thai: chắc chắn thành công, phẩm luôn Hoàn mỹ — không cần (và không phí) đan đột phá
  if (perfectBody()) choices.splice(0, choices.length - 1, { t: 'Đột phá', cls: 'prime', hint: 'Tỉ lệ 100% · Hoàn mỹ', fn: () => breakthrough().text });
  const fb = failBonus(nr);
  return {
    title: `Đột phá ${REALMS[nr].n}`,
    text: `Tu vi đã viên mãn. Bước tới là ${REALMS[nr].n} — thọ nguyên ${REALMS[nr].life} năm, sức mạnh tăng vọt. ${perfectBody() ? 'Hỗn Độn Đạo Thai: đột phá mọi cảnh giới đều chắc chắn thành công.' : `Thất bại sẽ bị thương và tâm ma tăng${s.r >= 3 ? ', thậm chí thân tử đạo tiêu' : ''}.`}${perfectBody() ? '' : `${tc}${wantN && !tc.includes('Thiên mệnh') ? `\n\nĐan dược hỗ trợ: ${wantN}.` : ''}${s.tamma > 20 ? `\nTâm ma đang ở mức ${Math.round(s.tamma)}, làm giảm tỉ lệ.` : ''}${s.hurt > 10 ? `\nĐang bị thương (${Math.round(s.hurt)}%), làm giảm tỉ lệ.` : ''}${fb.n ? `\nKinh nghiệm từ ${fb.n} lần thất bại: tỉ lệ +${Math.round(fb.v * 100)}%.` : ''}`}`,
    choices,
  };
}

// ---------- Tham ngộ pháp tắc / đại đạo ----------
export function daoScene(): Scene {
  const opts = daoOptions();
  const have = [...laws().map((e) => daoOf(e).n), ...daos().map((e) => daoOf(e).dao)];
  const text = `${have.length ? `Đã ngộ: ${have.join(', ')}.` : 'Chưa ngộ pháp tắc nào.'} Chọn thứ muốn quán tưởng; mỗi lần tốn một kỳ bế quan. Pháp tắc là bản đơn giản của Đại đạo cùng loại: ngộ pháp tắc nào thì sau mới ngộ được đại đạo đó. Tầng bậc: Hỗn Độn > Thời gian > Không gian > Bát quái > Âm Dương > Lực · Mẫn · Phá · Ngự > các hệ pháp thuật và vũ khí.`;
  if (!opts.length) return { title: 'Tham ngộ', text: text + (s.r < 18 ? ' Chuẩn Thánh trở lên mới chạm được pháp tắc.' : ' Không còn gì để ngộ.'), kind: 'info' };
  return {
    title: 'Tham ngộ',
    text,
    choices: [...opts.map((o) => ({ t: `${o.kind === 'law' ? 'Pháp tắc' : 'Đại đạo'}: ${o.n}`, hint: `${daoKindLabel(daoOf(o.id))} · ${Math.round(o.p * 100)}% · ${o.kind === 'law' ? `công ×${daoOf(o.id).pow}` : `công ×${daoOf(o.id).daoPow}`}`, cls: (o.p >= 0.4 ? 'prime' : undefined) as 'prime' | undefined, fn: () => contemplate(o.kind, o.id) })), { t: 'Thôi', fn: () => 'Ngươi gác lại.' }],
  };
}

// ---------- Đoạt Đại Đạo ----------
/** Đại Đạo chỉ chứa một người: Hợp Đạo viên mãn muốn bước lên phải giết kẻ đang giữ Đại Đạo. */
export function daiDaoScene(): Scene {
  if (!canLord()) return { title: 'Đoạt Đại Đạo', text: `Muốn tranh ngôi Đạo chủ phải nắm ít nhất ${DAO_FOR_LORD} Đại đạo. Ngươi mới ngộ ${daos().length}. Hãy Tham ngộ đại đạo trước.`, choices: [{ t: 'Tham ngộ ngay', cls: 'prime', fn: () => daoScene() as unknown as string }, { t: 'Chưa vội', fn: () => 'Ngươi lui về.' }] };
  const foe: FoeSpec = { name: DAO_HOLDER, r: DAI_DAO, st: 0, el: null, kind: 'boss', dao: true };
  return {
    title: 'Đoạt Đại Đạo',
    text: `Hợp Đạo viên mãn. Phía trên chỉ còn một bậc, và bậc ấy chỉ chứa được một người: ${DAO_HOLDER}, kẻ đã ngồi ở Đại Đạo từ thuở hỗn độn chưa phân. Không đan dược, không thiên kiếp nào đưa ngươi lên đó được. Muốn thành Đại Đạo, phải giết ${DAO_HOLDER}. Thua là thân tử đạo tiêu.`,
    choices: [
      {
        t: `Khiêu chiến ${DAO_HOLDER}`,
        cls: 'danger',
        hint: `${DAO_HOLDER} · Đại Đạo · ${dangerLabel(foe)} · trận sinh tử, không thể chạy`,
        fn: () => {
          const r = fight(foe, { lethal: true, noFlee: true });
          const t = fightSummary(r);
          if (!r.win) return t;
          s.r = DAI_DAO; s.st = 0; s.prog = 0; s.hurt = 0;
          s.flags.daiDao = true;
          s.fame += DAI_DAO * DAI_DAO * 3;
          mark(`Giết ${DAO_HOLDER}, đoạt Đại Đạo`);
          addLog(`Ngươi giết ${DAO_HOLDER}, thành Đại Đạo duy nhất trong trời đất.`, 'good');
          return `${t} ${DAO_HOLDER} tan vào hư vô. Đạo vị bỏ trống chỉ trong một sát na, rồi rơi xuống người ngươi. Từ nay trong trời đất chỉ có một Đại Đạo: ngươi.`;
        },
      },
      { t: 'Chưa vội', fn: () => 'Ngươi lui về, tiếp tục mài giũa đạo của mình.' },
    ],
  };
}

// ---------- Độ kiếp ----------
export function tribulationScene(): Scene {
  return {
    title: 'Độ kiếp phi thăng',
    text: (s.world ?? 0) >= LAST_WORLD
      ? `${s.body === 'thiendo' && s.r === 1 ? `Luyện Khí tầng ${s.flags.tang ?? 1} — sức mạnh đã ngang ${REALMS[RMAX()].n} viên mãn` : `${REALMS[RMAX()].n} viên mãn`}. Trên ${worldName(s.world ?? 0)} không còn giới nào nữa. Vượt qua kiếp cuối cùng, ngươi sẽ hợp nhất với Đại Đạo — vĩnh hằng bất diệt. Thất bại là tro bay khói tan.`
      : `${s.body === 'thiendo' && s.r === 1 ? `Luyện Khí tầng ${s.flags.tang ?? 1} — sức mạnh đã ngang ${REALMS[RMAX()].n} viên mãn` : `${REALMS[RMAX()].n} viên mãn`}. ${worldName(s.world ?? 0)} chỉ chứa nổi tới ${REALMS[RMAX()].n}. Vượt qua cửu trùng thiên kiếp là phi thăng ${worldName((s.world ?? 0) + 1)} — giới có tầng thứ sinh mệnh cao hơn, mở tới ${REALMS[RMAX((s.world ?? 0) + 1)].n}, nơi ngươi ${s.body === 'thiendo' && s.r === 1 ? 'tiếp tục luyện khí' : 'phải tu lại từ Luyện Khí'}. Thân thể sẽ bị ép về hình hài một tuổi, tâm trí giữ nguyên, thọ nguyên tính lại từ đầu — và ngươi tu luyện được ngay (đặc quyền phi thăng). Thất bại là tro bay khói tan.`,
    choices: [
      { t: 'Dẫn thiên kiếp', cls: 'danger', fn: () => tribulation(1) },
      { t: 'Chưa sẵn sàng', fn: () => 'Mây kiếp tan đi. Còn thời gian chuẩn bị — nhưng thọ nguyên không đợi ai.' },
    ],
  };
}
function tribulation(wave: number): ReturnType<Choice['fn']> {
  const names = ['', 'Thanh Lôi', 'Tử Lôi', 'Hỏa Lôi', 'Phong Kiếp', 'Tâm Ma Kiếp', 'Huyết Lôi', 'Hắc Lôi', 'Ngũ Hành Thần Lôi', 'Cửu Thiên Diệt Thế Lôi'];
  const r = fight({ dao: true, name: `Đạo kiếp thứ ${wave}: ${names[wave]}`, r: RMAX(), st: 3, el: wave === 4 ? 'phong' : wave === 3 ? 'hoa' : 'loi', kind: 'boss', mult: 0.45 + wave * 0.08, skills: ['loiquang', 'tutieuloi'] }, { noFlee: true });
  if (r.died || !r.win) {
    return `${fightSummary(r)} Đạo lôi thứ ${wave} đánh tan nhục thân ngươi.`;
  }
  s.hurt = Math.max(0, s.hurt - 15);
  if (wave >= 9) {
    if ((s.world ?? 0) >= LAST_WORLD) { transcend(); return 'Đạo kiếp cuối cùng tan thành ánh sáng. Ngươi không còn là người tu đạo — ngươi là một phần của Đại Đạo. Trời đất có ngày tàn, ngươi thì không.'; }
    const to = ascend();
    return `Đạo lôi cuối cùng tan biến. Mây kiếp rẽ ra, một cột sáng vàng rót xuống. Ngươi bước lên cột sáng, không quay đầu lại.\n\nKhi mở mắt, ngươi đã ở ${to}. Linh khí đặc như nước, kẻ quét rác bên đường cũng có khí tức khiến ngươi rùng mình. ${s.body === 'thiendo' && s.r === 1 ? `Thiên Đố Chi Thể vẫn vậy: ngươi tiếp tục luyện khí từ tầng ${s.flags.tang ?? 1}.` : 'Tu vi bị pháp tắc giới này ép về Luyện Khí — phải tu lại từ đầu, nhưng mỗi bước ở đây đều nặng hơn cả một cảnh giới ở hạ giới.'} Ngươi cúi nhìn: hai bàn tay bé xíu của một đứa trẻ một tuổi. Thân thể về điểm khởi đầu, nhưng trong đầu vẫn là ${Math.floor(s.year - (s.flags.soulBorn ?? s.born))} năm ký ức — và linh khí đã chảy được vào kinh mạch ngay lúc này.`;
  }
  return {
    text: `${fightSummary(r)} Đạo kiếp thứ ${wave} qua đi. Mây kiếp còn dày hơn — ${names[wave + 1]} đang tụ lại.`,
    choices: [{ t: `Đón đạo kiếp thứ ${wave + 1}`, cls: 'danger', fn: () => tribulation(wave + 1) }],
  };
}

export const sectRecruitmentUsed = (id: string, year = Math.floor(s.year)) =>
  ((s.flags.sectRecruitYear || {}) as Record<string, number>)[id] === year;

export function sectRecruitmentScene(id: string): Scene {
  const sc = SECTS[id];
  if (!sc || sc.tier !== 4) return { title: 'Kỳ tuyển sinh', text: 'Nơi này không tổ chức kỳ tuyển sinh của thánh địa.', kind: 'info' };
  const year = Math.floor(s.year);
  const title = `${sc.n} tuyển sinh`;
  if (sectRecruitmentUsed(id, year) || (id === 'tutieu' && s.flags.tutieuRecruitYear === year)) {
    return { title, text: `Kỳ tuyển sinh năm ${year} đã kết thúc. Hãy quay lại vào năm ${year + 1}.`, kind: 'info' };
  }
  const years = (s.flags.sectRecruitYear ||= {}) as Record<string, number>;
  years[id] = year;
  if (id === 'tutieu') s.flags.tutieuRecruitYear = year;
  const admission = canJoin(id);
  const team = 'Một đệ tử ngoại môn Trúc Cơ sơ kỳ dẫn đội; theo sau là bốn đệ tử tạp dịch có tu vi Luyện Khí sơ kỳ, trung kỳ, hậu kỳ và viên mãn.';
  if (!admission.ok) {
    return {
      title,
      text: `Mỗi năm, ${sc.n} đều mở một kỳ tuyển sinh. ${team} Năm nay ngươi chưa thể tham gia: ${admission.why}`,
      choices: [{ t: 'Chờ kỳ tuyển năm sau', fn: () => 'Ngươi lui khỏi đài tuyển đồ.' }],
    };
  }
  return {
    title,
    text: `${team} Chấp sự mời ngươi thử trắc linh, khảo hạch nhập môn tại ${id === 'tutieu' ? 'Tử Tiêu Thành' : `sơn môn ${sc.n}`}. Kỳ tuyển năm ${year} chỉ diễn ra một lần.`,
    choices: [
      {
        t: 'Tham gia khảo hạch',
        cls: 'prime',
        fn: () => {
          const current = canJoin(id);
          if (!current.ok) return `Khảo hạch không thể tiếp tục: ${current.why}`;
          return `Trắc linh thạch sáng lên, chấp sự gật đầu nhận ngươi vào ${sc.n}. ${joinSect(id)}`;
        },
      },
      { t: 'Để năm sau', fn: () => 'Ngươi quyết định chuẩn bị thêm rồi quay lại vào kỳ tuyển sau.' },
    ],
  };
}

export const tutieuRecruitmentScene = () => sectRecruitmentScene('tutieu');

// ---------- Tại chỗ ----------
export const placeType = (): Loc['type'] => LOCS[s.loc].type;

export function wander(): Scene {
  const l = LOCS[s.loc];
  delete s.flags.pinLv;
  passTime(Math.max(1 / 12, REALMS[s.r].turn * 0.25));
  const ev = tryEvent(l.type as Where, 0.85);
  if (ev) return ev;
  const flav = [
    `Ngươi dạo quanh ${l.n}. Tiếng rao hàng, mùi bánh hấp, một đứa trẻ chạy ngang qua. Không có gì đặc biệt.`,
    `Ngồi ở quán trà đầu phố nghe người ta kể chuyện tu tiên. Nửa thật nửa giả.`,
    `Mưa phùn. Ngươi trú dưới mái hiên cùng một người bán ô, cả hai cùng im lặng.`,
  ];
  if (ch(0.3)) {
    const n = addNpc(mkNpc({ dr: ri(-1, 0), rel: ri(5, 20), how: `Quen ở ${l.n}` }));
    return { title: 'Dạo chơi', text: `Ngươi làm quen được ${n.name}, ${n.r ? 'một tu sĩ ' + npcRealm(n) : 'một người dân'} tính tình ${n.trait}.` };
  }
  return { title: 'Dạo chơi', text: pick(flav) };
}

export function explore(): Scene {
  const l = LOCS[s.loc];
  delete s.flags.pinLv;
  const lv = l.lv ?? effRi();
  passTime(REALMS[s.r].turn * 0.5);
  const where: Where = l.type === 'realm' ? 'realm' : 'wild';
  const ev = tryEvent(where, l.type === 'realm' ? 0.75 : 0.55);
  if (ev) return ev;
  if (ch(0.55)) return beastEncounter(lv);
  return gatherScene(true);
}

export function beastEncounter(lv: number): Scene {
  const { spec } = beastFoe(clamp(lv + ri(-1, 0), 0, RMAX()));
  return {
    title: `Gặp ${spec.name}`,
    text: `Bụi cây rung lên. Một con ${spec.name} (${spec.r ? REALMS[spec.r].n : 'yêu thú cấp thấp'}) chặn đường, mắt đỏ ngầu. Đánh giá: ${dangerLabel(spec)}.`,
    choices: [
      { t: 'Giao chiến', cls: 'prime', fn: () => { const r = fight(spec); return fightSummary(r); } },
      { t: 'Lặng lẽ lui đi', fn: () => (ch(0.65 + (stat('van') - 5) * 0.04 + (has('nhangiac') ? 0.2 : 0) + pqSum('hide')) ? 'Ngươi nín thở lùi lại, nó không đuổi theo.' : (() => { const r = fight(spec); return 'Nó phát hiện ra ngươi! ' + fightSummary(r); })()) },
    ],
  };
}

export function gatherScene(fromExplore = false): Scene {
  const l = LOCS[s.loc];
  const lv = Math.max(1, (l.lv ?? 1) + (l.type === 'realm' ? 1 : 0));
  if (!fromExplore) passTime(REALMS[s.r].turn * 0.5);
  const pool = Object.values(HERBS).filter((h) => h.reg.includes(l.reg) && h.tier <= lv + 1);
  if (!pool.length) return { title: 'Hái thuốc', text: 'Lục lọi cả buổi chỉ thấy cỏ dại.' };
  const n = ri(1, 3) + (has('duocdien') ? 1 : 0) + (l.type === 'realm' ? 1 : 0) + pqSum('herb');
  const got: string[] = [];
  for (let i = 0; i < n; i++) {
    const h = wpick(pool, (x) => (x.tier <= lv ? 3 : 1) / x.tier);
    if (addItem('h:' + h.id, 1)) got.push(h.n);
  }
  if (!fromExplore && ch(0.25)) {
    const sc = beastEncounter(l.lv ?? effRi());
    sc.text = `Ngươi hái được ${got.join(', ') || 'chẳng gì'}. ` + sc.text;
    return sc;
  }
  return { title: 'Hái thuốc', text: got.length ? `Vạch lá tìm kiếm, ngươi hái được: ${got.join(', ')}.` : 'Túi đầy, không mang thêm được.' };
}

export function work(): Scene {
  const l = LOCS[s.loc];
  const y = s.r === 0 ? 0.5 : REALMS[s.r].turn * 0.5;
  passTime(y);
  if (s.r === 0) {
    const jobs = l.type === 'village' ? ['đốn củi', 'chăn trâu', 'gặt lúa thuê', 'đánh cá'] : ['bưng bê ở tửu lâu', 'khuân vác ở bến', 'chép sách thuê', 'làm tiểu nhị hiệu thuốc'];
    const m = Math.round(rf(3, 7) * (1 + (stat('can') - 5) * 0.05));
    s.money += m;
    return { title: 'Làm thuê', text: `Nửa năm ${pick(jobs)}, tích cóp được ${m} linh thạch (đổi từ bạc vụn).` };
  }
  if (s.craft.alch >= 1 && ch(0.5)) {
    const m = M(rf(8, 14) * s.craft.alch);
    s.money += m;
    return { title: 'Ngồi đường bán thuốc', text: `Ngươi bày sạp chữa bệnh, bán thuốc cho phàm nhân và tán tu. Kiếm được ${fmt(m)} linh thạch.` };
  }
  const m = M(rf(6, 12));
  s.money += m;
  const jobs = ['hộ tống thương đội', 'trấn yêu cho một trang viên', 'canh giữ dược điền cho phường thị', 'dạy võ cho con nhà giàu', 'trừ tà cho một ngôi miếu'];
  if (ch(0.2)) {
    const sc = beastEncounter(Math.max(0, effRi() - 1));
    sc.text = `Trong lúc ${pick(jobs)}, có biến! ` + sc.text;
    return sc;
  }
  return { title: 'Nhận việc', text: `${yearsTxt(y)} ${pick(jobs)}, nhận ${fmt(m)} linh thạch tiền công.` };
}

export function rest(): Scene {
  const y = Math.max(1 / 12, REALMS[s.r].turn * 0.25);
  passTime(y);
  s.hurt = clamp(s.hurt - 20, 0, 100);
  return { title: 'Dưỡng thương', text: `Nghỉ ngơi ${yearsTxt(y)}. Thương thế còn ${Math.round(s.hurt)}%.` };
}

// ---------- Đi lại ----------
export function travelInfo(l: Loc) {
  const block = travelBlock(l);
  const ship = needsShip(l) && effRi() < 2;
  const y = travelYears(l) * (ship ? 0.7 : 1);
  return { block, ship, y, fare: ship ? shipFare() : 0, d: Math.round(dist(s, l)) };
}
export function formationInfo(l: Loc) {
  const destination = l.formationTo ? LOCS[l.formationTo] : undefined;
  const fare = M(80);
  const reason = l.type !== 'formation' || !destination
    ? 'Đây không phải là đầu truyền tống trận.'
    : s.loc !== l.id
    ? 'Phải tới truyền tống trận trên bản đồ trước.'
    : s.money < fare
    ? `Cần ${fare} linh thạch làm trận phí.`
    : null;
  return { available: !reason, reason, fare, destination };
}
/** Truyền tống trận: tới nơi ngay lập tức, không mất thời gian (chỉ tốn trận phí). */
export function travelFormation(id: string): Scene {
  const l = LOCS[id];
  const ti = formationInfo(l);
  if (!ti.available) return { title: 'Không thể truyền tống', text: ti.reason || 'Truyền tống trận không khả dụng.' };
  const from = l.n;
  s.money -= ti.fare;
  setLoc(ti.destination!.id);
  const text = `Từ ${from}, ngươi kích hoạt cổ trận. Không gian xoắn lại, chớp mắt đã tới ${ti.destination!.n}; tiêu hao ${ti.fare} linh thạch.`;
  addLog(text);
  return { title: ti.destination!.n, text: `${text}\n\n${ti.destination!.d}`, kind: 'info' };
}
export function travelTo(id: string): Scene {
  const l = LOCS[id];
  const ti = travelInfo(l);
  if (ti.block) return { title: 'Không thể đi', text: ti.block };
  if (ti.ship) {
    const port = LOCS[s.loc].port || LOCS[s.loc].island;
    if (!port) return { title: 'Cần thuyền', text: 'Nơi ấy ở bên kia biển. Chưa thể ngự kiếm vượt biển (cần Trúc Cơ) — hãy tới một thành trì hoặc bến cảng để thuê thuyền.' };
    if (s.money < ti.fare) return { title: 'Thiếu tiền', text: `Lái thuyền đòi ${ti.fare} linh thạch.` };
    s.money -= ti.fare;
  }
  const from = LOCS[s.loc].n;
  if (ti.y > 0) passTime(ti.y);
  // sự kiện dọc đường (tọa kỵ tới ngay lập tức thì không có dọc đường)
  const roadP = clamp(ti.d / 900, 0.15, 0.6);
  const ev = ti.y > 0 ? tryEvent('road', roadP) : null;
  setLoc(id);
  const mount = myLinh();
  const how = ti.ship ? 'vượt biển' : mount ? `cưỡi ${mount.name}` : effRi() >= 2 ? 'ngự kiếm' : 'đi bộ';
  const arrive = ti.y > 0 ? `Rời ${from}, ${how} ${yearsTxt(ti.y)}, tới ${l.n}.` : `Rời ${from}, ${how} — chớp mắt đã tới ${l.n}.`;
  addLog(arrive);
  if (ev) {
    ev.text = arrive + ' Dọc đường...\n\n' + ev.text;
    return ev;
  }
  return { title: l.n, text: `${arrive}\n\n${l.d}`, kind: 'info' };
}

export function visitPin(p: Pin): Scene {
  const y = Math.max(1 / 12, dist(s, p) / travelSpeed());
  passTime(y);
  s.x = p.x;
  s.y = p.y;
  s.pins = s.pins.filter((x) => x.id !== p.id);
  s.flags.pinLv = p.lv;
  const ev = pickEvent(('pin' + p.k) as Where);
  // về địa điểm gần nhất sau sự kiện (vị trí logic)
  const near = Object.values(LOCS).filter((l) => l.reg === p.reg).sort((a, b) => dist(a, p) - dist(b, p))[0];
  if (near) { s.loc = near.id; }
  if (ev) return eventScene(ev);
  if (p.k === '!') return beastEncounter(p.lv);
  const sc = gatherScene(true);
  sc.text = 'Nơi này vắng lặng. ' + sc.text;
  return sc;
}

// ---------- Tông môn ----------
export function doMission(i: number): Scene {
  const m = missionPool()[i];
  if (!m || !s.sect) return { title: '', text: '' };
  const yrs = m.y * Math.max(0.5, REALMS[s.r].turn);
  passTime(yrs);
  let text = `Nhận nhiệm vụ: ${m.n}. `;
  if (ch(m.danger)) {
    const r = fight(m.danger >= 1 ? { name: pick(['Ma tu áo đen', 'Phản đồ', 'Kẻ trộm bí kíp']), r: effRi(), kind: 'cultivator', mult: 1.05 } : beastFoe(Math.max(0, effRi() - (m.danger < 0.6 ? 1 : 0))).spec, { lethal: m.danger >= 1 });
    text += fightSummary(r) + ' ';
    if (!r.win) {
      const half = Math.round(m.reward / 3);
      s.sect.contrib += half;
      return { title: m.n, text: text + `Nhiệm vụ thất bại, chỉ được ${half} cống hiến an ủi.` + missionProg(yrs, 0.15) };
    }
  }
  s.sect.contrib += m.reward;
  const pay = M(rf(1, 3));
  s.money += pay;
  return { title: m.n, text: text + `Hoàn thành. Cống hiến +${m.reward}, thưởng ${fmt(pay)} linh thạch.` + missionProg(yrs) };
}
export { promote, promoInfo, sect };

// ---------- Nhân mạch ----------
export function songTuWith(ids: string[]) {
  const people = [...new Set(ids)].map(id => findNpc(id));
  const year = Math.floor(s.year);
  if (!people.length || people.some(n => !n || !canSongTu(n) || (s.flags['npc_dual' + n.id] ?? -99) >= year)) return 'Người đã chọn chưa đủ điều kiện song tu hoặc cần chờ sang năm.';
  const partners = people.filter((n): n is NonNullable<typeof n> => !!n);
  const outcome = songTuOutcome(partners, 'Ngươi cùng ' + partners.map(n => n.name).join(', ') + ' nhập định, điều hòa linh khí. Tu vi tăng mạnh.');
  const bonus = partners.some(n => n.r >= effRi()) ? 35 : 20;
  for (const n of partners) s.flags['npc_dual' + n.id] = year;
  passTime(REALMS[s.r].turn);
  s.prog = Math.min(100, s.prog + bonus);
  for (const n of partners) relChange(n, 3);
  return outcome;
}
export function npcActions(id: string): Choice[] {
  const n = findNpc(id);
  if (!n || !n.alive) return [];
  const y = Math.floor(s.year);
  const done = (k: string) => (s.flags['npc_' + k + n.id] || -99) >= y;
  const markDone = (k: string) => (s.flags['npc_' + k + n.id] = y);
  const out: Choice[] = [];
  out.push({
    t: 'Đàm đạo', dis: done('talk'), hint: done('talk') ? 'Năm nay đã gặp' : undefined,
    fn: () => {
      markDone('talk');
      passTime(1 / 12);
      relChange(n, ri(3, 8));
      if (n.r > effRi() && ch(0.4)) { s.prog = Math.min(100, s.prog + 8); return `Ngươi cùng ${n.name} luận đạo suốt đêm. Lời ${n.g === 'm' ? 'hắn' : 'nàng'} khiến ngươi thông suốt nhiều chỗ. Tu vi tăng.`; }
      return `Ngươi cùng ${n.name} uống trà, kể chuyện mấy năm qua. Quan hệ thân thiết hơn.`;
    },
  });
  const gifts = s.bag.filter((b) => !b.id.startsWith('cp:') && !b.id.startsWith('x:')).slice(0, 6);
  if (gifts.length) out.push({
    t: 'Tặng quà', dis: done('gift'),
    fn: () => ({
      text: `Tặng ${n.name} thứ gì?`,
      choices: gifts.map((b) => ({
        t: itemName(b.id, b.g),
        fn: () => {
          markDone('gift');
          const v = clamp(Math.round((itemPrice(b.id, b.g) / M(6)) * 5), 2, 25);
          removeItem(b.id, 1, b.g);
          relChange(n, Math.max(2, v));
          return `${n.name} nhận lấy, ${v > 10 ? 'mắt sáng lên' : 'gật đầu cảm ơn'}.`;
        },
      })),
    }),
  });
  if (n.r > 0) out.push({
    t: 'Luận bàn', dis: done('spar'), hint: 'Tỷ thí không sát thương',
    fn: () => {
      markDone('spar');
      const r = fight({ name: n.name, r: n.r, st: n.st, el: n.el, kind: 'cultivator' }, { lethal: false, noLoot: true });
      relChange(n, r.win ? 4 : 6);
      s.techM = Math.min(100, s.techM + 4);
      if (r.win) s.wins--; // luận bàn không tính chiến tích
      s.kills = Math.max(0, s.kills - (r.win ? 1 : 0));
      return fightSummary(r) + ' Hai bên chắp tay. Kinh nghiệm chiến đấu tăng.';
    },
  });
  if (n.tag === 'master' && n.r > effRi()) out.push({
    t: 'Cầu sư phụ chỉ điểm', dis: done('teach'),
    fn: () => {
      markDone('teach');
      passTime(REALMS[s.r].turn);
      s.prog = Math.min(100, s.prog + 25);
      s.techM = Math.min(100, s.techM + 10);
      return `${n.name} chỉ ra mấy chỗ sai trong vận khí của ngươi. Tu vi và độ thuần thục công pháp tăng.`;
    },
  });
  if (n.tag === 'daolu') out.push({
    t: 'Song tu', dis: done('dual') || !canSongTu(n),
    fn: () => {
      return songTuWith([n.id]);
    },
  });
  const canPropose = n.rel >= 80 && n.tag !== 'daolu' && n.tag !== 'kin' && n.tag !== 'master' && n.tag !== 'disciple' && (n.r >= 1 || s.r === 0) && Math.abs(n.r - s.r) <= 2;
  if (canPropose) out.push({
    t: 'Ngỏ ý kết làm đạo lữ', cls: 'prime',
    fn: () => {
      if (ch(0.5 + (n.rel - 80) / 40 + (stat('mi') - 5) * 0.04)) {
        wedDaolu(n);
        n.rel = 100;
        mark(`Kết làm đạo lữ với ${n.name}`);
        return `${n.name} im lặng rất lâu, rồi khẽ gật đầu. Dưới gốc cây già, hai người thề cùng nhau đi hết tiên lộ.`;
      }
      relChange(n, -10);
      return `${n.name} lảng tránh ánh mắt ngươi: "Ta... chưa nghĩ tới chuyện đó." Có chút ngượng ngùng.`;
    },
  });
  if (n.tag === 'enemy' || n.tag === 'rival' || n.rel <= -40) out.push({
    t: 'Tìm tới khiêu chiến sinh tử', cls: 'danger', hint: dangerLabel({ name: n.name, r: n.r, st: n.st, kind: 'cultivator' }),
    fn: () => {
      passTime(REALMS[s.r].turn * 0.5);
      const r = fight({ name: n.name, r: n.r, st: n.st, el: n.el, kind: 'cultivator' });
      if (r.win) {
        n.alive = false;
        n.died = s.year;
        n.cause = 'chết dưới tay ngươi';
        s.fame += 10 + n.r * 10;
        if (s.flags.nemesis === n.id) { s.flags.revenged = true; mark(`Báo được thù diệt môn, chém ${n.name}`); }
        else mark(`Chém ${n.name}`);
      }
      return fightSummary(r);
    },
  });
  return out;
}

export const rootN = () => ROOTS[s.root.k].n;
export const typeN = (l: Loc) => LOC_TYPE[l.type].n;
export { PILL_GRADE, SECTS, maxHp, cultRate };

// ---------- Chờ một năm ----------
export function waitYear(): Scene {
  passTime(1);
  s.hurt = clamp(s.hurt - 30, 0, 100);
  return { title: 'Chờ một năm', text: `Một năm trôi qua yên ả. Thương thế còn ${Math.round(s.hurt)}%.`, kind: 'info' };
}

// ---------- Trà lâu: nghe đồn ----------
export const teaPrice = () => M(2);
export function teahouse(): Scene {
  const price = teaPrice();
  if (s.money < price) return { title: 'Trà lâu', text: 'Tiểu nhị liếc túi tiền của ngươi rồi quay đi.' };
  s.money -= price;
  passTime(1 / 12);
  const lines: string[] = [];
  const realms = Object.values(LOCS).filter((l) => l.type === 'realm').sort((a, b) => Math.hypot(a.x - s.x, a.y - s.y) - Math.hypot(b.x - s.x, b.y - s.y));
  for (const r of realms.slice(0, 2)) {
    const open = realmOpen(r);
    lines.push(open ? `"Nghe nói ${r.n} đang mở! Chỉ ${REALMS[r.minRealm || 0].n} trở lên mới vào được."` : `"${r.n} phải tới năm ${nextOpen(r)} mới mở lại."`);
  }
  const auc = Object.values(LOCS).filter((l) => l.auction);
  const a = pick(auc);
  lines.push(Math.floor(s.year) % 2 === 0 ? `"Năm nay ${a.n} mở hội đấu giá, đồ tốt lắm."` : `"Sang năm ${a.n} mới mở hội đấu giá."`);
  if (ch(0.6)) {
    spawnPin();
    const p = s.pins[s.pins.length - 1];
    lines.push(`"Mấy hôm trước có người thấy ${p.k === 'bao' ? 'bảo quang' : p.k === '!' ? 'yêu khí' : p.k === 'bi' ? 'một lối vào lạ' : 'chuyện kỳ quái'} gần ${nearestLoc(p.x, p.y).n}." (Bản đồ có dấu mới)`);
  }
  const en = s.npcs.find((n) => n.alive && (n.tag === 'enemy' || n.tag === 'rival'));
  if (en && ch(0.5)) lines.push(`"${en.name}? Nghe nói đã tới ${REALMS[en.r].n} rồi đấy."`);
  return { title: 'Trà lâu', text: `Ngươi gọi một ấm trà (${price} linh thạch), ngồi gần bàn thuyết thư. Nghe được mấy chuyện:\n\n` + lines.join('\n') };
}

// ---------- Bảng nhiệm vụ (truy nã, săn yêu, hộ tống) ----------
export interface Bounty { key: string; n: string; d: string; lv: number; reward: number; y: number; kind: 'beast' | 'outlaw' | 'escort' }
export function bounties(): Bounty[] {
  const key = `${s.loc}:${Math.floor(s.year)}`;
  const rnd = seeded(hashStr(key + s.id));
  const done = (s.flags.bountyDone ||= {}) as Record<string, boolean>;
  const out: Bounty[] = [];
  const kinds: Bounty['kind'][] = ['beast', 'outlaw', 'escort', 'beast', 'outlaw'];
  for (let i = 0; i < 4; i++) {
    const kind = kinds[Math.floor(rnd() * kinds.length)];
    const lv = clamp(effRi() + Math.floor(rnd() * 3) - 1, 0, RMAX());
    const reward = Math.round(14 * moneyScale(lv) * (0.8 + rnd() * 0.6) * (kind === 'escort' ? 1.3 : 1));
    const n = kind === 'beast' ? `Săn ${pick(['yêu lang', 'yêu hổ', 'độc xà', 'yêu điêu', 'thạch yêu'])} quấy nhiễu` : kind === 'outlaw' ? `Truy nã ${pick(['tán tu giết người', 'ma tu bắt cóc trẻ con', 'đạo tặc trộm bảo khố', 'kẻ phản bội tông môn'])}` : `Hộ tống ${pick(['thương đội', 'xe linh dược', 'tiểu thư thế gia', 'đoàn hành hương'])}`;
    const k = `${key}#${i}`;
    if (done[k]) continue;
    out.push({ key: k, n, d: `Cấp ${REALMS[lv].n}`, lv, reward, y: Math.max(1 / 12, REALMS[s.r].turn * (kind === 'escort' ? 0.8 : 0.5)), kind });
  }
  return out;
}
export function doBounty(b: Bounty): Scene {
  passTime(b.y);
  (s.flags.bountyDone ||= {})[b.key] = true;
  const spec = b.kind === 'beast' ? beastFoe(b.lv).spec : { name: b.kind === 'outlaw' ? b.n.replace('Truy nã ', '').replace(/^./, (c) => c.toUpperCase()) : 'Bọn cướp đường', r: b.lv, kind: 'cultivator' as const, mult: b.kind === 'escort' ? 1.1 : 1 };
  const r = fight(spec);
  if (r.win) {
    s.money += b.reward;
    s.fame += 2 + b.lv;
    return { title: b.n, text: `${fightSummary(r)} Nhiệm vụ hoàn thành, nhận ${fmt(b.reward)} linh thạch.` + missionProg(b.y) };
  }
  return { title: b.n, text: `${fightSummary(r)} Nhiệm vụ thất bại.` + missionProg(b.y, 0.15) };
}
