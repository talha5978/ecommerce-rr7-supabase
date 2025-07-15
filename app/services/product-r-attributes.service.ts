import type { Database } from "~/types/supabase";
import { ApiError } from "~/utils/ApiError";
import { createSupabaseServerClient } from "~/lib/supabase.server";
import { SupabaseClient } from "@supabase/supabase-js";
import type { ProductRAttributeCreateResponse, ProductRAttributeInput } from "~/types/product-r-attributes";
import { TABLE_NAMES } from "~/constants";

export class ProductRAttributesService {
	private supabase: SupabaseClient<Database>;
	private readonly TABLE = TABLE_NAMES.product_attributes;

	constructor(request: Request) {
		const { supabase } = createSupabaseServerClient(request);
		this.supabase = supabase;
	}

	/** Create bulk of product related attributes */
	async createBulkProductAttributes(input: ProductRAttributeInput[]): Promise<ProductRAttributeCreateResponse> {
		if (input.length == 0) {
			throw new ApiError("Failed to create product attributes", 500, []);
		}
		const { error: insertError } = await this.supabase
			.from(this.TABLE)
			.insert(input);

		let error: null | ApiError = null;

		if (insertError) {
			error = new ApiError(insertError.message, 500, [insertError.details]);
		}

		return {
			error,
		};
	}

	/** Delete a row of variant attributes table*/
	async deleteVariantAttribute(variant_id: string, attribute_id: string): Promise<void> {
		const { error } = await this.supabase
			.from(this.TABLE)
			.delete()
			.eq("variant_id", variant_id)
			.eq("attribute_id", attribute_id);

		if (error) {
			throw new ApiError(error.message, 500, [error.details]);
		}
	}

	/** Delete bulk rows of product attributes table (by product id and array of attribute ids associated with that product) */
	async deleteBulkProductRAttributes({product_id, attributes_ids} : {
		product_id: string;
		attributes_ids: string[];
	}): Promise<void> {

		const { error } = await this.supabase
			.from(this.TABLE)
			.delete()
			.eq("product_id", product_id)
			.in("attribute_id", attributes_ids);

		if (error) {
			throw new ApiError(error.message, 500, [error.details]);
		}
	}
}

