import { useEffect } from "react";
import { Button } from "~/components/ui/button";
import { createSupabaseServerClient } from "~/lib/supabase.server";
import { toast } from "sonner";
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from "~/components/ui/input-otp";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { ActionFunctionArgs, Form as AuthForm, Link, redirect, useActionData, useNavigation, useSearchParams, useSubmit } from "react-router";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "~/components/ui/form";
import { type OtpFormData, OtpSchema } from "~/schemas/otp.schema";

type OtpActionData = { error: string } | null;

export async function action({ request }: ActionFunctionArgs) {
	const formData = await request.formData();
	const email = formData.get("email") as string;
	const token = formData.get("token") as string;

	const parseResult = OtpSchema.safeParse({ email, token });

	if (!parseResult.success) {
		const firstError = Object.values(parseResult.error.flatten().fieldErrors).flat()[0]!;
        console.error(firstError);
		return { error: firstError };
	}

	const { supabase, headers } = createSupabaseServerClient(request);

	const {
		error,
		data: {session}
	} = await supabase.auth.verifyOtp({
		email,
		token,
		type: "email",
	});
	// console.log(session);
	
	if (error) {
		let _resp = error.message || "OTP verification failed";
        console.error(_resp);
        toast.error( _resp);
		return { error: _resp };
	}

	return redirect("/dashboard", { headers });
}

export default function OtpPage() {
	const [searchParams, setSearchParams] = useSearchParams();
	const emailParam = searchParams.get("email") || "";
	const sentParam = searchParams.get("sent") || "";

	useEffect(() => {
		if (!emailParam) {
			window.location.replace("/login");
		}
	}, [emailParam]);

    const form = useForm<OtpFormData>({
		resolver: zodResolver(OtpSchema),
		defaultValues: {
			email: emailParam,
		}
	});

	const { control } = form;

    const actionData = useActionData<OtpActionData>();

    useEffect(() => {
		if (sentParam === "true") {
			toast.success("OTP sent successfully to your e-mail");
			searchParams.delete("sent");
			setSearchParams(searchParams, { replace: true });
		}
    }, [actionData, sentParam]);

    const navigation = useNavigation();
    const isVerifying =
        navigation.state === "submitting" &&
        navigation.formAction === "/login/otp" &&
        navigation.formMethod === "POST";

	return (
		<section className="flex w-full h-svh items-center py-4 px-4">
			<div className="flex flex-col gap-6 w-md mx-auto">
				<div>
					<h2 className="text-2xl font-bold mx-auto w-fit">Enter OTP</h2>
				</div>
				<div>
					<Form {...form}>
						<AuthForm method="POST" action="/login/otp" className="space-y-4">
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
						</AuthForm>
					</Form>
				</div>
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
