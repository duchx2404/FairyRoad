#!/usr/bin/env bash
# Chạy pipeline vẽ có tự khởi động lại ComfyUI khi nó sập giữa chừng (ComfyUI hay chết sau vài ảnh khi RAM thấp).
# Dùng: bash tools/run_art_resume.sh   (log: tools/run_art_resume.log)
cd "$(dirname "$0")/.." || exit 1
export PYTHONIOENCODING=utf-8
COMFY_DIR="E:/ComfyUI_windows_portable"
log() { echo "[$(date +%H:%M:%S)] $*"; }
comfy_up() { curl -s -m 3 http://127.0.0.1:8188/system_stats >/dev/null 2>&1; }
start_comfy() {
  log "khởi động ComfyUI"
  powershell -NoProfile -Command "Start-Process -FilePath '$COMFY_DIR/python_embeded/python.exe' -ArgumentList '-s','ComfyUI\\main.py','--listen','127.0.0.1','--port','8188','--disable-auto-launch' -WorkingDirectory '$COMFY_DIR' -WindowStyle Minimized -RedirectStandardOutput 'E:\\Project\\TienLo\\tools\\comfy.out.log' -RedirectStandardError 'E:\\Project\\TienLo\\tools\\comfy.err.log'" >/dev/null 2>&1
  for i in $(seq 1 40); do comfy_up && { log "ComfyUI sẵn sàng"; return 0; }; sleep 5; done
  log "ComfyUI không lên"; return 1
}
# giai đoạn 1: ảnh toàn thân (nữ chính + thánh nữ) vẽ lại với luật gấu váy chạm đất & hài kín mũi
FULL="full_pc_f_quyen,full_sn_tutieu,full_sn_huyennguyen,full_sn_batchu,full_sn_cucbang,full_sn_longdinh,full_sn_vanyeudinh,full_sn_ta,full_sn_tudo,full_sn_congton,full_sn_cuuu,full_sn_linhsontu"
# đánh dấu ảnh toàn thân cần vẽ lại: xoá bản cũ để script bỏ qua được bản đã xong khi chạy lại
for k in ${FULL//,/ }; do
  if [ -f "public/items/$k.webp" ] && [ ! -f "tools/.redo_done_$k" ]; then rm -f "public/items/$k.webp"; fi
done
for attempt in $(seq 1 30); do
  comfy_up || start_comfy || continue
  log "lượt $attempt: ảnh toàn thân"
  python tools/gen_battle.py --group full --only "$FULL" && { for k in ${FULL//,/ }; do touch "tools/.redo_done_$k"; done; break; }
  log "gen_battle dừng (ComfyUI sập?) — thử lại"
  sleep 10
done
# giai đoạn 2: biến thể chân dung thánh nữ / thánh tử theo thế lực × linh căn
for attempt in $(seq 1 60); do
  comfy_up || start_comfy || continue
  log "lượt $attempt: biến thể chân dung"
  python tools/gen_art.py --group snv,stv,sn && { log "XONG toàn bộ"; break; }
  log "gen_art dừng (ComfyUI sập?) — thử lại"
  sleep 10
done
rm -f tools/.redo_done_*
log "kết thúc"
