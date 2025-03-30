import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Загрузка переменных окружения
  const env = loadEnv(mode, process.cwd());

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      }
    },
    server: {
      host: true, // Доступ извне для тестирования на реальных устройствах
      port: 5173, // Стандартный порт Vite
      strictPort: true, // Строгая проверка порта
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      sourcemap: mode === 'development',
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom', 'framer-motion'],
            twa: ['@twa-dev/sdk']
          }
        }
      }
    },
    define: {
      // Передаем переменные окружения в приложение
      'import.meta.env.VITE_MONGODB_URI': JSON.stringify(env.MONGODB_URI || '')
    },
    optimizeDeps: {
      include: ['@twa-dev/sdk', 'framer-motion']
    }
  };
})
