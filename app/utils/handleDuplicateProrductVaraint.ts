import { FetcherWithComponents } from "react-router";
import { toast } from "sonner";
import { bolleanToStringConverter } from "~/lib/utils";
import { ProductVariantRow } from "~/types/product-variants";

type handleDuplicateProps = { fetcher: FetcherWithComponents<any>; input: ProductVariantRow };

const handleDuplicateClick = ({ fetcher, input }: handleDuplicateProps) => {
	const formData = new FormData();
	toast.info("Duplicate variant in progress...");

	input.images.forEach((image) => {
		formData.append("images", image);
	});

	console.log(input);
	const fieldsToExclue = ["images", "createdAt", "status"];

	for (const key in input as Record<string, any>) {
		const value = (input as Record<string, any>)[key];
		if (fieldsToExclue.includes(key)) {
			if (typeof value === "boolean") {
				const stringifiedVal = bolleanToStringConverter(value);
				formData.set(key, stringifiedVal);
			}
		} else {
			/* weight can be null thus if it is null, set it to "0"
            we are passing all other remaining fields as strings
            and then we are parsing number fields only in the action*/
			formData.set(key, value === null ? "0" : value.toString());
		}
	}

	fetcher.submit(formData, {
		method: "POST",
		action: `/products/${input.product_id}/variants/duplicate`,
	});
};

export default handleDuplicateClick;