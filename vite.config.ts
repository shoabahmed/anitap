
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // No proxy needed since we use Jikan/AniList directly
  build: {
    outDir: 'dist',
  },
});
