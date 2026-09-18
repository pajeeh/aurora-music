import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const proxy = { '/api/connect': 'http://127.0.0.1:8787' };
export default defineConfig({ plugins: [react()], base: '/aurora-music/', server: { proxy }, preview: { proxy } });
