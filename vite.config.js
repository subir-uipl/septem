import { defineConfig } from 'vite';

export default defineConfig({
  // relative asset paths so the build works from any sub-folder (e.g. GitHub Pages)
  base: './',
  css: {
    preprocessorOptions: {
      scss: { api: 'modern' }
    }
  },
  build: {
    target: 'es2020',
    // three.js is by far the largest dependency; give it its own long-cached chunk
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks: id => {
          if (id.includes('node_modules/three')) return 'three';
          if (id.includes('node_modules/gsap') || id.includes('node_modules/lenis')) return 'motion';
          if (id.includes('node_modules/opentype')) return 'opentype';
        }
      }
    }
  }
});
