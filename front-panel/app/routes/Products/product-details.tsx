import { queryClient } from "@ecom/shared/lib/query-client/queryClient";
import { ChevronRight, CircleCheck, Copy, Heart } from "lucide-react";
import { type LoaderFunctionArgs, useLoaderData, useNavigate, useRouteLoaderData } from "react-router";
import { toast } from "sonner";
import ProductImageCarousel from "~/components/Products/ProductImagesCarousel";
import { Breadcrumbs } from "~/components/SEO/Breadcrumbs";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import { get_FP_searchProducts, getProductDetails } from "~/queries/products.q";
import { Controller, useForm, useWatch } from "react-hook-form";
import { memo, useEffect, useMemo, useState } from "react";
import QuantityInputBasic from "~/components/Custom-Inputs/quantity-input-basic";
import { ColorInput, SizeInput } from "~/components/Products/ProductDetailsInputs";
import {
	calculateDiscountedPrice,
	filterCoupons,
	getApplicableCoupons,
	getAvailableSizes,
	getCarouselImages,
	getProductAttributesToShow,
	getVariantsColors,
} from "~/utils/product-details-helpers";
import type { ProductAttribute } from "@ecom/shared/types/product-details";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { StockDisplay } from "~/components/Products/ProductDetailsStockDisplay";
import { type loader as rootLoader } from "~/root";
import { Badge } from "~/components/ui/badge";
import type { FullCoupon } from "@ecom/shared/types/coupons";
import { motion } from "motion/react";
import { addToCart } from "~/utils/manageCart";
import type { CartItem } from "~/types/cart";
import { addToFavourites } from "~/utils/manageFavourites";
import CartSheet from "~/components/Cart/CartSheet";
import { MetaDetails } from "~/components/SEO/MetaDetails";
import { SUPABASE_IMAGE_BUCKET_PATH } from "@ecom/shared/constants/constants";
import RelatedProducts from "~/components/Products/RelatedProducts";
import type { FP_SearchProductsResponse } from "@ecom/shared/types/products";
import TrustBadges from "~/components/Products/TrustBadges";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
	const product_id = params.productId;
	if (!product_id) {
		throw new Response("Product not found", {
			status: 400,
		});
	}

	const data = await queryClient.fetchQuery(getProductDetails({ request, product_id: String(product_id) }));

	let relatedProducts: FP_SearchProductsResponse | null = null;

	if (data.product?.product.category_id) {
		relatedProducts = await queryClient.fetchQuery(
			get_FP_searchProducts({
				request,
				filters: {
					categories: [data.product?.product.category_id],
					colors: [],
					material: [],
					p_max: null,
					p_min: null,
					sizes: [],
					style: [],
				},
			}),
		);
	}

	return { data: data.product, error: data.error, relatedProducts };
};

const formatCurrency = (value: number | string | undefined) => {
	if (value == null || value === "") return "N/A";
	const num = typeof value === "number" ? value : Number(value);
	if (Number.isNaN(num)) return String(value);
	return new Intl.NumberFormat(undefined, {
		style: "currency",
		currency: "PKR",
		maximumFractionDigits: 2,
		useGrouping: true,
	}).format(num);
};

type FormValues = {
	color: string;
	size: string;
	quantity: number;
	coupon: string;
};

