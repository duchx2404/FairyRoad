# Tiên Lộ Mạn Mạn (仙路漫漫)

Game mô phỏng một kiếp tu tiên, chạy trên trình duyệt, offline. Đầu thai → tu luyện 9 cảnh giới → độ kiếp phi thăng (hoặc chết giữa đường) → tính điểm → luân hồi.

## Chạy

```
npm install
npm run dev        # http://localhost:5180
npm run build      # bản tĩnh trong dist/ (deploy được lên Cloudflare Pages / GitHub Pages)
npx tsx tools/sim.ts 150          # bot chơi 150 kiếp: bắt lỗi sự kiện, đo cân bằng
CAREFUL=1 npx tsx tools/sim.ts 150 # bot né lựa chọn nguy hiểm
```

## Cấu trúc

- `src/data/` — dữ liệu: cảnh giới, linh căn, thể chất, thiên phú, xuất thân (`core.ts`), bản đồ/tông môn/yêu thú (`world.ts`), công pháp/thuật pháp/đan/thảo/phù/trang bị (`items.ts`).
- `src/engine/` — luật chơi: trạng thái + lưu (`state.ts`), chỉ số (`char.ts`), thời gian/tu luyện/đột phá/NPC (`core.ts`), chiến đấu (`combat.ts`), hành động (`actions.ts`), tông môn, luyện chế, buôn bán/đấu giá, vật phẩm, đầu thai/chết/thành tựu (`life.ts`).
- `src/engine/api.ts` — API cho người viết sự kiện. `src/events/*.ts` — các gói sự kiện (`core`, `town`, `wild`, `life`), mỗi gói gọi `register([...])`.
- `src/ui/` — bản đồ thủy mặc canvas, HUD, modal sự kiện, cửa sổ trang, các màn hình.
- `src/ai/ollama.ts` — AI kể chuyện tùy chọn (Ollama local): khi bật, viết lại phần mở đầu và kết quả của mọi sự kiện; có thể viết tiểu sử khi chết. Tắt AI thì dùng lời kể cố định.

## Thiên Cơ Lâu & luật phi thăng

- `src/engine/tienco.ts` — tổ chức Thiên Cơ Lâu trải khắp các giới: mỗi giới một Thiên Kiêu Bảng (theo tuổi thân thể, trần `TK_AGE`) và một Cường Giả Bảng; bảng chỉ ghi người đang ở trong giới. Nhân vật trên bảng (`s.flags.tienco.people`) tự tu luyện, đột phá, phi thăng, chết già trong `tiencoTick` (gọi từ `passTime`). Người chơi lên/tụt hạng được ghi nhật ký + danh vọng.
- Luật phi thăng (`life.ts ascend`): thân thể về **1 tuổi** (`s.born = year - 1`), tâm trí giữ nguyên; tuổi linh hồn `flags.soulBorn` không đổi (`soulAge()`), số năm đã sống cộng dồn `flags.lifeLived` (`lifeLived()`); tu luyện được ngay (không có `flags.childhood`). Sự kiện có `maxAge` xét tuổi linh hồn, `minAge` xét tuổi thân thể.
- Hồi hạ giả: mỗi thế lực hàng đầu Hỗn Độn (thánh địa tier 4 + đại tộc `HD_CLANS`) có thể ngẫu nhiên đưa tối đa một trẻ về Thương Lan; gặp ai và vào lúc nào cũng ngẫu nhiên (`src/events/tienco.ts`). Ngô Thu Phương luôn có mặt: người Ngô gia Hỗn Độn, thiên phú và mệnh cách đỉnh cấp; gia tộc ở Thương Lan, tông môn và đường tu đều được tạo ngẫu nhiên. Người chơi ở mọi xuất thân đều có nửa ngọc bội đôi; gặp nàng có thể chọn nhận nhau hoặc lướt qua. Xuất thân Diệp gia Hỗn Độn = suất của Diệp gia.

## Thêm sự kiện

Tạo file trong `src/events/`, import từ `../engine/api`, gọi `register([...])`, rồi thêm `import './events/<tên>';` vào `src/main.ts`. Xem `src/events/core.ts` làm mẫu. Chạy `tools/sim.ts` để kiểm tra không lỗi.
