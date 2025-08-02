import { QueryClientProvider } from "@tanstack/react-query";
import { LoaderFunctionArgs, Outlet, redirect, useLocation, useNavigation } from "react-router";
import { queryClient } from "~/lib/queryClient";
import { lazy, useEffect, useRef, useState } from "react";
import LoadingBar, { LoadingBarRef } from "react-top-loading-bar";
import { currentUserQuery } from "~/queries/auth.q";

const SidebarLayout = lazy(() =>
	import("~/components/Nav/nav-layout").then((mod) => ({ default: mod.default })),
);

export async function loader({ request }: LoaderFunctionArgs) {
	const { user, error } = await queryClient.fetchQuery(currentUserQuery({ request }));
	// console.log("Layout loader: user =", user, "error =", error);
	console.log("Layout loader ran ⚡\t", `${user?.first_name} ${user?.last_name}`);

	if (!user || error) {
		console.log("No user or error, redirecting to /login from", request.url);
		return redirect("/login");
	}

	return { user, error };
}
// TODO: Write functionality where we show the checkboxes in each row of products table and variants table! and we can share them and export urls if we want to.
// TODO: Apply Rate limiting
export default function Layout() {
	const navigation = useNavigation();
	const loadingBarRef = useRef<null | LoadingBarRef>(null);
	const [isLoadingBarStarted, setIsLoadingBarStarted] = useState<boolean>(false);
	const location = useLocation();

	useEffect(() => {
		if (loadingBarRef.current != null) {
			if (navigation.state === "loading") {
				if (!location?.state?.suppressLoadingBar) {
					// Start the loading bar for non-suppressed navigations
					loadingBarRef.current.continuousStart();
					setIsLoadingBarStarted(true);
				} else {
					// Ensure suppressed navigations don't start the bar
					setIsLoadingBarStarted(false);
				}
			} else if (navigation.state === "idle" && isLoadingBarStarted) {
				// Only complete the bar if it was started
				loadingBarRef.current.complete();
				setIsLoadingBarStarted(false);
			}
		}
	}, [navigation.state, navigation.location, isLoadingBarStarted]);

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