export default function ProductDetailsPage() {
	const { data, error, relatedProducts } = useLoaderData<typeof loader>();
	const rootLoaderData = useRouteLoaderData<typeof rootLoader>("root");
	const allCoupons: FullCoupon[] = filterCoupons(rootLoaderData?.coupons ?? []);
	const current_user = rootLoaderData?.user;

	if (error || data?.product == null) {
		toast.error(error?.message ?? "Something went wrong");
		return null;
	}

	// console.log("Coupons", rootLoaderData?.coupons);

	const allColors = useMemo(() => getVariantsColors(data), [data]);

	const defaultColor = allColors[0]?.value || "";
	const defaultAvailableSizes = getAvailableSizes(data, defaultColor);
	const defaultSize = defaultAvailableSizes[0]?.value || "";

	const [cartSheetOpen, setCartSheetOpen] = useState(false);

	const form = useForm<FormValues>({
		defaultValues: {
			color: defaultColor,
			size: defaultSize,
			quantity: 1,
			coupon: "",
		},
	});
	const { control, setValue, getValues } = form;

	const selectedColor = useWatch({ control, name: "color" });
	const selectedSize = useWatch({ control, name: "size" });
	const selectedCouponCode = useWatch({ control, name: "coupon" });

	const availableSizes = useMemo(() => getAvailableSizes(data, selectedColor), [data, selectedColor]);

	useEffect(() => {
		const isSizeAvailable = availableSizes.some((s) => s.value === selectedSize);
		if (!isSizeAvailable && availableSizes.length > 0) {
			setValue("quantity", 1);
			setValue("size", availableSizes[0].value);
		}
	}, [selectedColor, availableSizes, selectedSize, setValue]);

	const selectedVariant = useMemo(() => {
		return data.variants.find(
			(v) =>
				v.attributes.some((a) => a.attribute_type === "color" && a.value === selectedColor) &&
				v.attributes.some((a) => a.attribute_type === "size" && a.value === selectedSize),
		);
	}, [data.variants, selectedColor, selectedSize]);

	const stock = useMemo(() => selectedVariant?.stock ?? 0, [selectedVariant]);
	const isOutOfStock = useMemo(() => stock === 0, [stock]);

	const carouselImages = useMemo(() => getCarouselImages(data, selectedVariant), [data, selectedVariant]);

	// Filter applicable coupons based on selected variant (SKU)
	const applicableCoupons = useMemo(() => {
		if (!selectedVariant) return [];
		return getApplicableCoupons(allCoupons, selectedVariant, current_user ?? null);
	}, [allCoupons, selectedVariant, data]);

	// Auto-apply first applicable coupon or use selected manual coupon
	const effectiveCoupon = useMemo(() => {
		if (selectedCouponCode) {
			return allCoupons.find((c) => c.code === selectedCouponCode) ?? null;
		}
		const autoAppliedCoupon = applicableCoupons[0] ?? null;
		if (autoAppliedCoupon) {
			setValue("coupon", autoAppliedCoupon.code, { shouldValidate: true });
		}
		return autoAppliedCoupon;
	}, [allCoupons, applicableCoupons, selectedCouponCode, setValue]);

	// Reset coupon on size change
	useEffect(() => {
		if (selectedSize) {
			setValue("coupon", "", { shouldValidate: true });
		}
	}, [selectedSize, setValue]);

	const finalPrice = useMemo(
		() => calculateDiscountedPrice(selectedVariant?.original_price ?? 0, effectiveCoupon),
		[selectedVariant?.original_price, effectiveCoupon],
	);

	const navigate = useNavigate();

	function handleAddtoCartClick() {
		if (selectedVariant && data?.product != null) {
			const payload: Omit<CartItem, "quantity" | "id"> & { quantity?: number } = {
				variant_id: selectedVariant.id,
				stock: selectedVariant.stock,
				quantity: getValues("quantity"),
				apply_shipping: data?.product.free_shipping ?? true,
				category_id: data?.product.category_id ?? "",
				color: selectedVariant.attributes.find((a) => a.attribute_type === "color")?.name ?? "",
				image_url: selectedVariant.images[0],
				product_name: data?.product.name ?? "",
				sku: selectedVariant.sku ?? "",
				product_id: data?.product.id ?? "",
				size: selectedSize,
				original_price: selectedVariant.original_price,
				applied_coupon_code: effectiveCoupon?.code ?? "",
			};

			try {
				addToCart(payload);
				setCartSheetOpen(true);
			} catch (error) {
				toast.error("Something went wrong");
			}
		}
	}

	const handleFavouriteClick = () => {
		addToFavourites({
			image_url: data.product.cover_image,
			original_price: data.variants[0]?.original_price ?? 0,
			product_id: data.product.id,
			product_name: data.product.name,
			url_key: data.product.url_key,
		});

		toast.success("Added to favourites", {
			action: {
				label: "View Favourites",
				onClick: () => {
					navigate("/favourites");
				},
			},
		});
	};

	return (
		<>
			<MetaDetails
				metaTitle={data?.product.meta_title + " | Voguewalk"}
				metaKeywords={data?.product.meta_keywords || undefined}
				metaDescription={data?.product.meta_description}
				canonicalUrl={`${process.env.VITE_MAIN_APP_URL}/product/${data?.product.id}/${data?.product.url_key}`}
				ogUrl={`${process.env.VITE_MAIN_APP_URL}/product/${data?.product.id}/${data?.product.url_key}`}
				ogImage={`${SUPABASE_IMAGE_BUCKET_PATH}/${data?.product.cover_image}`}
			/>
			<CartSheet open={cartSheetOpen} setOpen={setCartSheetOpen} />
			<section className="max-container py-6 flex flex-col gap-3">
				<Breadcrumbs
					params={{
						name: data?.product.name ?? "Product",
						id: data?.product.id ?? "",
						metaUrl: data?.product.url_key ?? "",
					}}
				/>
				<div className="flex md:flex-row flex-col gap-6 w-full">
					<div className="flex-1 flex gap-10 flex-col">
						<div className="inline">
							<ProductImageCarousel images={carouselImages} thumbPosition="bottom" />
						</div>
					</div>
					<div className="flex-1 flex flex-col gap-3">
						<div className="flex gap-2 justify-between">
							<h1 className="font-semibold text-2xl">{data?.product.name}</h1>
							<div
								className="p-2 rounded-full bg-accent w-fit h-fit"
								onClick={handleFavouriteClick}
							>
								<Heart className="w-4 h-4 hover:text-destructive hover:fill-destructive transition-colors duration-200 ease-in-out cursor-pointer" />
							</div>
						</div>
						<div className="flex justify-baseline gap-4 flex-wrap">
							<div className="flex gap-2 items-center">
								{selectedVariant && (
									<Badge
										variant="outline"
										className="w-fit hover:bg-accent transition-colors duration-150 ease-in-out cursor-pointer hover:underline underline-offset-2"
										onClick={() => {
											navigator.clipboard.writeText(selectedVariant.sku);
											toast.success(`SKU ${selectedVariant.sku} Copied`);
										}}
									>
										<Copy strokeWidth={1.65} width={13} />
										{selectedVariant.sku}
									</Badge>
								)}
							</div>
							<div className="flex gap-1 items-center flex-wrap">
								<Badge variant="secondary" className="text-xs">
									{data.product.category_name}
								</Badge>
								<span className="text-muted-foreground text-xs">
									<ChevronRight className="w-3 h-3" />
								</span>
								<Badge variant="secondary" className="text-xs">
									{data.product.sub_category_name}
								</Badge>
								{data.product.free_shipping && (
									<Badge
										variant="outline"
										className="ml-2 text-xs text-success border-success/40"
									>
										Free shipping
									</Badge>
								)}
							</div>
						</div>
						<p className="text-muted-foreground">{data?.product.description}</p>
						<div className="flex items-center gap-2">
							<motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
								<span className="text-2xl font-bold">{formatCurrency(finalPrice)}</span>
							</motion.span>
							{effectiveCoupon && finalPrice < (selectedVariant?.original_price ?? 0) && (
								<motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
									<del className="text-destructive">
										{formatCurrency(selectedVariant?.original_price ?? 0)}
									</del>
								</motion.span>
							)}
						</div>
						<StockDisplay isOutOfStock={isOutOfStock} stock={stock} />
						<form action="#" className="flex flex-col gap-4 w-full">
							<div className="flex flex-col gap-2">
								<Label>Color</Label>
								<Controller
									name="color"
									control={control}
									render={({ field }) => (
										<ColorInput
											items={allColors}
											onValueChange={field.onChange}
											value={field.value}
										/>
									)}
								/>
							</div>
							<div className="flex flex-col gap-2">
								<Label>Size</Label>
								<Controller
									name="size"
									control={control}
									render={({ field }) => (
										<SizeInput
											items={availableSizes}
											key={selectedColor}
											onValueChange={field.onChange}
											value={field.value}
										/>
									)}
								/>
							</div>
							{applicableCoupons.length > 0 && (
								<div className="flex flex-col gap-2">
									<Label>
										<p>Available Coupons</p>
										{selectedCouponCode && (
											<motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
												<CircleCheck className="text-success h-4 w-4" />
											</motion.span>
										)}
									</Label>
									<Controller
										name="coupon"
										control={control}
										render={({ field }) => (
											<Select onValueChange={field.onChange} value={field.value}>
												<SelectTrigger className="cursor-pointer w-full">
													<SelectValue placeholder="Select a coupon" />
												</SelectTrigger>
												<SelectContent>
													{applicableCoupons.map((coupon) => (
														<SelectItem
															key={coupon.id}
															value={coupon.code}
															className="cursor-pointer"
														>
															{coupon.code}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										)}
									/>
								</div>
							)}
							<div className="flex gap-4">
								<Controller
									name="quantity"
									control={control}
									render={({ field: { onChange, value } }) => (
										<QuantityInputBasic
											quantity={value}
											onChange={onChange}
											step={1}
											min={1}
											minLength={1}
											maxLength={stock}
											max={stock}
											disabled={isOutOfStock}
										/>
									)}
								/>
								<div className="w-full">
									<Button
										size="lg"
										className="w-full flex-1 grow"
										variant={"default"}
										disabled={isOutOfStock}
										type="button"
										onClick={handleAddtoCartClick}
									>
										Add to cart
									</Button>
								</div>
							</div>
						</form>
						{data.collections.length > 0 && (
							<motion.div
								className="flex flex-col gap-1.5 mt-4"
								initial={{ opacity: 0, y: 10 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: 0.2 }}
							>
								<Label className="text-muted-foreground text-xs">Part of</Label>
								<div className="flex flex-wrap gap-2">
									{data.collections.map((col, index) => (
										<motion.div
											key={col.id}
											initial={{ opacity: 0, scale: 0.9 }}
											animate={{ opacity: 1, scale: 1 }}
											transition={{ delay: 0.05 * index }}
										>
											<Badge
												variant="outline"
												className="text-xs cursor-pointer hover:bg-accent"
											>
												{col.name}
											</Badge>
										</motion.div>
									))}
								</div>
							</motion.div>
						)}
						<ProductAttributesSection product_attributes={data.product_attributes} />
					</div>
				</div>

				<TrustBadges />

				{relatedProducts != null &&
					Array.isArray(relatedProducts.products) &&
					relatedProducts.products?.length > 0 && (
						<RelatedProducts products={relatedProducts.products} />
					)}
			</section>
		</>
	);
}

const ProductAttributesSection = memo(
	({ product_attributes }: { product_attributes: ProductAttribute[] }) => {
		const productAttribsToShow = getProductAttributesToShow(product_attributes);

		if (!productAttribsToShow || Object.keys(productAttribsToShow).length === 0) {
			return null;
		}

		return (
			<div className="mt-4">
				<h2 className="font-semibold text-xl mb-4">Product Details</h2>

				<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
					{Object.entries(productAttribsToShow).map(([type, attributes]) => (
						<div
							key={type}
							className="bg-card border border-border rounded-sm p-5 hover:shadow-sm transition-shadow"
						>
							<div className="uppercase text-xs tracking-widest text-muted-foreground mb-3">
								{type}
							</div>

							<div className="flex flex-wrap gap-2">
								{attributes.map((attr: ProductAttribute) => (
									<Badge
										key={attr.id}
										variant="secondary"
										className="text-sm py-1.5 px-4 font-medium"
									>
										{attr.name}
									</Badge>
								))}
							</div>
						</div>
					))}
				</div>
			</div>
		);
	},
);
