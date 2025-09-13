import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import viteCompression from "vite-plugin-compression";
import Inspect from "vite-plugin-inspect";
import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(__dirname, "../.env"), quiet: true });

export default defineConfig({
	plugins: [
		tailwindcss(),
		reactRouter(),
		tsconfigPaths({
			projects: [
				path.resolve(__dirname, "tsconfig.json"), // front panel tsconfig
				path.resolve(__dirname, "../shared/tsconfig.json"), // shared tsconfig
			],
		}),
		viteCompression({
			verbose: true,
			disable: false,
			algorithm: "brotliCompress",
			ext: ".br",
		}),
		Inspect(),
	],
	resolve: {
		alias: {
			"~": path.resolve(__dirname, "./app"),
			"@ecom/shared": path.resolve(__dirname, "../shared/src"),
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
