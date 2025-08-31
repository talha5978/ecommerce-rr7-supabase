import { ApiError } from "@ecom/shared/utils/ApiError";
import type { MetaUpdationPayload } from "@ecom/shared/types/meta_details.d";
import type { MetaDetailsActionData } from "@ecom/shared/schemas/meta-details.schema";
import { Service } from "@ecom/shared/services/service";
import { UseClassMiddleware } from "@ecom/shared/decorators/useClassMiddleware";
import { loggerMiddleware } from "@ecom/shared/middlewares/logger.middleware";
import { verifyUser } from "@ecom/shared/middlewares/auth.middleware";
import { asServiceMiddleware } from "@ecom/shared/middlewares/utils";
import { requireAllPermissions } from "@ecom/shared/middlewares/permissions.middleware";
import { UseMiddleware } from "@ecom/shared/decorators/useMiddleware";
import { Permission } from "@ecom/shared/permissions/permissions.enum";

@UseClassMiddleware(loggerMiddleware, asServiceMiddleware<MetaDetailsService>(verifyUser))
export class MetaDetailsService extends Service {
	/** Create meta details row */
	@UseMiddleware(requireAllPermissions([Permission.CREATE_META_DETAILS]))
	async createMetaDetails(input: MetaDetailsActionData): Promise<string> {
		const { meta_description, meta_title, url_key, meta_keywords } = input;

		const { data: metaData, error: metaError } = await this.supabase
			.from(this.META_DETAILS_TABLE)
			.insert({
				meta_title,
				meta_description,
				url_key,
				meta_keywords: meta_keywords || null, // convert empty string to null
			})
			.select("id")
			.single();

		if (metaError || !metaData) {
			throw new ApiError(
				`Failed to create meta details: ${metaError?.message || "Unknown error"}`,
				500,
				[metaError?.details],
			);
		}

		return metaData.id;
	}

	@UseMiddleware(requireAllPermissions([Permission.UPDATE_META_DETAILS]))
	async updateMetaDetails({
		meta_details,
		metaDetailsId,
	}: {
		meta_details: MetaUpdationPayload;
		metaDetailsId: string;
	}): Promise<void> {
		const metaUpdate: Partial<MetaUpdationPayload> = {};
		if (meta_details.meta_title) metaUpdate.meta_title = meta_details.meta_title;
		if (meta_details.meta_description) metaUpdate.meta_description = meta_details.meta_description;
		if (meta_details.url_key) metaUpdate.url_key = meta_details.url_key;
		if (meta_details.meta_keywords || meta_details.meta_keywords === "")
			metaUpdate.meta_keywords = meta_details.meta_keywords;

		if (Object.keys(metaUpdate).length > 0) {
			const { error: metaError } = await this.supabase
				.from(this.META_DETAILS_TABLE)
				.update(metaUpdate)
				.eq("id", metaDetailsId);

			if (metaError) {
				throw new ApiError(`Failed to update meta details: ${metaError.message}`, 500, []);
			}
		}
	}

	@UseMiddleware(requireAllPermissions([Permission.DELETE_META_DETAILS]))
	async deleteMetaDetails(metaDetailsId: string): Promise<void> {
		const { error: metaError } = await this.supabase
			.from(this.META_DETAILS_TABLE)
			.delete()
			.eq("id", metaDetailsId);

		if (metaError) {
			throw new ApiError(`Failed to delete meta details: ${metaError.message}`, 500, []);
		}
	}
}
