import type { NPC } from '../engine/state';

export const HEROINE = {
  name: 'Ngô Thu Phương',
  given: 'Thu Phương',
  pic: 'pc_f',
  bio: {
    look: 'Thiếu nữ dung mạo thanh tú, ánh mắt sáng và điềm tĩnh; thường đeo một nửa ngọc bội cũ bên người.',
    root: 'Thập linh căn viên mãn (đủ mười hệ)',
    els: ['kim', 'moc', 'thuy', 'hoa', 'tho', 'bang', 'loi', 'phong', 'am', 'quang'],
    body: 'Hỗn Độn Đạo Thai',
    bodyD: 'Đạo thai hiếm có, căn cơ và sinh cơ đều vượt xa người thường.',
    perk: 'Thiên Mệnh',
    perkD: 'Mệnh cách đỉnh cấp; gặp dữ hóa lành, cơ duyên và ngộ tính đều hơn người.',
    family: 'Ngô gia Hỗn Độn — người được đưa về Thương Lan từ khi còn nhỏ',
    traits: 'Kiên định, tự chủ',
    hobby: 'Tu luyện, ngắm sao',
  } satisfies NonNullable<NPC['bio']>,
};
