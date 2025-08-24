import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";
import type { Route } from "./+types/root";
import "./app.css";
import { Toaster } from "~/components/ui/sonner";
import ErrorPage from "~/components/Error/ErrorPage";
import { type DehydratedState, HydrationBoundary, QueryClientProvider } from "@tanstack/react-query";
import { getQueryClient } from "@ecom/shared/lib/query-client/queryClient";
import { ThemeProvider } from "~/components/Theme/theme-provder";

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

export function Layout({
	children,
	dehydratedState,
}: {
	children: React.ReactNode;
	dehydratedState?: DehydratedState | undefined;
}) {
	const queryClient = getQueryClient();

	return (
		<html lang="en" suppressHydrationWarning>
			<head>
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				{/* Title tag is inserted by each page component */}
				<Meta />
				<Links />
			</head>
			<body>
				<QueryClientProvider client={queryClient}>
					<HydrationBoundary state={dehydratedState}>
						<ThemeProvider>{children}</ThemeProvider>
					</HydrationBoundary>
				</QueryClientProvider>
				<ScrollRestoration />
				<Scripts />
			</body>
		</html>
	);
}

export default function App() {
	return (
		<>
			<Outlet />
			<Toaster />
		</>
	);
}

export function ErrorBoundary() {
	return <ErrorPage />;
}
