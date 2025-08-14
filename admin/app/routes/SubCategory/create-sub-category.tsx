import { defaults } from "@ecom/shared/constants/constants";
import { queryClient } from "@ecom/shared/lib/query-client/queryClient";
import {
	SubCategoryActionDataSchema,
	SubCategoryInputSchema,
	type SubCategoryFormValues,
} from "@ecom/shared/schemas/category.schema";
import { CategoryService } from "@ecom/shared/services/category.service";
import type { ActionResponse } from "@ecom/shared/types/action-data";
import { ApiError } from "@ecom/shared/utils/ApiError";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import {
	ActionFunctionArgs,
	useActionData,
	useNavigate,
	useNavigation,
	useParams,
	useSubmit,
} from "react-router";
import { toast } from "sonner";
import BackButton from "~/components/Nav/BackButton";
import { MetaDetails } from "~/components/SEO/MetaDetails";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import {
	CustomTagsInputClear,
	TagsInput,
	TagsInputInput,
	TagsInputItem,
	TagsInputList,
} from "~/components/ui/tags-input";
import { Textarea } from "~/components/ui/textarea";

export const action = async ({ request }: ActionFunctionArgs) => {
	const formData = await request.formData();
	console.log("Form data: ", formData);

	const data = {
		sub_category_name: formData.get("sub_category_name") as string,
		description: formData.get("description") as string,
		sort_order: Number(formData.get("sort_order")) as number,
		parent_id: formData.get("parent_id") as string,
		meta_details: {
			meta_title: formData.get("meta_details.meta_title") as string,
			meta_description: formData.get("meta_details.meta_description") as string,
			url_key: formData.get("meta_details.url_key") as string,
			meta_keywords: formData.get("meta_details.meta_keywords") as string,
		},
	};

	const parseResult = SubCategoryActionDataSchema.safeParse(data);
	console.log("Parse result: ", parseResult?.error);

	if (!parseResult.success) {
		return new Response(JSON.stringify({ validationErrors: parseResult.error.flatten().fieldErrors }), {
			status: 400,
			headers: { "Content-Type": "application/json" },
		});
	}
	const { sub_category_name, description, sort_order, meta_details, parent_id } = parseResult.data;

	const categoryService = new CategoryService(request);

	try {
		await categoryService.createSubCategoryWithMeta({
			sub_category_name,
			description: description ?? null,
			sort_order: Number(sort_order) ?? 0,
			parent_id,
			meta_details: {
				meta_title: meta_details.meta_title,
				meta_description: meta_details.meta_description,
				meta_keywords: meta_details.meta_keywords ?? null,
				url_key: meta_details.url_key,
			},
		});

		await queryClient.invalidateQueries({ queryKey: ["subCategories", parent_id] });
		await queryClient.invalidateQueries({ queryKey: ["categories"] });

		return { success: true };
	} catch (error: any) {
		console.error("Error in action:", error);
		const errorMessage =
			error instanceof ApiError ? error.message : error.message || "Failed to create sub category";

		if (error instanceof ApiError && error.details.length) {
			console.error("ApiError details:", error.details);
		}
		return {
			success: false,
			error: errorMessage,
		};
	}
};

export default function CreateCategoryPage() {
	const navigate = useNavigate();
	const submit = useSubmit();
	const navigation = useNavigation();
	const { categoryId } = useParams();

	const actionData: ActionResponse = useActionData();

	const form = useForm<SubCategoryFormValues>({
		resolver: zodResolver(SubCategoryInputSchema),
		mode: "onSubmit",
		defaultValues: {
			sub_category_name: "",
			description: "",
			sort_order: "1",
			parent_id: categoryId ?? "",
			meta_details: {
				meta_title: "",
				meta_description: "",
				url_key: "",
				meta_keywords: [],
			},
		},
	});

	const { handleSubmit, setError, control } = form;

	const isSubmitting = navigation.state === "submitting" && navigation.formMethod === "POST";

	async function onFormSubmit(values: SubCategoryFormValues) {
		const formData = new FormData();

		formData.set("sub_category_name", values.sub_category_name.trim());
		formData.set("description", values.description.trim());
		formData.set("sort_order", values.sort_order ?? "0");
		formData.set("parent_id", values.parent_id);
		formData.set("meta_details.meta_title", values.meta_details.meta_title.trim());
		formData.set("meta_details.meta_description", values.meta_details.meta_description.trim());
		formData.set("meta_details.url_key", values.meta_details.url_key.trim().toLowerCase());
		if (values.meta_details.meta_keywords) {
			const stringifiedKeywords = values.meta_details.meta_keywords
				.map((keyword) => keyword.trim())
				.join(",");
			formData.set("meta_details.meta_keywords", stringifiedKeywords);
		}

		submit(formData, { method: "POST", action: `/categories/${categoryId}/sub-categories/create` });
	}

	useEffect(() => {
		if (actionData) {
			if (actionData.success) {
				toast.success("Sub category created successfully");
				navigate(`/categories/${categoryId}/sub-categories`);
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
				metaTitle="Create Sub Category | Admin Panel"
				metaDescription="Create new product's sub category"
				metaKeywords="Sub Categories, Create, Sub Category"
			/>
			<section className="flex flex-col gap-4">
				<div className="flex gap-4 items-center">
					<BackButton href={`/categories/${categoryId}/sub-categories`} />
					<h1 className="text-2xl font-semibold">Create Sub Category</h1>
				</div>
				<form className="space-y-6" onSubmit={handleSubmit(onFormSubmit)}>
					<Form {...form}>
						{/* ----- Section 1: General ----- */}
						<Card>
							<CardHeader>
								<CardTitle className="text-lg">General</CardTitle>
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
													placeholder="Short description of this sub category"
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								{/* Parent Category */}
								<Input type="text" name="parent_id" value={categoryId} disabled hidden />

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
								<span>Create</span>
							</Button>
						</div>
					</Form>
				</form>
			</section>
		</>
	);
}
