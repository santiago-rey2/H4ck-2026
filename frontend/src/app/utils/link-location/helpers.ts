import type { LocationCoordinates } from "./coordinates";

export function decodeUriComponentSafe(value: string): string {
	try {
		return decodeURIComponent(value);
	} catch {
		return value;
	}
}

export function parseCoordinatePair(
	rawValue: string | null | undefined,
): LocationCoordinates | null {
	const candidate = rawValue?.trim();
	if (!candidate) {
		return null;
	}

	const pairMatch = candidate.match(
		/(-?\d{1,2}(?:\.\d+)?)[,\s]+(-?\d{1,3}(?:\.\d+)?)/,
	);
	if (!pairMatch) {
		return null;
	}

	const first = Number(pairMatch[1]);
	const second = Number(pairMatch[2]);
	if (!Number.isFinite(first) || !Number.isFinite(second)) {
		return null;
	}

	if (Math.abs(first) <= 90 && Math.abs(second) <= 180) {
		return { lat: first, lon: second };
	}

	if (Math.abs(first) <= 180 && Math.abs(second) <= 90) {
		return { lat: second, lon: first };
	}

	return null;
}

export function clamp(value: number, min: number, max: number): number {
	return Math.min(max, Math.max(min, value));
}
