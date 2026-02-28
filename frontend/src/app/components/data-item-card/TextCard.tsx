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

export function TextCard({ item, prefersReducedMotion }: TextCardProps) {
	const [copied, setCopied] = useState(false);
	const styles = getBaseStyleForItem(item.formato);
	const Icon = item.formato === "nota" ? StickyNote : FileText;
	const formattedDate = new Date(item.fecha).toLocaleDateString("es-ES", {
		month: "short",
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

				<p className="font-medium text-sm leading-relaxed text-slate-900 dark:text-slate-100">
					{item.texto}
				</p>

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
