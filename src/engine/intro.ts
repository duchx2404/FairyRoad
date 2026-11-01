// Dẫn truyện mở đầu khi vừa "Bước vào nhân gian".
import { ORIGINS, originName, worldName } from '../data/core';
import { LOCS, whereOf } from '../data/world';
import { s } from './state';
import { eventScene, type Scene } from './actions';
import { EVENTS } from './events';

export function introScene(): Scene {
  const org = ORIGINS.find((o) => o.id === s.origin);
  const l = LOCS[s.loc];
  const age = Math.floor(s.year - s.born);
  const head = `Năm ${Math.floor(s.year)}, ${worldName(s.world ?? 0)}. ${l ? `${l.n}, ${whereOf(l)}.` : ''}`;
  const identity = s.beast ? `Yêu thú ${s.beast} thuộc Yêu tộc` : s.race ? `người thuộc ${s.race}` : '';
  const who = org ? `Ngươi là ${s.name}${identity ? ` — ${identity}` : ''}; ${originName(org, s.g).toLowerCase()}. ${org.d}` : `Ngươi là ${s.name}.`;
  const logs = s.log.map((x) => x.t).filter((t) => t && !t.startsWith('Sinh ra tại')).join('\n\n');
  const close = s.flags.childhood
    ? 'Tiên lộ còn xa. Trước mắt ngươi chỉ là những năm thơ ấu ở Tổ Địa, cùng các vị hôn thê còn nhỏ như ngươi.'
    : `${age} tuổi, đứng ở ${l?.n ?? 'nơi này'}, ngươi ngẩng đầu nhìn trời. Tiên lộ mạn mạn — bước đầu tiên, đi về đâu là do ngươi chọn.`;
  return { title: 'Bước vào nhân gian', text: [head, who, logs, close].filter(Boolean).join('\n\n'), kind: 'event' };
}

/** Chuỗi mở đầu: ở Thương Lan, đêm ngươi ra đời là đêm sao băng hồi hạ giả giáng xuống — kể trước, rồi mới tới "Bước vào nhân gian". */
export function openingScene(): Scene {
  const intro = introScene(); // dựng trước để nhật ký của sự kiện sao băng không lẫn vào phần dẫn truyện
  const meteor = (s.world ?? 0) === 0 && s.evSeen.tc_sao_bang === undefined ? EVENTS.find((e) => e.id === 'tc_sao_bang') : undefined;
  return meteor ? { ...eventScene(meteor), then: intro } : intro;
}
