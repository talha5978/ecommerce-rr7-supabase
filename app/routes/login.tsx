import { Loader2 } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { ActionFunctionArgs, Link, LoaderFunctionArgs, redirect, useActionData, useNavigate, useNavigation } from "react-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "~/components/ui/form";
import { toast } from "sonner";
import { useEffect } from "react";
import { Form as RouterForm } from "react-router";
import { type LoginFormData, loginSchema } from "~/schemas/login.schema";
import { ApiError } from "~/utils/ApiError";
import type { ActionResponse } from "~/types/action-data";
import { queryClient } from "~/lib/queryClient";
import { currentUserQuery } from "~/queries/auth.q";
import { AuthService } from "~/services/auth.service";

export async function action({ request }: ActionFunctionArgs) {
	try {
		const formData = await request.formData();
		const email = (formData.get("email") as string)?.trim();

		const parseResult = loginSchema.safeParse({ email });
		if (!parseResult.success) {
			const firstError = Object.values(parseResult.error.flatten().fieldErrors).flat()[0]!;
			return { error: firstError };
		}

		const authSvc = new AuthService(request);
		const { error, headers } = await authSvc.getCode({ email });	

		if (error) {
			return { error: error.message || "Failed to send code" };
		}

		return new Response(
			JSON.stringify({ success: true, email }),
			{
				status: 200,
				headers: {
					"Content-Type": "application/json",
					"Set-Cookie": headers.get("Set-Cookie") || "",
				},
			}
		);
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
	const { user } = await queryClient.fetchQuery(currentUserQuery({ request }));
	// console.log(user);
	
	if (user) {
		return redirect("/");
	}

	return null;
}

function Login() {
	const actionData: (ActionResponse & { email?: string }) | undefined = useActionData();
	
	const navigation = useNavigation();
	const navigate = useNavigate();

	const isSubmitting =
		navigation.state === "submitting" &&
		navigation.formMethod === "POST";

	const form = useForm<LoginFormData>({
		resolver: zodResolver(loginSchema),
		mode: "onChange",
	});

	useEffect(() => {
		if (actionData) {
			if (actionData.success && actionData.email) {
				toast.success("OTP sent successfully to your e-mail");
				navigate(`/login/otp?email=${encodeURIComponent(actionData.email)}&sent=true`, { replace: true });
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