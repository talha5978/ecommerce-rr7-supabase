import { queryClient } from "@ecom/shared/lib/query-client/queryClient";
import { CircleCheck, Copy, Heart } from "lucide-react";
import { type LoaderFunctionArgs, useLoaderData, useNavigate, useRouteLoaderData } from "react-router";
import { toast } from "sonner";
import ProductImageCarousel from "~/components/Products/ProductImagesCarousel";
import { Breadcrumbs } from "~/components/SEO/Breadcrumbs";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import { getProductDetails } from "~/queries/products.q";
import { Controller, useForm, useWatch } from "react-hook-form";
import { memo, useEffect, useMemo } from "react";
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

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
	const product_id = params.productId;
	if (!product_id) {
		throw new Response("Product not found", {
			status: 400,
		});
	}
	const data = await queryClient.fetchQuery(getProductDetails({ request, product_id: String(product_id) }));
	return { data: data.product, error: data.error };
};

type FormValues = {
	color: string;
	size: string;
	quantity: number;
	coupon: string;
};

export default function ProductDetailsPage() {
	const { data, error } = useLoaderData<typeof loader>();
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
		return getApplicableCoupons(allCoupons, selectedVariant, current_user);
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
				toast.success(`Added to cart successfully`, {
					action: {
						label: "View Cart",
						onClick: () => {
							navigate("/cart");
						},
					},
				});
			} catch (error) {
				toast.error("Something went wrong");
			}
		}
	}

	return (
		<>
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
						<div className="min-[1000px]:inline hidden">
							<ProductImageCarousel images={carouselImages} />
						</div>
						<div className="inline min-[1000px]:hidden">
							<ProductImageCarousel images={carouselImages} thumbPosition="bottom" />
						</div>
					</div>
					<div className="flex-1 flex flex-col gap-3">
						<div className="flex gap-2 justify-between">
							<h1 className="font-semibold text-2xl">{data?.product.name}</h1>
							<div className="p-2 rounded-full bg-accent w-fit h-fit">
								<Heart className="w-4 h-4 hover:text-destructive hover:fill-destructive transition-colors duration-200 ease-in-out cursor-pointer" />
							</div>
						</div>
						<div className="flex gap-2 items-center">
							<h2 className="text-muted-foreground text-sm">SKU</h2>
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
						<p className="text-muted-foreground">{data?.product.description}</p>
						<div className="flex items-center gap-2">
							<motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
								<span className="text-2xl font-bold">PKR {finalPrice.toFixed(2)}</span>
							</motion.span>
							{effectiveCoupon && finalPrice < (selectedVariant?.original_price ?? 0) && (
								<motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
									<del className="text-destructive">
										PKR {(selectedVariant?.original_price ?? 0).toFixed(2)}
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
								<Button
									size="lg"
									className="w-full flex-1 grow"
									variant={"outline"}
									disabled={isOutOfStock}
									type="button"
									onClick={handleAddtoCartClick}
								>
									Add to cart
								</Button>
							</div>
							<Button size="lg" className="w-full" disabled={isOutOfStock}>
								Buy Now
							</Button>
						</form>
						<ProductAttributesSection product_attributes={data.product_attributes} />
					</div>
				</div>
			</section>
		</>
	);
}

const ProductAttributesSection = memo(
	({ product_attributes }: { product_attributes: ProductAttribute[] }) => {
		const productAttribsToShow = getProductAttributesToShow(product_attributes);

		return (
			<div className="mt-4 flex flex-col gap-2">
				<h2 className="font-semibold text-lg">Product Details</h2>
				<div className="border-1 rounded-sm border-primary">
					<div className="flex *:flex-1 items-center *:bg-accent">
						<div className="product-details-table-entry">Attribute(s)</div>
						<div className="product-details-table-entry">Value(s)</div>
					</div>
					<div className="flex *:flex-1 items-center">
						{productAttribsToShow["material"] && (
							<>
								<p className="product-details-table-entry">Material</p>
								{productAttribsToShow["material"]?.map((attribute: ProductAttribute) => (
									<p key={attribute.id} className="product-details-table-entry">
										{attribute.name}
									</p>
								))}
							</>
						)}
					</div>
					<div className="flex *:flex-1 items-center">
						{productAttribsToShow["style"] && (
							<>
								<p className="product-details-table-entry">Style</p>
								{productAttribsToShow["style"]?.map((attribute: ProductAttribute) => (
									<p key={attribute.id} className="product-details-table-entry">
										{attribute.name}
									</p>
								))}
							</>
						)}
					</div>
					<div className="flex *:flex-1 items-center">
						{productAttribsToShow["brand"] && (
							<>
								<p className="product-details-table-entry">Brand</p>
								{productAttribsToShow["brand"]?.map((attribute: ProductAttribute) => (
									<p key={attribute.id} className="product-details-table-entry">
										{attribute.name}
									</p>
								))}
							</>
						)}
					</div>
				</div>
			</div>
		);
	},
);
