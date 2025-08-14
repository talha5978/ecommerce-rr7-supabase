import { ApiError } from "@ecom/shared/utils/ApiError";
import type {
	AllProductAttributesResponse,
	AttributeType,
	AttributeUpdationPayload,
	GroupedProductAttributes,
	HighLevelProductAttributesResponse,
	ProductAttributesResponse,
	SingleProductAttributeResponse,
} from "@ecom/shared/types/attributes.d";
import {
	ProductAttributeActionData,
	ProductAttributesUpdateActionData,
} from "@ecom/shared/schemas/product-attributes.schema";
import { OPTIONAL_PRODUCT_ATTRIBS, REQUIRED_VARIANT_ATTRIBS } from "@ecom/shared/constants/constants";
import { GetAllProductAttribsInput } from "@ecom/shared/types/attributes.d";
import { Service } from "@ecom/shared/services/service";

export class ProductAttributesService extends Service {
	/** Fetch product attributes types for index page */
	async getHighLevelProductAttributes(): Promise<HighLevelProductAttributesResponse> {
		try {
			const { data, error: queryError } = await this.supabase.rpc("get_product_attribute_types");
			// console.log(data);

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

	/** Fetch all product attributes for the variants mutations */
	async getAllProductAttributes(
		input: GetAllProductAttribsInput = "all",
	): Promise<AllProductAttributesResponse> {
		if (!["all", "for-variant", "for-product"].includes(input)) {
			throw new ApiError("Invalid input", 400, []);
		}

		try {
			let query = this.supabase
				.from(this.ATTRIBUTES_TABLE)
				.select("*")
				.order("attribute_type", { ascending: true });

			if (input !== "all") {
				if (input === "for-variant") {
					query = query.in("attribute_type", REQUIRED_VARIANT_ATTRIBS as AttributeType[]);
				} else if (input === "for-product") {
					query = query.in("attribute_type", OPTIONAL_PRODUCT_ATTRIBS as AttributeType[]);
				}
			}

			const { data, error: queryError } = await query;
			console.log(data);

			let error: null | ApiError = null;
			if (queryError) {
				error = new ApiError(queryError.message, 500, [queryError.details]);
			}

			const groupedData: GroupedProductAttributes | null =
				data?.reduce(
					(
						acc: {
							[key in AttributeType]?: any[];
						},
						current,
					) => {
						const { attribute_type, ...rest } = current;
						if (!acc[attribute_type]) {
							acc[attribute_type] = [];
						}
						acc[attribute_type].push(rest);
						return acc;
					},
					{},
				) || null;

			return {
				product_attributes: groupedData,
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
				.from(this.ATTRIBUTES_TABLE)
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
			.from(this.ATTRIBUTES_TABLE)
			.insert({
				attribute_type: attribute_type as AttributeType,
				name,
				value,
			})
			.select("id")
			.single();

		if (attribError || !data.id) {
			throw new ApiError(
				`Failed to create product attribute: ${attribError?.message || "Unknown error"}`,
				500,
				[attribError?.details],
			);
		}
	}

	/** Fetch single product attribute row based on the id of attribute that we have selected! This is used for the updation processs*/
	async getSinlgeProductAttribute(attribute_id: string): Promise<SingleProductAttributeResponse> {
		try {
			const { data, error: queryError } = await this.supabase
				.from(this.ATTRIBUTES_TABLE)
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
	async updateProductAttribute(
		attribute_id: string,
		input: Partial<ProductAttributesUpdateActionData>,
	): Promise<void> {
		const { attribute_type, name, value } = input;

		const attribToUpdate: Partial<AttributeUpdationPayload> = {};

		if (attribute_type) attribToUpdate.attribute_type = attribute_type as AttributeType;
		if (name) attribToUpdate.name = name;
		if (value) attribToUpdate.value = value;

		if (Object.keys(attribToUpdate).length > 0) {
			const { error } = await this.supabase
				.from(this.ATTRIBUTES_TABLE)
				.update(attribToUpdate)
				.eq("id", attribute_id);

			if (error) {
				throw new ApiError(`Failed to update category: ${error.message}`, 500, []);
			}
		}
	}
}
