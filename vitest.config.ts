/// vitest.config.ts
import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    test: {
        environment: 'jsdom',
        setupFiles: ['./src/test/setup.ts'],
        globals: true,
        exclude: [
            '**/node_modules/**',
            '**/dist/**',
            '**/.{idea,git,cache,output,temp}/**',
            'supabase/functions/**', // handled by Deno
        ],
    },
});
