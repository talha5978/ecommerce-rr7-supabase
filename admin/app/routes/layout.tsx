import { type LoaderFunctionArgs, Outlet, redirect } from "react-router";
import { TopLoadingBar } from "~/components/Loaders/TopLoadingBar";
import { currentUserQuery } from "@ecom/shared/queries/auth.q";
import { getQueryClient } from "@ecom/shared/lib/query-client/queryClient";
import SidebarLayout from "~/components/Nav/nav-layout";
import { dehydrate } from "@tanstack/react-query";

export async function loader({ request }: LoaderFunctionArgs) {
	console.log("Layout loader ran ⚡");

	const queryClient = getQueryClient();
	const { user, error } = await queryClient.fetchQuery(currentUserQuery({ request }));

	if (!user || error) {
		console.error("User not found. Redirecting to login");
		return redirect("/login");
	}

	console.log("User found:", user.email);

	const state = dehydrate(queryClient);

	return { user, error, dehydratedState: state };
}

export default function Layout() {
	return (
		<SidebarLayout>
			<TopLoadingBar />
			<Outlet />
		</SidebarLayout>
	);
}
