import { ApiError } from "@ecom/shared/utils/ApiError";
import { ActionFunctionArgs } from "react-router";
import { queryClient } from "@ecom/shared/lib/query-client/queryClient";
import { CouponsService } from "@ecom/shared/services/coupons.service";

export const action = async ({ request, params }: ActionFunctionArgs) => {
	const couponId = (params.couponId as string) || "";
	if (!couponId || couponId == "") {
		return {
			success: false,
			error: "Coupon ID is required",
		};
	}

	try {
		const couponsSvc = new CouponsService(request);
		await couponsSvc.deleteFullCoupon({ coupon_id: Number(couponId) });

		await queryClient.invalidateQueries({ queryKey: ["high_lvl_coupons"] });
		await queryClient.invalidateQueries({ queryKey: ["single_coupon", Number(couponId)] });
		await queryClient.invalidateQueries({ queryKey: ["fp_all_coupons"] });

		return { success: true };
	} catch (error: any) {
		const errorMessage =
			error instanceof ApiError ? error.message : error.message || "Failed to delete coupon";

		return {
			success: false,
			error: errorMessage,
		};
	}
};
