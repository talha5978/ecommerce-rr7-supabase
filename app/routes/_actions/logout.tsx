import type { ActionFunctionArgs } from "react-router";
import { redirect } from "react-router";
import { queryClient } from "~/lib/queryClient";
import { currentUserQuery } from "~/queries/auth.q";
import { AuthService } from "~/services/auth.service";

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

	return redirect("/", { headers });
}

export default function LogoutRoute() {
	return null;
}
