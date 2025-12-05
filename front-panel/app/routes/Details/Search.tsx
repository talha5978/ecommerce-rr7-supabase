import { queryClient } from "@ecom/shared/lib/query-client/queryClient";
import { AttributeType, ProductAttribute } from "@ecom/shared/types/attributes";
import { zodResolver } from "@hookform/resolvers/zod";
import { BadgeQuestionMark } from "lucide-react";
import { useEffect } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { type LoaderFunctionArgs, useLoaderData, useSearchParams } from "react-router";
import z from "zod";
import FeaturedProductCard from "~/components/Products/FeaturedProduct";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { get_FP_searchProducts, get_FP_searchProductsFilters } from "~/queries/products.q";

export const loader = async ({ request }: LoaderFunctionArgs) => {
	const searchParams = new URL(request.url).searchParams;
	const p_max = searchParams.get("p_max");
	const p_min = searchParams.get("p_min");
	const colors = searchParams.get("colors")?.split(",") ?? [];
	const sizes = searchParams.get("sizes")?.split(",") ?? [];
	const material = searchParams.get("material")?.split(",") ?? [];
	const style = searchParams.get("style")?.split(",") ?? [];
	const categories = searchParams.get("categories")?.split(",") ?? [];

	const productsResp = await queryClient.fetchQuery(
		get_FP_searchProducts({
			request,
			filters: {
				colors,
				material,
				p_max,
				p_min,
				sizes,
				style,
				categories,
			},
		}),
	);

	const filtersData = await queryClient.fetchQuery(get_FP_searchProductsFilters({ request }));

	return {
		productsResp,
		filtersData,
	};
};

const ArraySchema = z.array(z.string()).optional();
const SearchFiltersSchema = z.object({
	categories: ArraySchema,
	sizes: ArraySchema,
	colors: ArraySchema,
	material: ArraySchema,
	style: ArraySchema,
	price: z.array(z.number()).optional(),
});

type SearchFilters = z.infer<typeof SearchFiltersSchema>;
type Attribs = Record<AttributeType, ProductAttribute[]>;

const maxDefault = 25000;

export default function SearchPage() {
	const loaderData = useLoaderData<typeof loader>();
	const products = loaderData.productsResp.products ?? [];
	const filtersData = loaderData.filtersData;
	const categories = filtersData.data?.categories ?? [];

	const colors = (filtersData.data?.attributes as Attribs)!.color ?? [];
	const sizes = (filtersData.data?.attributes as Attribs)!.size ?? [];
	const material = (filtersData.data?.attributes as Attribs)!.material ?? [];
	const style = (filtersData.data?.attributes as Attribs)!.style ?? [];

	const form = useForm<SearchFilters>({
		resolver: zodResolver(SearchFiltersSchema as any),
		mode: "onSubmit",
		defaultValues: {
			categories: [],
			sizes: [],
			colors: [],
			material: [],
			style: [],
			price: [0, maxDefault],
		},
	});

	const { control } = form;
	const watched = useWatch({ control });

	const [_, setSearchParams] = useSearchParams();

	useEffect(() => {
		if (!watched) return;

		const params = new URLSearchParams();

		for (const key in watched) {
			const value = watched[key as keyof typeof watched];
			console.log(key, value);

			if (!value) continue;

			if (key === "price") {
				params.set("p_min", String(value[0]));
				params.set("p_max", String(value[1]));
			} else {
				if (Array.isArray(value)) {
					value.forEach((v) => {
						if (v !== "" && v != null) {
							params.set(key, value.join(","));
						}
					});
				}
			}
		}

		setSearchParams(params);
	}, [watched]);

	return (
		<div className="grid md:grid-cols-4 max-container !h-full py-6">
			<aside className="col-span-1 max-[920px]:hidden px-4 py-4 flex flex-col gap-4 [&>.fBx]:space-y-2 [&>.fBx]:bg-secondary/40 [&>.fBx]:p-4 [&>.fBx]:rounded-lg [&>.fBx]:shadow">
				<div className="flex items-center justify-between ">
					<h2>Filters (2)</h2>
					<Button size={"sm"} variant={"link"} type="button">
						Clear All
					</Button>
				</div>
				<div className="fBx">
					<h3>Categories</h3>
					<div>
						{categories.map((category) => (
							<Controller
								key={category.id}
								name="categories"
								control={control}
								render={({ field }) => {
									const values: string[] = (field.value ?? []).map(String);
									const idStr = String(category.id);
									const checked = values.includes(idStr);

									return (
										<Label className="flex items-center px-2 py-1 cursor-pointer">
											<Checkbox
												checked={checked}
												onCheckedChange={(val) => {
													const isChecked = Boolean(val);
													let next: string[];
													if (isChecked) {
														// add if not present
														next = values.includes(idStr)
															? values
															: [...values, idStr];
													} else {
														// remove
														next = values.filter((v) => v !== idStr);
													}
													field.onChange(next);
												}}
												className="mr-2 cursor-pointer"
											/>
											{category.category_name}
										</Label>
									);
								}}
							/>
						))}
					</div>
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
				<div className="grid max-[920px]:grid-cols-3 max-[640px]:grid-cols-2 max-[325px]:grid-cols-1 min-[920px]:grid-cols-4 gap-4">
					{products.length > 0 ? (
						products.map((product) => <FeaturedProductCard product={product} key={product.id} />)
					) : (
						<div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
							<BadgeQuestionMark className="w-12 h-12 mb-3" strokeWidth={1.65} />

							<h2 className="mb-3 text-2xl font-semibold">No products found</h2>

							<p className="mb-8 max-w-md text-lg text-muted-foreground">
								We couldn’t find any products matching your current filters. Try adjusting or
								clearing them to see more items.
							</p>
						</div>
					)}
				</div>
			</section>
		</div>
	);
}
