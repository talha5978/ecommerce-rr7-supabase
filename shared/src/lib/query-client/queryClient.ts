import { QueryClient } from "@tanstack/react-query";

// createQueryClient function to create new instance for sensitive queries like user query that should not be shared among users
export function createQueryClient() {
	return new QueryClient({
		defaultOptions: {
			queries: {
				staleTime: 25 * 60 * 1000,
				gcTime: 30 * 60 * 1000,
				refetchOnWindowFocus: false,
				refetchOnMount: false,
				retry: false,
			},
		},
	});
}

// queryClient global instance that is shared between all the users
export const queryClient = createQueryClient();
