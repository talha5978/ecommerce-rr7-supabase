import { memo, useCallback, useEffect } from "react";
import { useSearchParams } from "react-router";
import { useSuppressTopLoadingBar } from "~/hooks/use-supress-loading-bar";
import { Controller, useForm } from "react-hook-form";
import { CondTypeLabels, getNameSearchTag, getPageSearchTag } from "@ecom/shared/constants/couponsConstants";
import { Search, X } from "lucide-react";
import { Input } from "~/components/ui/input";
import { BuyXGetYGroupOpts, SearchBarProps } from "@ecom/shared/types/coupons-comp";

export const SearchBar = memo(({ selectedType, group }: SearchBarProps) => {
	const nameSearchTag = getNameSearchTag(selectedType, group as BuyXGetYGroupOpts);
	if (!nameSearchTag) return null;

	const [searchParams] = useSearchParams();
	const suppressNavigation = useSuppressTopLoadingBar();

	let currentQuery = searchParams.get(nameSearchTag) || "";

	const form = useForm({
		mode: "onSubmit",
		defaultValues: {
			query: currentQuery?.trim() || "",
		},
	});

	const { setValue, handleSubmit, control, getValues } = form;

	const handleClearQuery = useCallback(() => {
		suppressNavigation(() => {
			searchParams.delete(nameSearchTag as string);
			// Also delete the search page param to force a page reset to first page..
			searchParams.delete(getPageSearchTag(selectedType, group as BuyXGetYGroupOpts) as string);
		}).setSearchParams(searchParams);
		setValue("query", "");
	}, [searchParams, setValue]);

	const submitQuery = (values: { query: string }) => {
		const searchValue = values.query?.trim() || "";
		suppressNavigation(() => {
			if (searchValue) {
				searchParams.set(nameSearchTag, searchValue);
			} else {
				searchParams.delete(nameSearchTag);
			}
			// Also delete the search page param to force a page reset to first page..
			searchParams.delete(getPageSearchTag(selectedType, group as BuyXGetYGroupOpts) as string);
		}).setSearchParams(searchParams);
	};

	useEffect(() => {
		if (selectedType && getValues("query") !== "") {
			setValue("query", "");
		}
	}, [selectedType]);

	return (
		<form onSubmitCapture={handleSubmit(submitQuery)} noValidate>
			<Controller
				name="query"
				control={control}
				render={({ field }) => (
					<div className="relative">
						<Search
							className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground"
							width={18}
						/>
						<Input
							placeholder={`Search ${CondTypeLabels[selectedType].plural.toLowerCase()}...`}
							name={nameSearchTag}
							className="w-full px-8"
							id="search"
							value={field.value}
							onChange={field.onChange}
						/>
						{field.value?.length > 0 && (
							<button
								className="absolute right-2 top-1/2 transform -translate-y-1/2 cursor-pointer"
								onClick={handleClearQuery}
								type="button"
							>
								<X className="text-muted-foreground" width={18} />
							</button>
						)}
					</div>
				)}
			/>
			{/* Invisible submit button: Enter in input triggers submit */}
			<button type="submit" className="hidden">
				<span className="sr-only">Search</span>
			</button>
		</form>
	);
});
