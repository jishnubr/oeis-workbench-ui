import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    watch: {
      ignored: [
        '**/drafts.db',
        '**/drafts.db-wal',
        '**/drafts.db-shm',
        '**/drafts_backup_*.db',
        '**/bfiles/**',
      ],
    },
    proxy: {
      '/api': {
        target: 'http://localhost:3060',
        changeOrigin: true,
      },
      '/bfiles': {
        target: 'http://localhost:3060',
        changeOrigin: true,
      },
    },
  },
});