import { memo } from "react";
import type { GetAllCategoriesResponse, SubCategoryListRow } from "@ecom/shared/types/category";
import { AccordianSkeleton } from "~/components/Coupons/Skeletons/AccordianSkeleton";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "~/components/ui/accordion";
import { Label } from "~/components/ui/label";
import { Checkbox } from "~/components/ui/checkbox";
import { ChevronUp } from "lucide-react";
import type { SelectionAreaProps } from "@ecom/shared/types/coupons-comp";
import { CollectionCategoryListRow } from "@ecom/shared/types/collections";

type StateCheckResp = { checked: boolean; indeterminate: boolean };

export const CategoriesSelectionArea = memo(
	({ field, resolvedData }: SelectionAreaProps<GetAllCategoriesResponse>) => {
		if (resolvedData == null) return <AccordianSkeleton />;

		const { categories: rawCategories, error: fetchError } = resolvedData;
		const categories =
			rawCategories?.map((category) => ({
				...category,
				sub_category:
					category.sub_category?.filter(
						(sub) => sub.products_count !== undefined && sub.products_count > 0,
					) || [],
			})) || [];

		// console.log("Categories", categories);

		if (
			!categories ||
			!Array.isArray(categories) ||
			categories.length === 0 ||
			fetchError?.ok === false
		) {
			return (
				<div className="my-9 p-4 pt-6">
					<p className="text-muted-foreground w-fit text-sm mx-auto">No categories found</p>
				</div>
			);
		}

		const selectedIds = Array.isArray(field.value) ? (field.value as string[]) : [];

		const getSubcategoryCheckboxState = (subCategory: SubCategoryListRow): StateCheckResp => {
			const isSelected = selectedIds.includes(subCategory.id);
			return {
				checked: isSelected,
				indeterminate: false, // Subcategories have no children, so no indeterminate state
			};
		};

		const getCategoryCheckboxState = (category: CollectionCategoryListRow): StateCheckResp => {
			const subCategoryIds = category.sub_category.map((sub) => sub.id);
			const selectedSubCategoryCount = subCategoryIds.filter((id) => selectedIds.includes(id)).length;
			const totalSubCategories = subCategoryIds.length;
			return {
				checked: selectedSubCategoryCount === totalSubCategories && totalSubCategories > 0,
				indeterminate: selectedSubCategoryCount > 0 && selectedSubCategoryCount < totalSubCategories,
			};
		};

		const handleSubcategoryToggle = (subCategoryId: string, checked: boolean) => {
			if (checked) {
				field.onChange([...selectedIds, subCategoryId]);
			} else {
				field.onChange(selectedIds.filter((id: string) => id !== subCategoryId));
			}
		};

		const handleCategoryToggle = (category: CollectionCategoryListRow, checked: boolean) => {
			const subCategoryIds = category.sub_category.map((sub) => sub.id);
			if (checked) {
				// Add all subcategory IDs that aren't already selected
				const newIds = subCategoryIds.filter((id) => !selectedIds.includes(id));
				field.onChange([...selectedIds, ...newIds]);
			} else {
				// Remove all subcategory IDs of this category
				field.onChange(selectedIds.filter((id: string) => !subCategoryIds.includes(id)));
			}
		};

		return (
			<div>
				{categories.map((cat: CollectionCategoryListRow) => {
					const categoryState = getCategoryCheckboxState(cat);
					return (
						<Accordion
							key={cat.id}
							transition={{ duration: 0.2, ease: "easeInOut" }}
							className="flex w-full flex-col divide-y divide-secondary dark:divide-secondary/50 mb-2"
						>
							<AccordionItem value={cat.id}>
								<AccordionTrigger className="w-full text-left hover:underline underline-offset-4 focus:underline focus:decoration-accent-foreground">
									<div className="flex items-center justify-between">
										<Label className="flex items-center px-2 py-2 cursor-pointer">
											<Checkbox
												checked={
													categoryState.checked ||
													(categoryState.indeterminate && "indeterminate")
												}
												onCheckedChange={(checked) =>
													handleCategoryToggle(cat, checked as boolean)
												}
												className="mr-2"
											/>
											{cat.category_name}
										</Label>
										<ChevronUp className="h-4 w-4 transition-transform duration-200 group-data-expanded:-rotate-180" />
									</div>
								</AccordionTrigger>
								<AccordionContent className="px-4">
									{cat.sub_category.length > 0 ? (
										<div className="border-sidebar-border flex min-w-0 flex-col gap-1 border-l px-2.5 py-0.5">
											{cat.sub_category.map((sub) => {
												const subCategoryState = getSubcategoryCheckboxState(sub);
												return (
													<div
														key={sub.id}
														className="w-full text-left hover:underline underline-offset-4"
													>
														<Label className="flex items-center px-2 py-1 cursor-pointer">
															<Checkbox
																checked={subCategoryState.checked}
																onCheckedChange={(checked) =>
																	handleSubcategoryToggle(
																		sub.id,
																		checked as boolean,
																	)
																}
																className="mr-2"
															/>
															{sub.sub_category_name}
														</Label>
													</div>
												);
											})}
										</div>
									) : (
										<div className="border-sidebar-border mx-3 flex min-w-0 translate-x-px flex-col gap-1 border-l pl-6 mt-1">
											<p className="text-muted-foreground text-sm">
												No sub-categories found for {cat.category_name.toLowerCase()}
											</p>
										</div>
									)}
								</AccordionContent>
							</AccordionItem>
						</Accordion>
					);
				})}
			</div>
		);
	},
);
