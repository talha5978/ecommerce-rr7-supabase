import { groups, typesToSelect } from "~/utils/couponsConstants";

export type BuyXGetYGroupOpts = "buy" | "get";
export type FixedProductsGroupOpts = "fix";
export type OrdersGroupOpts = "order";

export type TypesToSelect = (typeof typesToSelect)[number];

export type SearchBarGroups = BuyXGetYGroupOpts | FixedProductsGroupOpts | OrdersGroupOpts;

export type SearchBarProps = {
	selectedType: TypesToSelect;
	group: SearchBarGroups;
};

export type SelectionAreaProps<ResponseType> = {
	field: ControllerRenderProps<CouponFormValues>;
	resolvedData: ResponseType | null;
};

export type Groups = (typeof groups)[number];

type SelectionDialogProps = {
	field: ControllerRenderProps<CouponFormValues>;
	type: TypesToSelect;
	open: boolean;
	onClose: () => void;
	group: FixedProductsGroupOpts | OrdersGroupOpts;
	selectedData: Promise<any> | null;
};
