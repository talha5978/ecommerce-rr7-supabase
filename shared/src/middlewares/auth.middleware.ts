import { ApiError } from "@ecom/shared/utils/ApiError";
import { type ServiceBase } from "@ecom/shared/services/service";
import { queryClient } from "@ecom/shared/lib/query-client/queryClient";
import { currentUserQuery } from "@ecom/shared/queries/auth.q";
import { createServiceMiddleware } from "@ecom/shared/middlewares/utils";

export const verifyUser = createServiceMiddleware<ServiceBase>(async (ctx, next) => {
	try {
		const service = ctx.service;

		const { user, error: noUserError } =
			(await queryClient.fetchQuery(
				currentUserQuery({
					request: service.request,
				}),
			)) ?? {};
		// console.log("user in verify user middleware", user, noUserError);

		if (user == null && noUserError) {
			throw noUserError ?? new ApiError("User not found", 401, []);
		}

		return next();
	} catch (error) {
		throw error;
	}
});

// export const authorizeRole = createServiceMiddleware<ServiceBase>(async (ctx, next) => {
// 	// TODO: Add role managment logic here
// 	// for this create a policy based role management system
// });
