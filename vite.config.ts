import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { visualizer } from "rollup-plugin-visualizer";
import Inspect from "vite-plugin-inspect";
import viteCompression from "vite-plugin-compression";
import svgr from "vite-plugin-svgr";

export default defineConfig({
	plugins: [
		tailwindcss(),
		reactRouter(),
		tsconfigPaths(),
		Inspect(),
		visualizer({ open: true }),
		viteCompression(),
		svgr(),
	],
	resolve: {
		alias: {
			"~": path.resolve(__dirname, "./app"),
			// /esm/icons/index.mjs only exports the icons statically, so no separate chunks are created
			"@tabler/icons-react": "@tabler/icons-react/dist/esm/icons/index.mjs",
		},
	},
	optimizeDeps: {
		// Pre-bundling to optimize dev performance
		include: [
			"@tabler/icons-react",
			"@radix-ui/react-dropdown-menu",
			"@radix-ui/react-tooltip",
			"@radix-ui/react-dialog",
		],
	},
	build: {
		minify: "esbuild",
		chunkSizeWarningLimit: 1000,
	},
});
