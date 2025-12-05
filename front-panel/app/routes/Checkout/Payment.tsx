import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { useLoaderData, useNavigate, useNavigation, type LoaderFunctionArgs } from "react-router";
import { Button } from "~/components/ui/button";
import { toast } from "sonner";
import { memo, Suspense, useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~/components/ui/dialog";
import { Skeleton } from "~/components/ui/skeleton";
import { Loader2 } from "lucide-react";
import { StripeService } from "@ecom/shared/services/stripe.service";

const stripePromise = loadStripe(process.env.VITE_STRIPE_PUBLISHABLE_KEY!);

export const loader = ({ request }: LoaderFunctionArgs) => {
	const url = new URL(request.url);
	const order_id = url.searchParams.get("order_id");
	const client_secret = url.searchParams.get("client_secret");

	if (!order_id || !client_secret) {
		throw new Response("Missing order_id or client_secret", { status: 400 });
	}

	return { order_id, client_secret };
};

function PaymentPage() {
	const { client_secret: _, order_id } = useLoaderData<typeof loader>();
	const stripe = useStripe();
	const elements = useElements();
	const navigate = useNavigate();
	const [thankYouOpen, setThankYouOpen] = useState(false);
	const [isSubmitting, setSubmittion] = useState(false);

	useEffect(() => {
		if (!stripe) {
			console.log("Stripe.js not loaded yet...");
		} else {
			console.log("Stripe.js loaded!", stripe);
		}
	}, [stripe]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!stripe || !elements) {
			toast.error("Stripe not loaded");
			return;
		}

		setSubmittion(true);

		const stripeSvc = new StripeService();
		const error = await stripeSvc.confirmPayment({
			elements,
			return_url: window.location.origin,
			stripe_instance: stripe,
		});

		setSubmittion(false);

		if (error) {
			toast.error(error.message ?? "Payment failed");
			return;
		}

		toast.success("Payment successful! Order placed successfully.");

		setThankYouOpen(true);
		navigate("/");
	};

	return (
		<>
			<div className="max-w-md mx-auto mt-20 p-8 bg-secondary rounded-xl shadow-md">
				<h1 className="text-2xl font-bold text-center mb-2">Complete Payment</h1>
				<p className="text-center text-muted-foreground mb-8">Order ID: {order_id}</p>
				<form onSubmit={handleSubmit} className="flex flex-col gap-4">
					<div className="p-4 rounded-md border border-muted-foreground/10">
						<Suspense fallback={<Skeleton className="w-full h-20" />}>
							<PaymentElement />
						</Suspense>
					</div>

					<Button type="submit" className="w-full" disabled={!stripe || !elements || isSubmitting}>
						{isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
						{!stripe ? "Loading Stripe..." : "Pay Now"}
					</Button>
				</form>

				<p className="text-xs text-center text-muted-foreground mt-6">
					Test card: <code className="bg-gray-200 px-2 py-1 rounded">4242 4242 4242 4242</code>
				</p>
			</div>
			<ThankYouDialog open={thankYouOpen} setOpen={() => setThankYouOpen(false)} />
		</>
	);
}

// This wrapper provides Elements context
export default function PaymentPageWrapper() {
	const { client_secret } = useLoaderData<typeof loader>();

	return (
		<Elements stripe={stripePromise} options={{ clientSecret: client_secret }}>
			<PaymentPage />
		</Elements>
	);
}

const ThankYouDialog = memo(({ open, setOpen }: { open: boolean; setOpen: (open: boolean) => void }) => {
	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogContent className="sm:max-w-[550px]" showCloseButton={true}>
				<DialogHeader>
					<DialogTitle>Thank you for your order! 🎉</DialogTitle>
				</DialogHeader>
				<div>
					<p>
						Your order has been successfully processed. We appreciate your business and look
						forward to serving you again in the future.
					</p>
					<p>
						If you have any questions or concerns, please don't hesitate to contact us at{" "}
						<a href="mailto:support@example.com">support@example.com</a>.
					</p>
					<p>We hope you enjoy your purchase!</p>
				</div>
			</DialogContent>
		</Dialog>
	);
});
