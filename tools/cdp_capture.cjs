const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const brainDir = 'C:\\Users\\duchx\\.gemini\\antigravity\\brain\\bfd646cb-ae5c-4775-beb2-96c760505d5f';
const port = 9336;

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function capture() {
  console.log('Starting Edge in headless mode...');
  const edgeProc = spawn(edgePath, [
    '--headless=new',
    '--disable-gpu',
    `--remote-debugging-port=${port}`,
    '--window-size=1280,800',
    'about:blank'
  ]);

  let versionData = null;
  for (let i = 0; i < 20; i++) {
    await sleep(400);
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (res.ok) { versionData = await res.json(); break; }
    } catch {}
  }

  if (!versionData) {
    console.error('Could not connect to Edge');
    edgeProc.kill();
    process.exit(1);
  }

  const worlds = [
    { id: 0, name: 'Thương Lan', file: 'map_thuong_lan.png' },
    { id: 1, name: 'Linh Giới', file: 'map_linh_gioi.png' },
    { id: 2, name: 'Tiên Giới', file: 'map_tien_gioi.png' },
    { id: 3, name: 'Thần Giới', file: 'map_than_gioi.png' },
    { id: 4, name: 'Hồng Hoang', file: 'map_hong_hoang.png' },
    { id: 5, name: 'Hỗn Độn', file: 'map_hon_don.png' },
    { id: 4, name: 'Hồng Hoang (Zoom)', file: 'map_hong_hoang_zoom.png', zoomCoord: [6500, 6000] },
  ];

  for (const w of worlds) {
    const outFile = path.join(brainDir, w.file);
    console.log(`\nNavigating to ${w.name} (World ${w.id})...`);

    const createRes = await fetch(`http://127.0.0.1:${port}/json/new?http://localhost:5180/?world=${w.id}`, { method: 'PUT' });
    const tab = await createRes.json();
    const wsUrl = tab.webSocketDebuggerUrl;

    await new Promise((resolve) => {
      const ws = new WebSocket(wsUrl);
      let id = 1;

      ws.onopen = async () => {
        ws.send(JSON.stringify({ id: id++, method: 'Runtime.enable' }));
        // Đợi 4 giây để Vite kết nối hoàn tất và fitWorldView() chạy xong
        await sleep(4000);
        if (w.zoomCoord) {
          const evalId = id++;
          ws.send(JSON.stringify({
            id: evalId,
            method: 'Runtime.evaluate',
            params: {
              expression: `(() => {
                if (window.mapView && window.mapDraw) {
                  window.mapView.z = 0.55;
                  window.mapView.x = ${w.zoomCoord[0]} - window.innerWidth / 0.55 / 2;
                  window.mapView.y = ${w.zoomCoord[1]} - window.innerHeight / 0.55 / 2;
                  window.mapDraw();
                  return 'ZOOMED_SUCCESS: z=' + window.mapView.z;
                }
                return 'NOT_FOUND';
              })()`,
              returnByValue: true
            }
          }));
          await sleep(2000);
        }
        ws.send(JSON.stringify({ id: id++, method: 'Page.captureScreenshot', params: { format: 'png' } }));
      };

      ws.onmessage = async (msg) => {
        const data = JSON.parse(msg.data);
        if (data.id && data.result && data.result.result) {
          console.log('[EVAL RESULT]', data.result.result);
        }
        if (data.method === 'Runtime.consoleAPICalled') {
          console.log('[CONSOLE]', data.params.type, data.params.args.map(a => a.value || a.description).join(' '));
        }
        if (data.method === 'Runtime.exceptionThrown') {
          console.error('[EXCEPTION]', data.params.exceptionDetails.text, data.params.exceptionDetails.exception?.description);
        }
        if (data.result && data.result.data) {
          const buffer = Buffer.from(data.result.data, 'base64');
          fs.writeFileSync(outFile, buffer);
          console.log(`✓ ${w.name}: Saved screenshot (${buffer.length} bytes)`);
          ws.close();
          await fetch(`http://127.0.0.1:${port}/json/close/${tab.id}`);
          resolve();
        }
      };
    });
  }

  edgeProc.kill();
  console.log('\nAll captures finished!');
}

capture();
