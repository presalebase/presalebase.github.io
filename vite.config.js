import { defineConfig } from 'vite';

export default defineConfig({
  build:{
    rollupOptions:{
      input:{
        presaleBase:'index.html',
        developers:'developers/index.html',
      },
    },
  },
});
