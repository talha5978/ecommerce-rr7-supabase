import { ApiError } from "@ecom/shared/utils/ApiError";
import Stripe from "stripe";
import { PAYMENT_CURRENCY } from "@ecom/shared/constants/constants";
import { StripeElements, Stripe as StripeInstance } from "@stripe/stripe-js";

export class StripeService {
	private stripe: Stripe;
	payment_currency: string;

	constructor() {
		this.stripe = new Stripe(process.env.VITE_STRIPE_SECRET_KEY!);
		this.payment_currency = PAYMENT_CURRENCY;
	}

	/** Create PaymentIntent (Stripe-specific; call from action) */
	async createPaymentIntent({
		amount,
		orderId,
	}: {
		orderId: string;
		amount: number;
	}): Promise<{ clientSecret: string | null; paymentIntentId: string | null; error: ApiError | null }> {
		try {
			const paymentIntent = await this.stripe.paymentIntents.create({
				amount: Math.round(amount * 100),
				currency: this.payment_currency,
				metadata: { orderId },
				automatic_payment_methods: { enabled: true },
			});

			return {
				clientSecret: paymentIntent.client_secret,
				paymentIntentId: paymentIntent.id,
				error: null,
			};
		} catch (err: any) {
			return {
				clientSecret: null,
				paymentIntentId: null,
				error:
					err instanceof ApiError
						? err
						: new ApiError("Failed to create PaymentIntent", 500, [err.message]),
			};
		}
	}

	/** Confirms payment on the Payment page of stripe */
	async confirmPayment({
		elements,
		return_url,
		stripe_instance,
	}: {
		elements: StripeElements;
		return_url: string;
		stripe_instance: StripeInstance;
	}) {
		const { error } = await stripe_instance.confirmPayment({
			elements,
			confirmParams: {
				return_url: return_url,
			},
		});

		return error;
	}
}
