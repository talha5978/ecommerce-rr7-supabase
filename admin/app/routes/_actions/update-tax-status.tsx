import { ApiError } from "@ecom/shared/utils/ApiError";
import type { ActionFunctionArgs } from "react-router";
import { queryClient } from "@ecom/shared/lib/query-client/queryClient";
import { TaxesService } from "@ecom/shared/services/taxes.service";

export const action = async ({ request, params }: ActionFunctionArgs) => {
	const id = (params.id as string) || "";
	if (!id || id == "") {
		return {
			success: false,
			error: "Tax ID is required",
		};
	}

	const formData = await request.formData();
	const status = formData.get("status") as string;

	try {
		const svc = new TaxesService(request);
		await svc.updateTaxRateStatus(Number(id), status);

		await queryClient.invalidateQueries({ queryKey: ["taxes"] });
		await queryClient.invalidateQueries({ queryKey: ["taxes_fp"] });

		return { success: true };
	} catch (error: any) {
		const errorMessage =
			error instanceof ApiError ? error.message : error.message || "Failed to update tax";

		return {
			success: false,
			error: errorMessage,
		};
	}
};
