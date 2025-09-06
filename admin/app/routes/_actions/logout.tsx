import type { ActionFunctionArgs } from "react-router";
import { redirect } from "react-router";
import { queryClient } from "@ecom/shared/lib/query-client/queryClient";
import { AuthService } from "@ecom/shared/services/auth.service";
import { currentUserQuery } from "@ecom/shared/queries/auth.q";
import type { GetCurrentUser } from "@ecom/shared/types/auth";

export async function action({ request }: ActionFunctionArgs) {
	const resp: GetCurrentUser | undefined = queryClient.getQueryData(currentUserQuery({ request }).queryKey);
	const user = resp?.user ?? null;

	if (!user) {
		return redirect("/login");
	}

	const authService = new AuthService(request);
	const { error, headers } = await authService.logout();

	if (error) {
		throw new Response(error.message || "Failed to logout", { status: 400, headers });
	}

	await queryClient.invalidateQueries({ queryKey: ["current_user"] });
	queryClient.clear();

	return redirect("/login", { headers });
}

export default function LogoutRoute() {
	return null;
}
