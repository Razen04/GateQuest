import path from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

// https://vite.dev/config/
export default defineConfig({
    plugins: [
        react(),
        tailwindcss(),
        VitePWA({
            strategies: 'injectManifest',
            srcDir: 'src',
            filename: 'sw.ts',
            registerType: 'autoUpdate',
            injectManifest: {
                // Prevent 2.5MB+ KaTeX fonts from bloating the initial service worker precache
                globIgnores: ['**/KaTeX_*.{woff,woff2,ttf,eot}'],
                maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
            },
            devOptions: {
                enabled: true,
                type: 'module',
            },
            includeAssets: ['favicon.svg', 'robots.txt'],
            manifest: {
                name: 'GATEQuest',
                short_name: 'GATEQuest',
                start_url: '/',
                display: 'standalone',
                background_color: '#ffffff',
                theme_color: '#000000',
                icons: [
                    {
                        src: '/logo.svg',
                        sizes: '192x192',
                        type: 'image/svg+xml',
                    },
                    {
                        src: '/logo.svg',
                        sizes: '512x512',
                        type: 'image/svg+xml',
                    },
                ],
            },
        }),
    ],
    build: {
        rollupOptions: {
            output: {
                manualChunks(id) {
                    // React Core
                    if (
                        id.includes('node_modules/react/') ||
                        id.includes('node_modules/react-dom/') ||
                        id.includes('node_modules/react-router-dom/')
                    ) {
                        return 'vendor-react';
                    }
                    // Math rendering engine
                    if (id.includes('node_modules/katex')) {
                        return 'vendor-katex';
                    }
                    // Radix UI primitives
                    if (id.includes('node_modules/@radix-ui')) {
                        return 'vendor-radix';
                    }
                    // Charting (Nivo / Recharts)
                    if (
                        id.includes('node_modules/@nivo') ||
                        id.includes('node_modules/recharts')
                    ) {
                        return 'vendor-charts';
                    }
                    // Phosphor icons
                    if (id.includes('node_modules/@phosphor-icons')) {
                        return 'vendor-icons';
                    }
                    // Animation & Framer Motion
                    if (id.includes('node_modules/framer-motion')) {
                        return 'vendor-motion';
                    }
                },
            },
        },
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
});
