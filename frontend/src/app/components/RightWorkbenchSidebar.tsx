import { useAtom } from "jotai";
import { Eraser, Loader2, Send, SquarePen } from "lucide-react";
import { entryDraftAtom } from "@/app/atoms";
import { useCreateItemMutation } from "@/app/hooks/useDataItems";
import { emitToast } from "@/app/utils/toast-sink";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";

interface RightWorkbenchSidebarProps {
	className?: string;
	surface?: "default" | "drawer" | "tablet";
}

export function RightWorkbenchSidebar({
	className,
	surface = "default",
}: RightWorkbenchSidebarProps) {
	const createItemMutation = useCreateItemMutation();
	const [entryDraft, setEntryDraft] = useAtom(entryDraftAtom);

	const trimmedEntryDraft = entryDraft.trim();
	const canSaveEntry =
		trimmedEntryDraft.length > 0 && !createItemMutation.isPending;
	const hasEntryFormValues = trimmedEntryDraft.length > 0;

	const clearEntryComposer = () => {
		setEntryDraft("");
	};

	const submitEntry = async () => {
		if (!trimmedEntryDraft || createItemMutation.isPending) {
			return;
		}

		try {
			await createItemMutation.mutateAsync({
				name: trimmedEntryDraft,
			});

			clearEntryComposer();
			emitToast({
				tone: "success",
				title: "Item guardado",
				message: "Se agrego un nuevo item al feed.",
			});
		} catch {
			emitToast({
				tone: "error",
				title: "No se pudo guardar",
				message: "Revisa el modal de error para mas detalle.",
			});
		}
	};

	return (
		<div
			className={cn(
				"h-full flex flex-col bg-gradient-to-b",
				surface === "drawer"
					? "border-l-0 from-amber-50 via-white to-orange-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950"
					: surface === "tablet"
						? "border-l border-slate-200 from-white via-amber-50/40 to-orange-50/60 dark:border-slate-800 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950"
						: "border-l border-slate-200/70 from-amber-50/40 via-white to-orange-50/40 dark:border-slate-800/80 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950",
				className,
			)}
		>
			<div className="p-5 border-b border-slate-200/70 dark:border-slate-800/80 space-y-3">
				<p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700 dark:text-amber-300">
					Workspace
				</p>
				<h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
					Panel derecho
				</h2>

				<div className="inline-flex items-center gap-2 rounded-lg border border-amber-300/70 bg-amber-100/70 px-3 py-1.5 text-xs font-semibold text-amber-800 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200">
					<SquarePen className="size-3.5" />
					Entrada manual
				</div>
			</div>

			<div className="flex-1 p-5 overflow-y-auto space-y-4">
				<div className="space-y-1">
					<p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
						Introducir informacion
					</p>
					<p className="text-xs text-slate-600 dark:text-slate-400">
						Crea items reales en el feed. El backend asigna formato y categorias
						automaticamente.
					</p>
				</div>

				<textarea
					value={entryDraft}
					onChange={(event) => {
						setEntryDraft(event.target.value);
					}}
					onKeyDown={(event) => {
						if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
							event.preventDefault();
							void submitEntry();
						}
					}}
					placeholder="Escribe aqui la informacion que quieres guardar..."
					className="w-full min-h-[220px] resize-y rounded-2xl border border-slate-300/80 bg-white/80 p-4 text-sm leading-relaxed text-slate-900 dark:text-slate-100 dark:bg-slate-900/70 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
				/>

				<div className="grid grid-cols-2 gap-2 pt-1">
					<Button
						type="button"
						variant="outline"
						onClick={clearEntryComposer}
						disabled={!hasEntryFormValues || createItemMutation.isPending}
					>
						<Eraser className="size-3.5" />
						Limpiar
					</Button>
					<Button
						type="button"
						onClick={() => {
							void submitEntry();
						}}
						disabled={!canSaveEntry}
						className="bg-amber-600 hover:bg-amber-700 text-white"
					>
						{createItemMutation.isPending ? (
							<Loader2 className="size-3.5 animate-spin" />
						) : (
							<Send className="size-3.5" />
						)}
						{createItemMutation.isPending ? "Guardando..." : "Guardar item"}
					</Button>
				</div>

				<p className="text-[11px] text-slate-500 dark:text-slate-400">
					Tip: usa Ctrl/Cmd + Enter para guardar mas rapido.
				</p>
			</div>
		</div>
	);
}
