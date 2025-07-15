export const getActiveVaraintsFiltersCount = (params: URLSearchParams): number => {
	const nonFilterKeys = new Set(["q", "page", "size", "sortBy", "sortType"]);
	let count = 0;

	let hasMinStock = false;
	let hasMaxStock = false;
	let hasCreatedFrom = false;
	let hasCreatedTo = false;

	for (const [key, value] of params.entries()) {
		if (nonFilterKeys.has(key)) continue;
		if (value === "" || value === "null") continue;

		switch (key) {
			case "original_price":
			case "sale_price":
			case "reorder_level":
			case "status":
				count++;
				break;

			case "min_stock":
				hasMinStock = true;
				break;

			case "max_stock":
				hasMaxStock = true;
				break;

			case "createdFrom":
				hasCreatedFrom = true;
				break;

			case "createdTo":
				hasCreatedTo = true;
				break;

			// All `_op` fields are ignored
			case "original_price_op":
			case "sale_price_op":
			case "reorder_level_op":
				break;

			default:
				// Just in case you add future filters
				count++;
		}
	}

	// Count stock only once if any stock bound is set
	if (hasMinStock || hasMaxStock) count++;

	// Count createdAt if both bounds exist
	if (hasCreatedFrom && hasCreatedTo) count++;

	return count;
};