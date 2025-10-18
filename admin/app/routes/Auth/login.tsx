import { Loader2 } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
	ActionFunctionArgs,
	Link,
	LoaderFunctionArgs,
	redirect,
	useActionData,
	useNavigate,
	useNavigation,
} from "react-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "~/components/ui/form";
import { toast } from "sonner";
import { useEffect } from "react";
import { Form as RouterForm } from "react-router";
import { AuthService } from "@ecom/shared/services/auth.service";
import { currentUserQuery } from "@ecom/shared/queries/auth.q";
import { type onlyEmailLoginFormData, onlyEmailLoginSchema } from "@ecom/shared/schemas/login.schema";
import { ApiError } from "@ecom/shared/utils/ApiError";
import { queryClient } from "@ecom/shared/lib/query-client/queryClient";
import type { ActionResponse } from "@ecom/shared/types/action-data";
import { extractAuthId } from "@ecom/shared/lib/auth-utils.server";

export async function action({ request }: ActionFunctionArgs) {
	try {
		const formData = await request.formData();
		const email = (formData.get("email") as string)?.trim();

		const parseResult = onlyEmailLoginSchema.safeParse({ email });
		if (!parseResult.success) {
			const firstError = Object.values(parseResult.error.flatten().fieldErrors).flat()[0]!;
			return { error: firstError };
		}

		const authSvc = new AuthService(request);
		const { error, headers } = await authSvc.getCode({ email });

		if (error) {
			return { error: error.message || "Failed to send code" };
		}

		return new Response(JSON.stringify({ success: true, email }), {
			status: 200,
			headers: {
				"Content-Type": "application/json",
				"Set-Cookie": headers.get("Set-Cookie") || "",
			},
		});
	} catch (error: any) {
		const errorMessage =
			error instanceof ApiError ? error.message : error.message || "Failed to send code";

		if (error instanceof ApiError && error.details.length) {
			console.error("ApiError details:", error.details);
		}
		return {
			success: false,
			error: errorMessage,
		};
	}
}

export async function loader({ request }: LoaderFunctionArgs) {
	const authId = extractAuthId(request);
	if (authId) {
		const resp = await queryClient.fetchQuery(currentUserQuery({ request, authId }));
		if (resp?.user?.id) return redirect("/");
	}
	return { user: null };
}

function Login() {
	const actionData: (ActionResponse & { email?: string }) | undefined = useActionData();

	const navigation = useNavigation();
	const navigate = useNavigate();

	const isSubmitting = navigation.state === "submitting" && navigation.formMethod === "POST";

	const form = useForm<onlyEmailLoginFormData>({
		resolver: zodResolver(onlyEmailLoginSchema),
		mode: "onChange",
	});

	useEffect(() => {
		if (actionData) {
			if (actionData.success && actionData.email) {
				toast.success("OTP sent successfully to your e-mail");
				navigate(`/login/otp?email=${encodeURIComponent(actionData.email)}&sent=true`, {
					replace: true,
				});
			} else if (actionData.error) {
				toast.error(actionData.error);
			}
		}
	}, [actionData]);

	return (
		<section className="flex w-full h-svh items-center py-4 px-4">
			<div className="flex flex-col gap-6 max-w-md mx-auto">
				<div>
					<h2 className="text-2xl font-bold mx-auto w-fit mb-1">Login</h2>
				</div>
				<Form {...form}>
					<RouterForm method="POST" className="space-y-4" action="/login">
						<FormField
							control={form.control}
							name="email"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Email</FormLabel>
									<FormControl>
										<Input placeholder="admin@example.com" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<Button type="submit" className="w-full" disabled={isSubmitting}>
							{isSubmitting && <Loader2 className="animate-spin" />}
							<span>Get Code</span>
						</Button>
					</RouterForm>
				</Form>
				<div>
					<p className="text-center text-sm text-muted-foreground">
						By clicking “Get Code,” you agree to our{" "}
						<Link to="#" className="underline" prefetch="viewport" viewTransition>
							Terms of Service
						</Link>{" "}
						and{" "}
						<Link to="#" className="underline" prefetch="viewport" viewTransition>
							Privacy Policy
						</Link>
						.
					</p>
				</div>
			</div>
		</section>
	);
}

export default Login;
