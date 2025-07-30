import { createServerClient, parseCookieHeader, serializeCookieHeader } from "@supabase/ssr";
import { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "~/types/supabase";

function createSupabaseServerClient(request: Request) {
	const headers = new Headers();

	/* In production max cookie age is 1 day but in dev. it is 1 year */
	const maxCookieAge = 60 * 60 * 24 * (process.env.VITE_ENV === "production" ? 1 : 365);

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
						headers.append(
							"Set-Cookie",
							serializeCookieHeader(name, value, {
								...options,
								httpOnly: true,
								maxAge: maxCookieAge,
								secure:
									process.env.VITE_ENV != null
										? process.env.VITE_ENV === "production"
										: false,
								sameSite: "lax",
								path: "/",
							}),
						),
					);
				},
			},
		},
	);

	return { supabase, headers };
}

export { createSupabaseServerClient };
