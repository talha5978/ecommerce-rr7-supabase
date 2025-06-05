import { Loader2 } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { ActionFunctionArgs, Link, LoaderFunctionArgs, redirect, useActionData, useNavigate, useNavigation } from "react-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "~/components/ui/form";
import { toast } from "sonner";
import React, { useEffect } from "react";
import { createSupabaseServerClient } from "~/lib/supabase.server";
import { Form as RouterForm } from "react-router";

export async function loader({ request: _ }: LoaderFunctionArgs) {
	return null;
}

const loginSchema = z.object({
	email: z.string({ required_error: "Email is required" }).email(),
});

type LoginFormData = z.infer<typeof loginSchema>;

export async function action({ request }: ActionFunctionArgs) {
	const formData = await request.formData();
	const email = (formData.get("email") as string)?.trim();

	const parseResult = loginSchema.safeParse({ email });
	if (!parseResult.success) {
		const firstError = Object.values(parseResult.error.flatten().fieldErrors).flat()[0]!;
		return { error: firstError };
	}

	const { supabase, headers } = createSupabaseServerClient(request);

	// Attempt to send OTP
	const { error } = await supabase.auth.signInWithOtp({
		email,
		options: { shouldCreateUser: false },
	});

	if (error) {
		return { error: error.message || "Failed to send code" };
	}

	// On success: redirect to /login/otp with email and a flag so OtpPage can toast
	return redirect(`/login/otp?email=${encodeURIComponent(email)}&sent=true`, { headers });
}

function Login() {
	const actionData = useActionData<{ error: string }>();

	const navigation = useNavigation();
	const isSubmitting =
		navigation.state === "submitting" &&
		navigation.formMethod === "POST";
	
	// React Hook Form setup
	const form = useForm<LoginFormData>({
		resolver: zodResolver(loginSchema),
		mode: "onTouched",
	});

	// If actionData.error changes, show a toast
	useEffect(() => {
		if (actionData?.error) {
			toast.error(actionData.error);
		} else if (actionData == undefined) {
			toast.success("OTP sent successfully");
		}
		console.log(actionData);
		
	}, [actionData]);

	return (
		<section className="flex w-full h-svh items-center py-4 px-4">
			<div className="flex flex-col gap-6 max-w-md mx-auto">
				<div>
					<h2 className="text-2xl font-bold mx-auto w-fit mb-1">Login</h2>
				</div>
				<Form {...form}>
					<RouterForm method="POST" className="space-y-4" noValidate>
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
						<Link to="#" className="underline" prefetch="viewport">
							Terms of Service
						</Link>{" "}
						and{" "}
						<Link to="#" className="underline" prefetch="viewport">
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