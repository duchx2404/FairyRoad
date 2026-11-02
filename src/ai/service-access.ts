/** Loopback services belong to the desktop, never to a remote player's phone. */
export const localServicesAvailable = () => typeof location === 'undefined' || ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);
export function serviceAvailable(url: string): boolean {
  return serviceBlockReason(url) === null;
}

/** Lý do game không gọi dịch vụ ở `url` (null = được gọi). Dùng để báo cho người chơi thay vì tắt im lặng. */
export function serviceBlockReason(url: string): string | null {
  if (typeof location === 'undefined') return null;
  let target: URL;
  try { target = new URL(url, location.href); } catch { return `Địa chỉ "${url}" không hợp lệ.`; }
  if (['localhost', '127.0.0.1', '[::1]'].includes(target.hostname) && !localServicesAvailable()) {
    return `Đang chơi bản web (${location.hostname}): game chỉ gọi Ollama trên máy khi mở từ localhost. Muốn dùng AI, hãy chạy bản trên máy (npm run dev rồi mở http://localhost:5180).`;
  }
  if (location.protocol === 'https:' && target.protocol !== 'https:') {
    return `Trang đang chạy https nên không gọi được địa chỉ http "${url}". Hãy dùng địa chỉ https hoặc mở game từ localhost.`;
  }
  return null;
}
