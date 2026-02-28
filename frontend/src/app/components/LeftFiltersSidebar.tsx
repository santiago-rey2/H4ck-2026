import { useAtom, useSetAtom } from "jotai";
import { Filter, Loader2, RotateCcw, Search, Tags } from "lucide-react";
import { useMemo } from "react";
import {
	clearDataFiltersAtom,
	dataSearchQueryAtom,
	selectedFormatsAtom,
	selectedTagsAtom,
} from "@/app/atoms";
import { useCategories } from "@/app/hooks/useCategories";
import { useDataItems } from "@/app/hooks/useDataItems";
import { getFormatCounts, getTagCounts } from "@/app/utils/data-filters";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";

const FORMAT_OPTIONS = [
	{ value: "dato", label: "Datos" },
	{ value: "nota", label: "Notas" },
	{ value: "link", label: "Links" },
	{ value: "evento", label: "Eventos" },
];

interface LeftFiltersSidebarProps {
	className?: string;
	surface?: "default" | "drawer" | "tablet";
}

export function LeftFiltersSidebar({
	className,
	surface = "default",
}: LeftFiltersSidebarProps) {
	const { data, isLoading, hasMore } = useDataItems();
	const { data: categories, isLoading: isCategoriesLoading } = useCategories();
	const [searchQuery, setSearchQuery] = useAtom(dataSearchQueryAtom);
	const [selectedFormats, setSelectedFormats] = useAtom(selectedFormatsAtom);
	const [selectedTags, setSelectedTags] = useAtom(selectedTagsAtom);
	const clearFilters = useSetAtom(clearDataFiltersAtom);

	const items = data?.items ?? [];

	const formatCounts = useMemo(() => getFormatCounts(items), [items]);
	const tagCounts = useMemo(() => {
		const loadedTagCounts = getTagCounts(items);
		const mergedCounts = new Map<string, number>();

		for (const tag of loadedTagCounts) {
			mergedCounts.set(tag.tag, tag.count);
		}

		for (const category of categories ?? []) {
			const categoryName = category.name?.trim();
			if (!categoryName || mergedCounts.has(categoryName)) {
				continue;
			}

			mergedCounts.set(categoryName, 0);
		}

		return [...mergedCounts.entries()]
			.map(([tag, count]) => ({ tag, count }))
			.sort((a, b) => {
				if (b.count !== a.count) {
					return b.count - a.count;
				}

				return a.tag.localeCompare(b.tag, "es-ES");
			});
	}, [items, categories]);

	const isTagsLoading = isLoading || isCategoriesLoading;

	const activeFiltersCount =
		selectedFormats.length +
		selectedTags.length +
		(searchQuery.trim().length > 0 ? 1 : 0);

	const toggleFormat = (format: string) => {
		setSelectedFormats((currentFormats) =>
			currentFormats.includes(format)
				? currentFormats.filter((current) => current !== format)
				: [...currentFormats, format],
		);
	};

	const toggleTag = (tag: string) => {
		setSelectedTags((currentTags) =>
			currentTags.includes(tag)
				? currentTags.filter((current) => current !== tag)
				: [...currentTags, tag],
		);
	};

	return (
		<div
			className={cn(
				"h-full flex flex-col bg-gradient-to-b",
				surface === "drawer"
					? "border-r-0 from-teal-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950"
					: surface === "tablet"
						? "border-r border-slate-200 from-white via-slate-50 to-slate-100 dark:border-slate-800 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950"
						: "border-r border-slate-200/70 from-teal-50/60 via-white to-slate-50 dark:border-slate-800/80 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950",
				className,
			)}
		>
			<div className="p-5 border-b border-slate-200/70 dark:border-slate-800/80">
				<p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-700 dark:text-teal-300">
					Explorar
				</p>
				<h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mt-1">
					Filtros y busqueda
				</h2>
				<p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
					Refina las tarjetas por texto, tipo o tags.
				</p>
				<p className="text-[11px] text-slate-500 dark:text-slate-500 mt-2">
					{hasMore
						? "Los conteos son parciales hasta cargar mas paginas."
						: "Conteos completos sobre los resultados cargados."}
				</p>
			</div>

			<div className="p-5 space-y-3 border-b border-slate-200/70 dark:border-slate-800/80">
				<div className="relative">
					<Search className="w-4 h-4 text-slate-500 dark:text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
					<input
						type="text"
						value={searchQuery}
						onChange={(event) => setSearchQuery(event.target.value)}
						placeholder="Buscar por texto o tag"
						className="w-full h-10 rounded-xl border border-slate-300/80 bg-white/80 dark:bg-slate-900/70 dark:border-slate-700 pl-9 pr-3 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500"
					/>
				</div>

				<Button
					type="button"
					variant="outline"
					size="sm"
					onClick={() => clearFilters()}
					disabled={activeFiltersCount === 0}
					className="w-full justify-center"
				>
					<RotateCcw className="size-3.5" />
					Limpiar filtros{" "}
					{activeFiltersCount > 0 ? `(${activeFiltersCount})` : ""}
				</Button>
			</div>

			<div className="flex-1 overflow-y-auto p-5 space-y-6">
				<section className="space-y-3">
					<div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
						<Filter className="w-4 h-4" />
						<h3 className="text-sm font-semibold">Formato</h3>
					</div>

					<div className="grid grid-cols-2 gap-2">
						{FORMAT_OPTIONS.map((format) => {
							const isSelected = selectedFormats.includes(format.value);
							return (
								<button
									key={format.value}
									type="button"
									onClick={() => toggleFormat(format.value)}
									className={`rounded-xl border px-3 py-2 text-left transition-colors ${
										isSelected
											? "border-teal-500 bg-teal-100/80 text-teal-800 dark:border-teal-400 dark:bg-teal-950/50 dark:text-teal-200"
											: "border-slate-300/80 bg-white/70 text-slate-700 hover:border-teal-300 hover:bg-teal-50 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-300 dark:hover:border-teal-600 dark:hover:bg-teal-950/40"
									}`}
								>
									<p className="text-sm font-medium">{format.label}</p>
									<p className="text-xs opacity-75">
										{formatCounts[format.value] ?? 0}
									</p>
								</button>
							);
						})}
					</div>
				</section>

				<section className="space-y-3">
					<div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
						<Tags className="w-4 h-4" />
						<h3 className="text-sm font-semibold">Tags</h3>
					</div>

					{isTagsLoading ? (
						<div className="h-24 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 flex items-center justify-center">
							<Loader2 className="w-4 h-4 animate-spin text-slate-500" />
						</div>
					) : (
						<div className="flex flex-wrap gap-2">
							{tagCounts.map((tag) => {
								const isSelected = selectedTags.includes(tag.tag);
								return (
									<button
										key={tag.tag}
										type="button"
										onClick={() => toggleTag(tag.tag)}
										className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
											isSelected
												? "border-teal-500 bg-teal-100 text-teal-800 dark:border-teal-400 dark:bg-teal-950/50 dark:text-teal-200"
												: "border-slate-300/80 bg-white/70 text-slate-700 hover:border-teal-300 hover:bg-teal-50 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-300 dark:hover:border-teal-600 dark:hover:bg-teal-950/40"
										}`}
									>
										{tag.tag} ({tag.count})
									</button>
								);
							})}
						</div>
					)}
				</section>
			</div>
		</div>
	);
}
