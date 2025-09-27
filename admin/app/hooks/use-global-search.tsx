import { useState } from "react";
import { searchRegistry, SearchEntry } from "~/searchRegistry";

export function useGlobalSearch() {
	const [results, setResults] = useState<SearchEntry[]>([]);

	const search = (term: string) => {
		if (!term) {
			setResults([]);
			return;
		}

		const lower = term.toLowerCase();
		const filtered = searchRegistry.filter(
			(entry) =>
				entry.label.toLowerCase().includes(lower) ||
				entry.keywords?.some(
					(k) => k.toLowerCase().includes(lower) || lower.includes(k.toLowerCase()),
				),
		);

		setResults(filtered);
	};

	return { results, search };
}
