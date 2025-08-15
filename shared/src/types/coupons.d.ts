import type { Database } from "@ecom/shared/types/supabase";
import { type ApiError } from "@ecom/shared/utils/ApiError";
import type { TypesToSelect } from "@ecom/shared/types/coupons-comp";

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

export type FullCoupon = HighLevelCoupon & {
	description: string | null;
	discount_type: DiscountType;
	discount_value: number | null;
	main_simple_conditions: {
		type: string;
		operator: string;
		value_decimal: string | null;
		value_ids: string[] | null;
	}[];
	buy_x_get_y_conditions: {
		buy_group: {
			min_value_type: BuyMinType;
			min_value: string;
			entitiy_type: TypesToSelect;
			ids: (number | string)[];
		};
		get_group: {
			get_quantity: string;
			discount_percent: string;
			entitiy_type: TypesToSelect;
			ids: (number | string)[];
		};
	} | null;
	order_conditions: {
		min_purchase_qty: string | null;
		min_purchase_amount: string | null;
		max_uses_per_order: string | null;
		conditions:
			| {
					type: string;
					operator: string;
					value_decimal: string | null;
					value_ids: string[] | null;
					min_quantity: string;
			  }[]
			| null;
	};
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
