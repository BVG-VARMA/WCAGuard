import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import babelPluginDataLoc from 'babel-plugin-data-loc';

export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [babelPluginDataLoc]
      }
    })
  ],
  server: {
    port: 5173,
    strictPort: true,
    host: true
  }
});
