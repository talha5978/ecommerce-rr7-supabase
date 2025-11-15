import { defaults, type FilterOp } from "@ecom/shared/constants/constants";
import { defaultOp, type OrderFilters } from "@ecom/shared/schemas/orders-filter.schema";

interface FilterPayloadParams {
	request: Request;
}
/**
 * @param request : request getting in the loader to generate url to get the search params
 * @description : Returns the filter payload for service function and to be used to in the loader
 */

export function getOrdersFiltersPayload({ request }: FilterPayloadParams) {
	const url = new URL(request.url);

	const statusQ = url.searchParams.get("status");

	const totalQ = url.searchParams.get("total");
	const totalOp = url.searchParams.get("total_op") ?? defaultOp;

	const discountQ = url.searchParams.get("discount");
	const discountOp = url.searchParams.get("discount_op") ?? defaultOp;

	const fromParam = url.searchParams.get("createdFrom");
	const toParam = url.searchParams.get("createdTo");

	const sortBy =
		(url.searchParams.get("sortBy") as OrderFilters["sortBy"]) || defaults.defaultOrdersSortByFilter;
	const sortType =
		(url.searchParams.get("sortType") as OrderFilters["sortType"]) ||
		defaults.defaultOrdersSortTypeFilter;

	// @ts-ignore
	const filters: OrderFilters = {
		...(statusQ != null && { status: statusQ }),

		...(totalQ != null && {
			total: Number(totalQ),
			total_op: totalOp as FilterOp,
		}),

		...(discountQ != null && {
			discount: Number(discountQ),
			discount_op: discountOp as FilterOp,
		}),

		// date range
		...(fromParam &&
			toParam && {
				createdAt: {
					from: new Date(fromParam),
					to: new Date(toParam),
				},
			}),

		// sort fields
		...(sortBy && { sortBy: sortBy }),
		...(sortType && { sortType: sortType }),
	};

	// console.log("Filters: ", filters);

	return filters;
}
