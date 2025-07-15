import type { AttributeType } from "./types/attributes";
import { IconHelp, IconSettings } from "@tabler/icons-react";
import { Archive, Box, Boxes, Gift, House, LinkIcon, Megaphone, TableProperties, Tag, Users } from "lucide-react";
import type { NavItem, NavSubItem } from "~/types/nav";

class DefaultValues {
    readonly DEFAULT_CATEGORY_PAGE = 1;
    readonly DEFAULT_CATEGORY_PAGE_SIZE = 10;

    readonly DEFAULT_SUB_CATEGORY_PAGE = 1;
    readonly DEFAULT_SUB_CATEGORY_PAGE_SIZE = 10;

    readonly DEFAULT_PRODUCTS_PAGE = 1;
    readonly DEFAULT_PRODUCTS_PAGE_SIZE = 10;

    readonly DEFAULT_PRODUCTS_VARIANTS_PAGE = 1;
    readonly DEFAULT_PRODUCTS_VARIANTS_PAGE_SIZE = 20;

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
}

export const defaults = new DefaultValues();

export const mainNavItems: NavItem[] = [
	{
		title: "Quick Links",
		items: [
			{
				title: "Dashboard",
				url: "/dashboard",
				icon: <House />,
			},
			{
				title: "New Product",
				url: "/products/create",
				icon: <Archive />,
			},
			{
				title: "New Coupon",
				url: "/coupons/new",
				icon: <Gift />,
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
		title: "Discounts & News",
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

export const product_attributes_enum: AttributeType[] = ["color", "size", "material", "style", "brand"] as const;

export const MAX_IMAGE_SIZE = 1 * 1024 * 1024;
export const ALLOWED_IMAGE_FORMATS = ["image/jpeg", "image/png", "image/webp"];

export const REQUIRED_VARIANT_ATTRIBS = ["color", "size"];
export const OPTIONAL_PRODUCT_ATTRIBS = ["material", "style", "brand"];

export const DISABLED_DEFAULT_VARIANT_MESSAGE = "You cannot change this as other variant is currently set to default.";

export const TABLE_NAMES = {
	attributes: "attributes",
	product: "product",
	product_attributes: "product_attributes",
	product_variant: "product_variant",
	variant_attributes: "variant_attributes",
	meta_details: "meta_details",
	category: "category",
	sub_category: "sub_category",
	collection: "collections",
} as const;

export const STORAGE_BUCKETS = {
    images: "images",
} as const;

export const SUPABASE_IMAGE_BUCKET_PATH = `https://xbpbnydexqzhespljrqi.supabase.co/storage/v1/object/public/${STORAGE_BUCKETS.images}/`;


export const productSortByEnums = [
	"id",
	"name",
	"status",
	"is_featured",
	"free_shipping",
	"createdAt",
] as const;
export const productSortTypeEnums = ["asc", "desc"] as const;

export const productVariantsSortByEnums = [
	"id",
	"weight",
	"original_price",
	"sale_price",
	"stock",
	"createdAt",
] as const;
export const productVariantSortTypeEnums = ["asc", "desc"] as const;

export const filterOps = ["eq","gt","gte","lt","lte"] as const;
export type FilterOp = typeof filterOps[number];

export const collectionsSelectionTypeEnum = ["null", "category_based", "product_based"] as const;