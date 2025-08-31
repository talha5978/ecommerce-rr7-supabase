import type { ServiceBase } from "@ecom/shared/services/service";
import type { MiddlewareContext, MiddlewareFn } from "@ecom/shared/types/middleware";
import { ApiError } from "@ecom/shared/utils/ApiError";
import { PolicyManager } from "@ecom/shared/permissions/policyManager";
import { POLICY_MANAGER_KEY } from "@ecom/shared/decorators/keys";
import { UserRole } from "@ecom/shared/permissions/permissions.enum";

/**
 * Cast a ServiceBase-typed middleware to MiddlewareFn<T> for use at decorator site.
 * This is a compile-time cast only; runtime behavior is unchanged.
 *
 * Usage: @UseClassMiddleware(asServiceMiddleware<MyService>(verifyUser))
 */
export function asServiceMiddleware<T extends ServiceBase = ServiceBase>(
	mw: MiddlewareFn<ServiceBase>,
): MiddlewareFn<T> {
	return mw as unknown as MiddlewareFn<T>;
}

/** Small uitily to initilize a middleware specifically for service function(s)*/
export function createServiceMiddleware<T extends ServiceBase = ServiceBase>(
	fn: MiddlewareFn<T>,
): MiddlewareFn<T> {
	return async (ctx, next) => {
		if (!ctx.service) throw new ApiError("Middleware used outside service context", 500, []);
		return fn(ctx as MiddlewareContext<T> & { service: T }, next);
	};
}

/**
 * Returns a PolicyManager cached on the service instance.
 * If currentUser.role is missing, we fall back to CONSUMER.
 */
export function getOrCreatePolicyManager(service: ServiceBase): PolicyManager {
	const key = POLICY_MANAGER_KEY;
	const DEFAULT_ROLE = UserRole.CONSUMER;

	if ((service as any)[key]) {
		return (service as any)[key] as PolicyManager;
	}

	const role = service.currentUser?.role ?? DEFAULT_ROLE;
	const pm_instance = new PolicyManager(role);

	Object.defineProperty(service, key, {
		value: pm_instance,
		configurable: true,
		enumerable: false,
		writable: false,
	});

	return pm_instance;
}
