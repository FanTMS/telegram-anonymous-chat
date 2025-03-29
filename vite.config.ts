import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 5173,
    host: true,
  },
  build: {
    // Настройки для production режима
    minify: 'terser',
    sourcemap: false,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
          router: ['react-router-dom'],
          ui: ['framer-motion', '@twa-dev/sdk'],
        },
      },
    },
    // Добавляем настройки для Telegram WebApp
    target: 'esnext',
    assetsInlineLimit: 0,
  },
  // Переменные окружения для production
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
    'process.env.TELEGRAM_BOT_TOKEN': JSON.stringify(process.env.TELEGRAM_BOT_TOKEN),
    'process.env.ADMIN_TELEGRAM_ID': JSON.stringify('5394381166'),
  }
})
