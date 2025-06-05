import { LoaderFunctionArgs, Outlet, redirect } from "react-router";
import SidebarLayout from "~/components/Nav/nav-layout";
import { getCurrentUserFromRequest } from "~/hooks/useGetServerUser";

export async function loader({ request }: LoaderFunctionArgs) {
	const { user } = await getCurrentUserFromRequest(request);

	if (!user && request.url !== "/login") {
		return redirect("/login");
	}

	return { user };
}

export default function Layout() {
	return (
		<SidebarLayout>
			<Outlet />
		</SidebarLayout>
	);
}
