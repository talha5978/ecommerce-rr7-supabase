import { ActionFunctionArgs, LoaderFunctionArgs, Params, useActionData, useNavigate, useNavigation, useSubmit } from "react-router";
import { MetaDetails } from "~/components/SEO/MetaDetails";
import { queryClient } from "~/lib/queryClient";
import { singleSubCategoryQuery } from "~/queries/categories.q";
import { Route } from "./+types/update-sub-category";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { SubCategoryActionData, SubCategoryFormValues, SubCategoryInputSchema, SubCategoryUpdateActionDataSchema } from "~/schemas/category.schema";
import { useEffect } from "react";
import { toast } from "sonner";
import BackButton from "~/components/Nav/BackButton";
import { Loader2 } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "~/components/ui/card";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "~/components/ui/form";
import { CustomTagsInputClear, TagsInput, TagsInputClear, TagsInputInput, TagsInputItem, TagsInputList } from "~/components/ui/tags-input";
import { Textarea } from "~/components/ui/textarea";
import { defaults } from "~/constants";
import { Input } from "~/components/ui/input";
import { ApiError } from "~/utils/ApiError";
import { CategoryService } from "~/services/category.service";
import { ActionResponse } from "~/types/action-data";
import { getSanitizedMetaDetailsForAction, getSanitizedMetaDetailsForForm } from "~/utils/getSanitizedMetaDetails";

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
    const subCategoryId = (params.subCategoryId as string) || "";
    if (!subCategoryId || subCategoryId == "") {
        throw new Response("Sub category ID is required", { status: 400 });
    }

    const data = await queryClient.fetchQuery(
        singleSubCategoryQuery({ request, subCategoryId })
    );

    return {
		data,
	};
};

export const action = async ({ request, params } : ActionFunctionArgs) => {
	const subCategoryId = (params.subCategoryId as string) || "";
	const parentCategoryId = (params.categoryId as string) || "";
	
	if (!subCategoryId || subCategoryId == "") {
		throw new Response("Category ID is required", { status: 400 });
	}

	const formData = await request.formData();
	// console.log("Form data: ", formData);
	const categoryFields = ["sub_category_name", "description", "sort_order"] as const;

	const data: Partial<SubCategoryActionData> = {};

	for (const field of categoryFields) {
		if (formData.has(field)) {
			if (field === "sort_order") {
				data.sort_order = parseInt(formData.get(field) as string, 10);
			} else {
				data[field] = formData.get(field) as string;
			}
		}
	}

	getSanitizedMetaDetailsForAction({ formData, data });
	// Validate parsed data
	const parseResult = SubCategoryUpdateActionDataSchema.safeParse(data);
	// console.log("Parse result:", parseResult?.error); // Debug

	if (!parseResult.success) {
		return new Response(JSON.stringify({ validationErrors: parseResult.error.flatten().fieldErrors }), {
			status: 400,
			headers: { "Content-Type": "application/json" },
		});
	}
	// console.log(parseResult.data);

	const categoryService = new CategoryService(request);

	try {
		await categoryService.updateSubCategory(subCategoryId, parseResult.data);

		await queryClient.invalidateQueries({ queryKey: ["subCategories", parentCategoryId] });
		await queryClient.invalidateQueries({ queryKey: ["subCategory", subCategoryId] });
		return { success: true };
	} catch (error: any) {
		console.error("Error in update action:", error);
		const errorMessage =
			error instanceof ApiError ? error.message : error.message || "Failed to update sub category";

		if (error instanceof ApiError && error.details.length) {
			console.error("ApiError details:", error.details);
		}
		return {
			success: false,
			error: errorMessage,
		};
	}
};

