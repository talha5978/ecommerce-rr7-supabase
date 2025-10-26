import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useActionData, useNavigate, useNavigation, useSubmit } from "react-router";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import {
	Sheet,
	SheetClose,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
} from "~/components/ui/sheet";
import { Route } from "./+types/create-tax-type";
import type { ActionResponse } from "@ecom/shared/types/action-data";
import { queryClient } from "@ecom/shared/lib/query-client/queryClient";
import { ApiError } from "@ecom/shared/utils/ApiError";
import { IconBulb } from "@tabler/icons-react";
import { CreateTaxTypeSchema, type CreateTaxTypeFormValues } from "@ecom/shared/schemas/taxes.schema";
import { TaxesService } from "@ecom/shared/services/taxes.service";

export const action = async ({ request }: Route.ActionArgs) => {
	const formData = await request.formData();
	// console.log("Form data: ", formData);

	const parseResult = CreateTaxTypeSchema.safeParse({
		name: formData.get("name") as string,
	});

	if (!parseResult.success) {
		return new Response(JSON.stringify({ validationErrors: parseResult.error.flatten().fieldErrors }), {
			status: 400,
			headers: { "Content-Type": "application/json" },
		});
	}

	const { name } = parseResult.data;

	const taxService = new TaxesService(request);

	try {
		await taxService.createNewTaxType({ name });

		await queryClient.invalidateQueries({ queryKey: ["tax_types"] });

		return { success: true };
	} catch (error: any) {
		const errorMessage =
			error instanceof ApiError ? error.message : error.message || "Failed to create new tax type";

		return {
			success: false,
			error: errorMessage,
		};
	}
};

export default function CreateNewTaxPage() {
	const navigate = useNavigate();
	const actionData: ActionResponse = useActionData();

	const navigation = useNavigation();
	const isSubmitting = navigation.state === "submitting" && navigation.formMethod === "POST";

	const form = useForm<CreateTaxTypeFormValues>({
		resolver: zodResolver(CreateTaxTypeSchema),
		mode: "onSubmit",
		defaultValues: {
			name: "",
		},
	});

	const { setError, control, handleSubmit } = form;
	const submit = useSubmit();

	const onFormSubmit = (data: CreateTaxTypeFormValues) => {
		const formData = new FormData();

		for (const [key, value] of Object.entries(data)) {
			formData.append(key, value.trim() as keyof CreateTaxTypeFormValues);
		}

		submit(formData, { method: "POST", action: "" });
	};

	useEffect(() => {
		if (actionData) {
			if (actionData.success) {
				toast.success("Tax type created successfully");
				navigate(-1);
			} else if (actionData.error) {
				toast.error(actionData.error);
			} else if (actionData.validationErrors) {
				toast.error("Invalid form data. Please check your inputs.");
				Object.entries(actionData.validationErrors).forEach(([field, errors]) => {
					setError(field as keyof CreateTaxTypeFormValues, { message: errors[0] });
				});
			}
		}
	}, [actionData, navigate]);

	return (
		<Sheet defaultOpen onOpenChange={() => navigate("/settings/taxes")}>
			<SheetContent>
				<SheetHeader>
					<SheetTitle>Create Tax Type</SheetTitle>
					<SheetDescription>
						Create a new tax type to divide the tax rates. Click save when you are done.
					</SheetDescription>
				</SheetHeader>
				<form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4 flex flex-col p-4 h-full">
					<Form {...form}>
						<FormField
							control={control}
							name="name"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Name</FormLabel>
									<FormControl>
										<Input placeholder="e.g Withholding" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<SheetFooter className="self-end px-0">
							<Alert variant="default" className="mb-4">
								<AlertTitle className="flex gap-2 mb-1 items-center">
									<IconBulb className="w-4 h-4" />
									<p>Tip</p>
								</AlertTitle>
								<AlertDescription>
									Always use meaningful and descriptive names for your taxe types because
									they will be considered for the order placement.
								</AlertDescription>
							</Alert>
							<Button type="submit" disabled={isSubmitting} className="w-full">
								{isSubmitting && <Loader2 className="animate-spin" />}
								<span>Save</span>
							</Button>
							<SheetClose asChild className="w-full">
								<Button variant="outline">Close</Button>
							</SheetClose>
						</SheetFooter>
					</Form>
				</form>
			</SheetContent>
		</Sheet>
	);
}
