import { QueryClient } from "@tanstack/react-query";

export function createQueryClient() {
	return new QueryClient({
		defaultOptions: {
			queries: {
				staleTime: 25 * 60 * 1000,
				gcTime: 30 * 60 * 1000,
				refetchOnWindowFocus: false,
			},
		},
	});
}

let browserClient: QueryClient | undefined = undefined;

export function getQueryClient() {
	if (typeof window === "undefined") {
		return createQueryClient();
	} else {
		if (!browserClient) {
			browserClient = createQueryClient();
		}
		return browserClient;
	}
}

export const queryClient = createQueryClient();
