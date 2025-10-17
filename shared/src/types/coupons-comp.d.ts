import type { CouponType } from "@ecom/shared/types/coupons";
import { groups } from "@ecom/shared/constants/couponsConstants";

export type SearchBarProps = {
	selectedType: TypesToSelect;
	group: BuyXGetYGroupOpts | FixedProductsGroupOpts | OrdersGroupOpts;
};

export type CouponTypesOption = {
	label: string;
	description: string;
	value: CouponType;
	icon: JSX.Element;
};
