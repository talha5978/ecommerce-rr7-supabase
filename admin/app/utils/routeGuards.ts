import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { redirect } from "react-router";
import { queryClient } from "@ecom/shared/lib/query-client/queryClient";
import { currentUserQuery } from "@ecom/shared/queries/auth.q";
import { PolicyManager } from "@ecom/shared/permissions/policyManager";
import { UserRole } from "@ecom/shared/permissions/permissions.enum";
import type { Permission } from "@ecom/shared/permissions/permissions.enum";
import type { RequirePram } from "@ecom/shared/types/permissions";
import type { GetCurrentUser } from "@ecom/shared/types/auth";
import { extractAuthId } from "@ecom/shared/lib/auth-utils.server";

type ProtectorProps = {
	permissions: Permission | Permission[];
	require?: RequirePram;
	onFailRedirectTo?: string | null;
	cacheFirst?: boolean;
};

const DEFAULT_REQUIRE_MODE = "all";

/**
 * @description main permission checker
 */
export async function withRoutePermission(
	args: LoaderFunctionArgs | ActionFunctionArgs,
	opts: ProtectorProps,
): Promise<Response | null> {
	const {
		permissions,
		require = DEFAULT_REQUIRE_MODE,
		onFailRedirectTo = "/login",
		cacheFirst = true,
	} = opts;
	const perms = Array.isArray(permissions) ? permissions : [permissions];

	const authId = extractAuthId(args.request);
	const queryDesc = currentUserQuery({ request: args.request, authId });

	let result: GetCurrentUser | undefined;
	if (cacheFirst) {
		result = queryClient.getQueryData(queryDesc.queryKey) as GetCurrentUser | undefined;
	}
	// console.log("USER QUERY ---------->", result);

	if (result?.error || !result?.user) {
		try {
			result = (await queryClient.fetchQuery(queryDesc)) as GetCurrentUser;
		} catch (err) {
			console.warn("withRoutePermission: fetch currentUser failed", err);
			if (onFailRedirectTo) return redirect(onFailRedirectTo);
			return new Response("Unauthorized", { status: 401 });
		}
	}

	const { user } = result ?? {};

	if (!user || !user.role?.role_name) {
		if (onFailRedirectTo) return redirect(onFailRedirectTo);
		return new Response("Unauthorized", { status: 401 });
	}

	const role = user.role.role_name as UserRole;
	const pm = new PolicyManager(role);

	const ok = require === "all" ? pm.hasAll(...perms) : pm.hasAny(...perms);

	if (!ok) {
		console.warn("Route permission denied", {
			role,
			perms,
			method: args.request.method,
			url: args.request.url,
		});

		if (onFailRedirectTo) return redirect(onFailRedirectTo);
		return new Response("Forbidden", { status: 403 });
	}

	return null;
}

/**
 * @name protectLoader<T>
 * @description Wraps a standard LoaderFunction returning Promise<T | Response>
 * @description preserves the return type T so TypeScript knows the loader's result type
 *
 * @example
 * export const loader = protectLoader<LoaderReturnType>({
 * 	permissions: Permission.SOMETHING
 * })(async ({ .... } : Route.LoaderArgs) => { ... });
 */
export function protectLoader<T>({
	permissions,
	require = DEFAULT_REQUIRE_MODE,
	onFailRedirectTo = "/login",
	cacheFirst = true,
}: ProtectorProps) {
	return (realLoader: (args: LoaderFunctionArgs) => Promise<T>) => {
		const wrappedLoader = async (args: LoaderFunctionArgs): Promise<T | Response> => {
			const guard = await withRoutePermission(args, {
				permissions,
				require,
				onFailRedirectTo,
				cacheFirst,
			});

			if (guard) return guard;
			return realLoader(args);
		};

		return wrappedLoader;
	};
}

/**
 * @name protectAction<T>
 * @description Wraps a standard ActionFunction returning Promise<T | Response>
 * @description preserves the return type T so TypeScript knows the action's result type
 *
 * @example
 * export const action = protectAction<ActionReturnType>({
 * 	permissions: Permission.SOMETHING
 * })(async ({ .... } : Route.ActionArgs) => { ... });
 */
export function protectAction<T>({
	permissions,
	require = DEFAULT_REQUIRE_MODE,
	onFailRedirectTo = "/login",
	cacheFirst = true,
}: ProtectorProps) {
	return (realAction: (args: ActionFunctionArgs) => Promise<T | Response>) => {
		const wrappedAction = async (args: ActionFunctionArgs): Promise<T | Response> => {
			const guard = await withRoutePermission(args, {
				permissions,
				require,
				onFailRedirectTo,
				cacheFirst,
			});

			if (guard) return guard;
			return realAction(args);
		};

		return wrappedAction;
	};
}
