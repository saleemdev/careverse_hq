import path from 'path';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    test: {
        include: ['src/**/*.test.{ts,tsx}'],
        exclude: ['**/node_modules/**', '**/tests/**', '**/e2e/**'],
        environment: 'node',
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'src'),
        },
    },
});
