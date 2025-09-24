import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { visualizer } from "rollup-plugin-visualizer";
import Inspect from "vite-plugin-inspect";
import viteCompression from "vite-plugin-compression";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(__dirname, "../.env"), quiet: true });

export default defineConfig({
	plugins: [
		tailwindcss(),
		reactRouter(),
		tsconfigPaths({
			projects: [
				path.resolve(__dirname, "tsconfig.json"), // admin tsconfig
				path.resolve(__dirname, "../shared/tsconfig.json"), // shared tsconfig
			],
		}),
		Inspect(),
		visualizer({ open: true }),
		viteCompression({
			verbose: true,
			disable: false,
			algorithm: "brotliCompress",
			ext: ".br",
		}),
	],
	resolve: {
		alias: {
			"~": path.resolve(__dirname, "./app"),
			"@ecom/shared": path.resolve(__dirname, "../shared/src"),
			// /esm/icons/index.mjs only exports the icons statically, so no separate chunks are created
			"@tabler/icons-react": "@tabler/icons-react/dist/esm/icons/index.mjs",
		},
	},
	optimizeDeps: {
		exclude: ["crypto"],
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
