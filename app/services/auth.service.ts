import type { Database } from "~/types/supabase";
import { createSupabaseServerClient } from "~/lib/supabase.server";
import { SupabaseClient } from "@supabase/supabase-js";
import { ApiError } from "~/utils/ApiError";
import type { GetCurrentUser, Login, Logout, VerifyOtp } from "~/types/auth";

export class AuthService {
	private supabase: SupabaseClient<Database>;
	readonly headers: Headers;

	constructor(request: Request) {
		const { supabase, headers } = createSupabaseServerClient(request);
		this.supabase = supabase;
		this.headers = headers;
	}

	async getCurrentUser(): Promise<GetCurrentUser> {
		try {
			const {
				data: { user }, error: fetchError
			} = await this.supabase.auth.getUser();

			let error: null | ApiError = null;
			if (fetchError) {
				error = new ApiError(fetchError.message, 500, []);
			}

			return { user, error };
		} catch (err: any) {
			if (err instanceof ApiError) {
				return { user: null, error: err };
			}
			return {
				user: null,
				error: new ApiError("Unknown error", 500, [err]),
			};
		}
	}

	async getCode({ email }: { email: string }): Promise<Login> {
		try {
			const { error: fetchError } = await this.supabase
				.auth.signInWithOtp({
					email,
					options: { shouldCreateUser: false },
				});

			// data and session if destructrud from here will be null because it is magic link login

			let error: null | ApiError = null;
			if (fetchError) {
				error = new ApiError(fetchError.message, 500, []);
			}

			return { error, headers: this.headers };
		} catch (err: any) {
			if (err instanceof ApiError) {
				return { error: err, headers: this.headers };
			}
			return {
				error: new ApiError("Unknown error", 500, [err]),
				headers: this.headers
			};
		}
	}

	async verifyOtp({ email, token }: { email: string, token: string }): Promise<VerifyOtp> {
		try {
			const { error: fetchError, data: { user, session } } = await this.supabase
				.auth.verifyOtp({
					email,
					token,
					type: "email",
				});

			console.log(user, session, fetchError);
			
			// data and session if destructrud from here will be null because it is magic link login

			let error: null | ApiError = null;
			if (fetchError) {
				error = new ApiError(fetchError.message, Number(fetchError.code) || 500, []);
			}
			console.log(this.headers);
			
			return { error, user, session, headers: this.headers };
		} catch (err: any) {
			if (err instanceof ApiError) {
				return { error: err, user: null, session: null, headers: this.headers };
			}
			return {
				user: null,
				session: null,
				error: new ApiError("Unknown error", 500, [err]),
				headers: this.headers
			};
		}
	}

	async logout(): Promise<Logout> {
		try {
			const { error: logoutErrr } = await this.supabase.auth.signOut();

			let error: null | ApiError = null;
			if (logoutErrr) {
				error = new ApiError(logoutErrr.message, 500, []);
			}
			
			return { error, headers: this.headers };
		} catch (err: any) {
			if (err instanceof ApiError) {
				return { error: err, headers: this.headers };
			}
			return {
				error: new ApiError("Unknown error", 500, [err]),
				headers: this.headers
			};
		}
	}
}
