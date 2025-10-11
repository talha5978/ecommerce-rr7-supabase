import { Outlet, useRouteLoaderData } from "react-router";
import Header from "~/components/Header/Header";
import { type loader } from "~/root";

export default function GlobalLayout() {
	const rootLoaderData = useRouteLoaderData<typeof loader>("root");
	const header_categories = rootLoaderData?.header_categories ?? [];

	return (
		<>
			<Header categories={header_categories} />
			<Outlet />
		</>
	);
}
