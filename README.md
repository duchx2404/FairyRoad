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

## Prompt Song Tu

File public/prompts/song-tu.txt chứa chỉ dẫn kể dạng văn bản: mỗi dòng bắt đầu bằng dấu gạch đầu dòng, không cần JSON hay ký tự xuống dòng đặc biệt. Phần kết quả nằm riêng trong public/prompts/song-tu-ket-qua.txt, dùng {{outcome}} để nhận kết quả thực tế. Game tự ghép thông tin nhân vật và bối cảnh khi gọi AI.

Bấm Song Tu → AI viết xong lời kể → hiện hai nút **Tạo ảnh** và **Tạo video**. Chỉ khi bấm nút tương ứng mới gửi yêu cầu tạo media, dùng nguyên đoạn AI vừa kể làm nội dung. Không tự tạo ảnh/video. Có các nút Làm lại lời kể, Làm lại ảnh, Làm lại video độc lập. Giữ kết quả cũ tới khi có kết quả thay thế thành công; đổi lời kể sẽ đánh dấu media cũ để người chơi chủ động tạo lại. Không thực hiện lại hành động hoặc cộng lại phần thưởng.

Chạy Ollama với model đã chọn trong Cài đặt game. Để tạo media, bật ComfyUI (mặc định cổng 8188) và chạy npm run songtu (cổng 8788), chạy game bằng npm run dev ở terminal khác. Có thể đặt COMFY_URL để đổi địa chỉ ComfyUI.

Cấu hình kỹ thuật nằm riêng ở tools/songtu-media.json: imageWorkflow mặc định null để dùng Flux GGUF như tools/gen_art.py; videoWorkflow cần workflow ComfyUI định dạng API, với model/node video đã cài sẵn. Các biến workflow: {{prompt}}, {{negative_prompt}}, {{seed}}. Workflow video cần xuất mp4, webm hoặc gif. Thiếu workflow sẽ báo lỗi tại nút video; ảnh vẫn tạo độc lập. Server không tự tải model hoặc khởi động ComfyUI.

Prompt kể được đọc lại mỗi lần viết. Khi server Song Tu chạy, game đọc file trực tiếp qua server; nếu server tắt, dùng bản prompt được phục vụ cùng game (bản build tĩnh cần build lại để cập nhật). Hai nhân vật cần tuổi thân thể từ 18 trở lên; prompt mặc định là cảnh cùng nhập định, mặc đầy đủ trang phục.

Kết quả và metadata gồm lời kể thực tế, prompt media, seed được lưu tại public/generated/song-tu/. Hàng đợi xử lý lần lượt, tối đa 8 yêu cầu chờ. Đóng cảnh ngừng theo dõi kết quả; tác vụ đã gửi sang ComfyUI có thể vẫn chạy và lưu kết quả.

Lời kể dự phòng: public/prompts/song-tu-default.txt. Khi AI tắt, lỗi kết nối hoặc trả về rỗng, game đọc văn bản này (hỗ trợ các biến như {{place}}). File được đọc lại mỗi lần; ảnh/video vẫn dùng đúng lời kể đang hiển thị và cần dịch vụ tạo media riêng.

Biến {{partnerNames}} gọi đúng tên đạo lữ được chọn: một người là tên người đó; nhiều người là “A, B và C”. Dùng được trong prompt kể và lời kể mặc định.

Biến {{me}} được thay bằng đúng tên nhân vật chính, ví dụ: {{me}}: Chúng ta bắt đầu thôi. Dùng được trong prompt kể và lời kể mặc định.

Đối thoại theo số người được chọn (thứ tự bấm chọn): dùng {{partner1}}, {{partner2}}, …; dòng nhắc tới người không có trong lựa chọn sẽ được bỏ. Để nhắc đủ mọi người, dùng đoạn lặp:

```text
{{me}}: Mọi người sẵn sàng chưa?
{{#partners}}
{{name}}: Ta sẵn sàng rồi.
{{/partners}}
```

Trong đoạn lặp, {{name}} là tên từng đạo lữ, {{index}} là số thứ tự từ 1. Nội dung trong đoạn được lặp một lần cho mỗi người, áp dụng cả prompt AI và lời kể mặc định.

Khối cảnh Song Tu: {{#withPartner}}...{{/withPartner}} và {{#withNextPartner}}...{{/withNextPartner}} mỗi khối lấy người tiếp theo theo thứ tự chọn, không quay lại người đã dùng trong các khối cảnh. {{name}} giữ nguyên tên trong khối. Có thể dùng {{name1}}, {{name2}}, … trong cùng khối để lấy nhiều người khác nhau chưa dùng. Nếu không đủ người, bỏ nguyên khối. Không lồng khối; phải đóng đúng tên. {{partnerNames}} và vòng lặp {{#partners}} vẫn hiển thị toàn bộ danh sách, không làm thay đổi thứ tự phân người cho các khối cảnh. Các khối hoạt động trong cả prompt AI và lời kể mặc định.
