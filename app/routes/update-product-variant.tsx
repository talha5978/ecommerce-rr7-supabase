import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { LoaderFunctionArgs, useActionData, useNavigate, useNavigation, useSubmit } from "react-router";
import BackButton from "~/components/Nav/BackButton";
import { MetaDetails } from "~/components/SEO/MetaDetails";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "~/components/ui/form";
import { queryClient } from "~/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { toast } from "sonner";
import { ApiError } from "~/utils/ApiError";
import type { ActionResponse } from "~/types/action-data";
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";
import { Label } from "~/components/ui/label";
import { Route } from "./+types/update-product-variant";
import { type ProductVariantUpdateActionData, ProductVariantUpdateActionDataSchema, ProductVariantUpdateFormValues, ProductVariantUpdateInputSchema } from "~/schemas/product-variants.schema";
import MultipleImagesInput from "~/components/Custom-Inputs/multiple-images-input";
import { AllProductAttributesQuery } from "~/queries/product-attributes.q";
import AttributeSelect from "~/components/Custom-Inputs/attributes-select";
import type { AttributeType, ProductAttribute, ProductAttributeRow } from "~/types/attributes.d";
import { ProductVariantsService } from "~/services/product-variants.service";
import { singleVariantQuery, variantConstraintsQuery } from "~/queries/product-variants.q";
import { DISABLED_DEFAULT_VARIANT_MESSAGE, REQUIRED_VARIANT_ATTRIBS } from "~/constants";

function getSimpleFields() {
	const fields = [
		"is_default",
		"original_price",
		"sale_price",
		"reorder_level",
		"sku",
		"status",
		"stock",
		"weight",
	] as const;
	return fields;
}

export const action = async ({ request, params }: Route.ActionArgs) => {
	const formData = await request.formData();
	// Get the variant ID from params
	const variantId = (params.variantId as string) || "";
	if (!variantId || variantId === "") {
		throw new Response("Variant ID is required", { status: 400 });
	}
	
	const productId = (params.productId as string) || "";
	if (!variantId || variantId === "") {
		throw new Response("Product ID is required", { status: 400 });
	}

	// Initialize the data object
	const data: Partial<ProductVariantUpdateActionData> = {};

	// Define simple fields to extract as strings
	const simpleFields = getSimpleFields();

	// Extract simple fields
	for (const field of simpleFields) {
		if (formData.has(field)) {
			data[field] = formData.get(field) as string;
		}
	}

	// Extract images (array of new image files)
	if (formData.has("images")) {
		data.images = formData.getAll("images").map((file) => file as File);
	}

	// Extract images that are removed by user
	if (formData.has("removed_images")) {
		data.removed_images = formData.getAll("removed_images").map((value) => String(value));
	}
	
	// Extract new attributes (array of strings)
	if (formData.has("added_attributes")) {
		data.added_attributes = formData.getAll("added_attributes").map((value) => String(value));
	}

	// Extract attributes that are removed (array of strings)
	if (formData.has("removed_attributes")) {
		data.removed_attributes = formData.getAll("removed_attributes").map((value) => String(value));
	}

	// Validate the extracted data against the schema
	const parseResult = ProductVariantUpdateActionDataSchema.safeParse(data);
	console.log("Parse result: ", parseResult?.error);

	if (!parseResult.success) {
		return new Response(JSON.stringify({ validationErrors: parseResult.error.flatten().fieldErrors }), {
			status: 400,
			headers: { "Content-Type": "application/json" },
		});
	}

	console.log("Data in the action: ", parseResult.data);
	
	// Initialize the service with the request
	const productVariantsService = new ProductVariantsService(request);

	try {
		// Call the service to update the variant
		await productVariantsService.updateProductVaraint(variantId, parseResult.data);
		// Invalidate relevant queries
		await queryClient.invalidateQueries({ queryKey: ["productVariant", variantId] });
		await queryClient.invalidateQueries({ queryKey: ["productVariants", productId] });
		await queryClient.invalidateQueries({ queryKey: ["variantConstraints", productId] });

		if (formData.has("status")) {
			await queryClient.invalidateQueries({ queryKey: ["collectionDataItems"] });
		}

		return { success: true };
	} catch (error: any) {
		console.error("Error in action:", error);
		const errorMessage =
			error instanceof ApiError ? error.message : error.message || "Failed to update product variant";

		if (error instanceof ApiError && error.details.length) {
			console.error("ApiError details:", error.details);
		}
		return {
			success: false,
			error: errorMessage,
		};
	}
};

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
	const variant_id = params.variantId as string || "";
	const product_id = params.productId as string || "";

	if (!variant_id || variant_id == "") {
		throw new Response("Variant ID is required", { status: 400 });
	}

	if (!product_id || product_id == "") {
		throw new Response("Product ID is required", { status: 400 });
	}

	const variantData = await queryClient.fetchQuery(singleVariantQuery({ request, variant_id }));
	const attributesData = await queryClient.fetchQuery(AllProductAttributesQuery({
		request,
		input: "for-variant"
	}));
	const constraints = await queryClient.fetchQuery(variantConstraintsQuery({
		request,
		product_id
	}));
	//console.log(constraints);
	
	return { variantData, attributesData, constraints };
};

