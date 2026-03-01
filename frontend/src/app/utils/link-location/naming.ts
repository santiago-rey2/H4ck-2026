import { normalizeLinkTarget } from "../link-url-utils";
import {
	COORDINATE_ONLY_REGEX,
	IGNORED_LOCATION_NAME_SEGMENTS,
	LOCATION_NAME_QUERY_KEYS,
} from "./constants";
import { isLocationUrl } from "./detection";
import { decodeUriComponentSafe, parseCoordinatePair } from "./helpers";

function isCoordinateOnlyText(rawValue: string): boolean {
	const compact = rawValue.trim();
	if (!compact) {
		return false;
	}

	if (!COORDINATE_ONLY_REGEX.test(compact)) {
		return false;
	}

	return parseCoordinatePair(compact) !== null;
}

function normalizeLocationNameCandidate(
	rawValue: string | null | undefined,
): string | null {
	const candidate = rawValue?.trim();
	if (!candidate) {
		return null;
	}

	const decodedCandidate = decodeUriComponentSafe(candidate.replace(/\+/g, " "))
		.replace(/\s+/g, " ")
		.trim();
	if (!decodedCandidate) {
		return null;
	}

	const loweredCandidate = decodedCandidate.toLowerCase();
	if (IGNORED_LOCATION_NAME_SEGMENTS.has(loweredCandidate)) {
		return null;
	}

	if (
		decodedCandidate.startsWith("@") ||
		decodedCandidate.startsWith("!") ||
		isCoordinateOnlyText(decodedCandidate)
	) {
		return null;
	}

	return decodedCandidate;
}

function extractLocationNameFromSearchParams(url: URL): string | null {
	for (const key of LOCATION_NAME_QUERY_KEYS) {
		const normalizedCandidate = normalizeLocationNameCandidate(
			url.searchParams.get(key),
		);
		if (normalizedCandidate) {
			return normalizedCandidate;
		}
	}

	return null;
}

function extractLocationNameFromPath(url: URL): string | null {
	const decodedPathSegments = url.pathname
		.split("/")
		.filter(Boolean)
		.map((segment) => decodeUriComponentSafe(segment));
	if (decodedPathSegments.length === 0) {
		return null;
	}

	const loweredSegments = decodedPathSegments.map((segment) =>
		segment.toLowerCase(),
	);

	const placeIndex = loweredSegments.indexOf("place");
	if (placeIndex >= 0 && placeIndex + 1 < decodedPathSegments.length) {
		const placeCandidate = normalizeLocationNameCandidate(
			decodedPathSegments[placeIndex + 1],
		);
		if (placeCandidate) {
			return placeCandidate;
		}
	}

	const searchIndex = loweredSegments.indexOf("search");
	if (searchIndex >= 0) {
		for (
			let index = searchIndex + 1;
			index < decodedPathSegments.length;
			index += 1
		) {
			const searchCandidate = normalizeLocationNameCandidate(
				decodedPathSegments[index],
			);
			if (searchCandidate) {
				return searchCandidate;
			}
		}
	}

	const dirIndex = loweredSegments.indexOf("dir");
	if (dirIndex >= 0) {
		for (
			let index = decodedPathSegments.length - 1;
			index > dirIndex;
			index -= 1
		) {
			const directionCandidate = normalizeLocationNameCandidate(
				decodedPathSegments[index],
			);
			if (directionCandidate) {
				return directionCandidate;
			}
		}
	}

	return null;
}

export function extractLocationName(
	rawValue: string | null | undefined,
): string | null {
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

	if (!isLocationUrl(parsedUrl)) {
		return null;
	}

	const queryCandidate = extractLocationNameFromSearchParams(parsedUrl);
	if (queryCandidate) {
		return queryCandidate;
	}

	const pathCandidate = extractLocationNameFromPath(parsedUrl);
	if (pathCandidate) {
		return pathCandidate;
	}

	return null;
}
