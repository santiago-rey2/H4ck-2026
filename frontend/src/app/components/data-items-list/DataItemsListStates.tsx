import { Loader2, SearchX } from "lucide-react";
import { Button } from "@/components/ui";

export function DataItemsListLoadingState() {
	return (
		<div className="flex items-center justify-center min-h-96">
			<Loader2 className="w-8 h-8 animate-spin text-blue-600" />
		</div>
	);
}

interface DataItemsListErrorStateProps {
	error: unknown;
}

export function DataItemsListErrorState({
	error,
}: DataItemsListErrorStateProps) {
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

export function DataItemsListNoItemsState() {
	return (
		<div className="flex items-center justify-center min-h-96">
			<p className="text-slate-500">No hay datos disponibles</p>
		</div>
	);
}

interface DataItemsListIndexingStateProps {
	indexedLinksCount: number;
	totalLinksToIndex: number;
}

export function DataItemsListIndexingState({
	indexedLinksCount,
	totalLinksToIndex,
}: DataItemsListIndexingStateProps) {
	return (
		<div className="flex items-center justify-center min-h-96 px-6">
			<div className="text-center max-w-md space-y-3">
				<div className="inline-flex items-center justify-center rounded-full bg-slate-200/70 dark:bg-slate-800 p-3">
					<Loader2 className="w-5 h-5 animate-spin text-slate-600 dark:text-slate-300" />
				</div>
				<p className="font-semibold text-slate-800 dark:text-slate-100">
					Buscando en metadata de enlaces...
				</p>
				<p className="text-sm text-slate-600 dark:text-slate-400">
					Indexados {indexedLinksCount} de {totalLinksToIndex} links cargados.
				</p>
			</div>
		</div>
	);
}

interface DataItemsListNoResultsStateProps {
	activeFiltersCount: number;
	hasNextPage: boolean;
	isFetchingNextPage: boolean;
	onLoadMore: () => void;
}

export function DataItemsListNoResultsState({
	activeFiltersCount,
	hasNextPage,
	isFetchingNextPage,
	onLoadMore,
}: DataItemsListNoResultsStateProps) {
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
					Prueba con menos filtros o modifica la busqueda ({activeFiltersCount}{" "}
					activos).
				</p>

				{hasNextPage ? (
					<Button
						type="button"
						variant="outline"
						onClick={onLoadMore}
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
