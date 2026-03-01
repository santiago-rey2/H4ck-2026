import {
	hostMatches,
	hostMatchesAny,
	normalizeLinkTarget,
} from "./link-url-utils";

export interface LocationCoordinates {
	lat: number;
	lon: number;
}

const LOCATION_DOMAINS = [
	"maps.google.com",
	"maps.app.goo.gl",
	"google.com",
	"openstreetmap.org",
	"waze.com",
	"maps.apple.com",
	"apple.com",
	"bing.com",
	"wego.here.com",
];

const LOCATION_NAME_QUERY_KEYS = ["q", "query", "destination", "daddr"];

const IGNORED_LOCATION_NAME_SEGMENTS = new Set([
	"maps",
	"map",
	"place",
	"dir",
	"search",
	"data",
	"location",
	"loc",
]);

const COORDINATE_ONLY_REGEX =
	/^(?:loc:|coords?:)?\s*\(?\s*-?\d{1,2}(?:\.\d+)?\s*[,\s]\s*-?\d{1,3}(?:\.\d+)?(?:\s*,\s*\d+(?:\.\d+)?z?)?\s*\)?$/i;

function parseCoordinatePair(
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

function decodeUriComponentSafe(value: string): string {
	try {
		return decodeURIComponent(value);
	} catch {
		return value;
	}
}

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

function clamp(value: number, min: number, max: number): number {
	return Math.min(max, Math.max(min, value));
}

function buildLocationBoundingBox(
	coords: LocationCoordinates,
	zoom: number,
): { minLon: number; minLat: number; maxLon: number; maxLat: number } {
	const safeZoom = clamp(Math.round(zoom), 3, 18);
	const zoomScale = 2 ** (14 - safeZoom);
	const halfDeltaLon = clamp(0.02 * zoomScale, 0.0035, 0.5);
	const halfDeltaLat = clamp(0.0115 * zoomScale, 0.002, 0.3);

	const minLon = clamp(coords.lon - halfDeltaLon, -180, 180);
	const maxLon = clamp(coords.lon + halfDeltaLon, -180, 180);
	const minLat = clamp(coords.lat - halfDeltaLat, -85, 85);
	const maxLat = clamp(coords.lat + halfDeltaLat, -85, 85);

	return { minLon, minLat, maxLon, maxLat };
}

export function isLocationUrl(url: URL): boolean {
	const hostname = url.hostname.toLowerCase();
	const pathname = url.pathname.toLowerCase();
	const searchParams = url.searchParams;

	const isGoogleMapsHost =
		hostMatches(hostname, "maps.google.com") ||
		hostMatches(hostname, "maps.app.goo.gl") ||
		hostMatches(hostname, "google.com") ||
		hostname.endsWith(".google.com");

	const looksLikeGoogleMaps =
		isGoogleMapsHost &&
		(pathname.startsWith("/maps") ||
			pathname.startsWith("/place") ||
			pathname.startsWith("/dir") ||
			searchParams.has("q") ||
			searchParams.has("query") ||
			searchParams.has("destination"));

	const isKnownMapDomain =
		hostMatchesAny(hostname, LOCATION_DOMAINS) &&
		(pathname.startsWith("/maps") ||
			pathname.startsWith("/map") ||
			pathname.startsWith("/place") ||
			pathname.startsWith("/dir") ||
			searchParams.has("ll") ||
			searchParams.has("q") ||
			searchParams.has("query"));

	return looksLikeGoogleMaps || isKnownMapDomain;
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

	const pathnameDecoded = decodeURIComponent(parsedUrl.pathname);
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

export function buildOpenStreetMapTileSnapshotUrls(
	rawValue: string | null | undefined,
	zoom = 14,
): string[] | null {
	const coords = extractLocationCoordinates(rawValue);
	if (!coords) {
		return null;
	}

	const safeZoom = clamp(Math.round(zoom), 3, 18);
	const tileCount = 2 ** safeZoom;
	const latRad = (coords.lat * Math.PI) / 180;
	const xFloat = ((coords.lon + 180) / 360) * tileCount;
	const yFloat =
		((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) *
		tileCount;

	const baseX = Math.floor(xFloat);
	const baseY = Math.floor(yFloat);

	const toWrappedX = (value: number) =>
		((value % tileCount) + tileCount) % tileCount;
	const toClampedY = (value: number) => clamp(value, 0, tileCount - 1);

	return [
		`https://tile.openstreetmap.org/${safeZoom}/${toWrappedX(baseX)}/${toClampedY(baseY)}.png`,
		`https://tile.openstreetmap.org/${safeZoom}/${toWrappedX(baseX + 1)}/${toClampedY(baseY)}.png`,
		`https://tile.openstreetmap.org/${safeZoom}/${toWrappedX(baseX)}/${toClampedY(baseY + 1)}.png`,
		`https://tile.openstreetmap.org/${safeZoom}/${toWrappedX(baseX + 1)}/${toClampedY(baseY + 1)}.png`,
	];
}

export function buildOpenStreetMapEmbedUrl(
	rawValue: string | null | undefined,
	zoom = 14,
): string | null {
	const coords = extractLocationCoordinates(rawValue);
	if (!coords) {
		return null;
	}

	const bounds = buildLocationBoundingBox(coords, zoom);
	const params = new URLSearchParams({
		bbox: [
			bounds.minLon.toFixed(6),
			bounds.minLat.toFixed(6),
			bounds.maxLon.toFixed(6),
			bounds.maxLat.toFixed(6),
		].join(","),
		layer: "mapnik",
		marker: `${coords.lat.toFixed(6)},${coords.lon.toFixed(6)}`,
	});

	return `https://www.openstreetmap.org/export/embed.html?${params.toString()}`;
}
