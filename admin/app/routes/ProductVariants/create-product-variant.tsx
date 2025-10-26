import { zodResolver } from "@hookform/resolvers/zod";
import { DollarSign, Loader2 } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useActionData, useNavigate, useNavigation, useSubmit } from "react-router";
import { toast } from "sonner";
import AttributeSelect from "~/components/Custom-Inputs/attributes-select";
import MultipleImagesInput from "~/components/Custom-Inputs/multiple-images-input";
import BackButton from "~/components/Nav/BackButton";
import { MetaDetails } from "~/components/SEO/MetaDetails";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";
import { AllProductAttributesQuery } from "~/queries/product-attributes.q";
import { variantConstraintsQuery } from "~/queries/product-variants.q";
import { Route } from "./+types/create-product-variant";
import {
	ProductVariantActionDataSchema,
	type ProductVariantFormValues,
	ProductVariantInputSchema,
} from "@ecom/shared/schemas/product-variants.schema";
import { ProductVariantsService } from "@ecom/shared/services/product-variants.service";
import { queryClient } from "@ecom/shared/lib/query-client/queryClient";
import { ApiError } from "@ecom/shared/utils/ApiError";
import type { ActionResponse, ActionReturn } from "@ecom/shared/types/action-data";
import {
	DISABLED_DEFAULT_VARIANT_MESSAGE,
	PRODUCT_IMG_DIMENSIONS,
	REQUIRED_VARIANT_ATTRIBS,
} from "@ecom/shared/constants/constants";
import type {
	AllProductAttributesResponse,
	AttributeType,
	ProductAttribute,
} from "@ecom/shared/types/attributes";
import type { VariantConstraintsData } from "@ecom/shared/types/product-variants";
import { protectAction, protectLoader } from "~/utils/routeGuards";
import { Permission } from "@ecom/shared/permissions/permissions.enum";
import { Breadcrumbs } from "~/components/SEO/BreadCrumbs";

export const action = protectAction<ActionReturn>({
	permissions: Permission.CREATE_PRODUCT_VARIANTS,
})(async ({ request, params }: Route.ActionArgs) => {
	const formData = await request.formData();
	console.log("Form data: ", formData);
	const productId = (params.productId as string) || "";

	if (!productId || productId == "") {
		throw new Response("Product ID is required", { status: 400 });
	}

	const data = {
		images: formData.getAll("images") as File[],
		is_default: formData.get("is_default") as string,
		original_price: formData.get("original_price") as string,
		sale_price: formData.get("sale_price") as string,
		reorder_level: formData.get("reorder_level") as string,
		sku: formData.get("sku") as string,
		status: formData.get("status") as string,
		stock: formData.get("stock") as string,
		weight: formData.get("weight") as string,
		attributes: formData.getAll("attributes") as string[],
	};

	const parseResult = ProductVariantActionDataSchema.safeParse(data);
	console.log("Parse result: ", parseResult?.error?.errors);

	if (!parseResult.success) {
		return new Response(JSON.stringify({ validationErrors: parseResult.error.flatten().fieldErrors }), {
			status: 400,
			headers: { "Content-Type": "application/json" },
		});
	}

	console.log("Data in the action: ", parseResult.data);

	const variantService = new ProductVariantsService(request);

	try {
		await variantService.createProductVaraint(productId, parseResult.data);

		await queryClient.invalidateQueries({ queryKey: ["products"] });
		await queryClient.invalidateQueries({ queryKey: ["fp_featured_products"] });
		await queryClient.invalidateQueries({ queryKey: ["productVariants", productId] });
		await queryClient.invalidateQueries({ queryKey: ["fullProduct", productId] });
		await queryClient.invalidateQueries({ queryKey: ["variantConstraints", productId] });
		await queryClient.invalidateQueries({ queryKey: ["collectionDataItems"] });
		await queryClient.invalidateQueries({ queryKey: ["allProductUnits"] });

		return { success: true };
	} catch (error: any) {
		console.error("Error in action:", error);
		const errorMessage =
			error instanceof ApiError ? error.message : error.message || "Failed to create product variant";

		if (error instanceof ApiError && error.details.length) {
			console.error("ApiError details:", error.details);
		}
		return {
			success: false,
			error: errorMessage,
		};
	}
});

type LoaderReturn = {
	data: AllProductAttributesResponse;
	constraints: VariantConstraintsData;
};

export const loader = protectLoader<LoaderReturn>({
	permissions: Permission.CREATE_PRODUCT_VARIANTS,
})(async ({ request, params }: Route.LoaderArgs) => {
	const productId = (params.productId as string) || "";
	if (!productId || productId == "") {
		throw new Response("Product ID is required", { status: 400 });
	}

	const data = await queryClient.fetchQuery(AllProductAttributesQuery({ request, input: "for-variant" }));
	const constraints = await queryClient.fetchQuery(
		variantConstraintsQuery({
			request,
			product_id: productId,
		}),
	);
	//console.log("Constrains data in loader:", constraints);

	return { data, constraints };
});

