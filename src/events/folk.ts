// Sự kiện thế tục / dân gian: Tranh đoạt hoàng vị, đánh giặc biên ải, liên hôn gia tộc & hoàng thất.
import {
  RMAX, effRi, register, s, M, gain, money, cult, hurt, heal, statUp, tamma, fame, good, evil, giveGear,
  battle, cultivator, beast, mortal, meet, he, ch, ri, pick, root, age, realmN, here, mark, setFlag, flag,
  canPay, hasItem, lose, relChange, npcTitle, LOCS, REALMS, type Choice, type NPC, type Outcome,
} from '../engine/api';
import { mkName } from '../engine/core';
import { wedDaolu } from '../engine/relationships';

/** Kiểm tra xuất thân thuộc dòng dõi hoàng gia hoặc thân vương. */
const isRoyalOrigin = () => ['hoang_toc_dich', 'thaitu', 'thetu_vuongphu'].includes(s.origin);
/** Kiểm tra xuất thân quan võ, tướng soái hoặc binh nghiệp. */
const isMilitaryOrigin = () => ['tran_bac_hau', 'dai_tuong_quan', 'cam_quan_do_thong', 'tien_phong_hieu_uy', 'ngu_lam_quan', 'thien_xa_thu', 'tieucuc'].includes(s.origin);
/** Kiểm tra xuất thân quan lại, thế gia hoặc thư hương. */
const isNobleOrigin = () => ['con_te_tuong', 'con_thuong_thu', 'con_quan_huyen', 'dochu', 'giatoc'].includes(s.origin) || !!s.flags.clan;

