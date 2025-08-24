import { IconHelp, IconSettings } from "@tabler/icons-react";
import {
	Archive,
	Box,
	Boxes,
	Gift,
	House,
	LinkIcon,
	Megaphone,
	TableProperties,
	Tag,
	Users,
} from "lucide-react";
import type { DiscountType } from "@ecom/shared/types/coupons";
import type { NavItem, NavSubItem } from "@ecom/shared/types/nav";
import { Constants } from "@ecom/shared/types/supabase";

class DefaultValues {
	readonly DEFAULT_CATEGORY_PAGE = 1;
	readonly DEFAULT_CATEGORY_PAGE_SIZE = 10;

	readonly DEFAULT_SUB_CATEGORY_PAGE = 1;
	readonly DEFAULT_SUB_CATEGORY_PAGE_SIZE = 10;

	readonly DEFAULT_PRODUCTS_PAGE = 1;
	readonly DEFAULT_PRODUCTS_PAGE_SIZE = 10;

	readonly DEFAULT_PRODUCTS_VARIANTS_PAGE = 1;
	readonly DEFAULT_PRODUCTS_VARIANTS_PAGE_SIZE = 20;

	readonly DEFAULT_COUPONS_PAGE_SIZE = 20;

	readonly META_KEYWORDS_VALUE = 25;

	readonly defaultProductSortByFilter = "createdAt";
	readonly defaultProductSortTypeFilter = "desc";

	readonly defaultProductVaraintsSortByFilter = "createdAt";
	readonly defaultProductVaraintsSortTypeFilter = "desc";

	readonly MAX_STOCK_FILTER_DEFAULT_VAL = 1200;

	readonly DEFAULT_COLLECTIONS_PAGE = 1;
	readonly DEFAULT_COLLECTIONS_PAGE_SIZE = 10;

	readonly DEFAULT_COLLECTIONS_PRODUCTS_PAGE_SIZE = 7;
	readonly DEFAULT_COLLECTIONS_CATEGORY_PAGE_SIZE = 3;

	readonly defaultCollectionSortByFilter = "createdAt";
	readonly defaultCollectionSortTypeFilter = "desc";
}

export const defaults = new DefaultValues();

export const mainNavItems: NavItem[] = [
	{
		title: "Quick Links",
		items: [
			{
				title: "Dashboard",
				url: "/",
				icon: <House />,
			},
			{
				title: "New Product",
				url: "/products/create",
				icon: <Archive />,
			},
			{
				title: "New Collection",
				url: "/collections/create",
				icon: <Tag />,
			},
		],
	},
	{
		title: "Catalog",
		items: [
			{
				title: "Products",
				url: "/products",
				icon: <Archive />,
			},
			{
				title: "All Units",
				url: "/all-product-units",
				icon: <Boxes />,
			},
			{
				title: "Categories",
				url: "/categories",
				icon: <LinkIcon />,
			},
			{
				title: "Collections",
				url: "/collections",
				icon: <Tag />,
			},
			{
				title: "Product Attributes",
				url: "/product-attributes",
				icon: <TableProperties />,
			},
		],
	},
	{
		title: "Sales",
		items: [
			{
				title: "Orders",
				url: "/orders",
				icon: <Box />,
			},
			{
				title: "Customers",
				url: "/customers",
				icon: <Users />,
			},
		],
	},
	{
		title: "Promotion",
		items: [
			{
				title: "Coupons",
				url: "/coupons",
				icon: <Gift />,
			},

			{
				title: "Announcements",
				url: "/announcements",
				icon: <Megaphone />,
			},
		],
	},
];

export const secondaryNavItems: NavSubItem[] = [
	{
		title: "Settings",
		url: "#",
		icon: IconSettings,
	},
	{
		title: "Get Help",
		url: "#",
		icon: IconHelp,
	},
];

export const product_attributes_enum = Constants.public.Enums.attribute_type_enum;

export const MAX_IMAGE_SIZE = 1 * 1024 * 1024;
export const ALLOWED_IMAGE_FORMATS = ["image/jpeg", "image/png", "image/webp", "image/avif"];

export const getSimpleImgFormats = () => {
	const formats = ALLOWED_IMAGE_FORMATS.map((format) => format.split("/")[1].toUpperCase());
	return formats.join(", ");
};

export const PRODUCT_IMG_DIMENSIONS = {
	min: { width: 500, height: 600 },
	max: { width: 1200, height: 1200 },
};

export const COLLECTION_IMG_DIMENSIONS = {
	min: { width: 600, height: 400 },
	max: { width: 1600, height: 1200 },
};

export const REQUIRED_VARIANT_ATTRIBS = ["color", "size"];
export const OPTIONAL_PRODUCT_ATTRIBS = ["material", "style", "brand"];

export const DISABLED_DEFAULT_VARIANT_MESSAGE =
	"You cannot change this as other variant is currently set to default.";

export const STORAGE_BUCKETS = {
	images: "images",
} as const;

export const SUPABASE_IMAGE_BUCKET_PATH = `https://xbpbnydexqzhespljrqi.supabase.co/storage/v1/object/public/${STORAGE_BUCKETS.images}/`;

export const sortTypeEnums = ["asc", "desc"] as const;

export const productSortByEnums = [
	"id",
	"name",
	"status",
	"is_featured",
	"free_shipping",
	"createdAt",
] as const;

export const productVariantsSortByEnums = [
	"id",
	"weight",
	"original_price",
	"sale_price",
	"stock",
	"createdAt",
] as const;

export const filterOps = ["eq", "gt", "gte", "lt", "lte"] as const;
export type FilterOp = (typeof filterOps)[number];

export const collectionSortByEnums = ["status", "products_count", "name", "createdAt"] as const;

// 3 SIZES FOR DIFFERENET ENTITIIES BEING USED IN COUPON CREATION PAGE AND UPDATION PAGE
export const COUPONS_SKUS_PAGE_SIZE = 3;
export const COUPONS_COLLECTIONS_PAGE_SIZE = 5;
export const COUPONS_CATEGORIES_PAGE_SIZE = 5;

export const COUPON_TYPE_ENUM = Constants.public.Enums.coupon_type_enum;
export const ADDRESS_TYPE_ENUM = Constants.public.Enums.address_type_enum;
export const DISCOUNT_TYPE_ENUM = Constants.public.Enums.discount_type;
export const DISCOUNT_CUSTOMER_TYPE_ENUM = Constants.public.Enums.customer_type;
export const PRODUCT_COND_OPERATOR_ENUM = Constants.public.Enums.condition_operator;
export const DISCOUNT_COND_ROLE_ENUM = Constants.public.Enums.condition_role;
export const DISCOUNT_COND_TYPE_ENUM = Constants.public.Enums.condition_type;
export const BUY_MIN_TYPE_ENUM = Constants.public.Enums.buy_min_type_enum;

export const DEFAULT_DICOUNT_TYPE: DiscountType = "fixed_order";
