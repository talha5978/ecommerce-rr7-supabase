import { type ActionFunctionArgs } from "react-router";
import { ApiError } from "@ecom/shared/utils/ApiError";
import { queryClient } from "@ecom/shared/lib/query-client/queryClient";
import { CouponsService } from "@ecom/shared/services/coupons.service";

export const action = async ({ request, params }: ActionFunctionArgs) => {
	try {
		const ID = (params.couponId as string) || "";
		if (!ID || ID == "") {
			return {
				success: false,
				error: "Invalid data",
			};
		}

		const formData = await request.formData();

		const start_timestamp = formData.get("start_timestamp") as string;
		const end_timestamp = formData.get("end_timestamp") as string;
		const coupon_id = formData.get("coupon_id");

		console.log("data in action func", start_timestamp, end_timestamp, coupon_id);
		const svc = new CouponsService(request);
		await svc.updateCouponTimeSlots({
			coupon_id: Number(coupon_id),
			input: {
				end_timestamp: end_timestamp,
				start_timestamp: start_timestamp,
			},
		});

		await queryClient.invalidateQueries({ queryKey: ["high_lvl_coupons"] });
		await queryClient.invalidateQueries({ queryKey: ["single_coupon", Number(coupon_id)] });

		return { success: true };
	} catch (error: any) {
		const errorMessage =
			error instanceof ApiError ? error.message : error.message || "Failed to update coupon time slots";

		return {
			success: false,
			error: errorMessage,
		};
	}
};
