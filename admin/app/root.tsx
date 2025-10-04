import { Links, Meta, Outlet, redirect, Scripts, ScrollRestoration } from "react-router";
import type { Route } from "./+types/root";
import "./app.css";
import { Toaster } from "~/components/ui/sonner";
import ErrorPage from "~/components/Error/ErrorPage";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@ecom/shared/lib/query-client/queryClient";
import { ThemeProvider } from "~/components/Theme/theme-provder";
import { currentUserQuery } from "@ecom/shared/queries/auth.q";
import { TopLoadingBar } from "~/components/Loaders/TopLoadingBar";
import type { GetCurrentUser } from "@ecom/shared/types/auth";

export const links: Route.LinksFunction = () => [
	{ rel: "preconnect", href: "https://fonts.googleapis.com" },
	{
		rel: "preconnect",
		href: "https://fonts.gstatic.com",
		crossOrigin: "anonymous",
	},
	{
		rel: "stylesheet",
		href: "https://fonts.googleapis.com/css2?family=Geist:wght@100..900&display=swap",
	},
];

if (typeof window !== "undefined" && "serviceWorker" in navigator) {
	window.addEventListener("load", async () => {
		try {
			const { Workbox } = await import("workbox-window");
			const wb = new Workbox("/sw.js");
			await wb.register();
			console.log("Service worker registered successfully");

			// Keep service worker active
			wb.addEventListener("activated", () => {
				console.log("Service worker activated");
				setInterval(() => {
					wb.messageSW({ type: "KEEP_ALIVE" });
					console.log("Sent keep-alive to service worker");
				}, 20000);
			});
			wb.addEventListener("waiting", () => {
				wb.messageSkipWaiting();
			});
		} catch (error) {
			console.error("Failed to register service worker:", error);
		}
	});
}

export async function loader({ request }: Route.LoaderArgs) {
	const url = new URL(request.url);
	const pathname = url.pathname;
	// console.log("⚡ Root loader ran for", pathname);

	if (pathname.startsWith("/login")) {
		// console.log("➡️ Public route, skipping user fetch");
		const { genAuthSecurity } = await import("@ecom/shared/lib/auth-utils.server");
		const { authId } = genAuthSecurity(request);

		if (authId) {
			const resp: GetCurrentUser = await queryClient.fetchQuery(currentUserQuery({ request, authId }));
			if (resp?.user) return redirect("/");
		}

		return { user: null, error: null };
	}

	const { genAuthSecurity } = await import("@ecom/shared/lib/auth-utils.server");
	const { authId, headers } = genAuthSecurity(request);

	const resp: GetCurrentUser = await queryClient.fetchQuery(currentUserQuery({ request, authId }));

	const user = resp?.user ?? null;
	const error = resp?.error ?? null;

	if (!user || error) {
		console.warn("❌ No user, redirecting to /login");
		return redirect("/login", { headers });
	}

	console.log("✅ User found:", user?.email);
	return { user, error };
}

export function Layout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en" suppressHydrationWarning>
			<head>
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<Meta />
				<Links />
			</head>
			<body>
				<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
				<ScrollRestoration />
				<Scripts />
			</body>
		</html>
	);
}

export default function App() {
	return (
		<ThemeProvider>
			<TopLoadingBar />
			<Outlet />
			<Toaster />
		</ThemeProvider>
	);
}

export function ErrorBoundary() {
	return <ErrorPage />;
}
