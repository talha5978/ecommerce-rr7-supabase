import type { ApiError } from "@ecom/shared/utils/ApiError";
import type { AdminUser, FullUser } from "~/types/user";
import { type Session } from "@supabase/supabase-js";

export type GetCurrentUser = {
	user: AdminUser | null;
	error: ApiError | null;
};

export type GetFullCurrentUser = {
	user: FullUser | null;
	error: ApiError | null;
};

export type GetSession = {
	session: Session | null;
	error: ApiError | null;
};

export type Login = {
	error: ApiError | null;
	headers: Headers;
};

export type VerifyOtp = {
	user: User | null;
	session: Session | null;
	error: ApiError | null;
	headers: Headers;
};

export type Logout = {
	error: ApiError | null;
	headers: Headers;
};
