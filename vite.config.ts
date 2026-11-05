import { defineConfig, type ViteDevServer, type PreviewServer } from 'vite';
import { ollamaStartHandler } from './server/ollama.mjs';
const ollamaLauncher = {
  name: 'local-ollama-launcher',
  configureServer(server: ViteDevServer) { server.middlewares.use('/api/ai/ollama/start', ollamaStartHandler()); },
  configurePreviewServer(server: PreviewServer) { server.middlewares.use('/api/ai/ollama/start', ollamaStartHandler()); },
};
export default defineConfig({ base: './', plugins: [ollamaLauncher], build: { target: 'safari16.4' }, server: { port: 5180 } });
