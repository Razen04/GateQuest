import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

// https://vite.dev/config/
export default defineConfig({
    plugins: [
        react(),
        tailwindcss(),
        VitePWA({
            registerType: 'prompt',
            devOptions: {
                enabled: true, // allow testing in dev/preview
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
                        type: 'image/svg',
                    },
                    {
                        src: '/logo.svg',
                        sizes: '512x512',
                        type: 'image/svg',
                    },
                ],
            },
        }),
    ],
});
