import { ApiError } from "@ecom/shared/utils/ApiError";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function GetFormattedDate(input: string) {
	const date = new Date(input);
	return date.toLocaleDateString();
}

export function stringToBooleanConverter(s: string): boolean {
	if (s !== "true" && s !== "false") {
		throw new ApiError(`Invalid boolean value: ${s}`, 400, []);
	}

	return s === "true";
}

export function bolleanToStringConverter(boolVal: boolean): string {
	if (boolVal !== true && boolVal !== false) {
		throw new ApiError(`Invalid boolean value: ${boolVal}`, 400, []);
	}

	return boolVal === true ? "true" : "false";
}
