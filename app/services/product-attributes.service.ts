
import type { Database } from "~/types/supabase";
import { ApiError } from "~/utils/ApiError";
import { createSupabaseServerClient } from "~/lib/supabase.server";
import { SupabaseClient } from "@supabase/supabase-js";
import type { AttributeType, AttributeUpdationPayload, GetAllProductAttributesResponse, ProductAttributesResponse, SingleProductAttributeResponse } from "~/types/product-attributes";
import { ProductAttributeActionData, ProductAttributesUpdateActionData } from "~/schemas/product-attributes.schema";

export class ProductAttributesService {
	private supabase: SupabaseClient<Database>;
	private readonly TABLE = "product_attributes";

	constructor(request: Request) {
		const { supabase } = createSupabaseServerClient(request);
		this.supabase = supabase;
	}

	/** Fetch product attributes types for index page */
	async getAllProductAttributes(): Promise<GetAllProductAttributesResponse> {
		try {
			const { data, error: queryError } = await this.supabase.rpc("get_product_attribute_types");
			console.log(data);

			let error: null | ApiError = null;
			if (queryError) {
				error = new ApiError(queryError.message, 500, [queryError.details]);
			}

			return {
				product_attributes:
					data!.map((item) => {
						return {
							attribute_type: item.attribute_type,
							values_count: Number(item.values_count) ?? 0,
						};
					}) ?? [],
				error,
			};
		} catch (err: any) {
			if (err instanceof ApiError) {
				return { product_attributes: [], error: err };
			}
			return {
				product_attributes: [],
				error: new ApiError("Unknown error", 500, [err]),
			};
		}
	}

	/** Fetch product attributes based on the type of attribute that we have selected! */
	async getProductAttributes(attribute_type: AttributeType): Promise<ProductAttributesResponse> {
		try {
			const {
				data,
				error: queryError,
				count,
			} = await this.supabase
				.from(this.TABLE)
				.select("name, value, id", { count: "exact" })
				.eq("attribute_type", attribute_type);

			let error: null | ApiError = null;
			if (queryError) {
				error = new ApiError(queryError.message, 500, [queryError.details]);
			}

			return {
				product_attributes: data ?? [],
				total: count ?? 0,
				error,
			};
		} catch (err: any) {
			if (err instanceof ApiError) {
				return { product_attributes: [], total: 0, error: err };
			}
			return {
				product_attributes: [],
				total: 0,
				error: new ApiError("Unknown error", 500, [err]),
			};
		}
	}

	/** Create product attribute */
	async createProductAttribute(input: ProductAttributeActionData): Promise<void> {
		const { attribute_type, name, value } = input;

		const { data, error: attribError } = await this.supabase
			.from(this.TABLE)
			.insert(
				{
					attribute_type: attribute_type as AttributeType,
					name,
					value,
				}
			)
			.select("id")
			.single();
		
		if (attribError || !data.id) {
			throw new ApiError(
				`Failed to create product attribute: ${attribError?.message || "Unknown error"}`,
				500,
				[attribError?.details]
			);
		}
	}

	
	/** Fetch single product attribute row based on the id of attribute that we have selected! This is used for the updation processs*/
	async getSinlgeProductAttribute(attribute_id: string): Promise<SingleProductAttributeResponse> {
		try {
			const {
				data,
				error: queryError
			} = await this.supabase
				.from(this.TABLE)
				.select("name, value, id")
				.eq("id", attribute_id)
				.single();

			let error: null | ApiError = null;
			if (queryError) {
				error = new ApiError(queryError.message, 500, [queryError.details]);
			}

			return {
				product_attribute: data ?? null,
				error,
			};
		} catch (err: any) {
			if (err instanceof ApiError) {
				return { product_attribute: null, error: err };
			}
			return {
				product_attribute: null,
				error: new ApiError("Unknown error", 500, [err]),
			};
		}
	}

	/** Update attribute row from db using ID*/
	async updateProductAttribute(attribute_id: string, input: Partial<ProductAttributesUpdateActionData>): Promise<void> {
		const {	attribute_type, name, value } = input;

		const attribToUpdate: Partial<AttributeUpdationPayload> = {};

		if (attribute_type) attribToUpdate.attribute_type = attribute_type as AttributeType;
		if (name) attribToUpdate.name = name;
		if (value) attribToUpdate.value = value;

		if (Object.keys(attribToUpdate).length > 0) {
			const { error } = await this.supabase
				.from(this.TABLE)
				.update(attribToUpdate)
				.eq("id", attribute_id);

			if (error) {
				throw new ApiError(`Failed to update category: ${error.message}`, 500, []);
			}
		}
	}
}

