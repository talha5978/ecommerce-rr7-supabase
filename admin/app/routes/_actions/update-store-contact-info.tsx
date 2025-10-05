import type { ActionFunctionArgs } from "react-router";
import { ApiError } from "@ecom/shared/utils/ApiError";
import { StoreSettingsService } from "@ecom/shared/services/store-settings.service";
import { CheckerSchema } from "@ecom/shared/schemas/store-contact.schema";
import { queryClient } from "@ecom/shared/lib/query-client/queryClient";
import type { UpdateStoreContactInfo } from "@ecom/shared/types/store-settings";

export const action = async ({ request, params }: ActionFunctionArgs) => {
	try {
		const ID = (params.id as string) || "";
		if (!ID || ID == "") {
			return {
				success: false,
				error: "Invalid data",
			};
		}

		const formData = await request.formData();
		const dataKey = formData.get("contact_info");
		if (!dataKey) {
			return {
				success: false,
				error: "Invalid data",
			};
		}

		const data: Partial<UpdateStoreContactInfo> = JSON.parse(dataKey as string);
		// console.log("data in action func", data);

		const parseResult = CheckerSchema.safeParse(data);

		if (!parseResult.success) {
			return new Response(
				JSON.stringify({ validationErrors: parseResult.error.flatten().fieldErrors }),
				{
					status: 400,
					headers: { "Content-Type": "application/json" },
				},
			);
		}

		const storeSettingsSvc = new StoreSettingsService(request);
		await storeSettingsSvc.updateContactInfo({ id: ID, contact_info: data });

		await queryClient.invalidateQueries({ queryKey: ["store_settings"] });

		return { success: true };
	} catch (error: any) {
		const errorMessage =
			error instanceof ApiError ? error.message : error.message || "Failed to update contact info";

		return {
			success: false,
			error: errorMessage,
		};
	}
};
