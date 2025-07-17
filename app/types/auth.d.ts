import type { ApiError } from "~/utils/ApiError";

export type GetCurrentUser = {
    user: User | null;
    error: ApiError | null
};

export type Login = {
    error: ApiError | null;
    headers: Headers
}

export type VerifyOtp = {
    user: User | null;
    session: Session | null;
    error: ApiError | null;
    headers: Headers
}

export type Logout = {
    error: ApiError | null;
    headers: Headers
}