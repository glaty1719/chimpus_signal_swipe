import { defineConfig } from 'vite';
import { studioTuning } from './tools/vite-tuning.mjs';

export default defineConfig({
    base: './',   // relative paths: the build works from any folder on the server
    server: { port: 8080 },
    build: {
        chunkSizeWarningLimit: 2000,
        rollupOptions: {
            output: { manualChunks: { phaser: ['phaser'] } }   // Phaser cached separately from game code
        }
    },
    plugins: [studioTuning()]   // dev only: lets the debug panel save tuning.json
});
