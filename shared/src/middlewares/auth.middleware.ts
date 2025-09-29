import { ApiError } from "@ecom/shared/utils/ApiError";
import { type ServiceBase } from "@ecom/shared/services/service";
import { queryClient } from "@ecom/shared/lib/query-client/queryClient";
import { currentUserQuery } from "@ecom/shared/queries/auth.q";
import { createServiceMiddleware } from "@ecom/shared/middlewares/utils";
import { UserRole } from "@ecom/shared/permissions/permissions.enum";
import { extractAuthId } from "@ecom/shared/lib/auth-utils.server";

export const verifyUser = createServiceMiddleware<ServiceBase>(async (ctx, next) => {
	try {
		const service = ctx.service;
		if (service.currentUser != null && service.currentUser.id) {
			return next();
		}

		const authId = extractAuthId(service.request);

		const { user, error: noUserError } =
			(await queryClient.fetchQuery(
				currentUserQuery({
					request: service.request,
					authId: authId,
				}),
			)) ?? {};
		// console.log("user in verify user middleware", user, noUserError);

		if (user == null && noUserError) {
			throw noUserError ?? new ApiError("User not found", 401, []);
		}

		service.currentUser = {
			id: user?.id ?? "",
			email: user?.email ?? "",
			role: user?.role.role_name as UserRole,
		};

		return next();
	} catch (error) {
		throw error;
	}
});
