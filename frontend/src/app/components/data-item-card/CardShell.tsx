import { motion } from "motion/react";
import type {
	AriaRole,
	KeyboardEventHandler,
	MouseEventHandler,
	ReactNode,
} from "react";
import { MOTION_DURATION, MOTION_EASE } from "@/app/motion/tokens";
import type { CardStyleTokens } from "./types";

interface CardShellProps {
	styles: CardStyleTokens;
	prefersReducedMotion: boolean;
	children: ReactNode;
	className?: string;
	onClick?: MouseEventHandler<HTMLDivElement>;
	onKeyDown?: KeyboardEventHandler<HTMLDivElement>;
	role?: AriaRole;
	tabIndex?: number;
	ariaLabel?: string;
}

export function CardShell({
	styles,
	prefersReducedMotion,
	children,
	className,
	onClick,
	onKeyDown,
	role,
	tabIndex,
	ariaLabel,
}: CardShellProps) {
	const cardHoverMotion = prefersReducedMotion
		? {}
		: {
				whileHover: { y: -3, scale: 1.005 },
				whileTap: { scale: 0.998 },
			};

	return (
		<motion.div
			{...cardHoverMotion}
			transition={{
				duration: prefersReducedMotion ? 0 : MOTION_DURATION.fast,
				ease: MOTION_EASE.standard,
			}}
			className={`relative overflow-hidden rounded-2xl border ${styles.border} ${styles.bg} backdrop-blur-sm transition-[box-shadow,filter] duration-200 hover:shadow-lg hover:brightness-105 flex flex-col ${className ?? ""}`}
			onClick={onClick}
			onKeyDown={onKeyDown}
			role={role}
			tabIndex={tabIndex}
			aria-label={ariaLabel}
		>
			{children}
		</motion.div>
	);
}
