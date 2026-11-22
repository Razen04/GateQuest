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
        // Let Rollup code-split naturally. The previous manualChunks forced
        // whole ecosystems (all Phosphor icons, Recharts + Nivo, etc.) into
        // single eager chunks that the entry imported, adding ~600 KB gzip
        // to every page load even though those pages are lazy-loaded.
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
});
