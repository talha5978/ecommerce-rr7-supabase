import { defaults, FilterOp } from "~/constants";
import { stringToBooleanConverter } from "~/lib/utils";
import { defaultOp, type ProductVariantsFilters } from "~/schemas/product-variants-filter.schema";

interface FilterPayloadParams {
	request: Request;
}
/**
 * @param request : request getting in the loader to generate url to get the search params
 * @description : Returns the filter payload for service function and to be used to in the loader
 */
export function getProductVariantsFiltersPayload({ request }: FilterPayloadParams) {
	const url = new URL(request.url);

	const statusQ = url.searchParams.get("status");
	const origQ = url.searchParams.get("original_price");
	const origOp = url.searchParams.get("original_price_op") ?? defaultOp;
	const saleQ = url.searchParams.get("sale_price");
	const saleOp = url.searchParams.get("sale_price_op") ?? defaultOp;
	const reorderQ = url.searchParams.get("reorder_level");
	const reorderOp = url.searchParams.get("reorder_level_op") ?? defaultOp;

	const fromParam = url.searchParams.get("createdFrom");
	const toParam = url.searchParams.get("createdTo");

	const maxStockParam = url.searchParams.get("max_stock");
	const minStockParam = url.searchParams.get("min_stock");

	const sortBy =
		(url.searchParams.get("sortBy") as ProductVariantsFilters["sortBy"]) ||
		defaults.defaultProductVaraintsSortByFilter;
	const sortType =
		(url.searchParams.get("sortType") as ProductVariantsFilters["sortType"]) ||
		defaults.defaultProductVaraintsSortTypeFilter;

	const filters: ProductVariantsFilters = {
		// boolean flags
		...(statusQ != null && { status: stringToBooleanConverter(statusQ) }),

		// NUMBER FIELDS + OPS
		...(origQ != null && {
			original_price: Number(origQ),
			original_price_op: origOp as FilterOp,
		}),
		...(saleQ != null && {
			sale_price: Number(saleQ),
			sale_price_op: saleOp as FilterOp,
		}),
		...(reorderQ != null && {
			reorder_level: Number(reorderQ),
			reorder_level_op: reorderOp as FilterOp,
		}),

		// STOCK ARRAY FIELDS
		...(maxStockParam && { stock: [0, Number(maxStockParam)] }),
		...(minStockParam && { stock: [Number(minStockParam), defaults.MAX_STOCK_FILTER_DEFAULT_VAL] }),

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
