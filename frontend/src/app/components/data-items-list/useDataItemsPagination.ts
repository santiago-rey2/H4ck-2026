import { useEffect, useRef } from "react";

interface UseDataItemsPaginationOptions {
	fetchNextPage: () => void;
	hasNextPage: boolean;
	isFetchingNextPage: boolean;
	isLoading: boolean;
	isSearchActive: boolean;
	orderedItemsCount: number;
}

export function useDataItemsPagination({
	fetchNextPage,
	hasNextPage,
	isFetchingNextPage,
	isLoading,
	isSearchActive,
	orderedItemsCount,
}: UseDataItemsPaginationOptions) {
	const sentinelRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		if (isLoading || isFetchingNextPage || !hasNextPage) {
			return;
		}

		if (isSearchActive || orderedItemsCount === 0) {
			fetchNextPage();
		}
	}, [
		fetchNextPage,
		orderedItemsCount,
		hasNextPage,
		isSearchActive,
		isFetchingNextPage,
		isLoading,
	]);

	useEffect(() => {
		const sentinel = sentinelRef.current;
		if (!sentinel || !hasNextPage || isFetchingNextPage || isSearchActive) {
			return;
		}

		const observer = new IntersectionObserver(
			(entries) => {
				const shouldLoadMore = entries.some((entry) => entry.isIntersecting);
				if (shouldLoadMore) {
					fetchNextPage();
				}
			},
			{
				root: null,
				rootMargin: "420px 0px 420px 0px",
				threshold: 0.01,
			},
		);

		observer.observe(sentinel);

		return () => {
			observer.disconnect();
		};
	}, [fetchNextPage, hasNextPage, isFetchingNextPage, isSearchActive]);

	return { sentinelRef };
}
