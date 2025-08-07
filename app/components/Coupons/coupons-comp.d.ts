import type { GetAllCategoriesResponse } from "~/types/category";
import type { CollectionsNamesListResponse } from "~/types/collections";
import type { CouponType } from "~/types/coupons";
import type { SKUsNamesListResponse } from "~/types/products";
import { groups, typesToSelect } from "~/utils/couponsConstants";

export type BuyXGetYGroupOpts = "buy" | "get";
export type FixedProductsGroupOpts = "fix";
export type OrdersGroupOpts = "order";

export type TypesToSelect = (typeof typesToSelect)[number];

export type SearchBarProps = {
	selectedType: TypesToSelect;
	group: BuyXGetYGroupOpts | FixedProductsGroupOpts | OrdersGroupOpts;
};

export type SelectionAreaProps<ResponseType> = {
	field: ControllerRenderProps<CouponFormValues>;
	resolvedData: ResponseType | null;
};

export type Groups = (typeof groups)[number];

export type SelectionDialogProps = {
	field: ControllerRenderProps<CouponFormValues>;
	type: TypesToSelect;
	open: boolean;
	onClose: () => void;
	group: FixedProductsGroupOpts | OrdersGroupOpts;
	selectedData: Promise<
		GetAllCategoriesResponse | SKUsNamesListResponse | CollectionsNamesListResponse
	> | null;
};

export type CouponTypesOption = {
	label: string;
	description: string;
	value: CouponType;
	icon: JSX.Element;
};
