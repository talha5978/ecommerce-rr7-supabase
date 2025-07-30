import { createServerClient, parseCookieHeader, serializeCookieHeader } from "@supabase/ssr";
import { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "~/types/supabase";

function createSupabaseServerClient(request: Request) {
	const headers = new Headers();

	const supabase: SupabaseClient<Database> = createServerClient(
		process.env.VITE_SUPABASE_URL!,
		process.env.VITE_SUPABASE_ANON_KEY!,
		{
			cookies: {
				getAll() {
					const cookies = parseCookieHeader(request.headers.get("Cookie") ?? "");
					return cookies.map((cookie) => ({ name: cookie.name, value: cookie.value ?? "" }));
				},
				setAll(cookiesToSet) {
					cookiesToSet.forEach(({ name, value, options }) =>
						headers.append("Set-Cookie", serializeCookieHeader(name, value, options)),
					);
				},
			},
		},
	);

	return { supabase, headers };
}

export { createSupabaseServerClient };
