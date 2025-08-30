import { Outlet } from "react-router";
import SidebarLayout from "~/components/Nav/nav-layout";

// Protected routes go here
export default function LayoutRoute() {
	return (
		<SidebarLayout>
			<Outlet />
		</SidebarLayout>
	);
}
