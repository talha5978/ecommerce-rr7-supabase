import { type Database } from "@ecom/shared/types/supabase";
import { type ApiError } from "@ecom/shared/utils/ApiError";

export type TaxType_Raw = Database["public"]["Tables"]["tax_types"]["Row"];
export type TaxRate_Raw = Database["public"]["Tables"]["tax_rates"]["Row"];
export type TaxApplicCategories_Raw = Database["public"]["Tables"]["tax_applications_categories"]["Row"];

export type TaxApplicationCategory = {
	category_id: string | number;
	category_name: string;
};

export type TaxRate = Omit<TaxRate_Raw, "type"> & {
	type: TaxType_Raw;
	application_categories: TaxApplicationCategory[];
};

export type GetAllTaxesResp = {
	taxes: TaxRate[] | null;
	total: number;
	error: ApiError | null;
};

export type GetAllTaxTypes = {
	tax_types: TaxType_Raw[] | null;
	total: number;
	error: ApiError | null;
};

export type TaxRate_FP = {
	id: number;
	name: string;
	rate: number;
	application_categories: string[];
};

export type GetALlTaxRates_FP = {
	taxes: TaxRate_FP[] | null;
	error: ApiError | null;
};
