import { match } from "path-to-regexp";
import breadcrumbRegistry, { type BreadcrumbItem } from "~/breadCrumbsRegistry";

export function resolveBreadcrumbs(pathname: string, params?: Record<string, string>): BreadcrumbItem[] {
	for (const [pattern, generator] of Object.entries(breadcrumbRegistry)) {
		const matcher = match(pattern, { decode: decodeURIComponent });
		const matched = matcher(pathname);
		if (matched) {
			return generator({
				...Object.fromEntries(Object.entries(matched.params).map(([k, v]) => [k, String(v)])),
				...params,
			});
		}
	}
	return [];
}
