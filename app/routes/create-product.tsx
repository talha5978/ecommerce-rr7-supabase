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
import { useEffect } from "react";
import {
	TagsInput,
	TagsInputClear,
	TagsInputInput,
	TagsInputItem,
	TagsInputList,
} from "~/components/ui/tags-input";
import { defaults } from "~/constants";
import { toast } from "sonner";
import { ApiError } from "~/utils/ApiError";
import { ActionResponse } from "~/types/action-data";
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";
import { Label } from "~/components/ui/label";
import { ProductActionDataSchema, ProductFormValues, ProductInputSchema } from "~/schemas/product.schema";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { categoriesQuery } from "~/queries/categories.q";
import { Route } from "./+types/create-product";
import ImageInput from "~/components/Custom-Inputs/image-input";
import { ProductsService } from "~/services/products.service";

export const action = async ({ request }: ActionFunctionArgs) => {
	const formData = await request.formData();
	// console.log("Form data: ", formData);

	const data = {
		name: formData.get("name") as string,
		description: formData.get("description") as string,
		cover_image: formData.get("cover_image") as File,
		sub_category: formData.get("sub_category") as string,
		status: formData.get("status") as string,
		free_shipping: formData.get("free_shipping") as string,
		is_featured: formData.get("is_featured") as string,
		meta_details: {
			meta_title: formData.get("meta_details.meta_title") as string,
			meta_description: formData.get("meta_details.meta_description") as string,
			url_key: formData.get("meta_details.url_key") as string,
			meta_keywords: formData.get("meta_details.meta_keywords"),
		},
	};

	const parseResult = ProductActionDataSchema.safeParse(data);
	console.log("Parse result: ", parseResult?.error);

	if (!parseResult.success) {
		return new Response(JSON.stringify({ validationErrors: parseResult.error.flatten().fieldErrors }), {
			status: 400,
			headers: { "Content-Type": "application/json" },
		});
	}

	// console.log("Data in the action: ", parseResult.data);
	
	const productService = new ProductsService(request);
	// return;
	try {
		
		await productService.createProductWithMeta(parseResult.data);

		queryClient.invalidateQueries({ queryKey: ["products"] });

		return { success: true };
	} catch (error: any) {
		console.error("Error in action:", error);
		const errorMessage =
			error instanceof ApiError ? error.message : error.message || "Failed to create product";

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
	const data = await queryClient.fetchQuery(categoriesQuery({
		request, pageIndex : 0, pageSize: 50, q: "" 
	}));
	// console.log(data);
	
	return { data };
};

export default function CreateBasicProductPage({ loaderData : { data } } : Route.ComponentProps) {
	const navigate = useNavigate();

	useEffect(() => {
		if (data.error) {
			toast.error(data.error.message);
			navigate("/products");
		}
	}, [data.error]);

	const submit = useSubmit();
	const navigation = useNavigation();

	const actionData: ActionResponse = useActionData();

	const form = useForm<ProductFormValues>({
		resolver: zodResolver(ProductInputSchema),
		mode: "onSubmit",
		defaultValues: {
			cover_image: undefined,
			description: "",
			free_shipping: "false",
			is_featured: "false",
			name: "",
			status: "true",
			category: "",
			sub_category: "",
			meta_details: {
				meta_title: "",
				meta_description: "",
				url_key: "",
				meta_keywords: [],
			},
		},
	});

	const { handleSubmit, setError, control, resetField, register } = form;

	// Watch the category field
	const selectedCategory = useWatch({
		control,
		name: "category",
	});

	// Reset sub_category when category changes
	useEffect(() => {
		resetField("sub_category");
	}, [selectedCategory, resetField]);

	// Filter subcategories based on selected category
	const categories = data?.categories || [];
	const subCategories = categories.find((cat) => cat.id === selectedCategory)?.sub_category || [];

	const isSubmitting = navigation.state === "submitting" && navigation.formMethod === "POST";

	async function onFormSubmit(values: ProductFormValues) {
		const formData = new FormData();
		
		formData.set("name", values.name.trim());
		formData.set("description", values.description.trim());
		formData.set("cover_image", values.cover_image);
		formData.set("free_shipping", values.free_shipping ?? "false");
		formData.set("is_featured", values.is_featured ?? "false");
		formData.set("status", values.status ?? "true");
		formData.set("sub_category", values.sub_category);
		formData.set("meta_details.meta_title", values.meta_details.meta_title.trim());
		formData.set("meta_details.meta_description", values.meta_details.meta_description.trim());
		formData.set("meta_details.url_key", values.meta_details.url_key.trim().toLowerCase());
		if (values.meta_details.meta_keywords) {
			const stringifiedKeywords = values.meta_details.meta_keywords
				.map((keyword) => keyword.trim())
				.join(",");
			formData.set("meta_details.meta_keywords", stringifiedKeywords);
		}
		
		submit(formData, {
			method: "POST",
			action: "/products/create",
			encType: "multipart/form-data"
		});
	}
	
	useEffect(() => {
		if (actionData) {
			if (actionData.success) {
				toast.success("Product created successfully");
				toast.info("Now create atleast one variant for this product");
				navigate(`/products`);
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
			<MetaDetails metaTitle="Create Product | Admin Panel" metaDescription="Create new product" />
			<section className="flex flex-col gap-4">
				<div className="flex gap-4 items-center">
					<BackButton href="/products" />
					<h1 className="text-2xl font-semibold">Create Product</h1>
				</div>

				<form className="grid grid-cols-1 md:grid-cols-3 gap-4" onSubmit={handleSubmit(onFormSubmit)}>
					<Form {...form}>
						{/* Left Side: Basic Details and Meta Details */}
						<div className="md:col-span-2 space-y-4">
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
																	{categories.map((category) => (
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
														<Link to="/categories/create" viewTransition className="">
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
																	{subCategories.length > 0 ? (
																		subCategories.map((subCategory) => (
																			<SelectItem
																				key={subCategory.id}
																				value={subCategory.id}
																			>
																				{subCategory.sub_category_name}
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
														<Link to={`/categories/${selectedCategory}/sub-categories/create`} viewTransition>
															<Button variant="outline" size="icon" disabled={!selectedCategory}>
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
													<Input placeholder="e.g. Striped Polo T-Shirt" {...field} />
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
																<div className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive cursor-pointer border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 size-9 max-sm:w-full">
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

						{/* Right Side: Visibility and Shipping Card */}
						<Card className="md:col-span-1 h-fit">
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
											<FormLabel>Featured</FormLabel>
											<FormControl>
												<div className="space-y-2">
													<RadioGroup
														onValueChange={field.onChange}
														value={field.value}
													>
														<div className="flex items-center gap-3 *:cursor-pointer">
															<RadioGroupItem value="true" id="featured-yes" />
															<Label htmlFor="featured-yes">Yes</Label>
														</div>
														<div className="flex items-center gap-3 *:cursor-pointer">
															<RadioGroupItem value="false" id="featured-no" />
															<Label htmlFor="featured-no">No</Label>
														</div>
													</RadioGroup>
													<span className="text-muted-foreground text-sm">
														If "Yes" is selected then this product will be
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