import type { KeyboardEvent, RefObject } from "react";
import type { EntryInputMode } from "./types";

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

interface EntryInputFieldsProps {
	entryInputMode: EntryInputMode;
	entryDraft: string;
	audioFile: File | null;
	audioInputRef: RefObject<HTMLInputElement | null>;
	onEntryDraftChange: (value: string) => void;
	onManualSubmitShortcut: () => void;
	onAudioFileChange: (file: File | null) => void;
}

export function EntryInputFields({
	entryInputMode,
	entryDraft,
	audioFile,
	audioInputRef,
	onEntryDraftChange,
	onManualSubmitShortcut,
	onAudioFileChange,
}: EntryInputFieldsProps) {
	const handleManualKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
		if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
			event.preventDefault();
			onManualSubmitShortcut();
		}
	};

	return (
		<>
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
						onEntryDraftChange(event.target.value);
					}}
					onKeyDown={handleManualKeyDown}
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
							onAudioFileChange(event.target.files?.[0] ?? null);
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
		</>
	);
}
