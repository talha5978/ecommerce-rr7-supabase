import { ChevronUp } from "lucide-react";
import { memo } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "~/components/ui/accordion";
import { Label } from "~/components/ui/label";
import { Skeleton } from "~/components/ui/skeleton";

export const AccordianSkeleton = memo(function AccordianSkeletonsFunc({
	main_skeletons = 3,
	sub_skeletons = 2,
}: {
	main_skeletons?: number;
	sub_skeletons?: number;
}) {
	return (
		<div>
			{Array.from({ length: main_skeletons }, (_, idx) => (
				<Accordion
					key={idx}
					transition={{ duration: 0.2, ease: "easeInOut" }}
					className="flex w-full flex-col divide-y divide-secondary dark:divide-secondary/50 mb-2"
				>
					<AccordionItem value={idx}>
						<AccordionTrigger className="w-full text-left hover:underline underline-offset-4">
							<div className="flex items-center justify-between">
								<Label className="flex items-center px-2 py-2 cursor-pointer">
									<Skeleton className="h-4 w-4 rounded-sm" />
									<Skeleton className="h-4 min-w-[250px] rounded-sm" />
								</Label>
								<ChevronUp className="h-4 w-4 transition-transform duration-200 group-data-expanded:-rotate-180" />
							</div>
						</AccordionTrigger>
						<AccordionContent className="px-4">
							<div className="border-sidebar-border flex min-w-0 flex-col gap-0 border-l px-2.5 py-0.5">
								{Array.from({ length: sub_skeletons }, (_, sub_idx) => sub_idx).map((sub) => (
									<Label className="flex items-center px-2 py-2 cursor-pointer" key={sub}>
										<Skeleton className="h-4 w-4 rounded-sm" />
										<Skeleton className="h-4 min-w-[250px] rounded-sm" />
									</Label>
								))}
							</div>
						</AccordionContent>
					</AccordionItem>
				</Accordion>
			))}
		</div>
	);
});
