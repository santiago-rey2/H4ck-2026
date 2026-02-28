import { motion } from "motion/react";
import { MOTION_DURATION, MOTION_EASE } from "@/app/motion/tokens";
import { useMotionPreferences } from "@/app/motion/useMotionPreferences";
import { SidebarFooter } from "./SidebarFooter";
import { SidebarHeader } from "./SidebarHeader";
import { SidebarNavigation } from "./SidebarNavigation";

export function Sidebar() {
	const { prefersReducedMotion } = useMotionPreferences();

	return (
		<motion.div
			className="w-full h-full bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 flex flex-col"
			initial={prefersReducedMotion ? { x: 0 } : { x: "100%" }}
			animate={{ x: 0 }}
			transition={{
				duration: prefersReducedMotion ? 0 : MOTION_DURATION.base,
				ease: MOTION_EASE.decelerate,
			}}
		>
			<SidebarHeader />
			<SidebarNavigation />
			<SidebarFooter />
		</motion.div>
	);
}
