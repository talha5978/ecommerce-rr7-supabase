import { ApiError } from "@ecom/shared/utils/ApiError";
import { Service } from "@ecom/shared/services/service";
import { UseClassMiddleware } from "@ecom/shared/decorators/useClassMiddleware";
import { loggerMiddleware } from "@ecom/shared/middlewares/logger.middleware";
import { verifyUser } from "@ecom/shared/middlewares/auth.middleware";
import { asServiceMiddleware } from "@ecom/shared/middlewares/utils";
import { Permission } from "@ecom/shared/permissions/permissions.enum";
import { requireAllPermissions } from "@ecom/shared/middlewares/permissions.middleware";
import { UseMiddleware } from "@ecom/shared/decorators/useMiddleware";
import { defaults } from "@ecom/shared/constants/constants";
import type { GetAllTaxesResp, GetALlTaxRates_FP, GetAllTaxTypes } from "@ecom/shared/types/taxes";
import type { CreateTaxTypeFormValues, CreateTaxFormValues } from "@ecom/shared/schemas/taxes.schema";
import { stringToBooleanConverter } from "@ecom/shared/lib/utils";

@UseClassMiddleware(loggerMiddleware, asServiceMiddleware<TaxesService>(verifyUser))
export class TaxesService extends Service {
	/** Fetch the taxe rates for the admin settings */
	@UseMiddleware(requireAllPermissions([Permission.MANAGE_SETTINGS]))
	async getAllTaxRates({
		searchQuery,
		pageIndex = 0,
		pageSize = defaults.DEFAULT_TAXES_PAGE_SIZE,
	}: {
		searchQuery?: string;
		pageIndex?: number;
		pageSize?: number;
	}): Promise<GetAllTaxesResp> {
		const from = pageIndex * pageSize;
		const to = from + pageSize - 1;

		try {
			let query = this.supabase.from(this.TAX_RATES_TABLE).select(
				`
					created_at, id, name, rate, status,
					${this.TAX_TYPES_TABLE}(id, name, created_at),
					${this.TAX_APPLICATION_CATEGORIES_TABLE}(
						${this.CATEGORY_TABLE}(id, category_name)
					)	
				`,
				{
					count: "exact",
				},
			);

			if (searchQuery) {
				query = query.ilike("name", `%${searchQuery}%`);
			}

			query = query.order("created_at", { ascending: false });
			query = query.range(from, to);

			const { data, error: fetchError, count } = await query;

			let error: null | ApiError = null;

			if (fetchError || data == null) {
				error = new ApiError(fetchError.message, Number(fetchError.code), [fetchError.details]);
			}

			return {
				taxes:
					data?.flatMap((item) => {
						return {
							id: item.id,
							name: item.name,
							rate: item.rate,
							status: item.status,
							type: {
								id: item[this.TAX_TYPES_TABLE].id,
								name: item[this.TAX_TYPES_TABLE].name,
								created_at: item[this.TAX_TYPES_TABLE].created_at,
							},
							created_at: item.created_at,
							application_categories: item[this.TAX_APPLICATION_CATEGORIES_TABLE].map((i) => {
								return {
									category_id: i[this.CATEGORY_TABLE].id,
									category_name: i[this.CATEGORY_TABLE].category_name,
								};
							}),
						};
					}) ?? null,
				total: count ?? 0,
				error: error ?? null,
			};
		} catch (err: any) {
			if (err instanceof ApiError) {
				return {
					taxes: null,
					total: 0,
					error: err,
				};
			}
			return {
				taxes: null,
				total: 0,
				error: new ApiError(
					"Unknown error occured while fetching tax rates.",
					Number(err.code) ?? 500,
					[err],
				),
			};
		}
	}

	/** Fetch the taxe types for the admin settings */
	@UseMiddleware(requireAllPermissions([Permission.MANAGE_SETTINGS]))
	async getAllTaxTypes(): Promise<GetAllTaxTypes> {
		try {
			const {
				data,
				error: fetchError,
				count,
			} = await this.supabase
				.from(this.TAX_TYPES_TABLE)
				.select("*", {
					count: "exact",
				})
				.order("created_at", { ascending: false });

			let error: null | ApiError = null;

			if (fetchError || data == null) {
				error = new ApiError(fetchError.message, Number(fetchError.code), [fetchError.details]);
			}

			return {
				tax_types: data ?? null,
				total: count ?? 0,
				error: error ?? null,
			};
		} catch (err: any) {
			if (err instanceof ApiError) {
				return {
					tax_types: null,
					total: 0,
					error: err,
				};
			}
			return {
				tax_types: null,
				total: 0,
				error: new ApiError(
					"Unknown error occured while fetching tax types.",
					Number(err.code) ?? 500,
					[err],
				),
			};
		}
	}

	/** Delete the tax application categories for the tax rate given */
	async deleteTaxApplicationCategories(taxRateId: number): Promise<boolean> {
		const { error: dbError } = await this.supabase
			.from(this.TAX_APPLICATION_CATEGORIES_TABLE)
			.delete()
			.eq("tax_rate_id", taxRateId);

		if (dbError) {
			throw new ApiError(dbError.message, Number(dbError.code), [dbError.details]);
		}

		return true;
	}

	/** Fetch the taxe types for the admin settings */
	@UseMiddleware(requireAllPermissions([Permission.MANAGE_SETTINGS]))
	async deleteTaxRate(taxRateId: number): Promise<boolean> {
		await this.deleteTaxApplicationCategories(taxRateId);
		await this.deleteTaxRateEntry(taxRateId);

		return true;
	}

