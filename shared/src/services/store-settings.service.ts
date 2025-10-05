import { Service } from "@ecom/shared/services/service";
import { ApiError } from "@ecom/shared/utils/ApiError";
import { UseClassMiddleware } from "@ecom/shared/decorators/useClassMiddleware";
import { loggerMiddleware } from "@ecom/shared/middlewares/logger.middleware";
import { verifyUser } from "@ecom/shared/middlewares/auth.middleware";
import { asServiceMiddleware } from "@ecom/shared/middlewares/utils";
import type {
	getStoreSettingsResp,
	UpdateStoreAddress,
	UpdateStoreContactInfo,
} from "@ecom/shared/types/store-settings";

@UseClassMiddleware(loggerMiddleware, asServiceMiddleware<StoreSettingsService>(verifyUser))
export class StoreSettingsService extends Service {
	/** Fetch the store settings */
	async getStoreSettings(): Promise<getStoreSettingsResp> {
		try {
			// Fetch the first row from store_settings
			let { data: dbResp, error: fetchError } = await this.supabase
				.from(this.STORE_SETTINGS_TABLE)
				.select("*")
				.single(); // Enforce single row

			// If no row exists, insert a default one
			if (fetchError?.code === "PGRST116" || !dbResp) {
				// PGRST116: No rows found
				const defaultAddress = { formattedAddress: "", lat: 29.394644, lng: 71.6638747 };
				const { data: insertData, error: insertError } = await this.supabase
					.from(this.STORE_SETTINGS_TABLE)
					.insert({ store_address: defaultAddress })
					.select("*")
					.single();

				if (insertError) {
					throw new ApiError(insertError.message, Number(insertError.code) || 500, [
						insertError.details,
					]);
				}

				dbResp = insertData;
			}

			if (fetchError && fetchError.code !== "PGRST116") {
				throw new ApiError(fetchError.message, Number(fetchError.code) || 500, [fetchError.details]);
			}

			return {
				store_settings: dbResp
					? {
							id: dbResp.id,
							store_address: dbResp.store_address,
							created_at: dbResp.created_at,
							updated_at: dbResp.updated_at,
							email_1: dbResp.email_1,
							email_2: dbResp.email_2,
							phone_1: dbResp.phone_1,
							phone_2: dbResp.phone_2,
						}
					: null,
				error: null,
			};
		} catch (err: any) {
			if (err instanceof ApiError) {
				return { store_settings: null, error: err };
			}
			return {
				store_settings: null,
				error: new ApiError("Unknown error", 500, [err.message]),
			};
		}
	}

	/** Update the store address in the settings menu */
	async updateAddress({ id, address }: { id: string; address: UpdateStoreAddress }) {
		const { data, error } = await this.supabase
			.from("store_settings")
			.update({ store_address: address })
			.eq("id", id)
			.single();

		if (error) {
			throw error;
		}

		return data;
	}

	/** Update the store contact info in the settings menu */
	async updateContactInfo({ id, contact_info }: { id: string; contact_info: UpdateStoreContactInfo }) {
		const { data, error } = await this.supabase
			.from("store_settings")
			.update({ ...contact_info })
			.eq("id", id)
			.single();

		if (error) {
			throw error;
		}

		return data;
	}
}
