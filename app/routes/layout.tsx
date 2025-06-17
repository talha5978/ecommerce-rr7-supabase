import { QueryClientProvider } from "@tanstack/react-query";
import { LoaderFunctionArgs, Outlet, redirect, useNavigation } from "react-router";
import SidebarLayout from "~/components/Nav/nav-layout";
import { getCurrentUserFromRequest } from "~/hooks/useGetServerUser";
import { queryClient } from "~/lib/queryClient";
import ErrorPage from "~/components/Error/ErrorPage";
import { useEffect, useRef } from "react";
import LoadingBar, { LoadingBarRef } from "react-top-loading-bar";
export async function loader({ request }: LoaderFunctionArgs) {
	const { user } = await getCurrentUserFromRequest(request);
	
	if (!user && request.url !== "/login") {
		return redirect("/login");
	}

	return { user };
}

export function ErrorBoundary() {
	return <ErrorPage />;
}

export default function Layout() {
	const navigation = useNavigation();
	const loadingBarRef = useRef<null | LoadingBarRef>(null);


	useEffect(() => {
		if (loadingBarRef.current != null && navigation.state === "loading") {
			loadingBarRef.current.continuousStart();
		} else if (loadingBarRef.current != null && navigation.state === "idle") {
			loadingBarRef.current.complete();
		}
	}, [navigation.state]);
	
	return (
		<>
			<LoadingBar color="var(--color-primary)" ref={loadingBarRef} />
			<QueryClientProvider client={queryClient}>
				<SidebarLayout>
					<Outlet />
				</SidebarLayout>
			</QueryClientProvider>
		</>
	);
}
