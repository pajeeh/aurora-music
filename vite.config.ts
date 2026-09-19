import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

const proxy = { '/api/connect': 'http://127.0.0.1:8787' };
export default defineConfig(({mode}) => {
  const env=loadEnv(mode, process.cwd(), 'VITE_');
  const cardOrigin=[env.VITE_NOW_PLAYING_ENDPOINT,env.VITE_CONNECT_ENDPOINT].filter(Boolean).map(endpoint=>{const url=new URL(endpoint!);if(url.protocol!=='https:')throw new Error('Aurora service endpoints must use HTTPS');return url.origin;}).join(' ');
  return { plugins: [react(), {name:'aurora-now-playing-csp',transformIndexHtml(html:string){return cardOrigin?html.replace("https://lrclib.net;",`https://lrclib.net ${cardOrigin};`):html;}}], base: '/aurora-music/', server: { proxy, host: 'localhost', port: 5173, strictPort: true }, preview: { proxy, host: 'localhost', port: 5173, strictPort: true } };
});
