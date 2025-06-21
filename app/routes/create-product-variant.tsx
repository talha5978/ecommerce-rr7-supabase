import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { ActionFunctionArgs, Link, LoaderFunctionArgs, useActionData, useNavigate, useNavigation, useSubmit } from "react-router";
import BackButton from "~/components/Nav/BackButton";
import { MetaDetails } from "~/components/SEO/MetaDetails";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "~/components/ui/form";
import { queryClient } from "~/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Separator } from "~/components/ui/separator";
import { Button } from "~/components/ui/button";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { toast } from "sonner";
import { ApiError } from "~/utils/ApiError";
import { ActionResponse } from "~/types/action-data";
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";
import { Label } from "~/components/ui/label";
import { Route } from "./+types/create-product-variant";
import { ProductVariantActionDataSchema, ProductVariantFormValues, ProductVariantInputSchema } from "~/schemas/product-variants.schema";
import MultipleImagesInput from "~/components/Custom-Inputs/multiple-images-input";
import { AllProductAttributesQuery } from "~/queries/product-attributes.q";
import AttributeSelect from "~/components/Custom-Inputs/attributes-select";
import { ProductAttribute } from "~/types/product-attributes";
import { ProductVariantsService } from "~/services/product-variants.service";

export const action = async ({ request, params }: Route.ActionArgs) => {
	const formData = await request.formData();
	console.log("Form data: ", formData);
	const productId = params.productId as string || ""

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
	}

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

		queryClient.invalidateQueries({ queryKey: ["products"] });
		queryClient.invalidateQueries({ queryKey: ["productVariants", productId] });
		queryClient.invalidateQueries({ queryKey: ["fullProduct", productId] });

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
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
	const data = await queryClient.fetchQuery(AllProductAttributesQuery({ request }));
	
	return { data };
};

export default function CreateProductVariantPage({
	params,
	loaderData: { data: { product_attributes, error } },
} : Route.ComponentProps) {
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
	const Required_Attributes = ["color", "size"];

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
			weight: "0",
			required_attributes: Array(Required_Attributes.length).fill(""),
			optional_attributes: Array(
				attributeKeys.filter((key) => !Required_Attributes.includes(key)).length
			).fill(null),
		},
	});

	const { handleSubmit, setError, control } = form;

	const isSubmitting = navigation.state === "submitting" && navigation.formMethod === "POST";
	
	async function onFormSubmit(values: ProductVariantFormValues) {
		const formData = new FormData();

		const finalAttributes = [...values.required_attributes, ...values.optional_attributes].filter((attr) => attr !== null);
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
			encType: "multipart/form-data"
		});
	}
	
	useEffect(() => {
		if (actionData) {
			if (actionData.success) {
				toast.success("Product variant created successfully");
				navigate(`/products/${productId}/variants/create`);
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
			<section className="flex flex-col gap-4">
				<div className="flex gap-4 items-center">
					<BackButton href={`/products/${productId}/variants`} />
					<h1 className="text-2xl font-semibold">Create Variant</h1>
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

						{/* Right Side: Variant Options & Stock Card */}
						<Card className="h-fit">
							<CardHeader>
								<CardTitle className="text-lg">Variant Options & Stock</CardTitle>
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
														the store
													</span>
												</div>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<Separator />
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
													<span className="text-muted-foreground text-sm">
														If "Yes" is selected then this variant will be auto
														selected at first load
													</span>
												</div>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<Separator />
								{/* Weight */}
								<FormField
									control={control}
									name="weight"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Weight</FormLabel>
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
														Kg
													</Button>
												</div>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<Separator />
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
													min={1}
													minLength={1}
													placeholder="e.g. 200"
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<Separator />
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
														email about the low stock
													</span>
												</div>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<Separator />
								<div className="flex flex-col gap-4">
									<Label htmlFor="attributes">Attributes</Label>
									{/* Required Attributes */}
									<div className="space-y-3 ml-2" id="attributes">
										<FormField
											control={control}
											name="required_attributes"
											render={({ fieldState }) => (
												<FormItem>
													<FormLabel>Required</FormLabel>
													<FormControl>
														<div className="space-y-4">
															{attributeKeys.filter((key) => Required_Attributes.includes(key)).map((key, index) => (
																<div
																	key={key}
																	className="grid grid-cols-1"
																>
																	<FormItem>
																		<FormControl>
																			<AttributeSelect
																				name={`required_attributes.${index}`}
																				attributeKey={key}
																				options={
																					//@ts-ignore
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
													{fieldState.error?.message && (
														<FormMessage>{fieldState.error?.message}</FormMessage>
													)}
												</FormItem>
											)}
										/>
										{/* Optional Attributes */}
										<FormField
											control={control}
											name="optional_attributes"
											render={() => (
												<FormItem>
													<FormLabel>Optional</FormLabel>
													<FormControl>
														<div className="space-y-4">
															{attributeKeys.filter((key) => !Required_Attributes.includes(key)).map((key, index) => (
																<div
																	key={key}
																	className="grid grid-cols-1"
																>
																	<FormItem>
																		<FormControl>
																			<AttributeSelect
																				name={`optional_attributes.${index}`}
																				attributeKey={key}
																				options={
																					//@ts-ignore
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
									</div>
								</div>
							</CardContent>
						</Card>

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