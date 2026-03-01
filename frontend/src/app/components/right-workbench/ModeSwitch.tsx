import { AudioLines, SquarePen } from "lucide-react";
import { Button } from "@/components/ui";
import type { EntryInputMode } from "./types";

interface ModeSwitchProps {
	entryInputMode: EntryInputMode;
	isSubmitting: boolean;
	onModeChange: (mode: EntryInputMode) => void;
}

export function ModeSwitch({
	entryInputMode,
	isSubmitting,
	onModeChange,
}: ModeSwitchProps) {
	return (
		<>
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
						onModeChange("manual");
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
						onModeChange("audio");
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
		</>
	);
}