	/** Delete a tax rate entry from tax rates table */
	async deleteTaxRateEntry(taxRateId: number): Promise<boolean> {
		const { error: dbError } = await this.supabase
			.from(this.TAX_RATES_TABLE)
			.delete()
			.eq("id", taxRateId);

		if (dbError) {
			throw new ApiError(dbError.message, Number(dbError.code), [dbError.details]);
		}

		return true;
	}

	/** Create tax application categories */
	async createTaxApplicationCategories(
		categories: CreateTaxFormValues["categories"],
		tax_rate_id: number,
	): Promise<boolean> {
		const payload = categories.flatMap((category) => {
			return {
				category_id: category,
				tax_rate_id: tax_rate_id,
			};
		});

		const { error: dbError } = await this.supabase
			.from(this.TAX_APPLICATION_CATEGORIES_TABLE)
			.insert(payload);

		if (dbError) {
			await this.deleteTaxRateEntry(tax_rate_id);
			throw new ApiError(dbError.message, Number(dbError.code), [dbError.details]);
		}

		return true;
	}

	/** Update tax application categories */
	async upsertTaxApplicationCategories(categories: string[], tax_rate_id: number): Promise<boolean> {
		if (!categories) {
			throw new ApiError("No categories provided", 400, []);
		}

		const payload = categories.flatMap((category) => {
			return {
				category_id: category,
				tax_rate_id: tax_rate_id,
			};
		});

		const { error: dbError } = await this.supabase
			.from(this.TAX_APPLICATION_CATEGORIES_TABLE)
			.upsert(payload);

		if (dbError) {
			throw new ApiError(dbError.message, Number(dbError.code), [dbError.details]);
		}

		return true;
	}

	/** Create a new tax rate */
	@UseMiddleware(requireAllPermissions([Permission.MANAGE_SETTINGS]))
	async createNewTax(data: CreateTaxFormValues): Promise<void> {
		const { name, rate, status, tax_type } = data;

		const { error: dbError, data: dbResp } = await this.supabase
			.from(this.TAX_RATES_TABLE)
			.insert({
				name,
				rate: parseFloat(rate),
				status: stringToBooleanConverter(status),
				type: Number(tax_type),
			})
			.select("id")
			.single();

		if (dbError) {
			throw new ApiError(dbError.message, Number(dbError.code), [dbError.details]);
		}

		await this.createTaxApplicationCategories(data.categories, dbResp.id);

		return;
	}

	/** Create a new tax type */
	@UseMiddleware(requireAllPermissions([Permission.MANAGE_SETTINGS]))
	async createNewTaxType(data: CreateTaxTypeFormValues): Promise<void> {
		const { error: dbError } = await this.supabase.from(this.TAX_TYPES_TABLE).insert({ name: data.name });

		if (dbError) {
			throw new ApiError(dbError.message, Number(dbError.code), [dbError.details]);
		}

		return;
	}

	/** Create a new tax type */
	@UseMiddleware(requireAllPermissions([Permission.MANAGE_SETTINGS]))
	async deleteTaxType(id: number): Promise<void> {
		const { data, error: dbError } = await this.supabase
			.from(this.TAX_RATES_TABLE)
			.select("id", { count: "exact" })
			.eq("type", id);

		if (dbError) {
			throw new ApiError(dbError.message, Number(dbError.code), [dbError.details]);
		}

		if (data && data.length > 0) {
			throw new ApiError("Tax type is in use. First delete every tax using this tax type", 400, []);
		}

		const { error: deleteError } = await this.supabase.from(this.TAX_TYPES_TABLE).delete().eq("id", id);

		if (deleteError) {
			throw new ApiError(deleteError.message, Number(deleteError.code), [deleteError.details]);
		}

		return;
	}

	/** UPdate tax rate status only */
	@UseMiddleware(requireAllPermissions([Permission.MANAGE_SETTINGS]))
	async updateTaxRateStatus(taxRateId: number, status: string): Promise<boolean> {
		if (!status || !["true", "false"].includes(status)) {
			throw new ApiError("Invalid status", 400, []);
		}

		const { error } = await this.supabase
			.from(this.TAX_RATES_TABLE)
			.update({ status: stringToBooleanConverter(status) })
			.eq("id", taxRateId);

		if (error) {
			throw new ApiError(error.message, Number(error.code), [error.details]);
		}

		return true;
	}
}

@UseClassMiddleware(loggerMiddleware)
export class TaxesService_FP extends Service {
	/** Fetch the taxes for confirming checkout */
	async getAllTaxRates(): Promise<GetALlTaxRates_FP> {
		try {
			const { data, error: fetchError } = await this.supabase
				.from(this.TAX_RATES_TABLE)
				.select(
					`
					id, name, rate,
					${this.TAX_APPLICATION_CATEGORIES_TABLE}(
						${this.CATEGORY_TABLE}(id)
					)	
				`,
				)
				.eq("status", true)
				.order("created_at", { ascending: false });

			let error: null | ApiError = null;

			if (fetchError || data == null) {
				error = new ApiError(fetchError.message, Number(fetchError.code), [fetchError.details]);
			}

			return {
				taxes:
					data?.flatMap((item) => {
						return {
							id: item.id,
							name: item.name,
							rate: item.rate,
							application_categories: item[this.TAX_APPLICATION_CATEGORIES_TABLE].map(
								(i) => i[this.CATEGORY_TABLE].id,
							),
						};
					}) ?? null,
				error: error ?? null,
			};
		} catch (err: any) {
			if (err instanceof ApiError) {
				return {
					taxes: null,

					error: err,
				};
			}
			return {
				taxes: null,

				error: new ApiError(
					"Unknown error occured while fetching tax rates.",
					Number(err.code) ?? 500,
					[err],
				),
			};
		}
	}
}
