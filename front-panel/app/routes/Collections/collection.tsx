import { queryClient } from "@ecom/shared/lib/query-client/queryClient";
import type { AttributeType, ProductAttribute } from "@ecom/shared/types/attributes";
import type { FullCoupon } from "@ecom/shared/types/coupons";
import { zodResolver } from "@hookform/resolvers/zod";
import { BadgeQuestionMark } from "lucide-react";
import { useEffect } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { type LoaderFunctionArgs, useLoaderData, useRouteLoaderData, useSearchParams } from "react-router";
import z from "zod";
import FeaturedProductCard from "~/components/Products/FeaturedProduct";
import { MetaDetails } from "~/components/SEO/MetaDetails";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { get_FP_searchProductsFilters } from "~/queries/products.q";
import { getCollectionDetails } from "~/queries/collections.q";
import { filterCoupons } from "~/utils/product-details-helpers";
import type { loader as rootLoader } from "~/root";

const PAGE_SIZE = 24;

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
	const collectionId = params.collectionId;
	if (!collectionId) {
		throw new Response("Collection id is required", { status: 400 });
	}

	const searchParams = new URL(request.url).searchParams;
	const p_max = searchParams.get("p_max");
	const p_min = searchParams.get("p_min");
	const colors = searchParams.get("colors")?.split(",") ?? [];
	const sizes = searchParams.get("sizes")?.split(",") ?? [];
	const material = searchParams.get("material")?.split(",") ?? [];
	const style = searchParams.get("style")?.split(",") ?? [];
	const page = Number(searchParams.get("page") ?? "1");

	const collectionDetails = await queryClient.fetchQuery(
		getCollectionDetails({
			request,
			filters: {
				colors,
				material,
				p_max,
				p_min,
				sizes,
				style,
				categories: [],
			},
			pageIndex: page - 1,
			pageSize: PAGE_SIZE,
			collection_id: collectionId,
		}),
	);

	const filtersData = await queryClient.fetchQuery(get_FP_searchProductsFilters({ request }));

	return {
		productsResp: collectionDetails.products,
		collection: collectionDetails.collection,
		filtersData,
	};
};

const ArraySchema = z.array(z.string()).optional();
const SearchFiltersSchema = z.object({
	sizes: ArraySchema,
	colors: ArraySchema,
	material: ArraySchema,
	style: ArraySchema,
	price: z.array(z.number()).optional(),
});

type SearchFilters = z.infer<typeof SearchFiltersSchema>;
type Attribs = Record<AttributeType, ProductAttribute[]>;

const maxDefault = 25000;

