import type { Database } from "~/types/supabase";
import { ApiError } from "~/utils/ApiError";
import { createSupabaseServerClient } from "~/lib/supabase.server";
import { SupabaseClient } from "@supabase/supabase-js";
import { GetVariantAttributesResponse, VariantAttributeCreateResponse, VariantAttributeInput, VariantAttributesRow } from "~/types/variant-attributes";

export class VariantsAttributesService {
	private supabase: SupabaseClient<Database>;
	private readonly TABLE = "variant_attributes";

	constructor(request: Request) {
		const { supabase } = createSupabaseServerClient(request);
		this.supabase = supabase;
	}

	/** Create Variant Attribute Row */
	async createVariantAttributes(input: VariantAttributeInput): Promise<VariantAttributeCreateResponse> {
		const { variant_id, attribute_id } = input;

		const { error: insertError } = await this.supabase.from(this.TABLE).insert({
			variant_id,
			attribute_id,
		});

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
			.from(this.TABLE)
			.select("*")
			.eq("variant_id", variant_id);

		let error: null | ApiError = null;
		if (dbError) {
			error = new ApiError(dbError.message, 500, [dbError.details]);
		}

		return {
			data: data ?? null,
			error
		}
	}
}

