import { ApiError } from "@ecom/shared/utils/ApiError";
import type {
	ProductRAttributeCreateResponse,
	ProductRAttributeInput,
} from "@ecom/shared/types/product-r-attributes";
import { Service } from "@ecom/shared/services/service";
import { UseClassMiddleware } from "@ecom/shared/decorators/useClassMiddleware";
import { loggerMiddleware } from "@ecom/shared/middlewares/logger.middleware";
import { verifyUser } from "@ecom/shared/middlewares/auth.middleware";
import { asServiceMiddleware } from "@ecom/shared/middlewares/utils";
import { Permission } from "@ecom/shared/permissions/permissions.enum";
import { requireAllPermissions } from "@ecom/shared/middlewares/permissions.middleware";
import { UseMiddleware } from "@ecom/shared/decorators/useMiddleware";

@UseClassMiddleware(loggerMiddleware, asServiceMiddleware<ProductRAttributesService>(verifyUser))
export class ProductRAttributesService extends Service {
	/** Create bulk of product related attributes */
	@UseMiddleware(requireAllPermissions([Permission.CREATE_PRODUCT_R_ATTRIBUTES]))
	async createBulkProductAttributes(
		input: ProductRAttributeInput[],
	): Promise<ProductRAttributeCreateResponse> {
		if (input.length == 0) {
			throw new ApiError("Failed to create product attributes", 500, []);
		}
		const { error: insertError } = await this.supabase.from(this.PRODUCT_ATTRIBUTES_TABLE).insert(input);

		let error: null | ApiError = null;

		if (insertError) {
			error = new ApiError(insertError.message, 500, [insertError.details]);
		}

		return {
			error,
		};
	}

	/** Delete bulk rows of product attributes table (by product id and array of attribute ids associated with that product) */
	@UseMiddleware(requireAllPermissions([Permission.DELETE_PRODUCT_R_ATTRIBUTES]))
	async deleteBulkProductRAttributes({
		product_id,
		attributes_ids,
	}: {
		product_id: string;
		attributes_ids: string[];
	}): Promise<void> {
		const { error } = await this.supabase
			.from(this.PRODUCT_ATTRIBUTES_TABLE)
			.delete()
			.eq("product_id", product_id)
			.in("attribute_id", attributes_ids);

		if (error) {
			throw new ApiError(error.message, 500, [error.details]);
		}
	}
}
