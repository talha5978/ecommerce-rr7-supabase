import { memo, useCallback } from "react";
import { getPageSearchTag } from "~/utils/couponsConstants";
import { PaginationSkeleton } from "~/components/Coupons/Skeletons/PaginationSkeleton";
import { useSuppressTopLoadingBar } from "~/hooks/use-supress-loading-bar";
import { useSearchParams } from "react-router";
import { Button } from "~/components/ui/button";
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import type { Groups, TypesToSelect } from "@ecom/shared/types/coupons-comp";

type PaginationOptionsProps = {
	totalElements: number;
	originalPageSize: number;
	selectedType: TypesToSelect;
	group: Groups;
};

const PaginationOptions = memo(
	({ totalElements, originalPageSize, selectedType, group }: PaginationOptionsProps) => {
		const pageSearchTag = getPageSearchTag(selectedType as TypesToSelect, group);
		if (!pageSearchTag) return <PaginationSkeleton />;

		const suppressNavigation = useSuppressTopLoadingBar();
		const [searchParams] = useSearchParams();

		const pageCount = Math.ceil(totalElements / originalPageSize);
		const currentPage =
			pageCount === 0
				? 0
				: searchParams.get(pageSearchTag)
					? Number(searchParams.get(pageSearchTag))
					: 1;

		const isFirstPage = pageCount === 0 ? true : currentPage === 1;
		const isLastPage = currentPage === pageCount;

		const handlePrevPage = useCallback(() => {
			if (currentPage > 1) {
				suppressNavigation(() => {
					searchParams.set(pageSearchTag, (currentPage - 1).toString());
				}).setSearchParams(searchParams);
			}
		}, [currentPage, searchParams, suppressNavigation]);

		const handleNextPage = useCallback(() => {
			if (currentPage < pageCount) {
				suppressNavigation(() => {
					searchParams.set(pageSearchTag, (currentPage + 1).toString());
				}).setSearchParams(searchParams);
			}
		}, [currentPage, pageCount, searchParams, suppressNavigation]);

		return (
			<div className="flex gap-2 justify-between my-4 items-center">
				<Button
					variant="outline"
					size="sm"
					type="button"
					onClick={handlePrevPage}
					disabled={isFirstPage}
				>
					<IconChevronLeft />
					<span className="sm:inline hidden mr-2">Previous</span>
				</Button>
				<div>
					<p className="text-sm text-muted-foreground">
						Page {currentPage} of {pageCount}
					</p>
				</div>
				<Button
					variant="outline"
					size="sm"
					type="button"
					onClick={handleNextPage}
					disabled={isLastPage}
				>
					<span className="sm:inline hidden ml-2">Next</span>
					<IconChevronRight />
				</Button>
			</div>
		);
	},
);

export default PaginationOptions;
