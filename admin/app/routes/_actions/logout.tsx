import type { ActionFunctionArgs } from "react-router";
import { redirect } from "react-router";
import { queryClient } from "@ecom/shared/lib/query-client/queryClient";
import { AuthService } from "@ecom/shared/services/auth.service";
import { currentUserQuery } from "@ecom/shared/queries/auth.q";
import type { GetCurrentUser } from "@ecom/shared/types/auth";
import { extractAuthId } from "@ecom/shared/lib/auth-utils.server";

export async function action({ request }: ActionFunctionArgs) {
	const authId = extractAuthId(request);
	let resp: GetCurrentUser | null = null;

	if (authId) {
		resp = await queryClient.fetchQuery(currentUserQuery({ request, authId }));
		if (resp?.user?.id) return redirect("/login");
	}

	const authService = new AuthService(request);
	const { error, headers } = await authService.logout();

	if (error) {
		throw new Response(error.message || "Failed to logout", { status: 400, headers });
	}

	await queryClient.invalidateQueries({ queryKey: ["current_user", authId] });
	// queryClient.clear();

	return redirect("/login", { headers });
}

export default function LogoutRoute() {
	return null;
}
