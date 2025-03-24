import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    build: {
        chunkSizeWarningLimit: 1000,
        sourcemap: true,
        rollupOptions: {
            output: {
                manualChunks: {
                    vendor: [
                        'react',
                        'react-dom',
                        'react-router-dom',
                        'framer-motion',
                        '@twa-dev/sdk',
                        'date-fns'
                    ]
                }
            }
        }
    },
    define: {
        'process.env': {}
    },
    server: {
        host: '0.0.0.0',
        port: 5173,
        strictPort: true,
        hmr: {
            clientPort: 5173
        }
    },
    preview: {
        port: 4173,
        strictPort: true
    },
    resolve: {
        alias: {
            '@': '/src'
        }
    },
    optimizeDeps: {
        include: ['react', 'react-dom', 'react-router-dom']
    }
});
