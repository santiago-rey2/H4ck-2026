import { useAtom } from "jotai";
import type { RefObject } from "react";
import { useRef, useState } from "react";
import { entryDraftAtom } from "@/app/atoms";
import {
	useCreateItemFromAudioMutation,
	useCreateItemMutation,
} from "@/app/hooks/useDataItems";
import { emitToast } from "@/app/utils/toast-sink";
import type { EntryInputMode } from "./types";

interface RightWorkbenchComposerState {
	entryDraft: string;
	entryInputMode: EntryInputMode;
	audioFile: File | null;
	audioInputRef: RefObject<HTMLInputElement | null>;
	isSubmitting: boolean;
	canSaveEntry: boolean;
	hasEntryFormValues: boolean;
	setEntryInputMode: (mode: EntryInputMode) => void;
	setEntryDraftValue: (value: string) => void;
	setAudioFileValue: (file: File | null) => void;
	clearActiveInput: () => void;
	submitManualEntry: () => Promise<void>;
	submitActiveEntry: () => void;
}

export function useRightWorkbenchComposer(): RightWorkbenchComposerState {
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

	const submitManualEntry = async () => {
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

	const submitActiveEntry = () => {
		if (entryInputMode === "manual") {
			void submitManualEntry();
			return;
		}

		void submitAudio();
	};

	return {
		entryDraft,
		entryInputMode,
		audioFile,
		audioInputRef,
		isSubmitting,
		canSaveEntry,
		hasEntryFormValues,
		setEntryInputMode,
		setEntryDraftValue: setEntryDraft,
		setAudioFileValue: setAudioFile,
		clearActiveInput,
		submitManualEntry,
		submitActiveEntry,
	};
}
