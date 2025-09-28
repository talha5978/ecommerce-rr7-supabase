import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { ActionFunctionArgs, useActionData, useNavigate, useNavigation, useSubmit } from "react-router";
import BackButton from "~/components/Nav/BackButton";
import { MetaDetails } from "~/components/SEO/MetaDetails";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "~/components/ui/form";
import { Card, CardContent } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { Button } from "~/components/ui/button";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { toast } from "sonner";
import { queryClient } from "@ecom/shared/lib/query-client/queryClient";
import { ApiError } from "@ecom/shared/utils/ApiError";
import type { ActionResponse } from "@ecom/shared/types/action-data";
import { HERO_SECTION_DIMENSIONS } from "@ecom/shared/constants/constants";
import {
	HeroSectionCreateActionDataSchema,
	type HeroSectionCreateFormValues,
	HeroSectionCreateSchema,
} from "@ecom/shared/schemas/hero-section.schema";
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";
import { Label } from "~/components/ui/label";
import ImageInput from "~/components/Custom-Inputs/image-input";
import { HeroSectionsService } from "@ecom/shared/services/hero-sections.service";

export const action = async ({ request }: ActionFunctionArgs) => {
	const formData = await request.formData();
	console.log("Form data: ", formData);

	const data = {
		description: formData.get("description") as string,
		sort_order: Number(formData.get("sort_order")) as number,
		status: formData.get("status") as string,
		url: formData.get("url") as string,
		image: formData.get("image") as File,
	};

	const parseResult = HeroSectionCreateActionDataSchema.safeParse(data);
	console.log("Parse result: ", parseResult?.error);

	if (!parseResult.success) {
		return new Response(JSON.stringify({ validationErrors: parseResult.error.flatten().fieldErrors }), {
			status: 400,
			headers: { "Content-Type": "application/json" },
		});
	}

	const heroSectionsSvc = new HeroSectionsService(request);

	try {
		await heroSectionsSvc.createHeroSection(parseResult.data);

		await queryClient.invalidateQueries({ queryKey: ["highLvlHeroSections"] });
		await queryClient.invalidateQueries({ queryKey: ["fp_hero_sections"] });

		return { success: true };
	} catch (error: any) {
		const errorMessage =
			error instanceof ApiError ? error.message : error.message || "Failed to create new hero section";

		return {
			success: false,
			error: errorMessage,
		};
	}
};

export const loader = async () => {
	return null;
};

export default function HeroSectionCreatePage() {
	const navigate = useNavigate();
	const submit = useSubmit();
	const navigation = useNavigation();

	const actionData: ActionResponse = useActionData();

	const form = useForm<HeroSectionCreateFormValues>({
		resolver: zodResolver(HeroSectionCreateSchema),
		mode: "onSubmit",
		defaultValues: {
			image: undefined,
			description: "",
			sort_order: "1",
			url: "",
			status: "true",
		},
	});

	const { handleSubmit, setError, control } = form;

	const isSubmitting = navigation.state === "submitting" && navigation.formMethod === "POST";

	async function onFormSubmit(values: HeroSectionCreateFormValues) {
		const formData = new FormData();

		formData.set("description", values.description.trim());
		formData.set("status", values.status ?? "true");
		formData.set("sort_order", values.sort_order ?? "0");
		formData.set("url", values.url.trim().toLowerCase());
		formData.set("image", values.image);

		submit(formData, { method: "POST", encType: "multipart/form-data" });
	}

	useEffect(() => {
		if (actionData) {
			if (actionData.success) {
				toast.success("Hero section created successfully");
				navigate("/hero-sections");
			} else if (actionData.error) {
				toast.error(actionData.error);
			} else if (actionData.validationErrors) {
				toast.error("Invalid form data. Please check your inputs.");
				Object.entries(actionData.validationErrors).forEach(([field, errors]) => {
					setError(field as keyof HeroSectionCreateFormValues, { message: errors[0] });
				});
			}
		}
	}, [actionData, navigate]);

	return (
		<>
			<MetaDetails
				metaTitle="Create Hero Section | Admin Panel"
				metaDescription="Create new product category"
				metaKeywords="Categories, Create, Hero Section, Product Hero Section"
			/>
			<section className="flex flex-col gap-4">
				<div className="flex gap-4 items-center">
					<BackButton href="/categories" />
					<h1 className="text-2xl font-semibold">Create Hero Section</h1>
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
								<span>Create</span>
							</Button>
						</div>
					</Form>
				</form>
			</section>
		</>
	);
}
