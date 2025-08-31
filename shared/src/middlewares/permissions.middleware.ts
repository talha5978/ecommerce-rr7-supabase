import { createServiceMiddleware, getOrCreatePolicyManager } from "@ecom/shared/middlewares/utils";
import type { ServiceBase } from "@ecom/shared/services/service";
import { ApiError } from "@ecom/shared/utils/ApiError";
import { type Permission } from "@ecom/shared/permissions/permissions.enum";
import type { Opts } from "@ecom/shared/types/permissions";

const DEFAULT_REQUIRE_MODE = "all";

/**
 * Returns a middleware that asserts the current user has the given permission(s)
 * - require = "all" (default): all provided permissions must be present
 * - require = "any": at least one must be present
 */

export function createPermissionMiddleware<T extends ServiceBase = ServiceBase>(opts: Opts) {
	const permissions = opts.permissions;
	const requireMode = opts.require ?? DEFAULT_REQUIRE_MODE;

	return createServiceMiddleware<T>(async (ctx, next) => {
		const svc = ctx.service;
		console.log(svc);

		if (!svc.currentUser) {
			throw new ApiError("User not found", 401, []);
		}

		const pm = getOrCreatePolicyManager(svc);

		const ok = requireMode === "all" ? pm.hasAll(...permissions) : pm.hasAny(...permissions);

		if (!ok) {
			throw new ApiError("You don't have premission to perform this action.", 403, [
				"Insufficient permissions",
			]);
		}

		return next();
	});
}

/** Convenience helpers for this middleware */

export const requireAllPermissions = <T extends ServiceBase = ServiceBase>(perms: Permission[]) =>
	createPermissionMiddleware<T>({ permissions: perms, require: "all" });

export const requireAnyPermission = <T extends ServiceBase = ServiceBase>(perms: Permission[]) =>
	createPermissionMiddleware<T>({ permissions: perms, require: "any" });
