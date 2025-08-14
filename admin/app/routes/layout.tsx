import { QueryClientProvider } from "@tanstack/react-query";
import { LoaderFunctionArgs, Outlet, redirect } from "react-router";
import { queryClient } from "@ecom/shared/lib/query-client/queryClient";
import { lazy } from "react";
import { TopLoadingBar } from "~/components/Loaders/TopLoadingBar";
import { currentUserQuery } from "@ecom/shared/queries/auth.q";

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
// TODO: Show products option in each row of categories and sub categories, and we should also see the products that are related to a category or sub category in their respective updation page
// TODO: Write functionality where we show the checkboxes in each row of products table and variants table! and we can share them and export urls if we want to.
// TODO: Apply Rate limiting
export default function Layout() {
	return (
		<>
			<TopLoadingBar />
			<QueryClientProvider client={queryClient}>
				<SidebarLayout>
					<Outlet />
				</SidebarLayout>
			</QueryClientProvider>
		</>
	);
}
