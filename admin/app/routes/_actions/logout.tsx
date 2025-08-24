import type { ActionFunctionArgs } from "react-router";
import { redirect } from "react-router";
import { queryClient } from "@ecom/shared/lib/query-client/queryClient";
import { AuthService } from "@ecom/shared/services/auth.service";
import { currentUserQuery } from "@ecom/shared/queries/auth.q";

export async function action({ request }: ActionFunctionArgs) {
	const { user } = await queryClient.fetchQuery(currentUserQuery({ request }));

	if (!user) {
		return redirect("/login");
	}

	const authService = new AuthService(request);
	const { error, headers } = await authService.logout();

	if (error) {
		return { error: error.message };
	}

	await queryClient.invalidateQueries({ queryKey: ["current_user"] });
	queryClient.clear();

	return redirect("/", { headers });
}

export default function LogoutRoute() {
	return null;
}