export default function CreateProductVariantPage({
	params,
	loaderData: {
		data: { product_attributes, error },
		constraints: { is_default_variant_exists, productName },
	},
}: Route.ComponentProps) {
	const navigate = useNavigate();
	const productId = params.productId as string;

	useEffect(() => {
		if (error) {
			toast.error(error?.message);
			navigate(`/products/${productId}/variants`);
			return;
		}
	}, [error]);

	const attributeKeys = Object.keys(product_attributes || {});

	const submit = useSubmit();
	const navigation = useNavigation();

	const actionData: ActionResponse = useActionData();

	const form = useForm<ProductVariantFormValues>({
		resolver: zodResolver(ProductVariantInputSchema),
		mode: "onSubmit",
		defaultValues: {
			images: [null, null, null, null],
			is_default: "false",
			original_price: "0",
			sale_price: "0",
			reorder_level: "10",
			sku: "",
			status: "true",
			stock: "0",
			weight: "",
			required_attributes: Array(REQUIRED_VARIANT_ATTRIBS.length).fill(""),
		},
	});

	const { handleSubmit, setError, control } = form;
	console.log(productName);

	const isSubmitting = navigation.state === "submitting" && navigation.formMethod === "POST";

	async function onFormSubmit(values: ProductVariantFormValues) {
		console.log(values);
		toast.info("Creating product variant...");

		const formData = new FormData();

		const finalAttributes = values.required_attributes.filter(
			(attr) => attr !== "" && attr !== null,
		) as string[];
		const finalImages = values.images.filter((img) => img !== null) as File[];

		for (const key in values) {
			if (typeof key === "string") {
				const value = values[key as keyof ProductVariantFormValues];
				if (typeof value === "string") {
					formData.set(key, value.trim());
				}
			}
		}

		finalImages.forEach((image) => {
			formData.append("images", image);
		});

		finalAttributes.forEach((attribute_id) => {
			formData.append("attributes", attribute_id);
		});

		submit(formData, {
			method: "POST",
			action: `/products/${productId}/variants/create`,
			encType: "multipart/form-data",
		});
	}

	useEffect(() => {
		if (actionData) {
			if (actionData.success) {
				toast.success("Product variant created successfully");
				navigate(-1);
			} else if (actionData.error) {
				toast.error(actionData.error);
			} else if (actionData.validationErrors) {
				toast.error("Invalid form data. Please check your inputs.");
				Object.entries(actionData.validationErrors).forEach(([field, errors]) => {
					setError(field as keyof ProductVariantFormValues, { message: errors[0] });
				});
			}
		}
	}, [actionData, navigate]);

	return (
		<>
			<MetaDetails
				metaTitle="Create Product Variant | Admin Panel"
				metaDescription="Create new product variant"
			/>
			<Breadcrumbs params={{ productId }} />
			<section className="flex flex-col gap-4">
				<div className="flex gap-4 items-center">
					<BackButton href={`/products/${productId}/variants`} />
					<h1 className="text-2xl font-semibold">Create Variant</h1>
				</div>

				<form className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={handleSubmit(onFormSubmit)}>
					<Form {...form}>
						{/* Left Side: General and IMAGES */}
						<Card>
							<CardHeader>
								<CardTitle className="text-lg">General</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								{/* Variant SKU */}
								<FormField
									control={control}
									name="sku"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Variant SKU</FormLabel>
											<FormControl>
												<Input placeholder="e.g. STSH-3402-Black-X" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								{/* Parent Product */}
								{productName && (
									<div className="space-y-2">
										<Label htmlFor="parent_product">Parent Product</Label>
										<Input
											id="parent_product"
											placeholder="e.g. Parent Product"
											defaultValue={productName || ""}
											disabled
											readOnly
										/>
									</div>
								)}
								{/* Original Price */}
								<FormField
									control={control}
									name="original_price"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Original Price</FormLabel>
											<FormControl>
												<div className="flex gap-2">
													<Input
														type="number"
														min={1}
														minLength={1}
														placeholder="e.g. 1000"
														{...field}
													/>
													<Button
														variant="outline"
														size="icon"
														className="pointer-events-none"
														tabIndex={-1}
													>
														<DollarSign className="h-4 w-4" />
													</Button>
												</div>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								{/* Sale Price */}
								<FormField
									control={control}
									name="sale_price"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Sale Price</FormLabel>
											<FormControl>
												<div className="flex gap-2">
													<Input
														type="number"
														min={1}
														minLength={1}
														placeholder="e.g. 1000"
														{...field}
													/>
													<Button
														variant="outline"
														size="icon"
														className="pointer-events-none"
														tabIndex={-1}
													>
														$
													</Button>
												</div>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								{/* Weight */}
								<FormField
									control={control}
									name="weight"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Weight (Optional)</FormLabel>
											<FormControl>
												<div className="flex gap-2">
													<Input
														type="number"
														min={0.1}
														minLength={0.1}
														step={"any"}
														placeholder="e.g. 0.7"
														{...field}
													/>
													<Button
														variant="outline"
														size="icon"
														className="pointer-events-none"
														tabIndex={-1}
													>
														Kg
													</Button>
												</div>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								{/* Images */}
								<FormField
									control={control}
									name="images"
									render={() => (
										<FormItem>
											<FormLabel>Images</FormLabel>
											<FormControl>
												<MultipleImagesInput
													name="images"
													dimensions={PRODUCT_IMG_DIMENSIONS}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</CardContent>
						</Card>

						{/* Right Side: Visibility, stock and Attributes */}
						<div className="space-y-4">
							{/* Visibilty */}
							<Card>
								<CardHeader>
									<CardTitle className="text-lg">Visibility</CardTitle>
								</CardHeader>
								<CardContent className="space-y-4">
									{/* Status */}
									<FormField
										control={control}
										name="status"
										render={({ field }) => (
											<FormItem className="space-y-1">
												<FormLabel>Status</FormLabel>
												<FormControl>
													<div className="space-y-2">
														<RadioGroup
															onValueChange={field.onChange}
															value={field.value}
														>
															<div className="flex items-center gap-3 *:cursor-pointer">
																<RadioGroupItem
																	value="true"
																	id="status-active"
																/>
																<Label htmlFor="status-active">Active</Label>
															</div>
															<div className="flex items-center gap-3 *:cursor-pointer">
																<RadioGroupItem
																	value="false"
																	id="status-inactive"
																/>
																<Label htmlFor="status-inactive">
																	Inactive
																</Label>
															</div>
														</RadioGroup>
														<span className="text-muted-foreground text-sm">
															If inactive, then this variant will not be visible
															in the store.
														</span>
													</div>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>

									{/* Is default */}
									<FormField
										control={control}
										name="is_default"
										render={({ field }) => (
											<FormItem className="space-y-1">
												<FormLabel>Default</FormLabel>
												<FormControl>
													<div className="space-y-2">
														<RadioGroup
															onValueChange={field.onChange}
															value={field.value}
															disabled={is_default_variant_exists}
														>
															<div className="flex items-center gap-3 *:cursor-pointer">
																<RadioGroupItem
																	value="true"
																	id="default-val-yes"
																/>
																<Label htmlFor="default-val-yes">Yes</Label>
															</div>
															<div className="flex items-center gap-3 *:cursor-pointer">
																<RadioGroupItem
																	value="false"
																	id="default-val-no"
																/>
																<Label htmlFor="default-val-no">No</Label>
															</div>
														</RadioGroup>
														<span
															className={`text-muted-foreground text-sm ${
																is_default_variant_exists && "italic"
															}`}
														>
															{is_default_variant_exists
																? DISABLED_DEFAULT_VARIANT_MESSAGE
																: `If "Yes" is selected then this variant will be auto
																selected at first load in store front.`}
														</span>
													</div>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</CardContent>
							</Card>
							{/* Stock */}
							<Card>
								<CardHeader>
									<CardTitle className="text-lg">Stock</CardTitle>
								</CardHeader>
								<CardContent className="space-y-4">
									{/* Stock */}
									<FormField
										control={control}
										name="stock"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Stock</FormLabel>
												<FormControl>
													<Input
														type="number"
														min={0}
														minLength={1}
														placeholder="e.g. 200"
														{...field}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>

									{/* Reorder Level */}
									<FormField
										control={control}
										name="reorder_level"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Reorder Level</FormLabel>
												<FormControl>
													<div className="space-y-2">
														<Input
															type="number"
															min={1}
															minLength={1}
															placeholder="e.g. 10"
															{...field}
														/>
														<span className="text-muted-foreground text-sm">
															On your set reorder level, admins will be notified
															by email about the low stock.
														</span>
													</div>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</CardContent>
							</Card>
							{/* Required Attributes */}
							<Card>
								<CardHeader>
									<CardTitle className="text-lg">Attributes</CardTitle>
								</CardHeader>
								<CardContent>
									<FormField
										control={control}
										name="required_attributes"
										render={() => (
											<FormItem>
												<FormControl>
													<div className="space-y-4">
														{attributeKeys.map((key, index) => (
															<div key={key} className="grid grid-cols-1">
																<FormItem>
																	<FormControl>
																		<AttributeSelect
																			name={`required_attributes.${index}`}
																			attributeKey={
																				key as AttributeType
																			}
																			options={
																				//@ts-ignore
																				product_attributes != null
																					? //@ts-ignore
																						product_attributes[
																							key
																						]?.map(
																							(
																								opt: ProductAttribute,
																							) => ({
																								id: opt.id,
																								value: opt.value,
																								name: opt.name,
																							}),
																						)
																					: []
																			}
																			disabled={!product_attributes}
																		/>
																	</FormControl>
																</FormItem>
															</div>
														))}
													</div>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</CardContent>
							</Card>
						</div>

						{/* Submit Button */}
						<div className="flex justify-end md:col-span-3">
							<Button type="submit" disabled={isSubmitting}>
								{isSubmitting && <Loader2 className="animate-spin mr-2" />}
								<span>Create</span>
							</Button>
						</div>
					</Form>
				</form>
			</section>
		</>
	);
}
