import { queryOptions } from "@tanstack/react-query";
import { AuthService } from "~/services/auth.service";
import type { GetCurrentUser } from "~/types/auth";

export const currentUserQuery = ({ request }: { request: Request }) => {
	const customStaleTime = 60 * 1000 * (process.env.VITE_ENV === "production" ? 10 : 25);

	return queryOptions<GetCurrentUser>({
		queryKey: ["current_user"],
		queryFn: async () => {
			const authSvc = new AuthService(request);
			const result = await authSvc.getCurrentUser();
			return result;
		},
		staleTime: customStaleTime,
	});
};
