import type { Database } from "@ecom/shared/types/supabase";
import { type ApiError } from "@ecom/shared/utils/ApiError";
import type { TypesToSelect } from "@ecom/shared/types/coupons-comp";

export type CouponType = Database["public"]["Enums"]["coupon_type_enum"];

export type DiscountType = Database["public"]["Enums"]["discount_type"];

export type DiscountCustomerGrps = Database["public"]["Enums"]["customer_type"];

export type HighLevelCoupon = {
	id: number;
	code: string;
	status: boolean;
	coupon_type: CouponType;
	start_timestamp: string;
	end_timestamp: string;
	created_at: string | null;
};

export type FullCoupon = HighLevelCoupon & {
	description: string | null;
	discount_type: DiscountType;
	discount_value: number;
	specific_products:
		| {
				id: string;
				sku: string;
				cover_image?: string;
		  }[]
		| null;
	customer_conditions: {
		customer_group: DiscountCustomerGrps | null;
		customer_emails: string[];
		min_purchased_amount: string | null;
	};
	usage_conditions: {
		max_total_uses: string | null;
		one_use_per_customer: boolean | null;
	};
};

export type GetFullCoupon = {
	coupon: FullCoupon | null;
	error: ApiError | null;
};

export type FP_GetAllCouponsDetailsResp = {
	coupons: FullCoupon[] | null;
	error: ApiError | null;
};

export type GetHighLevelCouponsResp = {
	coupons: HighLevelCoupon[] | null;
	total: number;
	error: ApiError | null;
};
