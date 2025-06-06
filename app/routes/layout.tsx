import { QueryClientProvider } from "@tanstack/react-query";
import { LoaderFunctionArgs, Outlet, redirect } from "react-router";
import SidebarLayout from "~/components/Nav/nav-layout";
import { getCurrentUserFromRequest } from "~/hooks/useGetServerUser";
import { queryClient } from "~/lib/queryClient";
import ErrorPage from "~/components/Error/ErrorPage";

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
	return (
		<QueryClientProvider client={queryClient}>
			<SidebarLayout>
				<Outlet />
			</SidebarLayout>
		</QueryClientProvider>
	);
}
