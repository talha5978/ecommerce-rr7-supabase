import { ApiError } from "@ecom/shared/utils/ApiError";
import type {
	GetVariantAttributesResponse,
	VariantAttributeCreateResponse,
	VariantAttributeInput,
} from "@ecom/shared/types/variant-attributes";
import { Service } from "@ecom/shared/services/service";
import { UseClassMiddleware } from "@ecom/shared/decorators/useClassMiddleware";
import { loggerMiddleware } from "@ecom/shared/middlewares/logger.middleware";
import { verifyUser } from "@ecom/shared/middlewares/auth.middleware";
import { asServiceMiddleware } from "@ecom/shared/middlewares/utils";
import { UseMiddleware } from "@ecom/shared/decorators/useMiddleware";
import { requireAllPermissions, requireAnyPermission } from "@ecom/shared/middlewares/permissions.middleware";
import { Permission } from "@ecom/shared/permissions/permissions.enum";

@UseClassMiddleware(loggerMiddleware, asServiceMiddleware<VariantsAttributesService>(verifyUser))
export class VariantsAttributesService extends Service {
	/** Create bulk of variant attributes */
	@UseMiddleware(requireAnyPermission([Permission.CREATE_PRODUCT_VARIANTS, Permission.UPDATE_PRODUCT_VARIANTS]))
	async createBulkVariantAttributes(
		input: VariantAttributeInput[],
	): Promise<VariantAttributeCreateResponse> {
		if (input.length == 0) {
			throw new ApiError("Failed to create variant attributes", 500, []);
		}
		const { error: insertError } = await this.supabase.from(this.VARIANT_ATTRIBUTES_TABLE).insert(input);

		let error: null | ApiError = null;

		if (insertError) {
			error = new ApiError(insertError.message, 500, [insertError.details]);
		}

		return {
			error,
		};
	}

	/** Fetch variant attributes for a variant using variant id */
	@UseMiddleware(requireAllPermissions([Permission.CREATE_PRODUCT_VARIANTS]))
	async getVariantAttributes(variant_id: string): Promise<GetVariantAttributesResponse> {
		const { data, error: dbError } = await this.supabase
			.from(this.VARIANT_ATTRIBUTES_TABLE)
			.select("*")
			.eq("variant_id", variant_id);

		let error: null | ApiError = null;
		if (dbError) {
			error = new ApiError(dbError.message, 500, [dbError.details]);
		}

		return {
			data: data ?? null,
			error,
		};
	}

	/** Delete bulk rows of variant attributes table (by variant id and array of attribute ids associated with that variant) */
	@UseMiddleware(requireAllPermissions([Permission.UPDATE_PRODUCT_VARIANTS]))
	async deleteBulkVariantAttributes({
		variant_id,
		attributes_ids,
	}: {
		variant_id: string;
		attributes_ids: string[];
	}): Promise<void> {
		const { error } = await this.supabase
			.from(this.VARIANT_ATTRIBUTES_TABLE)
			.delete()
			.eq("variant_id", variant_id)
			.in("attribute_id", attributes_ids);

		if (error) {
			throw new ApiError(error.message, 500, [error.details]);
		}
	}
}
