import { Links, Meta, Outlet, redirect, Scripts, ScrollRestoration } from "react-router";
import type { Route } from "./+types/root";
import "./app.css";
import { Toaster } from "~/components/ui/sonner";
import ErrorPage from "~/components/Error/ErrorPage";
import { TopLoadingBar } from "~/components/Loaders/TopLoadingBar";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@ecom/shared/lib/query-client/queryClient";
import { get_FP_headerCategories } from "~/queries/categories.q";
import { get_FP_allCoupons } from "~/queries/coupons.q";
import { GetCurrentUser } from "@ecom/shared/types/auth";
import { currentFullUserQuery } from "~/queries/auth.q";
import { m } from "motion/react";

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

export async function loader({ request }: Route.LoaderArgs) {
	const header_categories_resp = await queryClient.fetchQuery(get_FP_headerCategories({ request }));
	const coupons = await queryClient.fetchQuery(get_FP_allCoupons({ request }));

	const url = new URL(request.url);
	const pathname = url.pathname;

	if (pathname.startsWith("/login")) {
		const { genAuthSecurity } = await import("@ecom/shared/lib/auth-utils.server");
		const { authId } = genAuthSecurity(request);

		if (authId) {
			const resp: GetCurrentUser = await queryClient.fetchQuery(
				currentFullUserQuery({ request, authId }),
			);
			if (resp?.user) return redirect("/");
		}

		return {
			headers: null,
			user: null,
			current_user_error: null,
			header_categories: header_categories_resp.categories ?? [],
			coupons: coupons.coupons ?? [],
		};
	}

	const { genAuthSecurity } = await import("@ecom/shared/lib/auth-utils.server");
	const { authId, headers } = genAuthSecurity(request);

	const resp: GetCurrentUser = await queryClient.fetchQuery(currentFullUserQuery({ request, authId }));

	const user = resp?.user ?? null;
	const current_user_error = resp?.error ?? null;

	if (!user || current_user_error) {
		console.warn("❌ No user found");
	}

	user && console.log(user?.email, " logged in");

	return {
		headers,
		user: user,
		current_user_error,
		header_categories: header_categories_resp.categories ?? [],
		coupons: coupons.coupons ?? [],
	};
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
		<>
			<TopLoadingBar />
			<Outlet />
			<Toaster />
		</>
	);
}

export function ErrorBoundary() {
	return <ErrorPage />;
}
