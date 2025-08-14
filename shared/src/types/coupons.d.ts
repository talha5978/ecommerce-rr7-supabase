import type { Database } from "@ecom/shared/types/supabase";
import { type ApiError } from "@ecom/shared/utils/ApiError";

export type CouponType = Database["public"]["Enums"]["coupon_type_enum"];

export type DiscountType = Database["public"]["Enums"]["discount_type"];

export type DiscountCondType = Database["public"]["Enums"]["condition_type"];

export type DiscountCondOperator = Database["public"]["Enums"]["condition_operator"];

export type DiscountCustomerGrps = Database["public"]["Enums"]["customer_type"];

export type BuyMinType = Database["public"]["Enums"]["buy_min_type_enum"];

export type GroupsConditionRole = Database["public"]["Enums"]["condition_role"];

export type HighLevelCoupon = {
	id: number;
	code: string;
	status: boolean;
	coupon_type: CouponType;
	start_timestamp: string;
	end_timestamp: string;
	created_at: string | null;
};

export type GetHighLevelCouponsResp = {
	coupons: HighLevelCoupon[] | null;
	total: number;
	error: ApiError | null;
};
