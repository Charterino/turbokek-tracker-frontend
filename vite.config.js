import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import pagesPlugin from 'vite-plugin-pages'
import tailwindcss from '@tailwindcss/vite'
import path from "path"

export default defineConfig({
  plugins: [
    react(),
    pagesPlugin({
      dirs: 'src/pages',
      extensions: ['jsx'],
    }),
    tailwindcss()
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
