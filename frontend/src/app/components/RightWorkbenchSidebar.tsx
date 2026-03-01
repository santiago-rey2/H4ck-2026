import { useAtom } from "jotai";
import { AudioLines, Eraser, Loader2, Send, SquarePen } from "lucide-react";
import { useRef, useState } from "react";
import { entryDraftAtom } from "@/app/atoms";
import {
	useCreateItemFromAudioMutation,
	useCreateItemMutation,
} from "@/app/hooks/useDataItems";
import { emitToast } from "@/app/utils/toast-sink";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";

type EntryInputMode = "manual" | "audio";

function formatFileSize(sizeInBytes: number): string {
	if (!Number.isFinite(sizeInBytes) || sizeInBytes <= 0) {
		return "0 B";
	}

	if (sizeInBytes < 1024) {
		return `${sizeInBytes} B`;
	}

	if (sizeInBytes < 1024 * 1024) {
		return `${(sizeInBytes / 1024).toFixed(1)} KB`;
	}

	return `${(sizeInBytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface RightWorkbenchSidebarProps {
	className?: string;
	surface?: "default" | "drawer" | "tablet";
}

export function RightWorkbenchSidebar({
	className,
	surface = "default",
}: RightWorkbenchSidebarProps) {
	const createItemMutation = useCreateItemMutation();
	const createItemFromAudioMutation = useCreateItemFromAudioMutation();
	const [entryDraft, setEntryDraft] = useAtom(entryDraftAtom);
	const [entryInputMode, setEntryInputMode] =
		useState<EntryInputMode>("manual");
	const [audioFile, setAudioFile] = useState<File | null>(null);
	const audioInputRef = useRef<HTMLInputElement | null>(null);

	const trimmedEntryDraft = entryDraft.trim();
	const isSubmitting =
		createItemMutation.isPending || createItemFromAudioMutation.isPending;
	const canSaveManualEntry = trimmedEntryDraft.length > 0 && !isSubmitting;
	const canSaveAudioEntry = Boolean(audioFile) && !isSubmitting;
	const canSaveEntry =
		entryInputMode === "manual" ? canSaveManualEntry : canSaveAudioEntry;
	const hasEntryFormValues =
		entryInputMode === "manual"
			? trimmedEntryDraft.length > 0
			: Boolean(audioFile);

	const clearEntryComposer = () => {
		setEntryDraft("");
	};

	const clearAudioInput = () => {
		setAudioFile(null);
		if (audioInputRef.current) {
			audioInputRef.current.value = "";
		}
	};

	const clearActiveInput = () => {
		if (entryInputMode === "manual") {
			clearEntryComposer();
			return;
		}

		clearAudioInput();
	};

	const submitEntry = async () => {
		if (!trimmedEntryDraft || isSubmitting) {
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

	const submitAudio = async () => {
		if (!audioFile || isSubmitting) {
			return;
		}

		try {
			await createItemFromAudioMutation.mutateAsync(audioFile);

			clearAudioInput();
			emitToast({
				tone: "success",
				title: "Audio procesado",
				message: "Se transcribio el audio y se agrego un nuevo item al feed.",
			});
		} catch {
			emitToast({
				tone: "error",
				title: "No se pudo procesar el audio",
				message: "Intenta con otro archivo o revisa el estado del backend.",
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
					{entryInputMode === "manual" ? (
						<SquarePen className="size-3.5" />
					) : (
						<AudioLines className="size-3.5" />
					)}
					{entryInputMode === "manual" ? "Entrada manual" : "Subida de audio"}
				</div>

				<div className="grid grid-cols-2 gap-2">
					<Button
						type="button"
						size="sm"
						variant={entryInputMode === "manual" ? "default" : "outline"}
						onClick={() => {
							setEntryInputMode("manual");
						}}
						disabled={isSubmitting}
						className={
							entryInputMode === "manual"
								? "bg-amber-600 text-white hover:bg-amber-700"
								: undefined
						}
					>
						<SquarePen className="size-3.5" />
						Manual
					</Button>
					<Button
						type="button"
						size="sm"
						variant={entryInputMode === "audio" ? "default" : "outline"}
						onClick={() => {
							setEntryInputMode("audio");
						}}
						disabled={isSubmitting}
						className={
							entryInputMode === "audio"
								? "bg-amber-600 text-white hover:bg-amber-700"
								: undefined
						}
					>
						<AudioLines className="size-3.5" />
						Audio
					</Button>
				</div>
			</div>

			<div className="flex-1 p-5 overflow-y-auto space-y-4">
				<div className="space-y-1">
					<p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
						Introducir informacion
					</p>
					<p className="text-xs text-slate-600 dark:text-slate-400">
						{entryInputMode === "manual"
							? "Crea items reales en el feed. El backend asigna formato y categorias automaticamente."
							: "Sube un archivo de audio para transcribirlo y crear un item automaticamente en el feed."}
					</p>
				</div>

				{entryInputMode === "manual" ? (
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
				) : (
					<div className="space-y-3 rounded-2xl border border-slate-300/80 bg-white/80 p-4 dark:border-slate-700 dark:bg-slate-900/70">
						<label
							htmlFor="audio-upload-input"
							className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-600 dark:text-slate-300"
						>
							Archivo de audio
						</label>
						<input
							id="audio-upload-input"
							ref={audioInputRef}
							type="file"
							accept="audio/*"
							onChange={(event) => {
								const nextAudioFile = event.target.files?.[0] ?? null;
								setAudioFile(nextAudioFile);
							}}
							className="block w-full rounded-xl border border-slate-300/80 bg-white px-3 py-2 text-sm text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-amber-100 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-amber-800 hover:file:bg-amber-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:file:bg-amber-900/60 dark:file:text-amber-200 dark:hover:file:bg-amber-900"
						/>

						{audioFile ? (
							<div className="rounded-xl border border-amber-300/70 bg-amber-50/80 px-3 py-2 text-xs text-amber-900 dark:border-amber-700/70 dark:bg-amber-950/30 dark:text-amber-100">
								<p className="font-semibold truncate">{audioFile.name}</p>
								<p className="text-[11px] opacity-80">
									{formatFileSize(audioFile.size)}
								</p>
							</div>
						) : (
							<p className="text-xs text-slate-500 dark:text-slate-400">
								Selecciona un archivo de audio para procesarlo.
							</p>
						)}
					</div>
				)}

				<div className="grid grid-cols-2 gap-2 pt-1">
					<Button
						type="button"
						variant="outline"
						onClick={clearActiveInput}
						disabled={!hasEntryFormValues || isSubmitting}
					>
						<Eraser className="size-3.5" />
						Limpiar
					</Button>
					<Button
						type="button"
						onClick={() => {
							if (entryInputMode === "manual") {
								void submitEntry();
								return;
							}

							void submitAudio();
						}}
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
			</div>
		</div>
	);
}
