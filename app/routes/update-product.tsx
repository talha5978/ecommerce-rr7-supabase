import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { ActionFunctionArgs, Link, LoaderFunctionArgs, useActionData, useNavigate, useNavigation, useSubmit } from "react-router";
import BackButton from "~/components/Nav/BackButton";
import { MetaDetails } from "~/components/SEO/MetaDetails";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "~/components/ui/form";
import { queryClient } from "~/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { Separator } from "~/components/ui/separator";
import { Button } from "~/components/ui/button";
import { Loader2, PlusCircle, RefreshCcw } from "lucide-react";
import { useEffect, useMemo } from "react";
import {
	TagsInput,
	TagsInputClear,
	TagsInputInput,
	TagsInputItem,
	TagsInputList,
} from "~/components/ui/tags-input";
import { defaults, OPTIONAL_PRODUCT_ATTRIBS } from "~/constants";
import { toast } from "sonner";
import { ApiError } from "~/utils/ApiError";
import { ActionResponse } from "~/types/action-data";
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";
import { Label } from "~/components/ui/label";
import { ProductFormValues, ProductUpdateActionData, ProductUpdateActionDataSchema, ProductUpdateFormValues, ProductUpdateInputSchema } from "~/schemas/product.schema";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { categoriesQuery } from "~/queries/categories.q";
import { Route } from "./+types/update-product";
import ImageInput from "~/components/Custom-Inputs/image-input";
import { ProductsService } from "~/services/products.service";
import { getFullSingleProductQuery } from "~/queries/products.q";
import { getSanitizedMetaDetailsForAction, getSanitizedMetaDetailsForForm } from "~/utils/getSanitizedMetaDetails";
import { AllProductAttributesQuery } from "~/queries/product-attributes.q";
import { AttributeType, ProductAttribute, ProductAttributeRow } from "~/types/attributes";
import AttributeSelect from "~/components/Custom-Inputs/attributes-select";

function getSimpleFields() {
	return [
		"name",
		"description",
		"cover_image",
		"free_shipping",
		"is_featured",
		"status",
		"sub_category",
	] as const;
}

