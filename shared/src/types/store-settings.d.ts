import type { ApiError } from "@ecom/shared/utils/ApiError";
import type { Database } from "@ecom/shared/types/supabase";

type StoreSettings_Raw = Database["public"]["Tables"]["store_settings"]["Row"];

export type UpdateStoreAddress = { formattedAddress?: string; lat?: number; lng?: number };

export type StoreAddress = { formattedAddress: string; lat: number; lng: number };

export type getStoreSettingsResp = {
	store_settings: StoreSettings_Raw | null;
	error: ApiError | null;
};

export type UpdateStoreContactInfo = {
	email_1?: string;
	email_2?: string;
	phone_1?: string;
	phone_2?: string;
};
