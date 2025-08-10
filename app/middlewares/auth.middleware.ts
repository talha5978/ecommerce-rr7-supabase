import { createServiceMiddleware } from "~/middlewares/utils";
import type { ServiceBase } from "~/services/service";
import { queryClient } from "~/lib/queryClient";
import { currentUserQuery } from "~/queries/auth.q";
import { ApiError } from "~/utils/ApiError";

export const verifyUser = createServiceMiddleware<ServiceBase>(async (ctx, next) => {
	try {
		const service = ctx.service;
		const { user, error: noUserError } = await queryClient.fetchQuery(
			currentUserQuery({ request: service.request }),
		);
		if (user == null && noUserError) {
			throw noUserError ?? new ApiError("User not found", 401, []);
		}
		return next();
	} catch (error) {
		throw error;
	}
});

export const authorizeRole = createServiceMiddleware<ServiceBase>(async (ctx, next) => {
	// TODO: Add role managment logic here
	// for this create a policy based role management system
});
