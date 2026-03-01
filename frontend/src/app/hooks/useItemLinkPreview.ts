import { useQueries, useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { isHttpError } from "@/app/api/appFetch";
import {
	getItemLinkPreview,
	type LinkPreviewDto,
} from "@/app/api/items.service";
import { itemsKeys } from "@/app/queries/keys";
import type { DataItem } from "@/app/types/data";

export interface LinkPreviewSearchIndexResult {
	searchIndexByItemId: Map<number, string>;
	isIndexing: boolean;
	totalLinksToIndex: number;
	indexedLinksCount: number;
}

function normalizeTextQuery(value: string): string {
	return value.trim().replace(/\s+/g, " ");
}

function buildLinkPreviewSearchText(preview: LinkPreviewDto | null): string {
	if (!preview) {
		return "";
	}

	return [
		preview.title,
		preview.description,
		preview.site_name,
		preview.url,
		preview.final_url,
	]
		.filter((value): value is string => Boolean(value?.trim()))
		.join(" ");
}

export async function fetchItemLinkPreviewSafe(
	itemId: number,
): Promise<LinkPreviewDto | null> {
	try {
		return await getItemLinkPreview(itemId);
	} catch (error) {
		if (isHttpError(error)) {
			if ([0, 400, 404, 422, 502, 504].includes(error.status)) {
				return null;
			}
		}

		throw error;
	}
}

export function useItemLinkPreview(itemId: number | null, enabled = true) {
	return useQuery<LinkPreviewDto | null>({
		queryKey: itemsKeys.linkPreview(itemId ?? 0),
		queryFn: () => fetchItemLinkPreviewSafe(itemId as number),
		enabled: enabled && itemId !== null && itemId > 0,
		staleTime: 60_000,
		retry: 0,
	});
}

export function useLinkPreviewSearchIndex(
	items: DataItem[],
	searchQuery: string,
): LinkPreviewSearchIndexResult {
	const normalizedSearchQuery = normalizeTextQuery(searchQuery);
	const searchableLinkItems = useMemo(
		() =>
			normalizedSearchQuery
				? items.filter((item) => item.formato === "link" && item.id > 0)
				: [],
		[items, normalizedSearchQuery],
	);

	const linkPreviewQueries = useQueries({
		queries: searchableLinkItems.map((item) => ({
			queryKey: itemsKeys.linkPreview(item.id),
			queryFn: () => fetchItemLinkPreviewSafe(item.id),
			enabled: Boolean(normalizedSearchQuery),
			staleTime: 10 * 60_000,
			retry: 0,
		})),
	});

	const searchIndexByItemId = useMemo(() => {
		const nextMap = new Map<number, string>();

		for (const [index, item] of searchableLinkItems.entries()) {
			const preview = linkPreviewQueries[index]?.data ?? null;
			const previewSearchText = buildLinkPreviewSearchText(preview);
			if (!previewSearchText) {
				continue;
			}

			nextMap.set(item.id, previewSearchText);
		}

		return nextMap;
	}, [linkPreviewQueries, searchableLinkItems]);

	const isIndexing =
		Boolean(normalizedSearchQuery) &&
		linkPreviewQueries.some((query) => query.isPending || query.isFetching);

	return {
		searchIndexByItemId,
		isIndexing,
		totalLinksToIndex: searchableLinkItems.length,
		indexedLinksCount: searchIndexByItemId.size,
	};
}
