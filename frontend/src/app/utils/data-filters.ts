import type { DataItem } from "@/app/types/data";

export interface DataFilters {
	searchQuery: string;
	selectedFormats: string[];
	selectedTags: string[];
}

export interface TagCount {
	tag: string;
	count: number;
}

const SEARCH_FIELDS: Array<
	keyof Pick<DataItem, "texto" | "title" | "description">
> = ["texto", "title", "description"];

export function filterDataItems(
	items: DataItem[],
	filters: DataFilters,
): DataItem[] {
	const normalizedQuery = filters.searchQuery.trim().toLocaleLowerCase("es-ES");
	const hasFormatFilters = filters.selectedFormats.length > 0;
	const hasTagFilters = filters.selectedTags.length > 0;

	return items.filter((item) => {
		if (hasFormatFilters && !filters.selectedFormats.includes(item.formato)) {
			return false;
		}

		if (
			hasTagFilters &&
			!filters.selectedTags.some((selectedTag) =>
				item.tags.includes(selectedTag),
			)
		) {
			return false;
		}

		if (!normalizedQuery) {
			return true;
		}

		const textMatches = SEARCH_FIELDS.some((field) =>
			item[field]?.toLocaleLowerCase("es-ES").includes(normalizedQuery),
		);

		if (textMatches) {
			return true;
		}

		return item.tags.some((tag) =>
			tag.toLocaleLowerCase("es-ES").includes(normalizedQuery),
		);
	});
}

export function getTagCounts(items: DataItem[]): TagCount[] {
	const map = new Map<string, number>();

	for (const item of items) {
		for (const tag of item.tags) {
			map.set(tag, (map.get(tag) ?? 0) + 1);
		}
	}

	return [...map.entries()]
		.map(([tag, count]) => ({ tag, count }))
		.sort((a, b) => {
			if (b.count !== a.count) {
				return b.count - a.count;
			}

			return a.tag.localeCompare(b.tag, "es-ES");
		});
}

export function getFormatCounts(items: DataItem[]): Record<string, number> {
	const counts: Record<string, number> = {};

	for (const item of items) {
		counts[item.formato] = (counts[item.formato] ?? 0) + 1;
	}

	return counts;
}

export function interleaveItemsByFormat(items: DataItem[]): DataItem[] {
	if (items.length <= 2) {
		return items;
	}

	const groupedItems = new Map<string, DataItem[]>();
	for (const item of items) {
		const bucket = groupedItems.get(item.formato);
		if (bucket) {
			bucket.push(item);
			continue;
		}

		groupedItems.set(item.formato, [item]);
	}

	if (groupedItems.size <= 1) {
		return items;
	}

	const formatOrder = [...groupedItems.keys()];

	const cursors = new Map<string, number>();
	for (const format of formatOrder) {
		cursors.set(format, 0);
	}

	const interleavedItems: DataItem[] = [];
	while (interleavedItems.length < items.length) {
		let addedInCycle = false;

		for (const format of formatOrder) {
			const bucket = groupedItems.get(format);
			if (!bucket) {
				continue;
			}

			const cursor = cursors.get(format) ?? 0;
			if (cursor >= bucket.length) {
				continue;
			}

			interleavedItems.push(bucket[cursor]);
			cursors.set(format, cursor + 1);
			addedInCycle = true;
		}

		if (!addedInCycle) {
			break;
		}
	}

	return interleavedItems;
}
