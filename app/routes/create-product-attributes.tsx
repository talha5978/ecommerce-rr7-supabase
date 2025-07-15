import { ActionFunctionArgs, useActionData, useNavigate, useNavigation, useSubmit } from "react-router";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetClose } from "~/components/ui/sheet";
import { Route } from "./+types/create-product-attributes";
import { Button } from "~/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "~/components/ui/form";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ProductAttributesFormValues, ProductAttributesInputSchema } from "~/schemas/product-attributes.schema";
import { Input } from "~/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { product_attributes_enum } from "~/constants";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Info, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useEffect } from "react";
import type { ActionResponse } from "~/types/action-data";
import { ProductAttributesService } from "~/services/attributes.service";
import { queryClient } from "~/lib/queryClient";
import { ApiError } from "~/utils/ApiError";
import { ColorPicker } from "~/components/Custom-Inputs/color-picker";

export const action = async ({ request, params }: ActionFunctionArgs) => {
	const formData = await request.formData();
	console.log("Form data: ", formData);
	const AttributeParam = params.attributeType;

	const parseResult = ProductAttributesInputSchema.safeParse({
		attribute_type: formData.get("attribute_type") as string,
		name: formData.get("name") as string,
		value: formData.get("value") as string,
	});

	if (!parseResult.success) {
		return new Response(
			JSON.stringify({ validationErrors: parseResult.error.flatten().fieldErrors }),
			{ status: 400, headers: { "Content-Type": "application/json" } }
		);
	}

	const { attribute_type, name, value } = parseResult.data;
	
	const attributeService = new ProductAttributesService(request);

	try {
		await attributeService.createProductAttribute({
			attribute_type, name, value
		});

		await queryClient.invalidateQueries({ queryKey: ["productAttributesByType", AttributeParam ?? attribute_type] });
		await queryClient.invalidateQueries({ queryKey: ["productAttributes"] });
		await queryClient.invalidateQueries({ queryKey: ["all_productAttributes"] });

		return { success: true };
	} catch (error:any) {
		console.error("Error in action:", error);
		const errorMessage =
			error instanceof ApiError ? error.message : error.message || "Failed to create category";

		if (error instanceof ApiError && error.details.length) {
			console.error("ApiError details:", error.details);
		}
		return {
			success: false,
			error: errorMessage,
		};
	}
};

export default function CreateProductAttributes({ params }: Route.ComponentProps) {
	const navigate = useNavigate();
	const AttributeParam = params.attributeType;
	const actionData: ActionResponse = useActionData();

	const navigation = useNavigation();
	const isSubmitting =
		navigation.state === "submitting" &&
		navigation.formMethod === "POST";

	const form = useForm<ProductAttributesFormValues>({
		resolver: zodResolver(ProductAttributesInputSchema),
		mode: "onSubmit",
		defaultValues: {
			attribute_type: AttributeParam == null ? "" : AttributeParam,
			name:  "",
			value: "",
		}
	});

	const { setError, control, handleSubmit } = form;
	const submit = useSubmit();
	const watchedAttributeType = useWatch({ control, name: "attribute_type" });

	const onFormSubmit = (data: ProductAttributesFormValues) => {
		const formData = new FormData();

		for (const [key, value] of Object.entries(data)) {
			formData.append(key, value.trim() as keyof ProductAttributesFormValues);
		}

		submit(formData, { method: "POST", action: "" });
	};

	useEffect(() => {
		if (actionData) {
			if (actionData.success) {
				toast.success("Product attribute created successfully");
				navigate(-1);
			} else if (actionData.error) {
				toast.error(actionData.error);
			} else if (actionData.validationErrors) {
				toast.error("Invalid form data. Please check your inputs.");
				Object.entries(actionData.validationErrors).forEach(([field, errors]) => {
					setError(field as keyof ProductAttributesFormValues, { message: errors[0] });
				});
			}
		}
	}, [actionData, navigate]);

    return (
		<Sheet defaultOpen onOpenChange={() => navigate(-1)}>
			<SheetContent>
				<SheetHeader>
					<SheetTitle>Create Attribute</SheetTitle>
					<SheetDescription>
						Create a new attribute here. Click save when you are done.
					</SheetDescription>
				</SheetHeader>
				<form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4 flex flex-col p-4 h-full">
					<Form {...form}>
						<FormField
							control={control}
							name="attribute_type"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Attribute Type</FormLabel>
									<FormControl>
										<div className="*:w-full grid gap-2">
											<Select
												onValueChange={field.onChange}
												value={field.value}
												disabled={AttributeParam != null}
											>
												<SelectTrigger>
													<SelectValue placeholder="Select Attribute Type" />
												</SelectTrigger>
												<SelectContent>
													{product_attributes_enum.map((item) => (
														<SelectItem key={item} value={item}>
															{item.charAt(0).toUpperCase() + String(item).slice(1)}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</div>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={control}
							name="name"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Attribute Name</FormLabel>
									<FormControl>
										<Input placeholder="Small" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={control}
							name="value"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Attribute Value</FormLabel>
									<FormControl>
										{watchedAttributeType !== "color" ? (
											<Input placeholder="S" {...field} />
										) : (
											<span className="flex gap-2">
												<Input placeholder="#FFFFFF" {...field}/>
												<ColorPicker {...field}  />
											</span>
										)}
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<SheetFooter className="self-end px-0">
							<Alert variant="default" className="mb-4">
								<Info />
								<AlertTitle>Recommendation</AlertTitle>
								<AlertDescription>
									The recommendd way for attribute's name is "Abccc" and value is "
									{watchedAttributeType != "color" &&
									watchedAttributeType != "size"
										? "abcdef"
										: "S"}
									".
								</AlertDescription>
							</Alert>
							<Button type="submit" disabled={isSubmitting}>
								{isSubmitting && <Loader2 className="animate-spin" />}
								<span>Save</span>
							</Button>
							<SheetClose asChild>
								<Button variant="outline">Close</Button>
							</SheetClose>
						</SheetFooter>
					</Form>
				</form>
			</SheetContent>
		</Sheet>
	);
};