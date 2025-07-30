import type { Database } from "~/types/supabase";

export type CouponType = Database["public"]["Enums"]["coupon_type_enum"];

export type DiscountType = Database["public"]["Enums"]["discount_type"];

export type ProductRow = Database["public"]["Tables"]["product"]["Row"];

export type DiscountCondType = Database["public"]["Enums"]["condition_type"];

export type DiscountCondOperator = Database["public"]["Enums"]["condition_operator"];

export type DiscountCustomerGrps = Database["public"]["Enums"]["customer_type"];
