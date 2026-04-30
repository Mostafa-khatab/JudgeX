import { defineConfig, loadEnv } from 'vite';
import path from 'path';
import react from '@vitejs/plugin-react-swc';
import svgr from 'vite-plugin-svgr';
import { viteStaticCopy } from 'vite-plugin-static-copy';

// https://vitejs.dev/config/

export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd(), '');
	const buildSourcemap = env.VITE_BUILD_SOURCEMAP === 'true';
	const disableMinify = env.VITE_DISABLE_MINIFY === 'true';

	return {
	define: {
		global: 'window',
		'process.env': {},
	},
	plugins: [
		react(),
		svgr({
			svgrOptions: { exportType: 'default', ref: true, titleProp: true },
			include: '**/*.svg',
		}),
		viteStaticCopy({
			targets: [
				{
					src: 'src/locales',
					dest: '',
				},
			],
		}),
	],
	css: {
		devSourcemap: true,
	},
	build: {
		sourcemap: buildSourcemap,
		minify: disableMinify ? false : 'esbuild',
	},
	resolve: {
		alias: {
			// eslint-disable-next-line no-undef
			'~': path.resolve(__dirname, './src'),
		},
	},
	assetsInclude: ['./src/locales'],
	};
});
