import { ApiError } from "@ecom/shared/utils/ApiError";
import type { GetCurrentUser, GetSession, Login, Logout, VerifyOtp } from "@ecom/shared/types/auth.d";
import type { AdminUser } from "@ecom/shared/types/user.d";
import { loggerMiddleware } from "@ecom/shared/middlewares/logger.middleware";
import { UseClassMiddleware } from "@ecom/shared/decorators/useClassMiddleware";
import { Service } from "@ecom/shared/services/service";

@UseClassMiddleware(loggerMiddleware)
export class AuthService extends Service {
	async getCurrentUser(): Promise<GetCurrentUser> {
		try {
			const {
				data: { user: authUser },
				error: authUserErr,
			} = await this.supabase.auth.getUser();
			// console.log("Auth user: ", authUser);

			let error: null | ApiError = null;
			if (authUserErr || authUser == null) {
				error = new ApiError(authUserErr?.message || "User not found", 401, []);
				return { user: null, error };
			}

			// console.log("Reached here 😀😀😀", authUser.id);

			const { data: userDetails, error: userDetailsErr } = await this.supabase
				.from(this.USERS_TABLE)
				.select(
					`
					user_id,
					first_name,
					last_name,
					phone_number,
					role,
					${this.USER_ROLES_TABLE}(id, role_name)
				`,
				)
				.eq("user_id", authUser.id)
				.eq("status", true)
				.single();

			// console.log("Reached at next level 😀😀😀", userDetails ?? "NOT FOUND 🌋");

			if (userDetailsErr || userDetails == null) {
				error = new ApiError(userDetailsErr?.message || "User not found", 401, []);
				return { user: null, error };
			}

			const appUser: AdminUser = {
				id: authUser.id ?? userDetails.user_id,
				email: authUser.email ?? "",
				is_email_verified: authUser.user_metadata.email_verified ?? true,
				createdAt: authUser.created_at,
				first_name: userDetails.first_name ?? null,
				last_name: userDetails.last_name ?? null,
				phone_number: userDetails.phone_number ?? null,
				role: {
					role_id: userDetails.user_roles.id,
					role_name: userDetails.user_roles.role_name,
				},
			};

			return { user: appUser, error };
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

	async getSession(): Promise<GetSession> {
		try {
			const {
				data: { session },
				error: sessionErr,
			} = await this.supabase.auth.getSession();
			// console.log("Auth user: ", authUser);

			let error: null | ApiError = null;
			if (sessionErr || session == null) {
				error = new ApiError(sessionErr?.message || "Session not found", 401, []);
				return { session: null, error };
			}

			return { session, error };
		} catch (err: any) {
			if (err instanceof ApiError) {
				return { session: null, error: err };
			}
			return {
				session: null,
				error: new ApiError("Unknown error", 500, [err]),
			};
		}
	}

	async getCode({ email }: { email: string }): Promise<Login> {
		try {
			const { error: fetchError } = await this.supabase.auth.signInWithOtp({
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
				headers: this.headers,
			};
		}
	}

	async verifyOtp({ email, token }: { email: string; token: string }): Promise<VerifyOtp> {
		try {
			const {
				error: fetchError,
				data: { user, session },
			} = await this.supabase.auth.verifyOtp({
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
			// console.log(this.headers);

			return { error, user, session, headers: this.headers };
		} catch (err: any) {
			if (err instanceof ApiError) {
				return { error: err, user: null, session: null, headers: this.headers };
			}
			return {
				user: null,
				session: null,
				error: new ApiError("Unknown error", 500, [err]),
				headers: this.headers,
			};
		}
	}

	async logout(): Promise<Logout> {
		try {
			// Signout the user for this session only
			const { error: logoutErrr } = await this.supabase.auth.signOut({ scope: "local" });

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
				headers: this.headers,
			};
		}
	}
}