register([
  // =========================================================================
  // PHẦN 1: TRANH ĐOẠT HOÀNG VỊ / CUNG ĐÌNH PHONG VÂN
  // =========================================================================

  // 1. Cửu Tử Đoạt Đích / Sóng Ngầm Hoàng Cung
  {
    id: 'folk_cuu_tu_doat_dich',
    where: ['town', 'road', 'village'],
    w: 5,
    minAge: 16,
    cd: 15,
    cond: () => here().reg === 'trungtho' || isRoyalOrigin() || isNobleOrigin(),
    title: 'Cửu Tử Đoạt Đích',
    text: () => {
      const isRoy = isRoyalOrigin();
      const prefix = isRoy
        ? 'Tin mật từ trong hoàng cung truyền ra: Lão Hoàng đế Đại Chu long thể nguy kịch, khí số suy vi. Trong cung sương mù dày đặc sát cơ. '
        : 'Ghé quán trà bên đường ở Trung Thổ, ngươi nghe các tu sĩ và thương nhân thì thào bàn tán: Hoàng đế Đại Chu lâm trọng bệnh, triều đình chao đảo. ';
      return (
        prefix +
        'Đông Cung Thái Tử bị vu cáo dùng thuật yểm bùa mưu hại phụ hoàng; Tam Hoàng Tử tay nắm Binh Bộ cấm quân rục rịch điều binh; Lục Hoàng Tử lại ngầm kết liên cùng tà tu Ma đạo. ' +
        'Ngay trong đêm, một phong mật thư đóng dấu long văn được đặc sứ hỏa tốc đưa đến tận tay ngươi!'
      );
    },
    ch: () => [
      {
        t: 'Phò tá Đông Cung Thái Tử (Bảo vệ chính thống)',
        cls: 'prime',
        hint: 'Cần lòng nhân nghĩa, nhận thánh bảo hoàng thất',
        fn: () => {
          good(12);
          fame(15);
          s.flags.folk_royal_ally = 'thaitu';
          money(1200);
          const gearText = giveGear(effRi(), 2, 3, 'quang');
          mark('Phò tá Đông Cung Thái Tử dẹp tan lời gièm pha, bảo vệ hoàng thống');
          return (
            'Ngươi lập tức vào triều, dùng đạo thuật thanh tẩy bùa chú tà ám và dâng linh đan cứu Hoàng Đế qua cơn nguy kịch. ' +
            'Lời vu khống bị đập tan, Đông Cung giữ vững ngôi vị thừa kế. Thái Tử cảm kích rơi lệ, Hoàng Đế đích thân mở quốc khố ban thưởng 1.200 linh thạch cùng bảo ngọc hộ thân.' +
            gearText
          );
        },
      },
      {
        t: 'Đầu quân Tam Hoàng Tử (Thiết huyết mưu đoạt)',
        cls: 'danger',
        hint: 'Sát phạt quyết đoán, thu được quân giới thần binh',
        fn: () => {
          evil(8);
          s.flags.folk_royal_ally = 'tamhoangtu';
          money(1500);
          statUp('can', 2);
          const gearText = giveGear(effRi(), 2, 1, 'kim');
          mark('Đầu quân Tam Hoàng Tử, dùng thiết huyết dẹp sạch địch thủ cấm cung');
          return (
            'Ngươi gia nhập cấm quân dưới trướng Tam Hoàng Tử, đột kích phủ các đại thần đối lập, thu giữ binh phù then chốt. ' +
            'Tam Hoàng Tử đắc thế nắm trọn quyền triều chính, thưởng nóng 1.500 linh thạch và trao tặng một bộ chiến giáp cấm vệ thượng phẩm. Căn cốt của ngươi được tôi luyện qua đao kiếm sát phạt!' +
            gearText
          );
        },
      },
      ...(isRoyalOrigin() || s.stats.van >= 8
        ? [
            {
              t: 'Tự mình đoạt lấy Chân Long Khí Vận!',
              cls: 'prime' as const,
              hint: 'Khí phách chí tôn: Tăng căn cốt, khí vận, đạo tâm',
              fn: () => {
                statUp('van', 3);
                statUp('can', 2);
                statUp('tam', 2);
                fame(25);
                s.flags.folk_true_dragon = true;
                mark('Giữa cơn biến loạn hoàng thất, đoạt lấy Chân Long Tử Khí');
                return (
                  'Ngươi cười dài một tiếng: "Thiên hạ là thiên hạ của người có thực lực, há phải cúi đầu phò tá ai?!" ' +
                  'Đêm đó ngươi đột nhập vào long mạch tế đàn dưới lòng hoàng thành, vận chuyển huyền công dẫn dắt Chân Long Tử Khí nhập thể. ' +
                  'Một đạo tử kim long ảnh gầm vang chấn động Cửu Tiêu! Khí vận ngập tràn, căn cốt và đạo tâm của ngươi đồng loạt thăng hoa vượt bậc!'
                );
              },
            },
          ]
        : []),
      {
        t: 'Đốt bỏ mật thư, một lòng hướng đạo',
        hint: 'Không vướng hồng trần, tăng đạo tâm và ngộ tính',
        fn: () => {
          statUp('tam', 3);
          statUp('ngo', 1);
          return (
            'Ngươi châm lửa đốt rụi phong mật thư: "Ngai vàng trần thế trăm năm chẳng qua một nắm cát vàng, sao bằng trường sinh tiêu dao trên chín tầng mây?" ' +
            'Buông bỏ hư danh quyền vị, đạo tâm ngươi sáng tỏ như gương vầng trăng rằm, cảnh giới tâm linh tĩnh lặng thâm sâu.'
          );
        },
      },
    ],
  },

  // 2. Cung Biến Đêm Mưa / Thích Khách Tà Đạo
  {
    id: 'folk_cung_bien_dem_mua',
    where: ['town', 'road'],
    w: 5,
    minAge: 18,
    cd: 12,
    cond: () => here().reg === 'trungtho',
    title: 'Cung Biến Đêm Mưa',
    text: () =>
      'Đêm mưa gió gầm thét dữ dội khắp kinh thành. Đột nhiên từ hướng Hoàng Thành bốc lên từng luồng ma khí đen đặc, tiếng chuông báo động dồn dập vang lên xé toạc màn đêm. ' +
      'Một toán thích khách ma đạo cùng tử sĩ phản tướng đã phá vỡ cấm trận hoàng cung, xông thẳng vào tẩm điện!',
    ch: () => [
      {
        t: 'Rút kiếm phá trận, trảm đầu nghịch tướng hộ giá',
        cls: 'prime',
        fn: () =>
          battle(cultivator('U Minh Thích Khách Thống Lĩnh', 0, 1.25, 'am'), {
            win: () => {
              good(15);
              fame(25);
              cult(120);
              money(1600);
              const gearText = giveGear(effRi(), 3, 0, 'kim');
              mark('Hộ giá trong đêm cung biến, một kiếm trảm U Minh Thích Khách');
              return (
                'Kiếm quang của ngươi xé toạc màn mưa đêm, chém lìa đầu lâu tên thủ lĩnh thích khách ngay trước thềm ngọc! ' +
                'Hoàng thất thoát nạn trong đường tơ kẽ tóc. Triều đình kính sợ phong ngươi làm Hộ Quốc Chân Nhân, ban thưởng ngàn vàng linh thạch cùng thần binh hộ thể!' +
                gearText
              );
            },
            lose: () => {
              hurt(35);
              tamma(8);
              return 'Thích khách tà pháp quỷ dị, ngươi trúng một chưởng độc hàn khí thấu xương, phải lui vào bóng đêm dưỡng thương.';
            },
          }),
      },
      {
        t: 'Hộ tống cung nhân và hoàng tử nhỏ chạy trốn',
        fn: () => {
          good(18);
          statUp('tam', 2);
          money(800);
          const n = meet({
            g: 'f',
            r: 0,
            tag: 'friend',
            rel: 60,
            how: 'Cung nữ được ngươi cứu thoát trong đêm cung biến',
            sect: null,
          });
          mark(`Đêm cung biến cứu thoát cung nữ ${n.name} cùng tiểu hoàng tử`);
          return (
            `Ngươi không màng tranh công, âm thầm mở đường máu đưa cung nữ ${n.name} và một vị ấu hoàng tử chạy khỏi biển lửa hoàng thành. ` +
            'Nàng quỳ lạy cảm tạ, trao lại cho ngươi một túi hạt châu linh ngọc giấu trong tay áo trị giá 800 linh thạch. Công đức vô lượng tích tụ trong tâm.'
          );
        },
      },
      {
        t: 'Thừa cơ lẻn vào Tàng Bảo Các hoàng thất',
        cls: 'danger',
        hint: 'Cơ hội đoạt bảo vật quốc khố bị bỏ lại',
        fn: () => {
          evil(10);
          money(2200);
          const gearText = giveGear(effRi(), 3, 2, 'hoa');
          gain('p:hoanguyen', 2);
          mark('Thừa dịp cung biến hỗn loạn, khoét sạch bảo khố hoàng gia');
          return (
            'Nhân lúc cấm vệ và thích khách chém giết hỗn loạn, ngươi dùng thuật tàng hình lẻn thẳng vào tầng sâu Tàng Bảo Các. ' +
            'Ngươi gom sạch 2.200 linh thạch, hai viên đan dược thượng phẩm và một món pháp bảo hoàng thất rồi biến mất vào màn mưa mịt mùng!' +
            gearText
          );
        },
      },
    ],
  },

  // 3. Hịch Văn Khởi Binh / Thanh Quân Trắc
  {
    id: 'folk_thanh_quan_trac',
    where: ['town', 'road'],
    w: 4,
    minAge: 20,
    cd: 18,
    cond: () => !s.flags.folk_pacified_realm,
    title: 'Hịch Văn Thanh Quân Trắc',
    text: () =>
      'Gian thần lộng quyền, mười tám lộ chư hầu cùng phiên vương nổi dậy phát hịch văn "Thanh Quân Trắc", dấy binh trăm vạn tiến về kinh đô. ' +
      'Các đạo quân giằng co bên bờ Lạc Thủy, khói lửa ngút trời, dân chúng lầm than oán thán dậy đất.',
    ch: () => [
      {
        t: 'Đứng ra điều đình, dùng uy áp tu tiên trấn áp gian thần',
        cls: 'prime',
        hint: 'Cần tu vi hoặc danh vọng, vạn dân ca tụng',
        fn: () => {
          if (effRi() < 2 && s.stats.tam < 8) {
            hurt(20);
            return 'Quân lính hai bên đang lúc đỏ mắt sát khí, ngươi đứng ra can ngăn bị mưa tên bắn trúng, đành phải lui bước.';
          }
          good(25);
          fame(30);
          statUp('tam', 2);
          statUp('van', 2);
          s.flags.folk_pacified_realm = true;
          mark('Một mình đứng giữa hai quân, tru diệt gian thần dẹp tan can qua');
          return (
            'Ngươi ngự kiếm giáng xuống giữa hai quân, khí thế bàng bạc chấn nhiếp trăm vạn thiết kỵ câm như hến! ' +
            'Ngươi chỉ tay chém bay đầu tên đầu sỏ gian thần xúi giục loạn lạc, buộc các chư hầu ký minh ước hòa hiếu bãi binh. ' +
            'Thiên hạ tránh khỏi một kiếp hạo kiếp binh đao, vạn dân khắp mười hai châu lập bài vị trường sinh kính bái ngươi!'
          );
        },
      },
      {
        t: 'Giúp quan quân triều đình công phá phản quân',
        fn: () =>
          battle(mortal('Phiên Vương Phản Tướng', 1.4), {
            win: () => {
              fame(20);
              money(1800);
              statUp('can', 1);
              mark('Giúp triều đình bình định phiên vương phản loạn');
              return 'Ngươi chém tướng đoạt cờ, phá vỡ thế trận phản quân. Triều đình mở tiệc khao thưởng ngàn cân vàng cùng 1.800 linh thạch!';
            },
            lose: () => {
              hurt(30);
              return 'Trận chiến sa trường tên bay đạn lạc, ngươi bị thương nhẹ phải rút lui.';
            },
          }),
      },
      {
        t: 'Lặng lẽ rời đi, cảm ngộ quy luật thịnh suy hưng vong',
        fn: () => {
          statUp('ngo', 2);
          statUp('tam', 2);
          return (
            'Ngươi đứng trên đỉnh núi nhìn xuống bãi chiến trường khói lửa mịt mờ, thở dài: "Thịnh suy hưng vong, hết thảy đều là nhân quả tuần hoàn." ' +
            'Tâm cảnh ngươi chạm đến tầng sâu xa của Thiên Đạo, ngộ tính và đạo tâm tăng tiến rõ rệt.'
          );
        },
      },
    ],
  },

  // =========================================================================
  // PHẦN 2: ĐÁNH GIẶC / BIÊN CƯƠNG SA TRƯỜNG / NGOẠI BANG CHIẾN LOẠN
  // =========================================================================

  // 4. Khói Lửa Biên Cương / Dị Tộc Tràn Về
  {
    id: 'folk_bien_ai_chien_bao',
    where: ['town', 'road', 'village'],
    w: 6,
    minAge: 15,
    cd: 12,
    cond: () => here().reg === 'bactho' || isMilitaryOrigin() || here().id === 'thietthanh' || here().id === 'bachlang',
    title: 'Khói Lửa Biên Cương',
    text: () => {
      const isMil = isMilitaryOrigin();
      const intro = isMil
        ? 'Tiếng tù và bằng sừng trâu xé toạc sương sớm biên thùy! Quân lệnh khẩn cấp từ soái phủ truyền tới: '
        : 'Ngươi đang đi qua vùng biên ải phía Bắc thì thấy từng cột khói sói đen kịt bốc lên ngút trời. ';
      return (
        intro +
        'Ba mươi vạn thiết kỵ dị tộc man hoang phối hợp cùng đàn dị thú hung tợn đã chọc thủng phòng tuyến Nhạn Môn Quan, ồ ạt vây hãm thành lũy. ' +
        'Thành chủ và các tướng lĩnh đang hò hét tử thủ, kêu gọi hào kiệt bốn phương tòng quân đánh giặc!'
      );
    },
    ch: () => [
      {
        t: 'Lên mặt thành cự địch, chém giết tiên phong giặc',
        cls: 'prime',
        fn: () =>
          battle(mortal('Dị Tộc Tiên Phong Trảm Mã Thủ', 1.3), {
            win: () => {
              good(15);
              fame(20);
              money(1000);
              const gearText = giveGear(effRi(), 2, 1, 'kim');
              mark('Lên thành huyết chiến, đẩy lui mũi tiên phong dị tộc bảo vệ biên ải');
              return (
                'Ngươi vung đao thương chém rụng thang công thành, hạ sát tên đầu lĩnh tiên phong hung hãn của giặc trước mặt tướng sĩ! ' +
                'Quân sĩ hò reo vang dội, giữ vững cổng thành then chốt. Chủ soái đích thân gắn quân công huân chương, thưởng 1.000 linh thạch và ban quân phục huyền giáp!' +
                gearText
              );
            },
            lose: () => {
              hurt(30);
              return 'Mưa tên như trút nước trên mặt thành, ngươi đỡ được mấy mũi tên độc nhưng bị nội thương, phải lui xuống thành băng bó.';
            },
          }),
      },
      {
        t: 'Lẻn ra sau phòng tuyến địch thiêu rụi kho lương',
        cls: 'danger',
        hint: 'Mưu trí đoạn tuyệt hậu cần giặc, cần ngộ tính',
        fn: () => {
          if (s.stats.ngo < 6 && effRi() < 1) {
            hurt(25);
            return 'Trại lương của địch phòng bị nghiêm ngặt, ngươi bị tuần tra phát hiện rượt đuổi trối chết qua ba quả đồi!';
          }
          good(20);
          fame(25);
          statUp('ngo', 2);
          money(1400);
          mark('Đêm khuya đốt sạch kho lương dị tộc, khiến địch quân tan rã');
          return (
            'Ngươi dùng độn thuật luồn lách qua các trạm gác, ném hỏa phù thiêu rụi toàn bộ kho lương thảo của địch quân! ' +
            'Ngọn lửa bốc cao mười trượng soi sáng cả vùng trời đêm. Dị tộc mất lương, rét đói hỗn loạn đành phải cuốn cờ rút quân trong đêm tuyết. Ngươi thu về 1.400 linh thạch chiến lợi phẩm!'
          );
        },
      },
      {
        t: 'Tổ chức cứu chữa thương binh và dân lành di tản',
        fn: () => {
          good(22);
          statUp('tam', 2);
          heal(50);
          gain('p:tukhi', 3);
          mark('Tận tình cứu chữa ngàn thương binh ngoài sa trường biên cương');
          return (
            'Ngươi không trực tiếp cầm đao kiếm mà lập doanh trại cứu thương dưới chân thành, tận tình dùng thảo dược và linh lực nối gân cứu mạng hàng trăm binh sĩ. ' +
            'Hành động nhân nghĩa cảm động lòng người, quân y doanh biếu tặng ngươi ba lọ đan dược trị thương cùng lòng biết ơn vô hạn của tướng sĩ.'
          );
        },
      },
    ],
  },

  // 5. Sa Trường Trảm Tướng / Trảm Soái Đoạt Kỳ
  {
    id: 'folk_sa_truong_tram_tuong',
    where: ['wild', 'road', 'town'],
    w: 5,
    minAge: 16,
    cd: 15,
    cond: () => here().reg === 'bactho' || isMilitaryOrigin(),
    title: 'Huyết Chiến Sa Trường',
    text: () =>
      'Giữa sa mạc gió cát ngợp trời, hai đạo đại quân giáp mặt tử chiến. Tiếng trống trận rền vang như sấm sét. ' +
      'Thống soái địch quân là một vị đại hãn dị tộc thân cao trượng mốt, cưỡi Thiết Giáp Tê Ngưu, tay múa khai sơn cự phủ liên tiếp chém ngã ba viên tướng tiên phong của phe ta, khí thế hung hãn không ai dám cản!',
    ch: () => [
      {
        t: 'Một ngựa một kiếm, xông thẳng vào trung quân trảm tướng!',
        cls: 'danger',
        fn: () =>
          battle(cultivator('Dị Tộc Vạn Hộ Trưởng', 1, 1.35, 'hoa'), {
            win: () => {
              good(20);
              fame(35);
              money(2500);
              statUp('can', 2);
              const gearText = giveGear(effRi(), 3, 0, 'kim');
              mark('Một ngựa xông vào vạn quân, trảm tướng đoạt kỳ danh chấn thiên hạ');
              return (
                'Giữa muôn trùng đao thương, ngươi đạp gió bay tới như thiên thần giáng thế, một kiếm bén ngót chém đứt đầu tên vạn hộ trưởng, tiện tay chém gãy soái kỳ! ' +
                'Vạn quân giặc mất tướng kinh hồn bạt vía tan tác như ong vỡ tổ. Triều đình phong thưởng tước Hầu, ban 2.500 linh thạch và một thanh bảo kiếm danh chấn sa trường!' +
                gearText
              );
            },
            lose: () => {
              hurt(45);
              return 'Chiến tướng địch sức mạnh ngập trời, rìu bổ xuống làm chấn động lục phủ ngũ tạng ngươi, may mắn nhờ đồng đội liều mạng kéo về cứu thoát.';
            },
          }),
      },
      {
        t: 'Bắn hạ soái kỳ địch từ cự ly ngàn bước',
        hint: 'Cần căn cốt hoặc xuất thân thiện xạ',
        fn: () => {
          if (s.stats.can < 6 && s.origin !== 'thien_xa_thu') {
            return 'Cung nỏ tầm xa không đủ sức bật, mũi tên rơi cắm xuống đất trước soái trướng khiến địch cười rộ lên.';
          }
          fame(20);
          good(15);
          money(1200);
          statUp('can', 1);
          mark('Bắn gãy soái kỳ địch từ ngàn bước, phá tan sĩ khí đối phương');
          return (
            'Ngươi giương cung sắt ngàn cân, vận chuyển linh lực vào mũi tên thép rồi buông tay! ' +
            'Mũi tên xé gió phát ra tiếng sấm rền, bắn gãy đôi cọc cờ soái của quân địch từ cự ly ngàn bước! Quân giặc khiếp hãi nhốn nháo vì ngỡ có thần tiên giáng trận.'
          );
        },
      },
      {
        t: 'Thu phục chiến mã dị chủng thượng cổ lưu lạc',
        cls: 'prime',
        hint: 'Cơ duyên gặp được thần thú tọa kỵ',
        fn: () => {
          statUp('can', 2);
          statUp('van', 2);
          s.flags.folk_mount = 'Đạp Tuyết Ô Truy';
          mark('Thu phục dị chủng thần mã Đạp Tuyết Ô Truy nơi sa trường');
          return (
            'Giữa bãi chiến trường khói lửa, ngươi bắt gặp một con tuấn mã toàn thân đen tuyền như mực, bốn vó trắng như tuyết, mắt sáng như sao sa. ' +
            'Ngươi dùng linh lực thuần phục dã tính của nó. Thần mã hí dài một tiếng rồi ngoan ngoãn cúi đầu quy phục! Căn cốt và tốc độ của ngươi tăng mạnh nhờ có tọa kỵ thần dũng.'
          );
        },
      },
    ],
  },

  // 6. Khải Hoàn Phong Thưởng
  {
    id: 'folk_khai_hoan_phong_thuong',
    where: ['town'],
    w: 4,
    minAge: 16,
    cd: 20,
    cond: () => !s.flags.folk_war_ended && (isMilitaryOrigin() || !!s.flags.folk_mount),
    title: 'Khải Hoàn Phong Thưởng',
    text: () =>
      'Đại thắng biên cương truyền về kinh thành, toàn quốc hân hoan. Hoàng triều mở tiệc khải hoàn khao thưởng ba quân. ' +
      'Bách tính hai bên đường rải hoa nghênh đón đoàn quân chiến thắng. Chiếu chỉ ban phong thưởng tướng sĩ được xướng lên giữa triều đình.',
    ch: () => [
      {
        t: 'Nhận chức Trấn Quốc Đại Tướng Quân, bảo vệ sơn hà',
        cls: 'prime',
        fn: () => {
          fame(30);
          money(3000);
          s.flags.folk_war_ended = true;
          s.flags.folk_general_title = true;
          const gearText = giveGear(effRi(), 3, 1, 'kim');
          mark('Thụ phong Trấn Quốc Đại Tướng Quân, nắm quyền tiết chế binh mã');
          return (
            'Ngươi quỳ nhận ấn tín đại tướng quân cùng cẩm bào do Hoàng đế ban tặng, bổng lộc hàng năm sung túc cùng 3.000 linh thạch khao quân. ' +
            'Danh tiếng dũng tướng của ngươi lưu truyền khắp giang sơn xã tắc!' +
            gearText
          );
        },
      },
      {
        t: 'Từ chối quan tước, đem linh thạch cứu tế cô nhi quả phụ',
        fn: () => {
          good(35);
          statUp('tam', 3);
          cult(300);
          s.flags.folk_war_ended = true;
          mark('Tạ từ quan lộc, đem thưởng kim cứu tế gia quyến tử sĩ sa trường');
          return (
            'Ngươi cúi đầu tạ ơn rồi dâng trả quan ấn: "Công lao này là của muôn ngàn binh sĩ đã nằm xuống nơi tuyết lạnh, ta há dám nhận công một mình?" ' +
            'Ngươi phân phát toàn bộ tiền thưởng cho thân nhân tử sĩ rồi phất áo rời triều đình. ' +
            'Đại công đức hội tụ, đạo tâm trong suốt không gợn bụi trần, tu vi của ngươi tăng vọt một đoạn dài!'
          );
        },
      },
    ],
  },

  // =========================================================================
  // PHẦN 3: LIÊN HÔN GIA TỘC / HOÀNG THẤT TỨ HÔN / LÔI ĐÀI CHIÊU THÂN
  // =========================================================================

  // 7. Thánh Chỉ Tứ Hôn / Hoàng Thất Liên Hôn
  {
    id: 'folk_hoang_that_tu_hon',
    where: ['town', 'village', 'road'],
    w: 5,
    minAge: 16,
    cd: 20,
    cond: () => !s.flags.folk_royal_wed && !s.flags.primaryDaolu,
    title: 'Thánh Chỉ Tứ Hôn',
    text: () => {
      const isFemale = s.g === 'f';
      const spouseTitle = isFemale ? 'Vương thế tử tuấn lãng phi phàm' : 'Hoàng thất Quận Chúa khuynh quốc khuynh thành';
      return (
        'Tiếng trống nhạc rộn ràng từ xa vọng lại, một đoàn nghi trượng hoàng gia lộng lẫy tiến thẳng đến trước mặt ngươi. ' +
        'Khâm sai đại thần mở cuộn thánh chỉ bằng gấm vàng, cất giọng sang sảng: ' +
        `"Phụng thiên thừa vận, Hoàng đế chiếu viết: Khen ngợi phong thái tuyệt luân của khanh, nay đặc ban tứ hôn kết duyên cùng ${spouseTitle}, ` +
        'kèm sính lễ hoàng thất 1.500 linh thạch và ngọc bội lưu ly trấn quốc!"'
      );
    },
    ch: () => [
      {
        t: 'Tiếp chỉ thành hôn (Kết duyên đạo lữ hoàng tộc)',
        cls: 'prime',
        hint: 'Nhận 1.500 linh thạch sính lễ và kết làm đạo lữ',
        fn: () => {
          const isFemale = s.g === 'f';
          const partnerGender = isFemale ? 'm' : 'f';
          const partnerName = mkName(partnerGender);
          const spouse = meet({
            name: partnerName,
            g: partnerGender,
            r: Math.max(1, effRi()),
            tag: 'daolu',
            how: 'Được Hoàng thất hạ chỉ tứ hôn kết tóc phu thê',
            sect: null,
          });
          wedDaolu(spouse);
          money(1500);
          fame(20);
          s.flags.folk_royal_wed = true;
          const gearText = giveGear(effRi(), 2, 3, 'quang');
          mark(`Tiếp thánh chỉ tứ hôn, kết làm đạo lữ cùng ${spouse.name}`);
          return (
            `Ngươi quỳ tiếp thánh chỉ. Đám cưới hoàng thất diễn ra long trọng khắp kinh kỳ, mười dặm hồng trang rực rỡ. ` +
            `${spouse.name} cùng ngươi uống chén rượu giao bôi, thề nguyện đồng hành trên đường đời. Ngươi nhận sính lễ 1.500 linh thạch và bảo ngọc hoàng thất!` +
            gearText
          );
        },
      },
      {
        t: 'Kháng chỉ từ hôn, một lòng hướng đạo!',
        cls: 'danger',
        hint: 'Giữ vẹn tiên đạo, tăng đạo tâm +3 và căn cốt +1',
        fn: () => {
          statUp('tam', 3);
          statUp('can', 1);
          statUp('van', 1);
          s.flags.folk_royal_wed = true;
          mark('Cự tuyệt thánh chỉ tứ hôn, kiên định giữ vững đạo tâm');
          return (
            'Ngươi ngẩng cao đầu cất tiếng: "Đại đạo trường sinh mới là chí hướng của ta, dây tơ hồng trần thế há trói được người tu tiên?!" ' +
            'Khâm sai thất sắc thu chỉ cáo lui. Dù làm phật ý hoàng gia, nhưng đạo tâm của ngươi kiên định như bàn thạch, được chư phái tu tiên ngợi khen khí phách ngút trời!'
          );
        },
      },
      {
        t: 'Lựa lời từ chối khéo léo, kết làm tri kỷ hảo hữu',
        fn: () => {
          statUp('ngo', 1);
          statUp('tam', 1);
          s.flags.folk_royal_wed = true;
          const isFemale = s.g === 'f';
          const friend = meet({
            g: isFemale ? 'm' : 'f',
            r: Math.max(1, effRi()),
            tag: 'friend',
            rel: 70,
            how: 'Hoàng tộc từng có hôn ước nhưng trở thành tri kỷ đàm đạo',
            sect: null,
          });
          mark(`Uyển chuyển thoái hôn hoàng thất, kết giao tri kỷ cùng ${friend.name}`);
          return (
            `Ngươi dùng lời lẽ tao nhã từ chối hôn nhân trần tục nhưng xin dâng một phương thuốc quý bồi bổ long thể. ` +
            `Đối phương là người hiểu lý lẽ, không những không giận mà còn khâm phục chí hướng của ngươi, kết làm bằng hữu tri kỷ thường xuyên đàm đạo thơ ca.`
          );
        },
      },
    ],
  },

  // 8. Lôi Đài Tỷ Võ Chiêu Thân
  {
    id: 'folk_loi_dai_chieu_than',
    where: ['town'],
    w: 5,
    minAge: 16,
    cd: 15,
    title: 'Lôi Đài Tỷ Võ Chiêu Thân',
    text: () => {
      const isFemale = s.g === 'f';
      const role = isFemale ? 'thiếu gia danh môn võ đạo song toàn' : 'thiên kim thành chủ dung mạo như hoa';
      return (
        'Tại quảng trường trung tâm thành thị, cờ xí rợp trời, người xem chen chúc đông như trẩy hội. ' +
        `Thành chủ cùng các bô lão dựng lôi đài tỷ võ kén duyên cho ${role}. ` +
        'Trên đài, một vị thiên kiêu ngạo nghễ liên tiếp đánh bại bảy đối thủ, đang lớn tiếng thách thức hào kiệt thiên hạ bước lên so tài!'
      );
    },
    ch: () => [
      {
        t: 'Bước lên lôi đài so tài võ nghệ',
        cls: 'prime',
        fn: () =>
          battle(cultivator('Thiên Kiêu Lôi Đài', 0, 1.2), {
            win: () => {
              fame(20);
              const isFemale = s.g === 'f';
              const mateG = isFemale ? 'm' : 'f';
              const mate = meet({
                name: mkName(mateG),
                g: mateG,
                r: Math.max(1, effRi()),
                tag: 'friend',
                rel: 80,
                how: 'Thắng lôi đài tỷ võ chiêu thân',
                sect: null,
              });
              mark(`Đăng đỉnh lôi đài tỷ võ chiêu thân, đánh bại thiên kiêu giành chiến thắng`);

              if (!s.flags.primaryDaolu) {
                wedDaolu(mate);
                money(1200);
                const gearText = giveGear(effRi(), 2, 0, 'kim');
                return (
                  `Ngươi thi triển tuyệt kỹ đánh bay đối thủ khỏi lôi đài trong tiếng reo hò sấm dậy của vạn người! ` +
                  `Thành chủ cười lớn chúc mừng, gả ${mate.name} cho ngươi cùng của hồi môn 1.200 linh thạch và một thanh bảo kiếm sắc bén!` +
                  gearText
                );
              } else {
                money(800);
                gain('p:hoanguyen', 1);
                return (
                  `Ngươi đánh bại thiên kiêu lôi đài giành ngôi quán quân. Vì đã có đạo lữ, ngươi xin nhường lại hôn duyên, chỉ xin nhận 800 linh thạch cùng đan dược quý. ` +
                  `${mate.name} nhìn theo bóng lưng ngươi với ánh mắt vừa thán phục vừa tiếc nuối.`
                );
              }
            },
            lose: () => {
              hurt(25);
              return 'Chiêu thức của đối thủ biến hóa khôn lường, ngươi sơ ý trúng chưởng ngã xuống lôi đài trong tiếc nuối.';
            },
          }),
      },
      {
        t: 'Đặt cược linh thạch dưới đài',
        hint: 'Dùng nhãn lực tiên gia kiếm linh thạch',
        fn: () => {
          if (!canPay(200)) return 'Ngươi sờ túi không đủ 200 linh thạch để đặt cược.';
          lose('money', 200);
          if (ch(0.65) || s.stats.van >= 7) {
            money(600);
            return 'Nhờ nhãn lực tinh tường nhìn thấu thực lực đấu sĩ, ngươi thắng cược thu về 600 linh thạch ngon ơ!';
          }
          return 'Đấu sĩ ngươi đặt cược bất ngờ bị phản đòn thất bại, ngươi mất toi 200 linh thạch tiền cược.';
        },
      },
      {
        t: 'Đứng xem đàm đạo, quan sát tinh hoa chiêu thức',
        fn: () => {
          statUp('ngo', 1);
          return 'Ngươi chăm chú theo dõi các thế đánh công thủ của các lưu phái trên đài, ngộ ra được vài biến hóa ảo diệu trong võ học.';
        },
      },
    ],
  },

  // 9. Thế Gia Ép Hôn / Đêm Trăng Đào Hôn
  {
    id: 'folk_the_gia_lien_hon_ep_duyen',
    where: ['town', 'village', 'road'],
    w: 5,
    minAge: 15,
    cd: 20,
    cond: () => isNobleOrigin() && !s.flags.folk_clan_escaped,
    title: 'Gia Tộc Ép Hôn',
    text: () =>
      'Trưởng bối trong gia tộc triệu tập ngươi về từ đường. Nhằm tranh đoạt một mỏ linh thạch trù phú, tộc trưởng đã tự ý ước định hôn sự của ngươi ' +
      'với một vị công tử/tiểu thư kiêu căng hống hách của đối phương thế gia, bất chấp ngươi có ưng thuận hay không!',
    ch: () => [
      {
        t: 'Khước từ hôn ước, thẳng tay ước chiến người đến cầu hôn',
        cls: 'danger',
        fn: () =>
          battle(cultivator('Hậu Duệ Thế Gia Cầu Thân', 0, 1.15), {
            win: () => {
              fame(15);
              statUp('tam', 2);
              statUp('can', 1);
              s.flags.folk_clan_escaped = true;
              mark('Đánh bại người đến ép hôn, tự tay xé nát hôn thư thế gia');
              return (
                'Trước mặt toàn thể trưởng lão hai họ, ngươi rút kiếm quát lớn: "Kẻ yếu đuối không đỡ nổi ba chiêu của ta, có tư cách gì cưới ta?!" ' +
                'Ngươi đánh cho kẻ cầu thân ôm mặt thất thanh tháo chạy, buộc đối phương phải tự hủy bỏ hôn ước trong hổ thẹn!'
              );
            },
            lose: () => {
              hurt(20);
              tamma(5);
              return 'Ngươi bị các trưởng lão hai nhà đồng thanh quở trách, áp lực gia tộc đè nặng lên tâm trí.';
            },
          }),
      },
      {
        t: 'Đêm khuya đào hôn, rũ áo phiêu bạt giang hồ',
        cls: 'prime',
        hint: 'Thoát khỏi gông cùm gia tộc: Tăng đạo tâm tự do tiêu dao',
        fn: () => {
          statUp('tam', 3);
          statUp('van', 1);
          money(500);
          s.flags.folk_clan_escaped = true;
          mark('Vượt tường đào hôn trong đêm trăng, chọn con đường tự do tiêu dao');
          return (
            'Đêm trăng sáng vằng vặc, ngươi gói ghém hành trang vượt tường trốn khỏi gia trạch. ' +
            'Gió đêm mơn man tà áo, giang sơn rộng lớn ngút ngàn đón chào ngươi. Từ nay không còn xiềng xích thế gia trói buộc, đạo tâm ngươi tự tại như cánh chim trời!'
          );
        },
      },
      {
        t: 'Chấp thuận vì đại cục của gia tộc',
        fn: () => {
          good(10);
          money(1000);
          const gearText = giveGear(effRi(), 2, 2, 'tho');
          s.flags.folk_clan_escaped = true;
          mark('Hy sinh duyên phận cá nhân vì lợi ích hưng thịnh của thị tộc');
          return (
            'Ngươi cắn răng gật đầu chấp thuận cuộc liên hôn vì sự tồn vong hưng thịnh của gia tộc. ' +
            'Gia tộc đoạt được mỏ linh thạch, tộc trưởng ban thưởng cho ngươi 1.000 linh thạch cùng bảo vật gia truyền bồi thường.' +
            gearText
          );
        },
      },
    ],
  },

  // 10. Dân Gian Trừ Bạo / Sơn Tặc Cướp Lương
  {
    id: 'folk_hiep_nghia_giang_ho',
    where: ['road', 'village'],
    w: 5,
    minAge: 14,
    cd: 10,
    title: 'Hành Hiệp Trượng Nghĩa',
    text: () =>
      'Đi qua chân núi hoang vắng, ngươi nghe tiếng kêu khóc thảm thiết. Một toán sơn tặc võ trang dữ tợn đang chặn đường cướp bóc đoàn xe chở lương của bá tánh gặp nạn đói, ' +
      'dao găm đã kề sát cổ ông lão trưởng thôn.',
    ch: () => [
      {
        t: 'Tuốt kiếm trảm tặc cứu dân',
        cls: 'prime',
        fn: () =>
          battle(mortal('Sơn Trại Đầu Lĩnh', 1.2), {
            win: () => {
              good(15);
              fame(10);
              money(350);
              statUp('tam', 1);
              mark('Giữa đường rút kiếm trảm sơn tặc, cứu đoàn xe lương thực của dân làng');
              return (
                'Chỉ với vài chiêu kiếm sắc lẹm, ngươi đã chém rụng binh khí và hạ sát tên đầu lĩnh sơn tặc hung hãn! ' +
                'Đám lâu la hoảng loạn quăng đao tháo chạy. Dân làng mừng rơi nước mắt quỳ bái tạ ơn, gom góp 350 linh thạch bạc vụn dâng tặng ân nhân.'
              );
            },
            lose: () => {
              hurt(20);
              return 'Sơn tặc đông người vây đánh, ngươi bị thương nhẹ nhưng cũng cứu được vài người chạy thoát.';
            },
          }),
      },
      {
        t: 'Dùng huyễn thuật dọa lui sơn tặc',
        hint: 'Cần ngộ tính, không tốn đao binh',
        fn: () => {
          if (s.stats.ngo < 5 && effRi() < 1) {
            hurt(15);
            return 'Thuật pháp chưa thành thạo bị sơn tặc nhìn thấu, phải rút kiếm chém giết vất vả mới thoát.';
          }
          good(12);
          statUp('ngo', 1);
          return (
            'Ngươi đứng trên ngọn cây thi triển huyễn ảnh sấm sét rền vang mây cuộn như thiên binh hạ phàm. ' +
            'Bọn cướp hồn xiêu phách tán dập đầu lia lịa rồi cắm đầu bỏ chạy trối chết, không tổn hại một giọt máu!'
          );
        },
      },
      {
        t: 'Lạnh lùng lướt qua',
        fn: () => {
          evil(5);
          return 'Ngươi thờ ơ lướt qua như không thấy, tiếng kêu khóc xa dần sau lưng.';
        },
      },
    ],
  },
]);
