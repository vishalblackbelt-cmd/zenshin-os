import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  cacheDir: '../../node_modules/.vite/apps-web',
  server: {
    host: '0.0.0.0',
    port: 3000,
  },
});
