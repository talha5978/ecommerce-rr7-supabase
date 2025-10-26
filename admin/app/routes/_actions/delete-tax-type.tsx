import { ApiError } from "@ecom/shared/utils/ApiError";
import type { ActionFunctionArgs } from "react-router";
import { queryClient } from "@ecom/shared/lib/query-client/queryClient";
import { TaxesService } from "@ecom/shared/services/taxes.service";

export const action = async ({ request, params }: ActionFunctionArgs) => {
	const id = (params.id as string) || "";
	if (!id || id == "") {
		return {
			success: false,
			error: "Tax type ID is required",
		};
	}

	try {
		const svc = new TaxesService(request);
		await svc.deleteTaxType(Number(id));

		await queryClient.invalidateQueries({ queryKey: ["tax_types"] });

		return { success: true };
	} catch (error: any) {
		const errorMessage =
			error instanceof ApiError ? error.message : error.message || "Failed to delete tax type";

		return {
			success: false,
			error: errorMessage,
		};
	}
};
