import { QueryClient } from "@tanstack/react-query";

export function createQueryClient() {
	return new QueryClient({
		defaultOptions: {
			queries: {
				staleTime: 25 * 60 * 1000, // 25 minutes
				refetchOnWindowFocus: false,
			},
		},
	});
}

export const queryClient = createQueryClient();
