import { useRouteLoaderData } from "react-router";
import { getCache } from "~/lib/cache";

export function useGetCurrentUser() {
	const cachedUser = getCache("user");
	if (cachedUser) {
		return { user: cachedUser };
	}
	return useRouteLoaderData("routes/layout")?.user ?? null;
}
