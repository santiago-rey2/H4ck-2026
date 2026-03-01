import type { DataItem, DataItemFormat } from "@/app/types/data";
import { normalizeLinkTarget } from "@/app/utils/link-classifier";

export interface DataFilters {
	searchQuery: string;
	selectedFormats: DataItemFormat[];
	selectedTags: string[];
}

export interface DataFilterOptions {
	linkPreviewSearchIndexByItemId?: Map<number, string> | null;
}

export interface TagCount {
	tag: string;
	count: number;
}

const SEARCH_FIELDS: Array<
	keyof Pick<DataItem, "texto" | "title" | "description">
> = ["texto", "title", "description"];

const FORMAT_SEARCH_ALIASES: Record<DataItemFormat, string[]> = {
	dato: ["dato", "datos", "short text", "short_text", "texto corto"],
	nota: ["nota", "notas", "long text", "long_text", "texto largo"],
	link: ["link", "links", "enlace", "enlaces", "url", "urls"],
	evento: ["evento", "eventos", "event", "calendar"],
};

function decodeUriComponentSafe(value: string): string {
	try {
		return decodeURIComponent(value);
	} catch {
		return value;
	}
}

function normalizeSearchText(value: string): string {
	return value
		.toLocaleLowerCase("es-ES")
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.replace(/[%+/_\\\-.,;:!?()[\]{}<>@#$^&*=|~`"']/g, " ")
		.replace(/\s+/g, " ")
		.trim();
}

function splitQueryTokens(normalizedQuery: string): string[] {
	if (!normalizedQuery) {
		return [];
	}

	return normalizedQuery.split(" ").filter(Boolean);
}

function buildLinkSearchCandidates(rawText: string): string[] {
	const normalizedLink = normalizeLinkTarget(rawText);
	if (!normalizedLink) {
		return [];
	}

	const linkCandidates = [
		normalizedLink,
		decodeUriComponentSafe(normalizedLink),
	];

	try {
		const parsedUrl = new URL(normalizedLink);
		const shortHost = parsedUrl.hostname.replace(/^www\./i, "");
		linkCandidates.push(parsedUrl.hostname, shortHost);
		linkCandidates.push(
			parsedUrl.pathname,
			decodeUriComponentSafe(parsedUrl.pathname),
		);

		for (const [key, value] of parsedUrl.searchParams.entries()) {
			linkCandidates.push(key, value, `${key} ${value}`);
		}

		const hashValue = parsedUrl.hash.replace(/^#/, "").trim();
		if (hashValue) {
			linkCandidates.push(hashValue, decodeUriComponentSafe(hashValue));
		}
	} catch {
		return linkCandidates;
	}

	return linkCandidates;
}

function buildSearchableText(
	item: DataItem,
	linkPreviewSearchText?: string | null,
): string {
	const candidates: string[] = [];

	for (const field of SEARCH_FIELDS) {
		const fieldValue = item[field];
		if (fieldValue) {
			candidates.push(fieldValue);
		}
	}

	candidates.push(item.formato, item.fecha, String(item.id), `id ${item.id}`);

	if (item.eventDate) {
		candidates.push(item.eventDate);
	}

	if (item.eventTime) {
		candidates.push(item.eventTime);
	}

	candidates.push(...item.tags);
	if (item.categoryDescriptions && item.categoryDescriptions.length > 0) {
		candidates.push(...item.categoryDescriptions);
	}
	candidates.push(...(FORMAT_SEARCH_ALIASES[item.formato] ?? []));

	if (item.formato === "link") {
		candidates.push(...buildLinkSearchCandidates(item.texto));

		if (linkPreviewSearchText) {
			candidates.push(linkPreviewSearchText);
		}
	}

	return normalizeSearchText(candidates.join(" "));
}

export function filterDataItems(
	items: DataItem[],
	filters: DataFilters,
	options?: DataFilterOptions,
): DataItem[] {
	const normalizedQuery = normalizeSearchText(filters.searchQuery);
	const explicitIdMatch = normalizedQuery.match(/^id\s+(\d+)$/);
	const explicitItemId = explicitIdMatch
		? Number.parseInt(explicitIdMatch[1] ?? "", 10)
		: null;
	const queryTokens = splitQueryTokens(normalizedQuery);
	const hasFormatFilters = filters.selectedFormats.length > 0;
	const hasTagFilters = filters.selectedTags.length > 0;
	const normalizedSelectedTags = filters.selectedTags
		.map((tag) => normalizeSearchText(tag))
		.filter(Boolean);

	return items.filter((item) => {
		if (hasFormatFilters && !filters.selectedFormats.includes(item.formato)) {
			return false;
		}

		if (hasTagFilters) {
			const normalizedItemTags = new Set(
				item.tags.map((tag) => normalizeSearchText(tag)).filter(Boolean),
			);

			const hasMatchingTag = normalizedSelectedTags.some((selectedTag) =>
				normalizedItemTags.has(selectedTag),
			);

			if (!hasMatchingTag) {
				return false;
			}
		}

		if (queryTokens.length === 0) {
			return true;
		}

		if (explicitItemId !== null && Number.isFinite(explicitItemId)) {
			return item.id === explicitItemId;
		}

		const linkPreviewSearchText =
			options?.linkPreviewSearchIndexByItemId?.get(item.id) ?? null;
		const searchableText = buildSearchableText(item, linkPreviewSearchText);
		return queryTokens.every((token) => searchableText.includes(token));
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

export function getFormatCounts(
	items: DataItem[],
): Partial<Record<DataItemFormat, number>> {
	const counts: Partial<Record<DataItemFormat, number>> = {};

	for (const item of items) {
		counts[item.formato] = (counts[item.formato] ?? 0) + 1;
	}

	return counts;
}

export function interleaveItemsByFormat(items: DataItem[]): DataItem[] {
	if (items.length <= 2) {
		return items;
	}

	const groupedItems = new Map<DataItemFormat, DataItem[]>();
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

	const cursors = new Map<DataItemFormat, number>();
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
