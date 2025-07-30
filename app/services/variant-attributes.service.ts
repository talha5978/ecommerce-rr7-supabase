import { ApiError } from "~/utils/ApiError";
import type {
	GetVariantAttributesResponse,
	VariantAttributeCreateResponse,
	VariantAttributeInput,
} from "~/types/variant-attributes";
import { Service } from "~/services/service";

export class VariantsAttributesService extends Service {
	/** Create bulk of variant attributes */
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

	/** Delete a row of variant attributes table*/
	async deleteVariantAttribute(variant_id: string, attribute_id: string): Promise<void> {
		const { error } = await this.supabase
			.from(this.VARIANT_ATTRIBUTES_TABLE)
			.delete()
			.eq("variant_id", variant_id)
			.eq("attribute_id", attribute_id);

		if (error) {
			throw new ApiError(error.message, 500, [error.details]);
		}
	}

	/** Delete bulk rows of variant attributes table (by variant id and array of attribute ids associated with that variant) */
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
