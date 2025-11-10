import { Service } from "@ecom/shared/services/service";
import { UseClassMiddleware } from "@ecom/shared/decorators/useClassMiddleware";
import { loggerMiddleware } from "@ecom/shared/middlewares/logger.middleware";
import { verifyUser } from "@ecom/shared/middlewares/auth.middleware";
import { asServiceMiddleware } from "@ecom/shared/middlewares/utils";
import { ApiError } from "@ecom/shared/utils/ApiError";
import { UseMiddleware } from "@ecom/shared/decorators/useMiddleware";
import type { PlaceOrderServicePayload } from "@ecom/shared/types/orders";
import { type Database } from "@ecom/shared/types/supabase";

@UseClassMiddleware(loggerMiddleware)
export class FP_PaymentsService extends Service {
	/** Create pending payment entry (with Wise integration for bank_transfer) */
	@UseMiddleware(asServiceMiddleware<FP_PaymentsService>(verifyUser))
	async insertInitialPaymentEntry({
		order_id,
		amount,
		method,
		status = "pending",
		payment_intent_id,
	}: {
		order_id: string;
		amount: number;
		method: PlaceOrderServicePayload["payment_method"];
		status?: Database["public"]["Enums"]["payment_status"];
		payment_intent_id?: string;
	}): Promise<{ error: ApiError | null }> {
		try {
			const { error: dbError } = await this.supabase.from(this.PAYMENTS_TABLE).insert({
				amount,
				currency: this.payment_currency,
				method,
				order_id,
				status,
				transaction_id: payment_intent_id,
			});

			return {
				error: dbError
					? new ApiError(dbError.message, Number(dbError.code), [dbError.details])
					: null,
			};
		} catch (error: any) {
			return {
				error:
					error instanceof ApiError
						? error
						: new ApiError("Failed to insert initial payment entry", 500, [error.message]),
			};
		}
	}
}
