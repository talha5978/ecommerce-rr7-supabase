import type { ActionFunctionArgs } from "react-router";
import { redirect } from "react-router";
import { createSupabaseServerClient } from "~/lib/supabase.server";
import { useGetCurrentUser } from "~/hooks/useGetCurrentUser";
import { clearCache } from "~/lib/cache";

export async function action({ request }: ActionFunctionArgs) {
	const { supabase, headers } = createSupabaseServerClient(request);
	const user = await useGetCurrentUser();
	
	if (!user) {
		return redirect("/login");
	}

	const { error } = await supabase.auth.signOut();

	if (error) {
		console.error(error);
		return { error: error.message };
	}
	
	clearCache();
	return redirect("/", { headers });
}

export default function LogoutRoute() {
	return null;
}