import { Links, Meta, Outlet, redirect, Scripts, ScrollRestoration, useLoaderData } from "react-router";
import type { Route } from "./+types/root";
import "./app.css";
import { Toaster } from "~/components/ui/sonner";
import ErrorPage from "~/components/Error/ErrorPage";
//import { dehydrate, HydrationBoundary, QueryClient, QueryClientProvider } from "@tanstack/react-query";
//import { createQueryClient } from "@ecom/shared/lib/query-client/queryClient";
//import { currentUserQuery } from "@ecom/shared/queries/auth.q";
import { useState } from "react";
import { TopLoadingBar } from "~/components/Loaders/TopLoadingBar";
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
	console.log("Layout loader ran ⚡");
	return { user: null, error: null, dehydratedState: undefined };
	/*
	const queryClient = createQueryClient();

	try {
		await queryClient.prefetchQuery(currentUserQuery({ request }));
	} catch (error) {
		console.error("Error prefetching current user query:", error);
	}

	const resp: GetCurrentUser | undefined = queryClient.getQueryData(currentUserQuery({ request }).queryKey);

	const user = resp?.user ?? null;
	const error = resp?.error ?? null;

	const url = new URL(request.url);
	const pathname = url.pathname;

	if (pathname === "/login" || pathname.startsWith("/login")) {
		if (user) {
			return redirect("/");
		}

		return { user, error, dehydratedState: undefined };
	}

	user ? console.log("User found:", user.email) : console.error("User not logged in.");

	return { user, error, dehydratedState: dehydrate(queryClient) };
	*/
}

let isInitialRequest = true;

export async function clientLoader({ serverLoader }: Route.ClientLoaderArgs) {
	if (isInitialRequest) {
		isInitialRequest = false;
		return await serverLoader();
	}
	return { dehydratedState: undefined };
}

clientLoader.hydrate = true as const;

export function Layout({ children }: { children: React.ReactNode }) {
	// const [queryClient] = useState(() => createQueryClient());
	const [queryClient] = useState(null);
	const loaderData = useLoaderData<typeof loader>();
	const dehydratedState = loaderData?.dehydratedState;

	return (
		<html lang="en" suppressHydrationWarning>
			<head>
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<Meta />
				<Links />
			</head>
			<body>
				{/* <QueryClientProvider client={queryClient as any}>
					<HydrationBoundary state={dehydratedState}>{children}</HydrationBoundary>
				</QueryClientProvider> */}
				{children}
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
