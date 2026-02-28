import { useReducedMotion } from "motion/react";

export function useMotionPreferences() {
	const prefersReducedMotion = useReducedMotion() ?? false;

	return {
		prefersReducedMotion,
		motionEnabled: !prefersReducedMotion,
	};
}
