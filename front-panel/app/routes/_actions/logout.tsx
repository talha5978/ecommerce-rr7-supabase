import type { ActionFunctionArgs } from "react-router";
import { redirect } from "react-router";
import { queryClient } from "@ecom/shared/lib/query-client/queryClient";
import { AuthService } from "@ecom/shared/services/auth.service";
import type { GetFullCurrentUser } from "@ecom/shared/types/auth";
import { genAuthSecurity } from "@ecom/shared/lib/auth-utils.server";
import { currentFullUserQuery } from "~/queries/auth.q";

export async function action({ request }: ActionFunctionArgs) {
	const { authId } = genAuthSecurity(request);
	console.log("Extracted authId in /logout:", authId);

	let resp: GetFullCurrentUser | null = null;
	if (authId) {
		resp = await queryClient.fetchQuery(currentFullUserQuery({ request, authId }));
		if (!resp?.user?.id) {
			console.error("User not found in /logout for authId:", authId);
			return redirect("/?error=" + encodeURIComponent("User not found"));
		}
	} else {
		console.error("No authId found in /logout");
		return redirect("/?error=" + encodeURIComponent("No user ID found"));
	}

	const authService = new AuthService(request);
	const { error, headers } = await authService.logout();

	if (error) {
		throw new Response(error.message || "Failed to logout", { status: 400, headers });
	}

	await queryClient.invalidateQueries({ queryKey: ["full_current_user", authId] });

	return redirect("/", { headers });
}

export default function LogoutRoute() {
	return null;
}
