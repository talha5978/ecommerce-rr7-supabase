import { useActionData, useNavigate, useNavigation, useParams, useSubmit } from "react-router";
import { MetaDetails } from "~/components/SEO/MetaDetails";
import type { Route } from "./+types/update-hero-section";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useEffect } from "react";
import { toast } from "sonner";
import BackButton from "~/components/Nav/BackButton";
import { Loader2 } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "~/components/ui/form";
import { Textarea } from "~/components/ui/textarea";
import { Input } from "~/components/ui/input";
import { queryClient } from "@ecom/shared/lib/query-client/queryClient";
import { ApiError } from "@ecom/shared/utils/ApiError";
import type { ActionResponse } from "@ecom/shared/types/action-data";
import { HERO_SECTION_DIMENSIONS } from "@ecom/shared/constants/constants";
import { getHeroSectionByIdQuery } from "~/queries/hero-sections.q";
import {
	HeroSectionUpdateFormValues,
	HeroSectionUpdateSchema,
	HeroSecUpdateActionDataSchema,
	HeroUpdateActionData,
} from "@ecom/shared/schemas/hero-section.schema";
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";
import { Label } from "~/components/ui/label";
import ImageInput from "~/components/Custom-Inputs/image-input";
import { HeroSectionsService } from "@ecom/shared/services/hero-sections.service";
import { Breadcrumbs } from "~/components/SEO/BreadCrumbs";

const getFieldsToCheck = () => {
	return ["url", "description", "sort_order", "status", "image"] as const;
};

export const action = async ({ request, params }: Route.ActionArgs) => {
	const hero_section_id = (params.hero_section_id as string) || "";
	if (!hero_section_id || hero_section_id == "") {
		throw new Response("Hero section ID is required", { status: 400 });
	}

	const formData = await request.formData();
	// console.log("Form data: ", formData);

	const fields = getFieldsToCheck();

	const data: Partial<HeroUpdateActionData> = {};

	for (const field of fields) {
		if (formData.has(field)) {
			if (field === "sort_order") {
				data.sort_order = parseInt(formData.get(field) as string, 10);
			} else {
				data[field] = formData.get(field) as string;
			}
		}
	}

	// Validate parsed data
	const parseResult = HeroSecUpdateActionDataSchema.safeParse(data);
	// console.log("Parse result:", parseResult?.error); // Debug

	if (!parseResult.success) {
		return new Response(JSON.stringify({ validationErrors: parseResult.error.flatten().fieldErrors }), {
			status: 400,
			headers: { "Content-Type": "application/json" },
		});
	}
	// console.log(parseResult.data);

	const heroSectionsSvc = new HeroSectionsService(request);

	try {
		await heroSectionsSvc.updateHeroSection(Number(hero_section_id), parseResult.data);

		await queryClient.invalidateQueries({ queryKey: ["highLvlHeroSections"] });
		await queryClient.invalidateQueries({ queryKey: ["getHeroSectionById", Number(hero_section_id)] });
		await queryClient.invalidateQueries({ queryKey: ["fp_hero_sections"] });

		return { success: true };
	} catch (error: any) {
		const errorMessage =
			error instanceof ApiError ? error.message : error.message || "Failed to update hero section";

		return {
			success: false,
			error: errorMessage,
		};
	}
};

export const loader = async ({ params, request }: Route.LoaderArgs) => {
	const id = (params.hero_section_id as string) || "";
	if (!id || id == "") {
		throw new Response("Hero section ID is required", { status: 400 });
	}

	const data = await queryClient.fetchQuery(getHeroSectionByIdQuery({ request, id: Number(id) }));

	return {
		data,
	};
};

