import { NavigateFunction, useNavigate, useSearchParams } from "react-router";

interface PaginationControlsReturnType {
    onPageChange: (newPageIndex: number) => void;
    onPageSizeChange: (newPageSize: number) => void;
}

interface PaginationControlsProps {
    defaultPageSize: number
}

class GetPaginationControlsController {
	private readonly navigate: NavigateFunction;
	private readonly searchParams: URLSearchParams;
	private readonly defaultPageSize: number;

	/**
	 * @description Returns the control functions for page and page size changes
	 */

	constructor({ defaultPageSize }: PaginationControlsProps) {
		const navigate = useNavigate();
		this.navigate = navigate;
		const [searchParams] = useSearchParams();
		this.searchParams = searchParams;
		this.defaultPageSize = defaultPageSize;
	}

	onPageChange(newPageIndex: number) {
		this.searchParams.set("page", (newPageIndex + 1).toString());
		this.navigate({ search: this.searchParams.toString() });
	}

	onPageSizeChange(newPageSize: number) {
		this.searchParams.set("size", newPageSize.toString());
		this.searchParams.set("page", String(this.defaultPageSize));
		this.navigate({ search: this.searchParams.toString() });
	}
}

export function GetPaginationControls({
	defaultPageSize,
}: PaginationControlsProps): PaginationControlsReturnType {
	const GetPaginationControls = new GetPaginationControlsController({
		defaultPageSize: defaultPageSize ?? 10,
	});

	return GetPaginationControls;
}