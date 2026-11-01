// Khe cắm nội bộ engine: tầng lõi (char.ts, core.ts) gọi lên tầng trên qua các khe này
// thay vì import thẳng, để không tạo vòng import chéo. Mỗi mô-đun tầng trên tự gán khe của
// mình khi được nạp; wire.ts bảo đảm chúng luôn được nạp.
import type { NPC } from './state';

export const slots = {
  /** kinhmach.ts: hệ số công từ kinh mạch (0 = chưa nối). */
  kmAtk: (): number => 0,
  /** kinhmach.ts: hệ số tu luyện từ kinh mạch. */
  kmCult: (): number => 0,
  /** dao.ts: nhân công phạt từ pháp tắc / đại đạo. */
  daoPow: (): number => 1,
  /** npctick.ts: một NPC trôi qua y năm. */
  npcTick: (_n: NPC, _y: number): void => {},
  /** tienco.ts: người trên bảng Thiên Cơ Lâu trôi qua y năm. */
  tiencoTick: (_y: number): void => {},
  /** court.ts: trả bổng lộc triều đình khi qua năm. */
  courtPay: (): void => {},
};
