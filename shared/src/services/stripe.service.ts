import { ApiError } from "@ecom/shared/utils/ApiError";
import Stripe from "stripe";
import { PAYMENT_CURRENCY } from "@ecom/shared/constants/constants";

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

	// TODO: Add webhook for production use
	/** Handle webhook events (Stripe-specific verification and parsing; call from webhook route) */
	async handleWebhookEvent({
		payload,
		signature,
	}: {
		payload: string | Buffer;
		signature: string;
	}): Promise<{ event: Stripe.Event | null; error: ApiError | null }> {
		try {
			const event = this.stripe.webhooks.constructEvent(
				payload,
				signature,
				process.env.VITE_STRIPE_WEBHOOK_SECRET!,
			);

			return { event, error: null };
		} catch (err: any) {
			return {
				event: null,
				error:
					err instanceof ApiError
						? err
						: new ApiError("Webhook verification failed", 400, [err.message]),
			};
		}
	}
}
