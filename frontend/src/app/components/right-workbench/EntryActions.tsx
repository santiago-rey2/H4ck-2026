import { AudioLines, Eraser, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui";
import type { EntryInputMode } from "./types";

interface EntryActionsProps {
	entryInputMode: EntryInputMode;
	isSubmitting: boolean;
	canSaveEntry: boolean;
	hasEntryFormValues: boolean;
	onClear: () => void;
	onSubmit: () => void;
}

export function EntryActions({
	entryInputMode,
	isSubmitting,
	canSaveEntry,
	hasEntryFormValues,
	onClear,
	onSubmit,
}: EntryActionsProps) {
	return (
		<>
			<div className="grid grid-cols-2 gap-2 pt-1">
				<Button
					type="button"
					variant="outline"
					onClick={onClear}
					disabled={!hasEntryFormValues || isSubmitting}
				>
					<Eraser className="size-3.5" />
					Limpiar
				</Button>
				<Button
					type="button"
					onClick={onSubmit}
					disabled={!canSaveEntry}
					className="bg-amber-600 hover:bg-amber-700 text-white"
				>
					{isSubmitting ? (
						<Loader2 className="size-3.5 animate-spin" />
					) : entryInputMode === "manual" ? (
						<Send className="size-3.5" />
					) : (
						<AudioLines className="size-3.5" />
					)}
					{isSubmitting
						? entryInputMode === "manual"
							? "Guardando..."
							: "Procesando..."
						: entryInputMode === "manual"
							? "Guardar item"
							: "Procesar audio"}
				</Button>
			</div>

			<p className="text-[11px] text-slate-500 dark:text-slate-400">
				{entryInputMode === "manual"
					? "Tip: usa Ctrl/Cmd + Enter para guardar mas rapido."
					: "Tip: al procesar audio, el backend transcribe, clasifica y crea el item automaticamente."}
			</p>
		</>
	);
}
