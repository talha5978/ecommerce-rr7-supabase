import { Skeleton } from "~/components/ui/skeleton";

export const PaginationSkeleton = () => {
	return (
		<div className="flex gap-2 justify-between my-4 items-center">
			<Skeleton className="mr-2 sm:w-[6rem] w-[2rem] h-[1.8rem]" />
			<Skeleton className="h-4 w-[66px] rounded-sm" />
			<Skeleton className="ml-2 sm:w-[6rem] w-[2rem] h-[1.8rem]" />
		</div>
	);
};
