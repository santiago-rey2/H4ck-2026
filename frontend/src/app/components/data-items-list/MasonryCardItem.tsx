import { motion, type Variants } from "motion/react";
import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { isWideDataItemCard } from "@/app/components/data-item-card/cardVariant";
import { MOTION_DURATION, MOTION_EASE } from "@/app/motion/tokens";
import type { DataItem } from "@/app/types/data";
import { DataItemCard } from "../DataItemCard";

export const MASONRY_ROW_HEIGHT_PX = 8;
const MASONRY_GAP_PX = 16;

interface MasonryCardItemProps {
	item: DataItem;
	entryDelay: number;
	prefersReducedMotion: boolean;
	listItemVariants: Variants;
}

export function MasonryCardItem({
	item,
	entryDelay,
	prefersReducedMotion,
	listItemVariants,
}: MasonryCardItemProps) {
	const [rowSpan, setRowSpan] = useState(1);
	const contentRef = useRef<HTMLDivElement | null>(null);
	const frameRef = useRef<number | null>(null);
	const isWideCard = isWideDataItemCard(item);

	const measureRowSpan = useCallback(() => {
		const contentNode = contentRef.current;
		if (!contentNode) {
			return;
		}

		const contentHeight = contentNode.getBoundingClientRect().height;
		const nextRowSpan = Math.max(
			1,
			Math.ceil(
				(contentHeight + MASONRY_GAP_PX) /
					(MASONRY_ROW_HEIGHT_PX + MASONRY_GAP_PX),
			),
		);

		setRowSpan((currentRowSpan) =>
			currentRowSpan === nextRowSpan ? currentRowSpan : nextRowSpan,
		);
	}, []);

	useLayoutEffect(() => {
		const contentNode = contentRef.current;
		if (!contentNode) {
			return;
		}

		const scheduleMeasure = () => {
			if (frameRef.current !== null) {
				cancelAnimationFrame(frameRef.current);
			}

			frameRef.current = requestAnimationFrame(() => {
				frameRef.current = null;
				measureRowSpan();
			});
		};

		scheduleMeasure();

		let resizeObserver: ResizeObserver | null = null;
		const hasResizeObserver = typeof ResizeObserver !== "undefined";
		if (typeof ResizeObserver !== "undefined") {
			resizeObserver = new ResizeObserver(() => {
				scheduleMeasure();
			});
			resizeObserver.observe(contentNode);
		} else {
			window.addEventListener("resize", scheduleMeasure);
		}

		const images = Array.from(contentNode.querySelectorAll("img"));
		for (const image of images) {
			if (image.complete) {
				continue;
			}

			image.addEventListener("load", scheduleMeasure);
			image.addEventListener("error", scheduleMeasure);
		}

		return () => {
			if (frameRef.current !== null) {
				cancelAnimationFrame(frameRef.current);
			}

			resizeObserver?.disconnect();

			for (const image of images) {
				image.removeEventListener("load", scheduleMeasure);
				image.removeEventListener("error", scheduleMeasure);
			}

			if (!hasResizeObserver) {
				window.removeEventListener("resize", scheduleMeasure);
			}
		};
	}, [measureRowSpan]);

	return (
		<div
			className={`min-w-0 ${isWideCard ? "col-span-1 sm:col-span-2" : "col-span-1"}`}
			style={{ gridRowEnd: `span ${rowSpan}` }}
		>
			<div ref={contentRef}>
				<motion.div
					variants={listItemVariants}
					initial="hidden"
					animate="visible"
					exit="exit"
					transition={{
						duration: prefersReducedMotion ? 0 : MOTION_DURATION.base,
						delay: prefersReducedMotion ? 0 : entryDelay,
						ease: MOTION_EASE.decelerate,
					}}
				>
					<DataItemCard item={item} />
				</motion.div>
			</div>
		</div>
	);
}
