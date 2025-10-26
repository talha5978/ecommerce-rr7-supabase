import { QueryClient } from "@tanstack/react-query";

function createQueryClient() {
	return new QueryClient({
		defaultOptions: {
			queries: {
				staleTime: 25 * 60 * 1000,
				gcTime: 30 * 60 * 1000,
				refetchOnWindowFocus: "always",
				refetchOnMount: false,
				retry: false,
			},
		},
	});
}

/** @description Global instance shared between all the users of both apps. */
export const queryClient = createQueryClient();
