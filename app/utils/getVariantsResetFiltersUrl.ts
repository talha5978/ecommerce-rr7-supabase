type Params = {
	search: string;
	pathname: string;
	defaultPage: string;
	defaultSize: string;
};

export function getVariantsResetFiltersUrl({ search, pathname, defaultPage, defaultSize }: Params): string {
	const searchParams = new URLSearchParams(search);
	const newParams = new URLSearchParams();

	const page = searchParams.get("page");
	const size = searchParams.get("size");

	if (page && page !== defaultPage) newParams.set("page", page);
	if (size && size !== defaultSize) newParams.set("size", size);

	const newSearch = newParams.toString();
	return newSearch ? `${pathname}?${newSearch}` : pathname;
}
