import { FilterOp } from "~/constants";

const opMethodMap: Record<FilterOp, FilterOp> = {
	eq: "eq",
	gt: "gt",
	gte: "gte",
	lt: "lt",
	lte: "lte",
};


export function applyFilterOps<T extends { [K in FilterOp]: (col: string, val: number) => T }>(
	query: T,
	column: string,
	op: FilterOp,
	value?: number
): T {
	if (value == null) return query;
	return query[opMethodMap[op]](column, value);
}
