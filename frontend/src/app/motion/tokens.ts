export const MOTION_DURATION = {
	none: 0,
	fast: 0.16,
	base: 0.24,
	slow: 0.32,
	slower: 0.44,
} as const;

export const MOTION_EASE = {
	standard: [0.2, 0, 0, 1],
	decelerate: [0, 0, 0, 1],
	accelerate: [0.4, 0, 1, 1],
	emphasized: [0.2, 0, 0, 1],
} as const;

export const MOTION_SPRING = {
	soft: {
		type: "spring",
		stiffness: 280,
		damping: 26,
		mass: 0.8,
	},
	panel: {
		type: "spring",
		stiffness: 250,
		damping: 30,
		mass: 0.9,
	},
} as const;