export default function UpdateCategoryForm({
	loaderData: {
		data: { sub_category, error }
	},
}: Route.ComponentProps) {
    const navigate = useNavigate();
	
    useEffect(() => {
        if (error) {
            toast.error(error.message);
            navigate("/categories");
        }
    }, [error]);

	const navigation = useNavigation();

	const actionData: ActionResponse = useActionData();

	const form = useForm<SubCategoryFormValues>({
		resolver: zodResolver(SubCategoryInputSchema),
		mode: "onSubmit",
		defaultValues: {
			sub_category_name: sub_category?.sub_category_name || "",
			description: sub_category?.description || "",
			sort_order: String(sub_category?.sort_order) || "1",
			meta_details: {
				meta_title: sub_category?.meta_details?.meta_title || "",
				meta_description: sub_category?.meta_details?.meta_description || "",
				url_key: sub_category?.meta_details?.url_key || "",
				meta_keywords: sub_category?.meta_details?.meta_keywords
					? sub_category?.meta_details?.meta_keywords?.split(",")
					: [],
			},
			parent_id: sub_category?.parent_id || "",
		},
	});
	// Ye check kro k kam si se chl rha hai ya ni sub category ko update krnay wala!
	
	const { handleSubmit, setError, control } = form;
    const submit = useSubmit();

    const isSubmitting = navigation.state === "submitting" && navigation.formMethod === "POST";
	
    async function onFormSubmit(values: SubCategoryFormValues) {
		console.log("Form submitted");
		if (!sub_category) {
			toast.error("Sub category not found");
			return;
		}

		const normalizedValues = {
			sub_category_name: values.sub_category_name.trim(),
			description: values.description.trim(),
			sort_order: values.sort_order?.toString() || "0",
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
		};

        const categoryFields = ["sub_category_name", "description", "sort_order"] as const;

		const formData = new FormData();
		let hasChanges = false;
        
		// Compare top-level category fields
		for (const field of categoryFields) {
			if (normalizedValues[field] !== String(sub_category[field])) {
				formData.set(field, normalizedValues[field]);
				hasChanges = true;
			}
		}

		const { hasChanges: hasMetaChanges } = getSanitizedMetaDetailsForForm({
			formData,
			normalizedValues,
			entity: sub_category,
			hasChanges,
		});

		hasChanges = hasChanges || hasMetaChanges;
        
		// If no changes, notify user
		if (!hasChanges) {
			toast.info("No changes to save");
			return;
		}

		// console.log("Submitting changed fields:", Object.fromEntries(formData));
		console.log("Submitting changed fields:", formData);
		
		submit(formData, { 
			method: "POST", 
			action: `/categories/${sub_category?.parent_id}/sub-categories/${sub_category?.id}/update`
		});
	}

    useEffect(() => {
        if (actionData) {
            if (actionData.success) {
                toast.success("Sub category updated successfully");
                navigate(`/categories/${sub_category?.parent_id}/sub-categories`);
            } else if (actionData.error) {
                toast.error(actionData.error);
            } else if (actionData.validationErrors) {
                toast.error("Invalid form data. Please check your inputs.");
                Object.entries(actionData.validationErrors).forEach(([field, errors]) => {
                    setError(field as keyof SubCategoryFormValues, { message: errors[0] });
                });
            }
        }
    }, [actionData, navigate]);

	return (
		<>
			<MetaDetails
				metaTitle="Update Sub Category | Admin Panel"
				metaDescription="Update product's sub category"
				metaKeywords="Update Sub Category, Update"
			/>
			<section className="flex flex-col gap-4">
				<div className="flex gap-4 items-center">
					<BackButton href={`/categories/${sub_category?.parent_id}/sub-categories`} />
					<h1 className="text-2xl font-semibold">Update Sub Category</h1>
				</div>
				<form className="space-y-6" onSubmit={handleSubmit(onFormSubmit)}>
					<Form {...form}>
						{/* ----- Section 1: Basic Details ----- */}
						<Card>
							<CardHeader>
								<CardTitle className="text-lg">Basic Details</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								{/* Category Name */}
								<FormField
									control={control}
									name="sub_category_name"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Sub Category Name</FormLabel>
											<FormControl>
												<Input placeholder="e.g. Shirts" {...field} />
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
													placeholder="Short description of this category"
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								{/* Sort Order */}
								<FormField
									control={control}
									name="sort_order"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Sort Order</FormLabel>
											<FormControl>
												<Input type="number" placeholder="0" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<Input type="text" value={sub_category?.parent_id} disabled hidden />
							</CardContent>
						</Card>

						{/* ----- Section 2: SEO & Meta Details ----- */}
						<Card>
							<CardHeader>
								<CardTitle className="text-lg">SEO &amp; Meta Attributes</CardTitle>
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
												<Input placeholder="e.g. Best Women Shirts" {...field} />
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
												<Textarea placeholder="A short summary for SEO" {...field} />
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
													max={defaults.META_KEYWORDS_VALUE}
													editable
													addOnPaste
													className="w-full"
													aria-invalid={!!fieldState.error}
												>
													<div className="flex sm:flex-row flex-col gap-2">
														<TagsInputList>
															{field.value != undefined &&
															Array.isArray(field.value)
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
														<CustomTagsInputClear />
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

						{/* Submit Button */}
						<div className="flex justify-end">
							<Button type="submit" disabled={isSubmitting}>
								{isSubmitting && <Loader2 className="animate-spin" />}
								<span>Update</span>
							</Button>
						</div>
					</Form>
				</form>
			</section>
		</>
	);
}