import { TaxesService } from "@ecom/shared/services/taxes.service";
import type { GetAllTaxesResp, GetAllTaxTypes } from "@ecom/shared/types/taxes";
import { queryOptions } from "@tanstack/react-query";

interface TaxesQueryArgs {
	request: Request;
	q: string;
	pageIndex?: number;
	pageSize?: number;
}

interface TaxeTypesQueryArgs {
	request: Request;
}

export const TaxesQuery = ({ request, q, pageIndex, pageSize }: TaxesQueryArgs) => {
	return queryOptions<GetAllTaxesResp>({
		queryKey: ["taxes", q, pageIndex, pageSize],
		queryFn: async () => {
			const taxSvc = new TaxesService(request);
			const result = await taxSvc.getAllTaxRates({
				pageIndex,
				pageSize,
				searchQuery: q,
			});
			return result;
		},
	});
};

export const TaxTypesQuery = ({ request }: TaxeTypesQueryArgs) => {
	return queryOptions<GetAllTaxTypes>({
		queryKey: ["tax_types"],
		queryFn: async () => {
			const taxSvc = new TaxesService(request);
			const result = await taxSvc.getAllTaxTypes();
			return result;
		},
	});
};
