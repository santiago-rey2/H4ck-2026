import { useAtomValue } from "jotai";
import { Loader2 } from "lucide-react";
import { AnimatePresence } from "motion/react";
import { useCallback, useEffect, useMemo, useRef } from "react";
import {
	dataSearchQueryAtom,
	selectedFormatsAtom,
	selectedTagsAtom,
} from "@/app/atoms";
import { useDataItems } from "@/app/hooks/useDataItems";
import { useLinkPreviewSearchIndex } from "@/app/hooks/useItemLinkPreview";
import { useMotionPreferences } from "@/app/motion/useMotionPreferences";
import { getListItemVariants } from "@/app/motion/variants";
import {
	filterDataItems,
	interleaveItemsByFormat,
} from "@/app/utils/data-filters";
import { Button } from "@/components/ui";
import {
	DataItemsListErrorState,
	DataItemsListIndexingState,
	DataItemsListLoadingState,
	DataItemsListNoItemsState,
	DataItemsListNoResultsState,
} from "./data-items-list/DataItemsListStates";
import {
	MASONRY_ROW_HEIGHT_PX,
	MasonryCardItem,
} from "./data-items-list/MasonryCardItem";
import { useDataItemsPagination } from "./data-items-list/useDataItemsPagination";

export function DataItemsList() {
	const searchQuery = useAtomValue(dataSearchQueryAtom);
	const {
		data,
		isLoading,
		error,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
	} = useDataItems();
	const { prefersReducedMotion } = useMotionPreferences();
	const selectedFormats = useAtomValue(selectedFormatsAtom);
	const selectedTags = useAtomValue(selectedTagsAtom);
	const isSearchActive = searchQuery.trim().length > 0;
	const hasRenderedOnce = useRef(false);
	const listItemVariants = getListItemVariants(prefersReducedMotion);

	useEffect(() => {
		hasRenderedOnce.current = true;
	}, []);

	const items = data?.items ?? [];
	const {
		searchIndexByItemId,
		isIndexing,
		totalLinksToIndex,
		indexedLinksCount,
	} = useLinkPreviewSearchIndex(items, searchQuery);

	const orderedItems = useMemo(
		() =>
			interleaveItemsByFormat(
				filterDataItems(
					items,
					{
						searchQuery,
						selectedFormats,
						selectedTags,
					},
					{
						linkPreviewSearchIndexByItemId: searchIndexByItemId,
					},
				),
			),
		[items, searchQuery, selectedFormats, selectedTags, searchIndexByItemId],
	);

	const activeFiltersCount =
		selectedFormats.length + selectedTags.length + (isSearchActive ? 1 : 0);
	const loadMore = useCallback(() => {
		void fetchNextPage();
	}, [fetchNextPage]);
	const { sentinelRef } = useDataItemsPagination({
		fetchNextPage: loadMore,
		hasNextPage,
		isFetchingNextPage,
		isLoading,
		isSearchActive,
		orderedItemsCount: orderedItems.length,
	});

	if (isLoading) {
		return <DataItemsListLoadingState />;
	}

	if (error) {
		return <DataItemsListErrorState error={error} />;
	}

	if (items.length === 0) {
		return <DataItemsListNoItemsState />;
	}

	if (orderedItems.length === 0) {
		if (isSearchActive && isIndexing) {
			return (
				<DataItemsListIndexingState
					indexedLinksCount={indexedLinksCount}
					totalLinksToIndex={totalLinksToIndex}
				/>
			);
		}

		return (
			<DataItemsListNoResultsState
				activeFiltersCount={activeFiltersCount}
				hasNextPage={hasNextPage}
				isFetchingNextPage={isFetchingNextPage}
				onLoadMore={loadMore}
			/>
		);
	}

	return (
		<div className="space-y-4">
			<div
				className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 grid-flow-row-dense items-start"
				style={{ gridAutoRows: `${MASONRY_ROW_HEIGHT_PX}px` }}
			>
				<AnimatePresence mode="sync" initial={false}>
					{orderedItems.map((item, index) => {
						const entryDelay = hasRenderedOnce.current
							? 0
							: Math.min(index * 0.03, 0.18);

						return (
							<MasonryCardItem
								key={item.id}
								item={item}
								entryDelay={entryDelay}
								prefersReducedMotion={prefersReducedMotion}
								listItemVariants={listItemVariants}
							/>
						);
					})}
				</AnimatePresence>
			</div>

			<div className="flex flex-col items-center gap-3 pt-1">
				<div ref={sentinelRef} className="h-1 w-full" />

				{isFetchingNextPage ? (
					<p className="inline-flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
						<Loader2 className="size-3.5 animate-spin" />
						Cargando mas tarjetas...
					</p>
				) : hasNextPage ? (
					<Button type="button" variant="outline" size="sm" onClick={loadMore}>
						Cargar mas
					</Button>
				) : (
					<p className="text-xs text-slate-500 dark:text-slate-400">
						Has llegado al final de los resultados cargados.
					</p>
				)}
			</div>
		</div>
	);
}
