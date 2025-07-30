import { useMatches } from "react-router";

export interface RouteHandle {
	title: string;
}

export function usePageTitle() {
	const matches = useMatches();
	return (
		(
			[...matches].reverse().find((m) => (m.handle as RouteHandle)?.title) as {
				handle: RouteHandle | undefined;
			}
		)?.handle?.title ?? "App"
	);
}
