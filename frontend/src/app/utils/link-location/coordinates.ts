import { normalizeLinkTarget } from "../link-url-utils";
import { decodeUriComponentSafe, parseCoordinatePair } from "./helpers";

export interface LocationCoordinates {
	lat: number;
	lon: number;
}

export function extractLocationCoordinates(
	rawValue: string | null | undefined,
): LocationCoordinates | null {
	const normalized = normalizeLinkTarget(rawValue);
	if (!normalized) {
		return null;
	}

	let parsedUrl: URL;
	try {
		parsedUrl = new URL(normalized);
	} catch {
		return null;
	}

	const searchParamCandidates = [
		"q",
		"query",
		"ll",
		"sll",
		"center",
		"destination",
		"daddr",
	];

	for (const key of searchParamCandidates) {
		const parsedCoords = parseCoordinatePair(parsedUrl.searchParams.get(key));
		if (parsedCoords) {
			return parsedCoords;
		}
	}

	const pathnameDecoded = decodeUriComponentSafe(parsedUrl.pathname);
	const atPattern = pathnameDecoded.match(
		/@(-?\d{1,2}(?:\.\d+)?),(-?\d{1,3}(?:\.\d+)?)/,
	);
	if (atPattern) {
		const parsedCoords = parseCoordinatePair(`${atPattern[1]},${atPattern[2]}`);
		if (parsedCoords) {
			return parsedCoords;
		}
	}

	const dataPattern = normalized.match(
		/!3d(-?\d{1,2}(?:\.\d+)?)!4d(-?\d{1,3}(?:\.\d+)?)/,
	);
	if (dataPattern) {
		const parsedCoords = parseCoordinatePair(
			`${dataPattern[1]},${dataPattern[2]}`,
		);
		if (parsedCoords) {
			return parsedCoords;
		}
	}

	const fallbackCoords = parseCoordinatePair(normalized);
	if (fallbackCoords) {
		return fallbackCoords;
	}

	return null;
}