export default function UpdateProductVariantPage({
	params,
	loaderData: {
		variantData: { variant, error: variantError },
		attributesData: { product_attributes, error: attributesError },
		constraints: { is_default_variant_exists, default_variant_id, productName }
	},
} : Route.ComponentProps) {
	
	const navigate = useNavigate();
	const productId = params.productId as string;

	useEffect(() => {
		if (variantError) {
			toast.error(variantError?.message);
			navigate(`/products/${productId}/variants`);
			return;
		}
	}, [variantError]);

	useEffect(() => {
		if (attributesError) {
			toast.error(attributesError?.message);
			navigate(`/products/${productId}/variants`);
			return;
		}
	}, [attributesError]);
	
	const is_default_disabled = (is_default_variant_exists && default_variant_id !== variant?.id ? true : false) || false;

	const submit = useSubmit();
	const navigation = useNavigation();

	const actionData: ActionResponse = useActionData();

	function normalizeImgArray(arr: string[]): (string | null)[] {
		return arr.length === 4 ? arr : [...arr, ...Array(4 - arr.length).fill(null)];
	}

	function getdefaultImages() {
		return variant?.images ? normalizeImgArray(variant.images) : Array(4).fill(null)
	}

	const attributeKeys = Object.keys(product_attributes || {});

	function getdefaultRequiredAttributes() {
		const attribs = variant?.attributes;
		return attribs
			? attributeKeys
				.map((key) => {
					const attr = variant?.attributes.find((a: ProductAttributeRow) => a.attribute_type === key);
					return attr ? attr.id : null; 
				})
			: Array(REQUIRED_VARIANT_ATTRIBS.length).fill("");
	}

	const form = useForm<ProductVariantUpdateFormValues>({
		resolver: zodResolver(ProductVariantUpdateInputSchema),
		mode: "onSubmit",
		defaultValues: {
			images: getdefaultImages(),
			is_default: variant?.is_default || "false",
			original_price: variant?.original_price || "0",
			sale_price: variant?.sale_price || "0",
			reorder_level: variant?.reorder_level || "10",
			sku: variant?.sku || "",
			status: variant?.status || "true",
			stock: variant?.stock || "0",
			weight: variant?.weight || "",
			required_attributes: getdefaultRequiredAttributes()
		},
	});

	useEffect(() => {
		console.log(form.getValues());
	}, [form]);

	const { handleSubmit, setError, control } = form; 

	const isSubmitting = navigation.state === "submitting" && navigation.formMethod === "POST";
	
	async function onFormSubmit(values: ProductVariantUpdateFormValues) {
		console.log("Form submitted: \n", values);
		
		const variantFields = getSimpleFields();

		const formData = new FormData();
		let hasChanges = false;

		// Normalize form values
		const normalizedValues: Partial<ProductVariantUpdateFormValues> = {
			is_default: String(values.is_default).trim(),
			original_price: String(values.original_price).trim(),
			sale_price: String(values.sale_price).trim(),
			reorder_level: String(values.reorder_level).trim(),
			sku: values.sku.trim(),
			status: String(values.status).trim(),
			stock: String(values.stock).trim(),
			weight: String(values.weight || "").trim(),
			images: values.images, // Handling images separately...
			required_attributes: values.required_attributes.map((id) => id?.trim() || "")
		};

		// Compare simple fields
		for (const field of variantFields) {
			const formValue = normalizedValues[field];
			const originalValue = String(variant?.[field] || "");
			
			if (formValue != null && formValue !== originalValue) {
				formData.append(field, formValue);
				hasChanges = true;
			}
		}

		// Compare images
		const originalImages = variant?.images || [];
		const formImages = normalizedValues.images?.filter((img): img is string | File => img !== null) ?? [];

		const imagesChanged =
			formImages.length !== originalImages.length ||
			formImages.some((img, index) => {
				if (typeof img === "string") {
					return img !== originalImages[index];
				}
				return true; // New File means change
			});

		if (imagesChanged) {
			// Extract kept images (strings) from formImages
			const keptImages = formImages.filter((img): img is string => typeof img === "string");
			// Calculate removed images (original images not in keptImages)
			const removedImages = originalImages.filter((img) => !keptImages.includes(img));

			// Append removed images to formData under "removed_images"
			removedImages.forEach((imageId) => {
				formData.append("removed_images", imageId);
			});

			const newImages = formImages.filter((img) => typeof img !== "string");
			// Append only new files of images to formData under "images"
			newImages.forEach((image) => {
				if (image) {
					formData.append("images", image);
				}
			});

			console.log("New Images", newImages);
			console.log("Removed Images", removedImages);
			

			hasChanges = true;
		}

		// Compare attributes
		const originalAttributeIds = (variant?.attributes || []).map((attr: ProductAttributeRow) => attr.id).sort();
		const formAttributeIds: string[] = normalizedValues?.required_attributes!
			.filter((attr) => attr !== null && attr !== "")
			.sort() as string[];

		// Calculate removed attributes (in original but not in form)
		const removedAttributes = originalAttributeIds.filter((id: string) => !formAttributeIds.includes(id));

		// Calculate added attributes (in form but not in original)
		const addedAttributes = formAttributeIds.filter((id: string) => !originalAttributeIds.includes(id));

		// Append removed attributes to FormData
		if (removedAttributes.length > 0) {
			removedAttributes.forEach((attributeId: string) => {
				formData.append("removed_attributes", attributeId);
			});
			hasChanges = true;
		}

		// Append added attributes to FormData
		if (addedAttributes.length > 0) {
			addedAttributes.forEach((attributeId: string) => {
				formData.append("added_attributes", attributeId);
			});
			hasChanges = true;
		}

		console.log("Added Attributes: ", addedAttributes);
		console.log("Removed Attributes: ", removedAttributes);
		
		// If no changes, show toast and return
		if (!hasChanges) {
			toast.info("No changes to update");
			return;
		}

		toast.info("Updating product variant...");
		// Submit form data
		submit(formData, {
			method: "POST",
			action: `/products/${productId}/variants/${variant?.id}/update`,
			encType: "multipart/form-data",
		});
	}
	
	useEffect(() => {
		if (actionData) {
			if (actionData.success) {
				toast.success("Product variant updated successfully");
				navigate(-1);
			} else if (actionData.error) {
				toast.error(actionData.error);
			} else if (actionData.validationErrors) {
				toast.error("Invalid form data. Please check your inputs.");
				Object.entries(actionData.validationErrors).forEach(([field, errors]) => {
					setError(field as keyof ProductVariantUpdateFormValues, { message: errors[0] });
				});
			}
		}
	}, [actionData, navigate]);
	
	return (
		<>
			<MetaDetails
				metaTitle="Update Product Variant | Admin Panel"
				metaDescription="Update product variant"
			/>
			<section className="flex flex-col gap-4">
				<div className="flex gap-4 items-center">
					<BackButton href={`/products/${productId}/variants`} />
					<h1 className="text-2xl font-semibold">Update Variant</h1>
				</div>

				<form className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={handleSubmit(onFormSubmit)}>
					<Form {...form}>
						{/* Left Side: Basic Details and IMAGES */}
						<Card>
							<CardHeader>
								<CardTitle className="text-lg">Basic Details</CardTitle>
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
														Rs.
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
														Rs.
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
												<MultipleImagesInput name="images" />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</CardContent>
						</Card>

						{/* Right Side */}
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
																<RadioGroupItem value="true" id="status-active" />
																<Label htmlFor="status-active">Active</Label>
															</div>
															<div className="flex items-center gap-3 *:cursor-pointer">
																<RadioGroupItem
																	value="false"
																	id="status-inactive"
																/>
																<Label htmlFor="status-inactive">Inactive</Label>
															</div>
														</RadioGroup>
														<span className="text-muted-foreground text-sm">
															If inactive, then this variant will not be visible in
															the store.
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
															disabled={is_default_disabled}
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
														<span className={`text-muted-foreground text-sm ${is_default_disabled && "italic"}`}>
															{is_default_disabled
																? DISABLED_DEFAULT_VARIANT_MESSAGE
																: `If "Yes" is selected then this variant will be auto
																selected at first load in store front.`
															}
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
															On your set reorder level, admins will be notified by
															email about the low stock.
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
															<div
																key={key}
																className="grid grid-cols-1"
															>
																<FormItem>
																	<FormControl>
																		<AttributeSelect
																			name={`required_attributes.${index}`}
																			attributeKey={key as AttributeType}
																			options={
																				// @ts-ignore
																				product_attributes != null ? product_attributes[key]?.map(
																					(opt: ProductAttribute) => ({
																						id: opt.id,
																						value: opt.value,
																						name: opt.name
																					})
																				) : []
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
								<span>Update</span>
							</Button>
						</div>
					</Form>
				</form>
			</section>
		</>
	);
}