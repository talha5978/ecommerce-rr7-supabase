import { queryOptions } from "@tanstack/react-query";
import { AuthService } from "~/services/auth.service";
import type { GetCurrentUser } from "~/types/auth";

export const currentUserQuery = ({ request }: { request: Request }) => {
	return queryOptions<GetCurrentUser>({
		queryKey: ["current_user"],
		queryFn: async () => {
			const authSvc = new AuthService(request);
			const result = await authSvc.getCurrentUser();
			return result;
		},
	});
};
