import type { Variants } from "motion/react";
import { MOTION_DURATION, MOTION_EASE } from "./tokens";

export function getPageVariants(reduceMotion: boolean): Variants {
	if (reduceMotion) {
		return {
			initial: { opacity: 1 },
			animate: { opacity: 1, transition: { duration: MOTION_DURATION.none } },
			exit: { opacity: 1, transition: { duration: MOTION_DURATION.none } },
		};
	}

	return {
		initial: { opacity: 0, y: 12, scale: 0.996 },
		animate: {
			opacity: 1,
			y: 0,
			scale: 1,
			transition: {
				duration: MOTION_DURATION.base,
				ease: MOTION_EASE.decelerate,
			},
		},
		exit: {
			opacity: 0,
			y: -10,
			scale: 0.996,
			transition: {
				duration: MOTION_DURATION.fast,
				ease: MOTION_EASE.accelerate,
			},
		},
	};
}

export function getViewSwitchVariants(reduceMotion: boolean): Variants {
	if (reduceMotion) {
		return {
			initial: { opacity: 1 },
			animate: { opacity: 1, transition: { duration: MOTION_DURATION.none } },
			exit: { opacity: 1, transition: { duration: MOTION_DURATION.none } },
		};
	}

	return {
		initial: { opacity: 0, y: 8 },
		animate: {
			opacity: 1,
			y: 0,
			transition: {
				duration: MOTION_DURATION.base,
				ease: MOTION_EASE.decelerate,
			},
		},
		exit: {
			opacity: 0,
			y: -6,
			transition: {
				duration: MOTION_DURATION.fast,
				ease: MOTION_EASE.accelerate,
			},
		},
	};
}

export function getSidebarContentVariants(
	reduceMotion: boolean,
	side: "left" | "right",
): Variants {
	if (reduceMotion) {
		return {
			initial: { opacity: 1 },
			animate: { opacity: 1, transition: { duration: MOTION_DURATION.none } },
			exit: { opacity: 1, transition: { duration: MOTION_DURATION.none } },
		};
	}

	const offset = side === "left" ? -14 : 14;

	return {
		initial: { opacity: 0, x: offset },
		animate: {
			opacity: 1,
			x: 0,
			transition: {
				duration: MOTION_DURATION.base,
				ease: MOTION_EASE.decelerate,
			},
		},
		exit: {
			opacity: 0,
			x: offset * 0.7,
			transition: {
				duration: MOTION_DURATION.fast,
				ease: MOTION_EASE.accelerate,
			},
		},
	};
}

export function getListItemVariants(reduceMotion: boolean): Variants {
	if (reduceMotion) {
		return {
			hidden: { opacity: 1 },
			visible: { opacity: 1, transition: { duration: MOTION_DURATION.none } },
			exit: { opacity: 1, transition: { duration: MOTION_DURATION.none } },
		};
	}

	return {
		hidden: { opacity: 0, y: 14, scale: 0.99 },
		visible: {
			opacity: 1,
			y: 0,
			scale: 1,
			transition: {
				duration: MOTION_DURATION.base,
				ease: MOTION_EASE.decelerate,
			},
		},
		exit: {
			opacity: 0,
			y: -10,
			scale: 0.985,
			transition: {
				duration: MOTION_DURATION.fast,
				ease: MOTION_EASE.accelerate,
			},
		},
	};
}

export function getModalVariants(reduceMotion: boolean): {
	backdrop: Variants;
	panel: Variants;
} {
	if (reduceMotion) {
		return {
			backdrop: {
				hidden: { opacity: 1 },
				visible: { opacity: 1, transition: { duration: MOTION_DURATION.none } },
				exit: { opacity: 1, transition: { duration: MOTION_DURATION.none } },
			},
			panel: {
				hidden: { opacity: 1 },
				visible: { opacity: 1, transition: { duration: MOTION_DURATION.none } },
				exit: { opacity: 1, transition: { duration: MOTION_DURATION.none } },
			},
		};
	}

	return {
		backdrop: {
			hidden: { opacity: 0 },
			visible: {
				opacity: 1,
				transition: {
					duration: MOTION_DURATION.fast,
					ease: MOTION_EASE.standard,
				},
			},
			exit: {
				opacity: 0,
				transition: {
					duration: MOTION_DURATION.fast,
					ease: MOTION_EASE.accelerate,
				},
			},
		},
		panel: {
			hidden: { opacity: 0, y: 16, scale: 0.99 },
			visible: {
				opacity: 1,
				y: 0,
				scale: 1,
				transition: {
					duration: MOTION_DURATION.base,
					ease: MOTION_EASE.decelerate,
				},
			},
			exit: {
				opacity: 0,
				y: 10,
				scale: 0.995,
				transition: {
					duration: MOTION_DURATION.fast,
					ease: MOTION_EASE.accelerate,
				},
			},
		},
	};
}
