import { type ActionFunctionArgs, redirect } from "react-router";
import { AuthService } from "@ecom/shared/services/auth.service";
import { ApiError } from "@ecom/shared/utils/ApiError";

export const action = async ({ request }: ActionFunctionArgs) => {
	try {
		const formData = await request.formData();
		const redirectToOrigin = formData.get("redirectToOrigin") as string | null;

		if (!redirectToOrigin) {
			return redirect(`/login?error=${encodeURIComponent("No redirect origin")}`);
		}

		const authSvc = new AuthService(request);
		const { error, headers, url } = await authSvc.loginWithGoogle({ redirectToOrigin });

		if (error || !url) {
			return redirect(
				`/login?error=${encodeURIComponent(error?.message || "Failed to perform Google login")}`,
			);
		}

		return redirect(url, { headers });
	} catch (error: any) {
		console.error("Error in /login/google action:", error);
		const errorMessage =
			error instanceof ApiError ? error.message : error.message || "Failed to initiate Google login";
		return redirect(`/login?error=${encodeURIComponent(errorMessage)}`);
	}
};

export default function GoogleLogin() {
	return null;
}
