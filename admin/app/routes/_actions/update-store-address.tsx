import { ActionFunctionArgs } from "react-router";
import { ApiError } from "@ecom/shared/utils/ApiError";
import { StoreSettingsService } from "@ecom/shared/services/store-settings.service";
import { CheckerSchema } from "@ecom/shared/schemas/store-address.schema";
import { queryClient } from "@ecom/shared/lib/query-client/queryClient";

export const action = async ({ request, params }: ActionFunctionArgs) => {
	try {
		const addressID = (params.id as string) || "";
		if (!addressID || addressID == "") {
			return {
				success: false,
				error: "Invalid data",
			};
		}

		const formData = await request.formData();
		const addressKey = formData.get("address");
		if (!addressKey) {
			return {
				success: false,
				error: "Invalid data",
			};
		}

		const data = JSON.parse(addressKey as string);
		console.log("data in action func", data);

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
		await storeSettingsSvc.updateAddress({ id: addressID, address: parseResult.data.address });

		await queryClient.invalidateQueries({ queryKey: ["store_settings"] });

		return { success: true };
	} catch (error: any) {
		const errorMessage =
			error instanceof ApiError ? error.message : error.message || "Failed to update address";

		return {
			success: false,
			error: errorMessage,
		};
	}
};
