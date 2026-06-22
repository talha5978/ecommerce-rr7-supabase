import { createServerClient, parseCookieHeader, serializeCookieHeader } from "@supabase/ssr";
import { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@ecom/shared/types/supabase";
import { config as dotenvConfig } from "dotenv";
import path from "path";

const __dirname = path.dirname(new URL(import.meta.url).pathname);
dotenvConfig({ path: path.resolve(__dirname, "../../../../.env") });

function createSupabaseServerClient(request: Request) {
	//	console.log(process.env.VITE_SUPABASE_URL, "\n", process.env.SUPABASE_SERVICE_ROLE__KEY);
	if (!process.env.VITE_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE__KEY) {
		throw new Error("Missing Supabase environment variables");
	}

	const headers = new Headers();

	/* In production max cookie age is 1 day but in dev. it is 1 year */
	const maxCookieAge = 60 * 60 * 24 * (process.env.VITE_ENV === "production" ? 1 : 365);

	// @ts-ignore
	const supabase: SupabaseClient<Database> = createServerClient(
		process.env.VITE_SUPABASE_URL!,
		process.env.SUPABASE_SERVICE_ROLE__KEY!,
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
			global: {
				headers: {
					Cookie: request.headers.get("Cookie") || "",
				},
			},
		},
	);

	return { supabase, headers };
}

export { createSupabaseServerClient };
