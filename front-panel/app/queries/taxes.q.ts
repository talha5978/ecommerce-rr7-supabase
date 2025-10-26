import { TaxesService_FP } from "@ecom/shared/services/taxes.service";
import type { GetALlTaxRates_FP } from "@ecom/shared/types/taxes";
import { queryOptions } from "@tanstack/react-query";

interface TaxesQueryArgs {
	request: Request;
}

export const TaxesQuery = ({ request }: TaxesQueryArgs) => {
	return queryOptions<GetALlTaxRates_FP>({
		queryKey: ["taxes_fp"],
		queryFn: async () => {
			const taxSvc = new TaxesService_FP(request);
			const result = await taxSvc.getAllTaxRates();
			return result;
		},
	});
};