export default function CollectionPage() {
	const loaderData = useLoaderData<typeof loader>();
	const rootLoaderData = useRouteLoaderData<typeof rootLoader>("root");
	const allCoupons: FullCoupon[] = filterCoupons(rootLoaderData?.coupons ?? []) ?? [];

	const products = loaderData.productsResp.products ?? [];
	const filtersData = loaderData.filtersData;
	const collection = loaderData.collection;

	const colors = (filtersData.data?.attributes as Attribs)!.color ?? [];
	const sizes = (filtersData.data?.attributes as Attribs)!.size ?? [];
	const material = (filtersData.data?.attributes as Attribs)!.material ?? [];
	const style = (filtersData.data?.attributes as Attribs)!.style ?? [];

	const [searchParams, setSearchParams] = useSearchParams();

	const urlFilters = {
		colors: searchParams.get("colors")?.split(",").filter(Boolean) ?? [],
		sizes: searchParams.get("sizes")?.split(",").filter(Boolean) ?? [],
		material: searchParams.get("material")?.split(",").filter(Boolean) ?? [],
		style: searchParams.get("style")?.split(",").filter(Boolean) ?? [],
		price: searchParams.get("p_min")
			? [Number(searchParams.get("p_min")!), Number(searchParams.get("p_max") ?? maxDefault)]
			: [0, maxDefault],
	};

	const form = useForm<SearchFilters>({
		resolver: zodResolver(SearchFiltersSchema as any),
		mode: "onSubmit",
		defaultValues: urlFilters,
	});

	const { control } = form;
	const watched = useWatch({ control });

	useEffect(() => {
		const newParams = new URLSearchParams(searchParams);
		let hasFilterChange = false;

		(["colors", "sizes", "material", "style"] as const).forEach((key) => {
			const value = watched[key];
			const currentValue = searchParams.get(key);

			if (value?.length) {
				const newValue = value.join(",");
				if (newValue !== currentValue) {
					newParams.set(key, newValue);
					hasFilterChange = true;
				}
			} else {
				if (currentValue) {
					newParams.delete(key);
					hasFilterChange = true;
				}
			}
		});

		if (watched.price) {
			const [min, max] = watched.price;
			const currentMin = searchParams.get("p_min");
			const currentMax = searchParams.get("p_max");

			if (min > 0) {
				if (String(min) !== currentMin) hasFilterChange = true;
				newParams.set("p_min", String(min));
			} else {
				if (currentMin) hasFilterChange = true;
				newParams.delete("p_min");
			}

			if (max < maxDefault) {
				if (String(max) !== currentMax) hasFilterChange = true;
				newParams.set("p_max", String(max));
			} else {
				if (currentMax) hasFilterChange = true;
				newParams.delete("p_max");
			}
		}

		if (hasFilterChange) {
			newParams.set("page", "1");
		}

		if (newParams.toString() !== searchParams.toString()) {
			setSearchParams(newParams, { replace: true });
		}
	}, [watched, searchParams, setSearchParams]);

	// Sync URL → form on back/forward/refresh
	useEffect(() => {
		form.reset(urlFilters);
	}, [searchParams]);

	function clearAllFilters() {
		const newParams = new URLSearchParams();
		setSearchParams(newParams, { replace: true });
		form.reset({
			colors: [],
			sizes: [],
			material: [],
			style: [],
			price: [0, maxDefault],
		});
	}

	const currentPage = Number(searchParams.get("page") ?? "1");
	const totalPages = Math.ceil((loaderData.productsResp.total || 0) / PAGE_SIZE);

	const goToPage = (page: number) => {
		const newParams = new URLSearchParams(searchParams);
		newParams.set("page", String(page));
		setSearchParams(newParams, { replace: true });
	};

	return (
		<>
			<MetaDetails
				metaTitle={(collection?.meta_details?.meta_title ?? "Collection") + " | Voguewalk"}
				metaDescription={collection?.meta_details?.meta_description ?? ""}
				metaKeywords={collection?.meta_details?.meta_keywords ?? ""}
			/>
			<div className="grid md:grid-cols-4 gap-2 max-container !h-full py-6">
				<aside className="col-span-1 max-[920px]:hidden p-6 flex flex-col gap-4 [&>.fBx]:space-y-2 space-y-2 bg-card shadow-sm h-fit border border-border">
					<div className="flex items-center justify-between mb-4">
						<h2 className="text-xl font-bold text-primary">Filters</h2>
						<Button size={"sm"} variant={"link"} type="button" onClick={clearAllFilters}>
							Clear All
						</Button>
					</div>
					<div className="fBx">
						<h3>Price (PKR)</h3>
						<div>
							<Controller
								name="price"
								control={control}
								render={({ field }) => (
									<div className="w-full mx-auto space-y-4 mt-1 [&>.pfield]:flex [&>.pfield]:gap-4 [&>.pfield]:items-center [&>.pfield]:[&>input]:w-full">
										<div className="pfield ">
											<div>
												<h4>Min</h4>
											</div>
											<Input
												value={field.value?.[0] ?? 0}
												onChange={(e) =>
													field.onChange([
														Number(e.target.value),
														field.value?.[1] ?? maxDefault,
													])
												}
												className="text-center text-sm text-muted-foreground w-fit"
												type="number"
												min={0}
												max={maxDefault}
											/>
										</div>
										<div className="pfield">
											<div>
												<h4>Max</h4>
											</div>
											<Input
												value={field.value?.[1] ?? maxDefault}
												onChange={(e) =>
													field.onChange([
														field.value?.[0] ?? 0, // preserve old min
														Number(e.target.value), // new max
													])
												}
												className="text-center text-sm text-muted-foreground w-fit"
												type="number"
												min={0}
												max={maxDefault}
											/>
										</div>
									</div>
								)}
							/>
						</div>
					</div>
					<div className="fBx">
						<h3>Colors</h3>
						<div>
							{colors.map((clr: ProductAttribute) => (
								<Controller
									key={clr.id}
									name="colors"
									control={control}
									render={({ field }) => {
										const values: string[] = (field.value ?? []).map(String);
										const idStr = String(clr.id);
										const checked = values.includes(idStr);

										return (
											<Label className="flex items-center px-2 py-1 cursor-pointer">
												<Checkbox
													checked={checked}
													onCheckedChange={(val) => {
														const isChecked = Boolean(val);
														let next: string[];
														if (isChecked) {
															next = values.includes(idStr)
																? values
																: [...values, idStr];
														} else {
															next = values.filter((v) => v !== idStr);
														}
														field.onChange(next);
													}}
													className="mr-2 cursor-pointer"
												/>
												{clr.name}
											</Label>
										);
									}}
								/>
							))}
						</div>
					</div>
					<div className="fBx">
						<h3>Sizes</h3>
						<div>
							{sizes.map((clr: ProductAttribute) => (
								<Controller
									key={clr.id}
									name="sizes"
									control={control}
									render={({ field }) => {
										const values: string[] = (field.value ?? []).map(String);
										const idStr = String(clr.id);
										const checked = values.includes(idStr);

										return (
											<Label className="flex items-center px-2 py-1 cursor-pointer">
												<Checkbox
													checked={checked}
													onCheckedChange={(val) => {
														const isChecked = Boolean(val);
														let next: string[];
														if (isChecked) {
															next = values.includes(idStr)
																? values
																: [...values, idStr];
														} else {
															next = values.filter((v) => v !== idStr);
														}
														field.onChange(next);
													}}
													className="mr-2 cursor-pointer"
												/>
												{clr.value}
											</Label>
										);
									}}
								/>
							))}
						</div>
					</div>
					<div className="fBx">
						<h3>Material</h3>
						<div>
							{material.map((clr: ProductAttribute) => (
								<Controller
									key={clr.id}
									name="material"
									control={control}
									render={({ field }) => {
										const values: string[] = (field.value ?? []).map(String);
										const idStr = String(clr.id);
										const checked = values.includes(idStr);

										return (
											<Label className="flex items-center px-2 py-1 cursor-pointer">
												<Checkbox
													checked={checked}
													onCheckedChange={(val) => {
														const isChecked = Boolean(val);
														let next: string[];
														if (isChecked) {
															next = values.includes(idStr)
																? values
																: [...values, idStr];
														} else {
															next = values.filter((v) => v !== idStr);
														}
														field.onChange(next);
													}}
													className="mr-2 cursor-pointer"
												/>
												{clr.name}
											</Label>
										);
									}}
								/>
							))}
						</div>
					</div>
					<div className="fBx">
						<h3>Style</h3>
						<div>
							{style.map((clr: ProductAttribute) => (
								<Controller
									key={clr.id}
									name="style"
									control={control}
									render={({ field }) => {
										const values: string[] = (field.value ?? []).map(String);
										const idStr = String(clr.id);
										const checked = values.includes(idStr);

										return (
											<Label className="flex items-center px-2 py-1 cursor-pointer">
												<Checkbox
													checked={checked}
													onCheckedChange={(val) => {
														const isChecked = Boolean(val);
														let next: string[];
														if (isChecked) {
															next = values.includes(idStr)
																? values
																: [...values, idStr];
														} else {
															next = values.filter((v) => v !== idStr);
														}
														field.onChange(next);
													}}
													className="mr-2 cursor-pointer"
												/>
												{clr.name}
											</Label>
										);
									}}
								/>
							))}
						</div>
					</div>
				</aside>
				<section className="col-span-3 px-4 py-4">
					<div className="mb-6">
						<h1 className="md:text-3xl text-2xl font-semibold tracking-tight">
							{collection?.name}
						</h1>
						<p className="text-muted-foreground">{collection?.description}</p>
					</div>

					<div className="grid max-[920px]:grid-cols-3 max-[640px]:grid-cols-2 max-[325px]:grid-cols-1 min-[920px]:grid-cols-4 gap-4">
						{products.length > 0 ? (
							products.map((product) => (
								<FeaturedProductCard
									key={product.id}
									product={product}
									allCoupons={allCoupons}
								/>
							))
						) : (
							<div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
								<BadgeQuestionMark className="w-12 h-12 mb-3" strokeWidth={1.65} />

								<h2 className="mb-3 text-2xl font-semibold">No products found</h2>

								<p className="mb-8 max-w-md text-lg text-muted-foreground">
									We couldn’t find any products matching your current filters. Try adjusting
									or clearing them to see more items.
								</p>
							</div>
						)}
					</div>

					{/* Pagination */}
					{totalPages > 1 && (
						<div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
							<Button
								variant="outline"
								disabled={currentPage === 1}
								onClick={() => goToPage(currentPage - 1)}
								className="min-w-[100px]"
							>
								Previous
							</Button>

							<div className="hidden sm:flex items-center gap-1">
								{Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
									const showPage =
										pageNum === 1 ||
										pageNum === totalPages ||
										Math.abs(pageNum - currentPage) <= 1 ||
										totalPages <= 7;

									if (showPage) {
										return (
											<Button
												key={pageNum}
												variant={pageNum === currentPage ? "default" : "outline"}
												size="icon"
												onClick={() => goToPage(pageNum)}
												className="w-9 h-9"
											>
												{pageNum}
											</Button>
										);
									}

									if (
										(pageNum === 2 && currentPage > 4) ||
										(pageNum === totalPages - 1 && currentPage < totalPages - 3)
									) {
										return (
											<span key={pageNum} className="px-3 text-muted-foreground">
												...
											</span>
										);
									}
									return null;
								})}
							</div>

							<div className="sm:hidden text-sm text-muted-foreground font-medium">
								Page {currentPage} of {totalPages}
							</div>

							<Button
								variant="outline"
								disabled={currentPage === totalPages}
								onClick={() => goToPage(currentPage + 1)}
								className="min-w-[100px]"
							>
								Next
							</Button>
						</div>
					)}
				</section>
			</div>
		</>
	);
}
