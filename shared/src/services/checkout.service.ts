import { Service } from "@ecom/shared/services/service";
import { FP_OrdersService } from "@ecom/shared/services/orders.service";
import { StripeService } from "@ecom/shared/services/stripe.service";
import { FP_PaymentsService } from "@ecom/shared/services/payments.service";
import { ApiError } from "@ecom/shared/utils/ApiError";
import type { PlaceOrderServicePayload } from "@ecom/shared/types/orders";
import { UseClassMiddleware } from "@ecom/shared/decorators/useClassMiddleware";
import { loggerMiddleware } from "@ecom/shared/middlewares/logger.middleware";
import { asServiceMiddleware } from "@ecom/shared/middlewares/utils";
import { verifyUser } from "@ecom/shared/middlewares/auth.middleware";
import { FP_ProductVariantsService } from "./product-variants.service";

@UseClassMiddleware(loggerMiddleware, asServiceMiddleware<CheckoutService>(verifyUser))
export class CheckoutService extends Service {
	/** Function to be used in the confirm checkout action function */
	async confirmCheckout(payload: PlaceOrderServicePayload) {
		let order_id: string | null = null;
		let clientSecret: string | null = null;
		let paymentIntentId: string | null = null;

		try {
			const order_svc = await this.createSubService(FP_OrdersService);
			try {
				const { order_id: svc_order_id } = await order_svc.placeInitialOrder({
					// @ts-ignore
					billing_address: payload.billing_address === "" ? undefined : payload.billing_address,
					...payload,
				});

				order_id = svc_order_id;
			} catch (error: any) {
				return {
					success: false,
					clientSecret: null,
					order_id,
					error:
						error instanceof ApiError ? error.message : error.message || "Failed to place order",
				};
			}

			if (order_id == null) {
				return {
					success: false,
					clientSecret: null,
					order_id,
					error: new ApiError("Failed to place order", 500, []),
				};
			}

			if (payload.payment_method == "online") {
				const stripe_svc = new StripeService();
				const {
					clientSecret: svc_clientSecret,
					error: paymentIntent_err,
					paymentIntentId: svc_paymentIntentId,
				} = await stripe_svc.createPaymentIntent({
					orderId: order_id,
					amount: Number(payload.cart_summary.total),
				});

				clientSecret = svc_clientSecret;
				paymentIntentId = svc_paymentIntentId;

				if (paymentIntent_err != null) {
					await order_svc.deleteOrderEntry(order_id);

					return {
						success: false,
						clientSecret,
						order_id,
						error:
							paymentIntent_err instanceof ApiError
								? paymentIntent_err.message
								: "Failed to initiate payment process",
					};
				}
			}

			const payment_svc = await this.createSubService(FP_PaymentsService);
			const payment_res = await payment_svc.insertInitialPaymentEntry({
				order_id,
				amount: Number(payload.cart_summary.total),
				method: payload.payment_method,
				payment_intent_id: paymentIntentId ?? undefined,
				status: "pending",
			});

			if (payment_res.error != null) {
				await order_svc.deleteOrderEntry(order_id);

				return {
					success: false,
					clientSecret,
					order_id,
					error: payment_res.error,
				};
			}

			const variants_data = payload.cart_items.flatMap((item) => ({
				variant_id: item.variant_id,
				stock: item.quantity,
			}));

			try {
				const variant_svc = await this.createSubService(FP_ProductVariantsService);
				await variant_svc.updateProductVaraintStock(variants_data);
			} catch (error) {
				await order_svc.deleteOrderEntry(order_id);
				await payment_svc.deletePaymentEntry(order_id);

				if (error instanceof ApiError) {
					return {
						success: false,
						clientSecret,
						order_id,
						error: error.message,
					};
				}
			}

			return { success: true, clientSecret, order_id, error: null };
		} catch (error: any) {
			return {
				success: false,
				clientSecret,
				order_id,
				error: error instanceof ApiError ? error.message : error.message || "Failed to place order",
			};
		}
	}
}
