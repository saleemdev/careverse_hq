import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react'
import proxyOptions from './proxyOptions';

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [react()],
	base: '/assets/careverse_hq/admin-central/',
	server: {
		port: 8080,
		host: '0.0.0.0',
		proxy: proxyOptions
	},
	resolve: {
		alias: {
			'@': path.resolve(__dirname, 'src')
		}
	},
	build: {
		outDir: '../careverse_hq/public/admin-central',
		emptyOutDir: true,
		target: 'es2015',
		manifest: true,
		sourcemap: true,
		rollupOptions: {
			output: {
				manualChunks: undefined,
			},
		},
	},
});
