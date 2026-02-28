import { AnimatePresence, motion } from "motion/react";
import type { ReactNode } from "react";
import { useMotionPreferences } from "@/app/motion/useMotionPreferences";
import { getPageVariants } from "@/app/motion/variants";

interface PageTransitionProps {
	children: ReactNode;
	pageKey: string;
	className?: string;
}

export function PageTransition({
	children,
	pageKey,
	className = "w-full h-full",
}: PageTransitionProps) {
	const { prefersReducedMotion } = useMotionPreferences();
	const pageVariants = getPageVariants(prefersReducedMotion);

	return (
		<AnimatePresence mode="wait" initial={false}>
			<motion.div
				key={pageKey}
				variants={pageVariants}
				initial="initial"
				animate="animate"
				exit="exit"
				className={className}
			>
				{children}
			</motion.div>
		</AnimatePresence>
	);
}
