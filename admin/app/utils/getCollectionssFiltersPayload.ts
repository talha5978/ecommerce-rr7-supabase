import type { CollectionFilers } from "@ecom/shared/schemas/collections-filter.schema";
import { defaults } from "@ecom/shared/constants/constants";

interface FilterPayloadParams {
	request: Request;
}
/**
 * @param request : request getting in the loader to generate url to get the search params
 * @description : Returns the filter payload for service function and to be used to in the loader
 */
export function getCollectionsFiltersPayload({ request }: FilterPayloadParams) {
	const url = new URL(request.url);

	const sortBy =
		(url.searchParams.get("sortBy") as CollectionFilers["sortBy"]) ||
		defaults.defaultCollectionSortByFilter;
	const sortType =
		(url.searchParams.get("sortType") as CollectionFilers["sortType"]) ||
		defaults.defaultCollectionSortTypeFilter;

	const filters: CollectionFilers = {
		// sort fields
		...(sortBy && { sortBy: sortBy }),
		...(sortType && { sortType: sortType }),
	};

	// console.log("Filters: ", filters);

	return filters;
}
