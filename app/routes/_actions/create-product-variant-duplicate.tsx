import { ActionFunctionArgs } from "react-router";
import { queryClient } from "~/lib/queryClient";
import { DuplicateVariantActionDataSchema } from "~/schemas/product-variants.schema";
import { ProductVariantsService } from "~/services/product-variants.service";
import { ApiError } from "~/utils/ApiError";

function parseNumber(value: FormDataEntryValue | null): number {
	if (value === null) {
		throw new ApiError("Invalid number value", 400, []);
	}
	const numberValue = Number(value);
	if (isNaN(numberValue)) {
		throw new ApiError("Invalid number value", 400, []);
	}
	return numberValue;
}

export const action = async ({ request }: ActionFunctionArgs) => {
	const formData = await request.formData();

	const data = {
		images: formData.getAll("images") as string[],
		is_default: formData.get("is_default") as string,
		original_price: parseNumber(formData.get("original_price")),
		sale_price: parseNumber(formData.get("sale_price")),
		reorder_level: parseNumber(formData.get("reorder_level")),
		sku: formData.get("sku") as string,
		stock: parseNumber(formData.get("stock")),
		weight: parseNumber(formData.get("weight")),
		product_id: formData.get("product_id") as string,
		id: formData.get("id") as string
	}

	// console.log(data);

	const parseResult = DuplicateVariantActionDataSchema.safeParse(data);
	console.log("Parse result: ", parseResult?.error?.errors);
	if (!parseResult.success) {
		return new Response(JSON.stringify({ validationErrors: parseResult.error.flatten().fieldErrors }), {
			status: 400,
			headers: { "Content-Type": "application/json" },
		});
	}
	console.log("Parsed data: ", parseResult.data);
	
	try {
		const productVariantSvc = new ProductVariantsService(request);
		await productVariantSvc.createProductVaraintDuplicate(data);
		await queryClient.invalidateQueries({ queryKey: ["productVariants", data.product_id] });
		await queryClient.invalidateQueries({ queryKey: ["allProductUnits"] });
		await queryClient.invalidateQueries({ queryKey: ["products"] });
		await queryClient.invalidateQueries({ queryKey: ["variantConstraints", data.product_id] });
		
		return { success: true };
	} catch (error: any) {
		console.error("Error in action:", error);
		const errorMessage =
			error instanceof ApiError ? error.message : error.message || "Failed to duplicate variant";

		if (error instanceof ApiError && error.details.length) {
			console.error("ApiError details:", error.details);
		}
		return {
			success: false,
			error: errorMessage,
		};
	}
};