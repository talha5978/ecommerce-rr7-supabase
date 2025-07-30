import { defaults } from "~/constants";
import { stringToBooleanConverter } from "~/lib/utils";
import type { ProductFilters } from "~/schemas/products-filter.schema";

interface FilterPayloadParams {
	request: Request;
}
/**
 * @param request : request getting in the loader to generate url to get the search params
 * @description : Returns the filter payload for service function and to be used to in the loader
 */
export function getProductsFiltersPayload({ request }: FilterPayloadParams) {
	const url = new URL(request.url);

	const statusQ = url.searchParams.get("status");
	const isFeaturedQ = url.searchParams.get("is_featured");
	const categoryQ = url.searchParams.get("category");
	const subCategoryQ = url.searchParams.get("sub_category");
	const freeShippingQ = url.searchParams.get("free_shipping");

	const fromParam = url.searchParams.get("createdFrom");
	const toParam = url.searchParams.get("createdTo");

	const sortBy =
		(url.searchParams.get("sortBy") as ProductFilters["sortBy"]) || defaults.defaultProductSortByFilter;
	const sortType =
		(url.searchParams.get("sortType") as ProductFilters["sortType"]) ||
		defaults.defaultProductSortTypeFilter;

	const filters: ProductFilters = {
		// boolean flags
		...(statusQ != null && { status: stringToBooleanConverter(statusQ) }),
		...(isFeaturedQ != null && { is_featured: stringToBooleanConverter(isFeaturedQ) }),
		...(freeShippingQ != null && { free_shipping: stringToBooleanConverter(freeShippingQ) }),

		// multi-select arrays
		...(categoryQ != null && { category: categoryQ.split(",") }),
		...(subCategoryQ != null && { sub_category: subCategoryQ.split(",") }),

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