export default function UpdateHeroSectionForm({
	loaderData: {
		data: { hero_section, error },
	},
}: Route.ComponentProps) {
	const navigate = useNavigate();

	useEffect(() => {
		if (error || hero_section == null) {
			toast.error(error?.message || "Unkown error occured. Please try again later.");
			navigate("/hero-sections");
		}
	}, [error]);

	const navigation = useNavigation();

	const actionData: ActionResponse = useActionData();

	const form = useForm<HeroSectionUpdateFormValues>({
		resolver: zodResolver(HeroSectionUpdateSchema),
		mode: "onSubmit",
		defaultValues: {
			image: hero_section?.image ?? "",
			description: hero_section?.description ?? "",
			sort_order: String(hero_section?.sort_order) ?? "1",
			status: String(hero_section?.status) ?? "false",
			url: hero_section?.url ?? "",
		},
	});

	const { handleSubmit, setError, control } = form;
	const submit = useSubmit();

	const isSubmitting = navigation.state === "submitting" && navigation.formMethod === "POST";

	async function onFormSubmit(values: HeroSectionUpdateFormValues) {
		if (hero_section == null || !hero_section.id) {
			toast.error("Hero section not found");
			return;
		}

		const normalizedValues = {
			description: values.description.trim(),
			sort_order: values?.sort_order?.toString() || "1",
			url: values.url.trim().toLowerCase(),
			status: values.status ?? "false",
			image: values.image,
		};

		const fields = getFieldsToCheck();

		const formData = new FormData();
		let hasChanges = false;

		// Compare top-level category fields
		for (const field of fields) {
			if (normalizedValues[field] !== String(hero_section[field])) {
				formData.set(field, normalizedValues[field]);
				hasChanges = true;
			}
		}

		// If no changes, notify user
		if (!hasChanges) {
			toast.info("No changes to save");
			return;
		}

		// console.log("Submitting changed fields:", Object.fromEntries(formData));

		submit(formData, {
			method: "POST",
			action: `/hero-sections/${hero_section.id}/update`,
			encType: "multipart/form-data",
		});
	}

	useEffect(() => {
		if (actionData) {
			if (actionData.success) {
				toast.success("Hero section updated successfully");
				navigate("/hero-sections");
			} else if (actionData.error) {
				toast.error(actionData.error);
			} else if (actionData.validationErrors) {
				toast.error("Invalid form data. Please check your inputs.");
				Object.entries(actionData.validationErrors).forEach(([field, errors]) => {
					setError(field as keyof HeroUpdateActionData, { message: errors[0] });
				});
			}
		}
	}, [actionData, navigate]);

	return (
		<>
			<MetaDetails
				metaTitle="Update Hero Sections | Admin Panel"
				metaDescription="Update product category"
				metaKeywords="Update Hero Sections, Update"
			/>
			<Breadcrumbs
				params={{ id: String(hero_section?.id) ?? String(useParams().hero_section_id) ?? "" }}
			/>
			<section className="flex flex-col gap-4">
				<div className="flex gap-4 items-center">
					<BackButton href="/hero-sections" />
					<h1 className="text-2xl font-semibold">Update Hero Sections</h1>
				</div>
				<form className="space-y-6" onSubmit={handleSubmit(onFormSubmit)}>
					<Form {...form}>
						<Card>
							<CardContent className="space-y-4">
								{/* Description */}
								<FormField
									control={control}
									name="description"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Description</FormLabel>
											<FormControl>
												<Textarea
													placeholder="Short description for this hero section..."
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								{/* Image Upload */}
								<FormField
									control={control}
									name="image"
									render={() => (
										<FormItem>
											<FormLabel>Image</FormLabel>
											<FormControl>
												<ImageInput
													name="image"
													dimensions={HERO_SECTION_DIMENSIONS}
													className="aspect-[16/9] max-w-[400px]"
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

								{/* Status */}
								<FormField
									control={control}
									name="status"
									render={({ field }) => (
										<FormItem className="space-y-1">
											<FormLabel>Status</FormLabel>
											<FormControl>
												<RadioGroup
													onValueChange={field.onChange}
													value={field.value}
												>
													<div className="flex items-center gap-3 *:cursor-pointer">
														<RadioGroupItem value="true" id="status-active" />
														<Label htmlFor="status-active">Active</Label>
													</div>
													<div className="flex items-center gap-3 *:cursor-pointer">
														<RadioGroupItem value="false" id="status-inactive" />
														<Label htmlFor="status-inactive">Inactive</Label>
													</div>
												</RadioGroup>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={control}
									name="url"
									render={({ field }) => (
										<FormItem>
											<div className="flex gap-2">
												<FormLabel>URL</FormLabel>
												<span className="text-muted-foreground text-sm">
													(Without spaces)
												</span>
											</div>
											<FormControl>
												<Input placeholder="e.g. collections/1234" {...field} />
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
