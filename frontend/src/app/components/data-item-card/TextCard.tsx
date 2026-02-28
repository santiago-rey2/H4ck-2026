import { Check, Copy, FileText, StickyNote } from "lucide-react";
import { useState } from "react";
import type { DataItem } from "@/app/types/data";
import { CardFooter } from "./CardFooter";
import { CardShell } from "./CardShell";
import { getBaseStyleForItem } from "./styles";

interface TextCardProps {
	item: DataItem;
	prefersReducedMotion: boolean;
}

const LONG_TEXT_PREVIEW_LIMIT = 280;

function buildLongTextPreview(value: string, maxLength: number): string {
	if (value.length <= maxLength) {
		return value;
	}

	const initialSlice = value.slice(0, maxLength);
	const lastWordBoundary = initialSlice.lastIndexOf(" ");
	if (lastWordBoundary <= Math.floor(maxLength * 0.6)) {
		return `${initialSlice.trimEnd()}...`;
	}

	return `${initialSlice.slice(0, lastWordBoundary).trimEnd()}...`;
}

export function TextCard({ item, prefersReducedMotion }: TextCardProps) {
	const [copied, setCopied] = useState(false);
	const [isExpanded, setIsExpanded] = useState(false);
	const styles = getBaseStyleForItem(item.formato);
	const Icon = item.formato === "nota" ? StickyNote : FileText;
	const isLongText = item.formato === "nota";
	const shouldCollapseLongText =
		isLongText && item.texto.length > LONG_TEXT_PREVIEW_LIMIT;
	const previewText = shouldCollapseLongText
		? buildLongTextPreview(item.texto, LONG_TEXT_PREVIEW_LIMIT)
		: item.texto;
	const displayedText =
		shouldCollapseLongText && !isExpanded ? previewText : item.texto;
	const formattedDate = new Date(item.fecha).toLocaleDateString("es-ES", {
		year: "numeric",
		month: "long",
		day: "numeric",
	});

	const handleCopy = () => {
		navigator.clipboard.writeText(item.texto);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	return (
		<CardShell styles={styles} prefersReducedMotion={prefersReducedMotion}>
			<div className="p-5 space-y-4 flex flex-col">
				<div className="flex items-start justify-between gap-3">
					<div
						className={`p-2 rounded-xl ${styles.iconBg} ${styles.iconColor}`}
					>
						<Icon className="w-4 h-4" />
					</div>
					<button
						type="button"
						onClick={handleCopy}
						className={`p-2 rounded-xl hover:bg-white/50 dark:hover:bg-black/20 transition-colors duration-200 ${styles.iconColor}`}
						title="Copiar"
					>
						{copied ? (
							<Check className="w-4 h-4 text-green-600 dark:text-green-500" />
						) : (
							<Copy className="w-4 h-4" />
						)}
					</button>
				</div>

				<div className="space-y-1">
					<p className="font-medium text-sm leading-relaxed text-slate-900 dark:text-slate-100 whitespace-pre-wrap break-words">
						{displayedText}
					</p>

					{shouldCollapseLongText ? (
						<button
							type="button"
							onClick={() => {
								setIsExpanded((currentValue) => !currentValue);
							}}
							className={`text-xs font-semibold transition-colors ${styles.iconColor} hover:opacity-80`}
							aria-expanded={isExpanded}
						>
							{isExpanded ? "Ver menos" : "Ver mas"}
						</button>
					) : null}
				</div>

				<CardFooter
					item={item}
					styles={styles}
					prefersReducedMotion={prefersReducedMotion}
					formattedDate={formattedDate}
				/>
			</div>
		</CardShell>
	);
}
