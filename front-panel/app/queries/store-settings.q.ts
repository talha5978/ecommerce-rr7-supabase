import { FP_StoreSettingsService } from "@ecom/shared/services/store-settings.service";
import type { getStoreSettingsResp } from "@ecom/shared/types/store-settings";
import { queryOptions } from "@tanstack/react-query";

type getStoreSettingsQArgs = {
	request: Request;
};

export const StoreSettingsQUery = ({ request }: getStoreSettingsQArgs) => {
	return queryOptions<getStoreSettingsResp>({
		queryKey: ["store_settings"],
		queryFn: async () => {
			const svc = new FP_StoreSettingsService(request);
			const result = await svc.getStoreSettings();
			return result;
		},
	});
};
