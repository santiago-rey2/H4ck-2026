import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { MOTION_DURATION, MOTION_EASE } from "@/app/motion/tokens";
import type { DataItem } from "@/app/types/data";
import { Badge } from "@/components/ui/badge";
import type { CardStyleTokens } from "./types";

interface CardFooterProps {
	item: DataItem;
	styles: CardStyleTokens;
	prefersReducedMotion: boolean;
	formattedDate?: string;
	showDate?: boolean;
}

const MAX_VISIBLE_TAGS = 3;

export function CardFooter({
	item,
	styles,
	prefersReducedMotion,
	formattedDate,
	showDate = true,
}: CardFooterProps) {
	const [showTooltip, setShowTooltip] = useState(false);
	const visibleTags = item.tags.slice(0, MAX_VISIBLE_TAGS);
	const hiddenTags = item.tags.slice(MAX_VISIBLE_TAGS);
	const remainingCount = hiddenTags.length;

	return (
		<div className="space-y-2">
			<div className="flex flex-wrap gap-1.5">
				{visibleTags.map((tag) => (
					<Badge
						key={tag}
						variant="secondary"
						className={`text-[10px] px-2 py-0.5 border-0 ${styles.tagBg}`}
					>
						{tag}
					</Badge>
				))}

				{remainingCount > 0 && (
					<button
						type="button"
						className="relative cursor-help"
						aria-label="Mostrar tags restantes"
						onMouseEnter={() => setShowTooltip(true)}
						onMouseLeave={() => setShowTooltip(false)}
						onFocus={() => setShowTooltip(true)}
						onBlur={() => setShowTooltip(false)}
					>
						<Badge
							variant="secondary"
							className={`text-[10px] px-2 py-0.5 border-0 cursor-help transition-colors ${styles.tagBg} opacity-70 hover:opacity-100`}
						>
							+{remainingCount}
						</Badge>

						<AnimatePresence>
							{showTooltip ? (
								<motion.div
									initial={
										prefersReducedMotion
											? { opacity: 1 }
											: { opacity: 0, y: 6, scale: 0.98 }
									}
									animate={{ opacity: 1, y: 0, scale: 1 }}
									exit={
										prefersReducedMotion
											? { opacity: 1 }
											: { opacity: 0, y: 4, scale: 0.98 }
									}
									transition={{
										duration: prefersReducedMotion ? 0 : MOTION_DURATION.fast,
										ease: MOTION_EASE.standard,
									}}
									className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 pointer-events-none"
								>
									<div className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs rounded-lg px-3 py-2 shadow-xl whitespace-nowrap">
										<div className="flex flex-wrap gap-1.5 max-w-[200px]">
											{hiddenTags.map((tag) => (
												<span key={tag} className="inline-block">
													{tag}
												</span>
											))}
										</div>
										<div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
											<div className="border-4 border-transparent border-t-slate-900 dark:border-t-slate-100" />
										</div>
									</div>
								</motion.div>
							) : null}
						</AnimatePresence>
					</button>
				)}
			</div>

			{showDate && formattedDate ? (
				<div className={`flex items-center gap-1 text-xs font-medium ${styles.iconColor}`}>
					{formattedDate}
				</div>
			) : null}
		</div>
	);
}
