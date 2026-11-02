/** Loopback services belong to the desktop, never to a remote player's phone. */
export const localServicesAvailable = () => typeof location === 'undefined' || ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);
export function serviceAvailable(url: string): boolean {
  if (typeof location === 'undefined') return true;
  try {
    const target = new URL(url, location.href);
    if (location.protocol === 'https:' && target.protocol !== 'https:') return false;
    return !['localhost', '127.0.0.1', '[::1]'].includes(target.hostname) || localServicesAvailable();
  } catch { return false; }
}
