import { useEffect } from "react";
import { Button } from "~/components/ui/button";
import { toast } from "sonner";
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from "~/components/ui/input-otp";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Mail } from "lucide-react";
import {
	ActionFunctionArgs,
	Link,
	LoaderFunctionArgs,
	redirect,
	useActionData,
	useNavigate,
	useNavigation,
	useSearchParams,
	useSubmit,
} from "react-router";
import { Form, FormControl, FormField, FormItem, FormMessage } from "~/components/ui/form";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { AuthService } from "@ecom/shared/services/auth.service";
import { currentUserQuery } from "@ecom/shared/queries/auth.q";
import { ApiError } from "@ecom/shared/utils/ApiError";
import { queryClient } from "@ecom/shared/lib/query-client/queryClient";
import type { ActionResponse } from "@ecom/shared/types/action-data";
import { type OtpFormData, OtpSchema } from "@ecom/shared/schemas/otp.schema";

export async function action({ request }: ActionFunctionArgs) {
	try {
		const formData = await request.formData();
		const email = formData.get("email") as string;
		const token = formData.get("token") as string;

		const parseResult = OtpSchema.safeParse({ email, token });

		if (!parseResult.success) {
			return new Response(
				JSON.stringify({ validationErrors: parseResult.error.flatten().fieldErrors }),
				{
					status: 400,
					headers: { "Content-Type": "application/json" },
				},
			);
		}

		const authSvc = new AuthService(request);
		const { error: tokenError, headers } = await authSvc.verifyOtp({ email, token });
		console.log(headers);

		if (tokenError) {
			return { success: false, error: tokenError.message || "Failed to login" };
		}

		console.log("ERROR 🌋🌋🌋🌋🌋🌋🌋🌋🌋🌋🌋🌋", tokenError);
		await queryClient.invalidateQueries({ queryKey: ["current_user"] });

		const { user, error: userErr } = await authSvc.getCurrentUser();

		if (userErr || !user) {
			console.error("Failed to fetch user after OTP verification:", userErr);
			return { success: false, error: "Failed to fetch user session" };
		}

		return new Response(JSON.stringify({ success: true }), {
			status: 200,
			headers: {
				"Content-Type": "application/json",
				"Set-Cookie": headers.get("Set-Cookie") || "",
			},
		});
	} catch (error: any) {
		const errorMessage = error instanceof ApiError ? error.message : error.message || "Failed to login";

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
	const resp = queryClient.getQueryData(currentUserQuery({ request }).queryKey);
	const user = resp?.user ?? null;

	if (user) {
		return redirect("/");
	}

	return null;
}

export default function OtpPage() {
	const submit = useSubmit();
	const navigate = useNavigate();

	const [searchParams] = useSearchParams();
	const emailParam = searchParams.get("email") || "";

	const form = useForm<OtpFormData>({
		resolver: zodResolver(OtpSchema),
		defaultValues: {
			email: emailParam,
			token: "",
		},
	});

	const { control, handleSubmit, setError } = form;

	const actionData: ActionResponse = useActionData();

	useEffect(() => {
		if (actionData) {
			console.log(actionData);

			if (actionData.success) {
				toast.success("Logged in successfully");
				navigate(`/`, { replace: true });
			} else if (actionData.error) {
				toast.error(actionData.error);
				setError("token", { message: actionData.error });
			} else if (actionData.validationErrors) {
				toast.error("Invalid form data. Please check your inputs.");
				Object.entries(actionData.validationErrors).forEach(([field, errors]) => {
					setError(field as keyof OtpFormData, { message: errors[0] });
				});
			}
		}
	}, [actionData, navigate]);

	const navigation = useNavigation();
	const isVerifying = navigation.state === "submitting" && navigation.formMethod === "POST";

	const onCodeSubmit = (formData: OtpFormData) => {
		submit(
			{
				email: formData.email.trim(),
				token: formData.token.trim(),
			},
			{
				method: "POST",
				action: `/login/otp?email=${encodeURIComponent(formData.email)}&sent=true`,
			},
		);
	};

	return (
		<section className="flex w-full h-svh items-center py-4 px-4">
			<div className="flex flex-col gap-6 w-md mx-auto">
				<div>
					<h2 className="text-2xl font-bold mx-auto w-fit">Enter OTP</h2>
				</div>
				<div>
					<form className="space-y-4" onSubmit={handleSubmit(onCodeSubmit)}>
						<Form {...form}>
							<input type="hidden" name="email" value={emailParam} />
							<FormField
								control={control}
								name="token"
								render={({ field }) => (
									<FormItem>
										<FormControl>
											<InputOTP
												maxLength={6}
												value={field.value}
												onChange={field.onChange}
												name="token"
											>
												<InputOTPGroup className="w-full *:w-full">
													<InputOTPSlot index={0} />
													<InputOTPSlot index={1} />
													<InputOTPSlot index={2} />
												</InputOTPGroup>
												<InputOTPSeparator />
												<InputOTPGroup className="w-full *:w-full">
													<InputOTPSlot index={3} />
													<InputOTPSlot index={4} />
													<InputOTPSlot index={5} />
												</InputOTPGroup>
											</InputOTP>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<Button type="submit" className="w-full" disabled={isVerifying}>
								{isVerifying && <Loader2 className="animate-spin" />}
								<span>Verify OTP</span>
							</Button>
						</Form>
					</form>
				</div>
				<Alert variant="default" className="mb-4">
					<Mail className="h-4 w-4 text-primary" />
					<AlertTitle>Note</AlertTitle>
					<AlertDescription>
						<p>
							Please enter the code that was sent to{" "}
							<a href={`mailto:${emailParam}`}>
								<b className="hover:underline">{emailParam}</b>
							</a>
						</p>
					</AlertDescription>
				</Alert>
				<div className="*:text-center *:text-sm *:text-muted-foreground flex gap-2 flex-wrap justify-center">
					<p>Didn’t receive a code?</p>
					<Link to="/login" className="hover:underline" prefetch="viewport" viewTransition>
						Request again
					</Link>
				</div>
			</div>
		</section>
	);
}