export const action = async ({ request, params }: ActionFunctionArgs) => {
	const formData = await request.formData();
	// console.log("Form data: ", formData);

	const productId = (params.productId as string) || "";
	if (!productId || productId == "") {
		throw new Response("Product ID is required", { status: 400 });
	}

	const data: Partial<ProductUpdateActionData> = {};

	const simpleFields = getSimpleFields();

	for (const field of simpleFields) {
		if (formData.has(field)) {
			if (field === "cover_image") {
				data.cover_image = formData.get("cover_image") as File;
			} else {
				data[field] = formData.get(field) as string;
			}
		}
	}

	// Parse meta_details fields
	getSanitizedMetaDetailsForAction({ formData, data });
	
	// Extract new attributes (array of strings)
	if (formData.has("added_attributes")) {
		data.added_attributes = formData.getAll("added_attributes").map((value) => String(value));
	}

	// Extract attributes that are removed (array of strings)
	if (formData.has("removed_attributes")) {
		data.removed_attributes = formData.getAll("removed_attributes").map((value) => String(value));
	}
	
	const parseResult = ProductUpdateActionDataSchema.safeParse(data);
	console.log("Parse result: ", parseResult?.error);

	if (!parseResult.success) {
		return new Response(JSON.stringify({ validationErrors: parseResult.error.flatten().fieldErrors }), {
			status: 400,
			headers: { "Content-Type": "application/json" },
		});
	}

	// console.log("Data in the action: ", parseResult.data);
	// return;
	const productService = new ProductsService(request);

	try {
		await productService.updateProduct(parseResult.data, productId);

		await queryClient.invalidateQueries({ queryKey: ["products"] });
		await queryClient.invalidateQueries({ queryKey: ["fullProduct", productId] });
		
		// if name is updated then we invalidate the cache for the variant constraints service function because it also fetches the product name and also the cache that fetches the products names list in the all units page dialog
		if (formData.has("name")) {
			await queryClient.invalidateQueries({ queryKey: ["variantConstraints", productId] });
			await queryClient.invalidateQueries({ queryKey: ["productNames"] });
		}
		
		if (formData.has("status")) {
			await queryClient.invalidateQueries({ queryKey: ["collectionDataItems"] });
		}

		return { success: true };
	} catch (error: any) {
		console.error("Error in action:", error);
		const errorMessage =
			error instanceof ApiError ? error.message : error.message || "Failed to update product";

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
	const prodId = params.productId as string || "";
	if (!prodId || prodId == "") {
		throw new Response("Product ID is required", { status: 400 });
	}

	const product = await queryClient.fetchQuery(getFullSingleProductQuery(
		{ request, productId: prodId }
	));

	const categories = await queryClient.fetchQuery(categoriesQuery({ request }));

	const attribs_for_product = await queryClient.fetchQuery(AllProductAttributesQuery({
		request,
		input: "for-product"
	}));
	
	return {
		data: {
			productResp: product,
			categoriesResp: categories,
			optional_attributes: attribs_for_product
		}
	};
};

export default function UpdateProductPage({
	loaderData: {
		data: { productResp, categoriesResp, optional_attributes },
	},
}: Route.ComponentProps) {
	const navigate = useNavigate();

	useEffect(() => {
		if (productResp?.error) {
			toast.error(productResp?.error.message);
			navigate("/products");
		}
	}, [productResp?.error]);
	
	useEffect(() => {
		if (categoriesResp?.error) {
			toast.error(categoriesResp?.error?.message);
			navigate("/products");
		}
	}, [categoriesResp?.error]);
	
	useEffect(() => {
		if (optional_attributes?.error) {
			toast.error(optional_attributes?.error?.message);
			navigate("/products");
		}
	}, [optional_attributes?.error]);

	const submit = useSubmit();
	const navigation = useNavigation();

	const actionData: ActionResponse = useActionData();

	const defaultCategory = useMemo(() => {
		return categoriesResp?.categories?.find((category) => {
			return category.sub_category.find(
				(subCategory) => subCategory.id === productResp.product.sub_category
			);
		});
	}, [categoriesResp, productResp]);

	const attributeKeys = Object.keys(optional_attributes.product_attributes || {});

	function getdefaultOptionalAttributes() : (string | null)[] {
		const attribs = optional_attributes?.product_attributes;
		return attribs
			? attributeKeys
				.map((key) => {
					const attr = productResp?.product.attributes.find((a: ProductAttributeRow) => a.attribute_type === key);
					return attr ? attr.id : null; 
					// Yahan pr alternative null use kr rhy hain takay empty values fill ho jaien
				})
			: Array(OPTIONAL_PRODUCT_ATTRIBS.length).fill(null);
	}

	const form = useForm<ProductUpdateFormValues>({
		resolver: zodResolver(ProductUpdateInputSchema),
		mode: "onSubmit",
		defaultValues: {
			cover_image: productResp?.product.cover_image ?? "",
			description: productResp?.product.description ?? "",
			free_shipping: String(productResp?.product.free_shipping) ?? "false",
			is_featured: String(productResp?.product.is_featured) ?? "false",
			name: productResp?.product.name ?? "",
			status: String(productResp?.product.status) ?? "false",
			category: defaultCategory?.id ?? "",
			sub_category: productResp?.product.sub_category ?? "",
			meta_details: {
				meta_title: productResp?.product.meta_details.meta_title ?? "",
				meta_description: productResp?.product.meta_details.meta_description ?? "",
				url_key: productResp?.product.meta_details.url_key ?? "",
				meta_keywords:
					productResp.product?.meta_details?.meta_keywords == ""
						? []
						: productResp.product?.meta_details?.meta_keywords?.split(",") || [],
			},
			optional_attributes: getdefaultOptionalAttributes()
		},
	});
	
	const { handleSubmit, setError, control, resetField, getValues } = form;
	
    const selectedCategory = useWatch({ control, name: "category" });

	const categories = categoriesResp.categories || [];
    const subCategories = useMemo(() =>
        categories.find((cat) => cat.id === selectedCategory)?.sub_category || [],
        [categories, selectedCategory]
    );
	
    useEffect(() => {
        resetField("sub_category");
    }, [selectedCategory, subCategories, resetField, getValues]);

	const isSubmitting = navigation.state === "submitting" && navigation.formMethod === "POST";

	async function onFormSubmit(values: ProductUpdateFormValues) {
		// console.log(values);

		const simpleFields = getSimpleFields();
		
		const formData = new FormData();
		let hasChanges = false;

		const normalizedValues = {
			name: values.name.trim(),
			description: values.description.trim(),
			cover_image: values.cover_image,
			free_shipping: values.free_shipping ?? "false",
			is_featured: values.is_featured ?? "false",
			status: values.status ?? "true",
			sub_category: values.sub_category,
			meta_details: {
				meta_title: values.meta_details.meta_title.trim(),
				meta_description: values.meta_details.meta_description.trim(),
				url_key: values.meta_details.url_key.trim().toLowerCase(),
				meta_keywords: Array.isArray(values.meta_details.meta_keywords)
					? values.meta_details.meta_keywords
						.map((kw) => kw.trim())
						.filter(Boolean)
					: []
			},
			optional_attributes: values.optional_attributes,
		}
		// console.log(normalizedValues);
		
		for (const field of simpleFields) {
			if (normalizedValues[field] !== String(productResp?.product[field])) {
				formData.set(field, normalizedValues[field]);
				hasChanges = true;
			}
		}

		const { hasChanges: hasMetaChanges } = getSanitizedMetaDetailsForForm({
			formData,
			normalizedValues,
			entity: productResp?.product,
			hasChanges,
		});

		hasChanges = hasChanges || hasMetaChanges;

		const originalAttributeIds = (productResp?.product?.attributes || []).map((attr: ProductAttributeRow) => attr.id).sort();
		const formAttributeIds: string[] = normalizedValues.optional_attributes
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

		// console.log("Added Attributes: ", addedAttributes);
		// console.log("Removed Attributes: ", removedAttributes);

		if (!hasChanges) {
			toast.info("No changes to save");
			return;
		}
		toast.info("Updating product...");

		submit(formData, {
			method: "POST",
			action: `/products/${productResp?.product.id}/update`,
			encType: "multipart/form-data",
		});
	}

	useEffect(() => {
		if (actionData) {
			if (actionData.success) {
				toast.success("Product updated successfully");
				navigate("/products");
			} else if (actionData.error) {
				toast.error(actionData.error);
			} else if (actionData.validationErrors) {
				toast.error("Invalid form data. Please check your inputs.");
				Object.entries(actionData.validationErrors).forEach(([field, errors]) => {
					setError(field as keyof ProductFormValues, { message: errors[0] });
				});
			}
		}
	}, [actionData, navigate]);

	return (
		<>
			<MetaDetails metaTitle="Update Product | Admin Panel" metaDescription="Update product" />
			<section className="flex flex-col gap-4">
				<div className="flex gap-4 items-center">
					<BackButton href="/products" />
					<h1 className="text-2xl font-semibold">Update Product</h1>
				</div>

				<form className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={handleSubmit(onFormSubmit)}>
					<Form {...form}>
						{/* Left Side: Basic Details and Meta Details */}
						<div className="space-y-4">
							{/* Basic Details Card */}
							<Card>
								<CardHeader>
									<CardTitle className="text-lg">Basic Details</CardTitle>
								</CardHeader>
								<CardContent className="space-y-4">
									{/* Product Name */}
									<FormField
										control={control}
										name="name"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Product Name</FormLabel>
												<FormControl>
													<Input
														placeholder="e.g. Striped Polo T-Shirt"
														{...field}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									{/* Description */}
									<FormField
										control={control}
										name="description"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Description</FormLabel>
												<FormControl>
													<Textarea
														placeholder="Short description of this product"
														{...field}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									{/* Category */}
									<FormField
										control={control}
										name="category"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Category</FormLabel>
												<FormControl>
													<div className="flex gap-2">
														<div className="*:w-full flex-1">
															<Select
																onValueChange={field.onChange}
																value={field.value}
															>
																<SelectTrigger>
																	<SelectValue placeholder="Select Category" />
																</SelectTrigger>
																<SelectContent>
																	{categories?.map((category) => (
																		<SelectItem
																			key={category.id}
																			value={category.id}
																		>
																			{category.category_name}
																		</SelectItem>
																	))}
																</SelectContent>
															</Select>
														</div>
														<Link
															to="/categories/create"
															viewTransition
															className=""
														>
															<Button variant="outline" size="icon">
																<PlusCircle className="h-4 w-4" />
															</Button>
														</Link>
													</div>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									{/* Sub Category */}
									<FormField
										control={control}
										name="sub_category"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Sub Category</FormLabel>
												<FormControl>
													<div className="flex gap-2">
														<div className="*:w-full flex-1">
															<Select
																onValueChange={field.onChange}
																value={field.value}
																disabled={!selectedCategory}
															>
																<SelectTrigger>
																	<SelectValue placeholder="Select Sub Category" />
																</SelectTrigger>
																<SelectContent className="*:w-fit">
																	{subCategories?.length > 0 ? (
																		subCategories.map((subCategory) => (
																			<SelectItem
																				key={subCategory.id}
																				value={subCategory.id}
																			>
																				{
																					subCategory.sub_category_name
																				}
																			</SelectItem>
																		))
																	) : (
																		<div className="py-1">
																			<span className="text-sm py-1.5 pr-8 pl-2 text-destructive">
																				No sub categories found
																			</span>
																		</div>
																	)}
																</SelectContent>
															</Select>
														</div>
														<Link
															to={`/categories/${selectedCategory}/sub-categories/create`}
															viewTransition
														>
															<Button
																variant="outline"
																size="icon"
																disabled={!selectedCategory}
															>
																<PlusCircle className="h-4 w-4" />
															</Button>
														</Link>
													</div>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									{/* Cover Image Upload */}
									<FormField
										control={control}
										name="cover_image"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Cover Image</FormLabel>
												<FormControl>
													<ImageInput name="cover_image" />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</CardContent>
							</Card>

							{/* Meta Details Card */}
							<Card>
								<CardHeader>
									<CardTitle className="text-lg">SEO & Meta Attributes</CardTitle>
								</CardHeader>
								<CardContent className="space-y-4">
									{/* Meta Title */}
									<FormField
										control={control}
										name="meta_details.meta_title"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Meta Title</FormLabel>
												<FormControl>
													<Input
														placeholder="e.g. Striped Polo T-Shirt"
														{...field}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									{/* Meta Description */}
									<FormField
										control={control}
										name="meta_details.meta_description"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Meta Description</FormLabel>
												<FormControl>
													<Textarea
														placeholder="A short summary for SEO"
														{...field}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									{/* Meta Keywords */}
									<FormField
										control={control}
										name="meta_details.meta_keywords"
										render={({ field, fieldState }) => (
											<FormItem>
												<FormLabel>Meta Keywords</FormLabel>
												<FormControl>
													<TagsInput
														value={field.value}
														onValueChange={field.onChange}
														max={defaults.META_KEYWORDS_VALUE} // Adjust as per your defaults
														editable
														addOnPaste
														className="w-full"
														aria-invalid={!!fieldState.error}
													>
														<div className="flex sm:flex-row flex-col gap-2">
															<TagsInputList>
																{field.value && Array.isArray(field.value)
																	? field.value.map((item) => (
																			<TagsInputItem
																				key={item}
																				value={item}
																			>
																				{item}
																			</TagsInputItem>
																	))
																	: null}
																<TagsInputInput placeholder="Add meta keywords..." />
															</TagsInputList>
															<TagsInputClear className="sm:w-fit w-full">
																<div className="tags-input-clear-container">
																	<RefreshCcw className="h-4 w-4" />
																	<span className="sm:hidden inline">
																		Clear
																	</span>
																</div>
															</TagsInputClear>
														</div>
														<div className="text-muted-foreground text-sm">
															You can add up to {defaults.META_KEYWORDS_VALUE}{" "}
															keywords
														</div>
													</TagsInput>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									{/* URL Key */}
									<FormField
										control={control}
										name="meta_details.url_key"
										render={({ field }) => (
											<FormItem>
												<div className="flex gap-2">
													<FormLabel>URL Key</FormLabel>
													<span className="text-muted-foreground text-sm">
														(Without spaces)
													</span>
												</div>
												<FormControl>
													<Input placeholder="e.g. women" {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</CardContent>
							</Card>
						</div>

						{/* Right Side: Visibility and Shipping Card and OPTIONAL ATTRIBUTES */}
						<div className="space-y-4">
							<Card>
								<CardHeader>
									<CardTitle className="text-lg">Visibility & Shipping</CardTitle>
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
															If inactive, the product will not be visible in the
															store
														</span>
													</div>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									<Separator />
									{/* Is Featured */}
									<FormField
										control={control}
										name="is_featured"
										render={({ field }) => (
											<FormItem className="space-y-1">
												<FormLabel>Featured Status</FormLabel>
												<FormControl>
													<div className="space-y-2">
														<RadioGroup
															onValueChange={field.onChange}
															value={field.value}
														>
															<div className="flex items-center gap-3 *:cursor-pointer">
																<RadioGroupItem value="true" id="featured-yes" />
																<Label htmlFor="featured-yes">Active</Label>
															</div>
															<div className="flex items-center gap-3 *:cursor-pointer">
																<RadioGroupItem value="false" id="featured-no" />
																<Label htmlFor="featured-no">Inactive</Label>
															</div>
														</RadioGroup>
														<span className="text-muted-foreground text-sm">
															If "Active" is selected then this product will be
															featured on the home page
														</span>
													</div>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									<Separator />
									{/* Free Shipping */}
									<FormField
										control={control}
										name="free_shipping"
										render={({ field }) => (
											<FormItem className="space-y-1">
												<FormLabel>Free Shipping</FormLabel>
												<FormControl>
													<RadioGroup
														onValueChange={field.onChange}
														value={field.value}
													>
														<div className="flex items-center gap-3 *:cursor-pointer">
															<RadioGroupItem value="true" id="shipping-yes" />
															<Label htmlFor="shipping-yes">Yes</Label>
														</div>
														<div className="flex items-center gap-3 *:cursor-pointer">
															<RadioGroupItem value="false" id="shipping-no" />
															<Label htmlFor="shipping-no">No</Label>
														</div>
													</RadioGroup>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</CardContent>
							</Card>
							{/* Optional Attributes */}
							<Card>
								<CardHeader>
									<CardTitle className="text-lg flex gap-2 items-center">
										<span>Attributes</span>
										<span className="text-muted-foreground text-sm">
											(Optional)
										</span>
									</CardTitle>
								</CardHeader>
								<CardContent>
									<FormField
										control={control}
										name="optional_attributes"
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
																			name={`optional_attributes.${index}`}
																			attributeKey={key as AttributeType}
																			options={
																				//@ts-ignore
																				optional_attributes.product_attributes != null ? optional_attributes.product_attributes[key]?.map(
																					(opt: ProductAttribute) => ({
																						id: opt.id,
																						value: opt.value,
																						name: opt.name
																					})
																				) : []
																			}
																			disabled={!optional_attributes}
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