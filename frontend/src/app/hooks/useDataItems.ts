import {
	useInfiniteQuery,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import { useMemo } from "react";
import { isHttpError } from "@/app/api/appFetch";
import {
	type CreateItemPayload,
	createItem,
	deleteItem,
	getItemById,
	getItemLinkPreview,
	getItemsPage,
	type LinkPreviewDto,
	type UpdateItemPayload,
	updateItem,
} from "@/app/api/items.service";
import { itemsKeys } from "@/app/queries/keys";
import type { DataItem, DataResponse } from "@/app/types/data";

const DEFAULT_PAGE_SIZE = 12;

function flattenUniqueItems(pages?: Array<{ items: DataItem[] }>): DataItem[] {
	if (!pages || pages.length === 0) {
		return [];
	}

	const seenIds = new Set<number>();
	const merged: DataItem[] = [];

	for (const page of pages) {
		for (const item of page.items) {
			if (seenIds.has(item.id)) {
				continue;
			}

			seenIds.add(item.id);
			merged.push(item);
		}
	}

	return merged;
}

export function useInfiniteDataItems(pageSize = DEFAULT_PAGE_SIZE) {
	const query = useInfiniteQuery({
		queryKey: itemsKeys.infinite({ pageSize }),
		initialPageParam: 0,
		queryFn: ({ pageParam }) => {
			const safeSkip =
				typeof pageParam === "number" ? pageParam : Number(pageParam) || 0;

			return getItemsPage({
				skip: safeSkip,
				limit: pageSize,
			});
		},
		getNextPageParam: (lastPage) => {
			if (!lastPage.hasMore) {
				return undefined;
			}

			return lastPage.nextSkip ?? lastPage.skip + lastPage.items.length;
		},
		retry: 1,
		staleTime: 60_000,
	});

	const items = useMemo(
		() => flattenUniqueItems(query.data?.pages),
		[query.data?.pages],
	);
	const data = useMemo<DataResponse>(() => ({ items }), [items]);

	return {
		...query,
		items,
		data,
		hasMore: query.hasNextPage ?? false,
		isLoading: query.isPending,
	};
}

export function useDataItems(pageSize = DEFAULT_PAGE_SIZE) {
	return useInfiniteDataItems(pageSize);
}

export function useItem(itemId: number, enabled = true) {
	return useQuery({
		queryKey: itemsKeys.detail(itemId),
		queryFn: () => getItemById(itemId),
		enabled: enabled && itemId > 0,
	});
}

export function useItemLinkPreview(itemId: number | null, enabled = true) {
	return useQuery<LinkPreviewDto | null>({
		queryKey: itemsKeys.linkPreview(itemId ?? 0),
		queryFn: async () => {
			try {
				return await getItemLinkPreview(itemId as number);
			} catch (error) {
				if (isHttpError(error)) {
					if ([0, 400, 404, 422, 502, 504].includes(error.status)) {
						return null;
					}
				}

				throw error;
			}
		},
		enabled: enabled && itemId !== null && itemId > 0,
		staleTime: 60_000,
		retry: 0,
	});
}

export function useCreateItemMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (payload: CreateItemPayload) => createItem(payload),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: itemsKeys.all });
		},
	});
}

export function useUpdateItemMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (args: { itemId: number; payload: UpdateItemPayload }) =>
			updateItem(args.itemId, args.payload),
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({ queryKey: itemsKeys.all });
			queryClient.invalidateQueries({
				queryKey: itemsKeys.detail(variables.itemId),
			});
		},
	});
}

export function useDeleteItemMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (itemId: number) => deleteItem(itemId),
		onSuccess: (_, itemId) => {
			queryClient.invalidateQueries({ queryKey: itemsKeys.all });
			queryClient.removeQueries({ queryKey: itemsKeys.detail(itemId) });
		},
	});
}
