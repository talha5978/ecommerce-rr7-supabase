export const getActiveOrdersFiltersCount = (params: URLSearchParams): number => {
	const nonFilterKeys = new Set(["q", "page", "size", "sortBy", "sortType"]);
	let count = 0;

	let hasCreatedFrom = false;
	let hasCreatedTo = false;

	for (const [key, value] of params.entries()) {
		if (nonFilterKeys.has(key)) continue;
		if (value === "" || value === "null") continue;

		switch (key) {
			case "total":
			case "discount":
			case "status":
				count++;
				break;

			case "createdFrom":
				hasCreatedFrom = true;
				break;

			case "createdTo":
				hasCreatedTo = true;
				break;

			// All `_op` fields are ignored
			case "total_op":
			case "discount_op":
				break;

			default:
				count++;
		}
	}

	// Count createdAt if both bounds exist
	if (hasCreatedFrom && hasCreatedTo) count++;

	return count;
};
