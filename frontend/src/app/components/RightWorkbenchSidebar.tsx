import { cn } from "@/lib/utils";
import { EntryActions } from "./right-workbench/EntryActions";
import { EntryInputFields } from "./right-workbench/EntryInputFields";
import { ModeSwitch } from "./right-workbench/ModeSwitch";
import type { EntryInputMode } from "./right-workbench/types";
import { useRightWorkbenchComposer } from "./right-workbench/useRightWorkbenchComposer";

interface RightWorkbenchSidebarProps {
	className?: string;
	surface?: "default" | "drawer" | "tablet";
}

export function RightWorkbenchSidebar({
	className,
	surface = "default",
}: RightWorkbenchSidebarProps) {
	const {
		entryDraft,
		entryInputMode,
		audioFile,
		audioInputRef,
		isSubmitting,
		canSaveEntry,
		hasEntryFormValues,
		setEntryInputMode,
		setEntryDraftValue,
		setAudioFileValue,
		clearActiveInput,
		submitManualEntry,
		submitActiveEntry,
	} = useRightWorkbenchComposer();
	const handleEntryModeChange = (nextMode: EntryInputMode) => {
		setEntryInputMode(nextMode);
	};
	const handleAudioFileChange = (nextAudioFile: File | null) => {
		setAudioFileValue(nextAudioFile);
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

				<ModeSwitch
					entryInputMode={entryInputMode}
					isSubmitting={isSubmitting}
					onModeChange={handleEntryModeChange}
				/>
			</div>

			<div className="flex-1 p-5 overflow-y-auto space-y-4">
				<EntryInputFields
					entryInputMode={entryInputMode}
					entryDraft={entryDraft}
					audioFile={audioFile}
					audioInputRef={audioInputRef}
					onEntryDraftChange={(value) => {
						setEntryDraftValue(value);
					}}
					onManualSubmitShortcut={() => {
						void submitManualEntry();
					}}
					onAudioFileChange={handleAudioFileChange}
				/>

				<EntryActions
					entryInputMode={entryInputMode}
					isSubmitting={isSubmitting}
					canSaveEntry={canSaveEntry}
					hasEntryFormValues={hasEntryFormValues}
					onClear={clearActiveInput}
					onSubmit={submitActiveEntry}
				/>
			</div>
		</div>
	);
}
