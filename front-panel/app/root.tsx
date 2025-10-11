import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";
import type { Route } from "./+types/root";
import "./app.css";
import { Toaster } from "~/components/ui/sonner";
import ErrorPage from "~/components/Error/ErrorPage";
//import { dehydrate, HydrationBoundary, QueryClient, QueryClientProvider } from "@tanstack/react-query";
//import { createQueryClient } from "@ecom/shared/lib/query-client/queryClient";
//import { currentUserQuery } from "@ecom/shared/queries/auth.q";
import { TopLoadingBar } from "~/components/Loaders/TopLoadingBar";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@ecom/shared/lib/query-client/queryClient";
// import { currentUserQuery } from "@ecom/shared/queries/auth.q";
import { get_FP_headerCategories } from "~/queries/categories.q";
import { get_FP_allCoupons } from "~/queries/coupons.q";
//import type { GetCurrentUser } from "@ecom/shared/types/auth";

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
	// const url = new URL(request.url);
	// const pathname = url.pathname;
	// // console.log("⚡ Root loader ran for", pathname);

	// if (pathname.startsWith("/login")) {
	// 	// console.log("➡️ Public route, skipping user fetch");
	// 	const { genAuthSecurity } = await import("@ecom/shared/lib/auth-utils.server");
	// 	const { authId } = genAuthSecurity(request);

	// 	if (authId) {
	// 		const resp: any = await queryClient.fetchQuery(currentUserQuery({ request, authId }));
	// 		if (resp?.user) return redirect("/");
	// 	}

	// 	return { user: null, error: null };
	// }

	// const { genAuthSecurity } = await import("@ecom/shared/lib/auth-utils.server");
	// const { authId, headers } = genAuthSecurity(request);

	// const resp: GetCurrentUser = await queryClient.fetchQuery(currentUserQuery({ request, authId }));

	// const user = resp?.user ?? null;
	// const error = resp?.error ?? null;

	// if (!user || error) {
	// 	console.warn("❌ No user, redirecting to /login");
	// }

	// console.log("✅ User found:", user?.email);
	// return { user, error, headers };
	const header_categories_resp = await queryClient.fetchQuery(get_FP_headerCategories({ request }));
	const coupons = await queryClient.fetchQuery(get_FP_allCoupons({ request }));

	return {
		user: null,
		error: null,
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
