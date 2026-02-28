import { useAtomValue } from "jotai";
import { Loader2, SearchX } from "lucide-react";
import { AnimatePresence, motion, type Variants } from "motion/react";
import {
	useCallback,
	useEffect,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import {
	dataSearchQueryAtom,
	selectedFormatsAtom,
	selectedTagsAtom,
} from "@/app/atoms";
import { useDataItems } from "@/app/hooks/useDataItems";
import { MOTION_DURATION, MOTION_EASE } from "@/app/motion/tokens";
import { useMotionPreferences } from "@/app/motion/useMotionPreferences";
import { getListItemVariants } from "@/app/motion/variants";
import type { DataItem } from "@/app/types/data";
import {
	filterDataItems,
	interleaveItemsByFormat,
} from "@/app/utils/data-filters";
import { classifyLinkTarget } from "@/app/utils/link-classifier";
import { Button } from "@/components/ui";
import { DataItemCard } from "./DataItemCard";

const MASONRY_ROW_HEIGHT_PX = 8;
const MASONRY_GAP_PX = 16;

interface MasonryCardItemProps {
	item: DataItem;
	entryDelay: number;
	prefersReducedMotion: boolean;
	listItemVariants: Variants;
}

function MasonryCardItem({
	item,
	entryDelay,
	prefersReducedMotion,
	listItemVariants,
}: MasonryCardItemProps) {
	const [rowSpan, setRowSpan] = useState(1);
	const contentRef = useRef<HTMLDivElement | null>(null);
	const frameRef = useRef<number | null>(null);
	const linkKind =
		item.formato === "link" ? classifyLinkTarget(item.texto).kind : null;
	const isWideCard =
		item.formato === "nota" ||
		item.formato === "evento" ||
		linkKind === "video" ||
		linkKind === "location";

	const measureRowSpan = useCallback(() => {
		const contentNode = contentRef.current;
		if (!contentNode) {
			return;
		}

		const contentHeight = contentNode.getBoundingClientRect().height;
		const nextRowSpan = Math.max(
			1,
			Math.ceil(
				(contentHeight + MASONRY_GAP_PX) /
					(MASONRY_ROW_HEIGHT_PX + MASONRY_GAP_PX),
			),
		);

		setRowSpan((currentRowSpan) =>
			currentRowSpan === nextRowSpan ? currentRowSpan : nextRowSpan,
		);
	}, []);

	useLayoutEffect(() => {
		const contentNode = contentRef.current;
		if (!contentNode) {
			return;
		}

		const scheduleMeasure = () => {
			if (frameRef.current !== null) {
				cancelAnimationFrame(frameRef.current);
			}

			frameRef.current = requestAnimationFrame(() => {
				frameRef.current = null;
				measureRowSpan();
			});
		};

		scheduleMeasure();

		let resizeObserver: ResizeObserver | null = null;
		const hasResizeObserver = typeof ResizeObserver !== "undefined";
		if (typeof ResizeObserver !== "undefined") {
			resizeObserver = new ResizeObserver(() => {
				scheduleMeasure();
			});
			resizeObserver.observe(contentNode);
		} else {
			window.addEventListener("resize", scheduleMeasure);
		}

		const images = Array.from(contentNode.querySelectorAll("img"));
		for (const image of images) {
			if (image.complete) {
				continue;
			}

			image.addEventListener("load", scheduleMeasure);
			image.addEventListener("error", scheduleMeasure);
		}

		return () => {
			if (frameRef.current !== null) {
				cancelAnimationFrame(frameRef.current);
			}

			resizeObserver?.disconnect();

			for (const image of images) {
				image.removeEventListener("load", scheduleMeasure);
				image.removeEventListener("error", scheduleMeasure);
			}

			if (!hasResizeObserver) {
				window.removeEventListener("resize", scheduleMeasure);
			}
		};
	}, [measureRowSpan]);

	return (
		<div
			className={`min-w-0 ${isWideCard ? "col-span-1 sm:col-span-2" : "col-span-1"}`}
			style={{ gridRowEnd: `span ${rowSpan}` }}
		>
			<div ref={contentRef}>
				<motion.div
					variants={listItemVariants}
					initial="hidden"
					animate="visible"
					exit="exit"
					transition={{
						duration: prefersReducedMotion ? 0 : MOTION_DURATION.base,
						delay: prefersReducedMotion ? 0 : entryDelay,
						ease: MOTION_EASE.decelerate,
					}}
				>
					<DataItemCard item={item} />
				</motion.div>
			</div>
		</div>
	);
}

export function DataItemsList() {
	const {
		data,
		isLoading,
		error,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
	} = useDataItems();
	const { prefersReducedMotion } = useMotionPreferences();
	const searchQuery = useAtomValue(dataSearchQueryAtom);
	const selectedFormats = useAtomValue(selectedFormatsAtom);
	const selectedTags = useAtomValue(selectedTagsAtom);
	const isSearchActive = searchQuery.trim().length > 0;
	const hasRenderedOnce = useRef(false);
	const sentinelRef = useRef<HTMLDivElement | null>(null);
	const listItemVariants = getListItemVariants(prefersReducedMotion);

	useEffect(() => {
		hasRenderedOnce.current = true;
	}, []);

	const items = data?.items ?? [];

	const orderedItems = useMemo(
		() =>
			interleaveItemsByFormat(
				filterDataItems(items, {
					searchQuery,
					selectedFormats,
					selectedTags,
				}),
			),
		[items, searchQuery, selectedFormats, selectedTags],
	);

	const activeFiltersCount =
		selectedFormats.length + selectedTags.length + (isSearchActive ? 1 : 0);

	useEffect(() => {
		if (isLoading || isFetchingNextPage || !hasNextPage) {
			return;
		}

		if (isSearchActive || orderedItems.length === 0) {
			void fetchNextPage();
		}
	}, [
		fetchNextPage,
		orderedItems.length,
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
					void fetchNextPage();
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

	if (isLoading) {
		return (
			<div className="flex items-center justify-center min-h-96">
				<Loader2 className="w-8 h-8 animate-spin text-blue-600" />
			</div>
		);
	}

	if (error) {
		return (
			<div className="flex items-center justify-center min-h-96 bg-red-50 dark:bg-red-900/20 rounded-lg p-6">
				<div className="text-center">
					<p className="text-red-600 dark:text-red-400 font-semibold">
						Error al cargar los datos
					</p>
					<p className="text-sm text-red-500 dark:text-red-300 mt-2">
						{error instanceof Error ? error.message : "Error desconocido"}
					</p>
				</div>
			</div>
		);
	}

	if (items.length === 0) {
		return (
			<div className="flex items-center justify-center min-h-96">
				<p className="text-slate-500">No hay datos disponibles</p>
			</div>
		);
	}

	if (orderedItems.length === 0) {
		return (
			<div className="flex items-center justify-center min-h-96 px-6">
				<div className="text-center max-w-md space-y-3">
					<div className="inline-flex items-center justify-center rounded-full bg-slate-200/70 dark:bg-slate-800 p-3">
						<SearchX className="w-5 h-5 text-slate-600 dark:text-slate-300" />
					</div>
					<p className="font-semibold text-slate-800 dark:text-slate-100">
						No hay resultados con los filtros actuales
					</p>
					<p className="text-sm text-slate-600 dark:text-slate-400">
						Prueba con menos filtros o modifica la busqueda (
						{activeFiltersCount} activos).
					</p>

					{hasNextPage ? (
						<Button
							type="button"
							variant="outline"
							onClick={() => {
								void fetchNextPage();
							}}
							disabled={isFetchingNextPage}
						>
							{isFetchingNextPage ? (
								<Loader2 className="size-3.5 animate-spin" />
							) : null}
							Cargar mas resultados
						</Button>
					) : null}
				</div>
			</div>
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
					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={() => {
							void fetchNextPage();
						}}
					>
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
