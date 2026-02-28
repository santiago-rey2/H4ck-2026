import type { LucideIcon } from "lucide-react";
import { motion } from "motion/react";
import { useMotionPreferences } from "@/app/motion/useMotionPreferences";

type SidebarTileVariant = "navigation" | "action" | "auth";

interface SidebarTileProps {
	icon: LucideIcon;
	label: string;
	isActive?: boolean;
	variant?: SidebarTileVariant;
	onClick?: () => void;
	className?: string;
}

export function SidebarTile({
	icon: Icon,
	label,
	isActive = false,
	variant = "navigation",
	onClick,
	className = "",
}: SidebarTileProps) {
	const { motionEnabled } = useMotionPreferences();

	const getVariantStyles = () => {
		switch (variant) {
			case "navigation":
				return isActive
					? "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400"
					: "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800";
			case "action":
				return "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800";
			case "auth":
				return "bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700";
			default:
				return "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800";
		}
	};

	return (
		<motion.button
			onClick={onClick}
			className={`w-full flex items-center space-x-3 p-2 rounded-lg transition-colors ${getVariantStyles()} ${className}`}
			whileHover={motionEnabled ? { scale: 1.015 } : undefined}
			whileTap={motionEnabled ? { scale: 0.99 } : undefined}
		>
			<Icon size={18} />
			<span className="text-sm">{label}</span>
		</motion.button>
	);
}
