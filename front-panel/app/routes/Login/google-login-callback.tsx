import { type LoaderFunctionArgs, redirect } from "react-router";
import { queryClient } from "@ecom/shared/lib/query-client/queryClient";
import { AuthService } from "@ecom/shared/services/auth.service";
import { genAuthSecurity } from "@ecom/shared/lib/auth-utils.server";
import { Loader2 } from "lucide-react";

export const loader = async ({ request }: LoaderFunctionArgs) => {
	const authSvc = new AuthService(request);
	const requestUrl = new URL(request.url);
	const code = requestUrl.searchParams.get("code");

	if (!code) {
		return redirect(`/login?error=${encodeURIComponent("Failed to exchange OAuth code")}`);
	}

	const { error: exchangeError, headers: exchangeHeaders } = await authSvc.exchangeCodeForSession({ code });

	if (exchangeError) {
		console.error("OAuth code exchange error:", exchangeError);
		return redirect(
			`/login?error=${encodeURIComponent(exchangeError.message || "Failed to exchange OAuth code")}`,
			{ headers: exchangeHeaders },
		);
	}

	// console.log("Session after exchange:", data?.session?.expires_in); // Debug: Check session

	// console.log("Extracted authId:", authId); // Debug: Check authId
	// if (!authId && data?.session?.user?.id) {
	// 	console.warn("extractAuthId returned null, using data?.session?.user.id as fallback");
	// 	authId = data?.session?.user.id;
	// }

	// if (authId) {
	// 	const { user, error: userError } = await queryClient.fetchQuery(
	// 		currentFullUserQuery({ request, authId, headers }), // Pass headers for session propagation
	// 	);
	// 	console.log("User from currentFullUserQuery:", user); // Debug: Check user
	// 	if (userError || !user) {
	// 		console.error("User error in /auth/callback:", userError);
	// 		return redirect(`/login?error=${encodeURIComponent(userError?.message || "User not found")}`, {
	// 			headers,
	// 		});
	// 	}
	// } else {
	// 	console.error("No authId found in /auth/callback");
	// 	return redirect("/login?error=No%20user%20ID%20found", { headers });
	// }

	let { authId } = genAuthSecurity(request);
	await queryClient.invalidateQueries({ queryKey: ["full_current_user", authId] });

	return redirect("/", { headers: exchangeHeaders });
};

export default function AuthCallback() {
	return (
		<div className="flex items-center justify-center min-h-screen">
			<Loader2 className="h-8 w-8 animate-spin" />
		</div>
	);
}
