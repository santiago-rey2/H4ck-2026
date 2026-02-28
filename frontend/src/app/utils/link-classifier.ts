export type LinkCardKind = "web" | "video" | "location" | "reel" | "social";

export interface LinkClassification {
	kind: LinkCardKind;
	platform: string | null;
	normalizedUrl: string | null;
	hostname: string | null;
}

export interface LocationCoordinates {
	lat: number;
	lon: number;
}

const CONSENT_GATEWAY_DOMAINS = ["consent.google.com", "consent.youtube.com"];
const CONSENT_TEXT_MARKERS = [
	"antes de ir a",
	"before you continue",
	"avant de continuer",
	"prima di continuare",
];

const ABSOLUTE_URL_REGEX = /^[a-zA-Z][a-zA-Z\d+.-]*:\/\//;

const SOCIAL_DOMAINS = [
	"instagram.com",
	"tiktok.com",
	"facebook.com",
	"x.com",
	"twitter.com",
	"threads.net",
	"linkedin.com",
	"reddit.com",
	"pinterest.com",
	"snapchat.com",
];

const VIDEO_DOMAINS = [
	"youtube.com",
	"youtu.be",
	"vimeo.com",
	"twitch.tv",
	"dailymotion.com",
];

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

function hostMatches(hostname: string, domain: string): boolean {
	return hostname === domain || hostname.endsWith(`.${domain}`);
}

function hostMatchesAny(hostname: string, domains: string[]): boolean {
	return domains.some((domain) => hostMatches(hostname, domain));
}

function isYouTubeHost(hostname: string): boolean {
	return (
		hostMatches(hostname, "youtube.com") || hostMatches(hostname, "youtu.be")
	);
}

function sanitizeYouTubeId(rawValue: string | null | undefined): string | null {
	const candidate = rawValue?.trim();
	if (!candidate) {
		return null;
	}

	const cleaned = candidate.split(/[?/&#]/, 1)[0];
	if (!/^[A-Za-z0-9_-]{6,15}$/.test(cleaned)) {
		return null;
	}

	return cleaned;
}

function parseColonTimestampToSeconds(value: string): number | null {
	const segments = value
		.split(":")
		.map((segment) => Number.parseInt(segment, 10));
	if (segments.some((segment) => !Number.isFinite(segment) || segment < 0)) {
		return null;
	}

	if (segments.length === 2) {
		const [minutes, seconds] = segments;
		if (seconds >= 60) {
			return null;
		}

		return minutes * 60 + seconds;
	}

	if (segments.length === 3) {
		const [hours, minutes, seconds] = segments;
		if (minutes >= 60 || seconds >= 60) {
			return null;
		}

		return hours * 3600 + minutes * 60 + seconds;
	}

	return null;
}

function parseYouTubeTimestampToSeconds(
	rawValue: string | null | undefined,
): number | null {
	const candidate = rawValue?.trim().toLowerCase();
	if (!candidate) {
		return null;
	}

	if (/^\d+$/.test(candidate)) {
		const parsed = Number.parseInt(candidate, 10);
		return parsed > 0 ? parsed : null;
	}

	if (/^\d{1,3}:\d{1,2}(?::\d{1,2})?$/.test(candidate)) {
		const parsed = parseColonTimestampToSeconds(candidate);
		return parsed && parsed > 0 ? parsed : null;
	}

	let totalSeconds = 0;
	let hasUnitMatch = false;
	const unitRegex = /(\d+)\s*(h|m|s)/g;
	for (const match of candidate.matchAll(unitRegex)) {
		const amount = Number.parseInt(match[1], 10);
		if (!Number.isFinite(amount) || amount < 0) {
			continue;
		}

		hasUnitMatch = true;
		const unit = match[2];
		if (unit === "h") {
			totalSeconds += amount * 3600;
			continue;
		}

		if (unit === "m") {
			totalSeconds += amount * 60;
			continue;
		}

		totalSeconds += amount;
	}

	if (hasUnitMatch && totalSeconds > 0) {
		return totalSeconds;
	}

	return null;
}

function extractYouTubeStartSeconds(parsedUrl: URL): number | null {
	const explicitStart = parseYouTubeTimestampToSeconds(
		parsedUrl.searchParams.get("start"),
	);
	if (explicitStart && explicitStart > 0) {
		return explicitStart;
	}

	const timestampStart = parseYouTubeTimestampToSeconds(
		parsedUrl.searchParams.get("t"),
	);
	if (timestampStart && timestampStart > 0) {
		return timestampStart;
	}

	return null;
}

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

function getPlatformByHostname(hostname: string): string | null {
	if (
		hostMatches(hostname, "youtube.com") ||
		hostMatches(hostname, "youtu.be")
	) {
		return "YouTube";
	}
	if (hostMatches(hostname, "vimeo.com")) {
		return "Vimeo";
	}
	if (hostMatches(hostname, "twitch.tv")) {
		return "Twitch";
	}
	if (hostMatches(hostname, "instagram.com")) {
		return "Instagram";
	}
	if (hostMatches(hostname, "tiktok.com")) {
		return "TikTok";
	}
	if (hostMatches(hostname, "facebook.com")) {
		return "Facebook";
	}
	if (hostMatches(hostname, "x.com") || hostMatches(hostname, "twitter.com")) {
		return "X";
	}
	if (hostMatches(hostname, "threads.net")) {
		return "Threads";
	}
	if (hostMatches(hostname, "linkedin.com")) {
		return "LinkedIn";
	}
	if (
		hostMatches(hostname, "maps.google.com") ||
		hostMatches(hostname, "maps.app.goo.gl") ||
		hostMatches(hostname, "google.com")
	) {
		return "Google Maps";
	}
	if (hostMatches(hostname, "openstreetmap.org")) {
		return "OpenStreetMap";
	}
	if (hostMatches(hostname, "waze.com")) {
		return "Waze";
	}
	if (
		hostMatches(hostname, "maps.apple.com") ||
		hostMatches(hostname, "apple.com")
	) {
		return "Apple Maps";
	}

	return null;
}

function isLocationUrl(url: URL): boolean {
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

function isReelUrl(url: URL): boolean {
	const hostname = url.hostname.toLowerCase();
	const pathname = url.pathname.toLowerCase();

	if (hostMatches(hostname, "instagram.com")) {
		return pathname.startsWith("/reel/") || pathname.startsWith("/reels/");
	}

	if (hostMatches(hostname, "tiktok.com")) {
		return pathname.includes("/video/") || pathname.startsWith("/t/");
	}

	if (
		hostMatches(hostname, "youtube.com") ||
		hostMatches(hostname, "youtu.be")
	) {
		return pathname.startsWith("/shorts/");
	}

	if (hostMatches(hostname, "facebook.com")) {
		return pathname.includes("/reel/") || pathname.includes("/reels/");
	}

	return false;
}

function isVideoUrl(url: URL): boolean {
	const hostname = url.hostname.toLowerCase();
	const pathname = url.pathname.toLowerCase();

	if (hostMatches(hostname, "youtube.com")) {
		return (
			pathname.startsWith("/watch") ||
			pathname.startsWith("/live") ||
			pathname.startsWith("/embed/") ||
			pathname.startsWith("/playlist")
		);
	}

	if (hostMatches(hostname, "youtu.be")) {
		return pathname.length > 1;
	}

	if (
		hostMatches(hostname, "vimeo.com") ||
		hostMatches(hostname, "twitch.tv")
	) {
		return true;
	}

	return hostMatchesAny(hostname, VIDEO_DOMAINS);
}

function isSocialUrl(url: URL): boolean {
	const hostname = url.hostname.toLowerCase();
	return hostMatchesAny(hostname, SOCIAL_DOMAINS);
}

export function normalizeLinkTarget(
	rawValue: string | null | undefined,
): string | null {
	const trimmed = rawValue?.trim();
	if (!trimmed) {
		return null;
	}

	const withScheme = ABSOLUTE_URL_REGEX.test(trimmed)
		? trimmed
		: `https://${trimmed}`;

	try {
		const parsed = new URL(withScheme);
		if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
			return null;
		}

		return parsed.toString();
	} catch {
		return null;
	}
}

export function getDisplayHostname(
	rawValue: string | null | undefined,
): string | null {
	const normalized = normalizeLinkTarget(rawValue);
	if (!normalized) {
		return null;
	}

	try {
		return new URL(normalized).hostname.replace(/^www\./i, "");
	} catch {
		return null;
	}
}

export function isConsentGatewayUrl(
	rawValue: string | null | undefined,
): boolean {
	const normalized = normalizeLinkTarget(rawValue);
	if (!normalized) {
		return false;
	}

	try {
		const hostname = new URL(normalized).hostname.toLowerCase();
		return CONSENT_GATEWAY_DOMAINS.some((domain) =>
			hostMatches(hostname, domain),
		);
	} catch {
		return false;
	}
}

export function isConsentLikeTitle(
	rawValue: string | null | undefined,
): boolean {
	const compact = rawValue?.trim().toLowerCase();
	if (!compact) {
		return false;
	}

	return CONSENT_TEXT_MARKERS.some(
		(marker) => compact.startsWith(marker) || compact.includes(marker),
	);
}

export function extractYouTubeVideoId(
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

	const hostname = parsedUrl.hostname.toLowerCase();
	if (!isYouTubeHost(hostname)) {
		return null;
	}

	if (hostMatches(hostname, "youtu.be")) {
		const shortId = parsedUrl.pathname.split("/").filter(Boolean)[0];
		return sanitizeYouTubeId(shortId);
	}

	const queryId = sanitizeYouTubeId(parsedUrl.searchParams.get("v"));
	if (queryId) {
		return queryId;
	}

	const pathSegments = parsedUrl.pathname.split("/").filter(Boolean);
	if (pathSegments.length >= 2) {
		const [firstSegment, secondSegment] = pathSegments;
		if (["embed", "shorts", "live", "v"].includes(firstSegment)) {
			return sanitizeYouTubeId(secondSegment);
		}
	}

	return null;
}

export function buildYouTubeEmbedUrl(
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

	const hostname = parsedUrl.hostname.toLowerCase();
	if (!isYouTubeHost(hostname)) {
		return null;
	}

	const videoId = extractYouTubeVideoId(normalized);
	if (!videoId) {
		return null;
	}

	const embedUrl = new URL(`https://www.youtube.com/embed/${videoId}`);

	const startSeconds = extractYouTubeStartSeconds(parsedUrl);
	if (startSeconds && startSeconds > 0) {
		embedUrl.searchParams.set("start", String(startSeconds));
	}

	const listId = parsedUrl.searchParams.get("list")?.trim();
	if (listId) {
		embedUrl.searchParams.set("list", listId);

		const listIndex = parsedUrl.searchParams.get("index")?.trim();
		if (listIndex && /^\d+$/.test(listIndex)) {
			embedUrl.searchParams.set("index", listIndex);
		}
	}

	return embedUrl.toString();
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

export function classifyLinkTarget(
	rawValue: string | null | undefined,
): LinkClassification {
	const normalizedUrl = normalizeLinkTarget(rawValue);
	if (!normalizedUrl) {
		return {
			kind: "web",
			platform: null,
			normalizedUrl: null,
			hostname: null,
		};
	}

	let parsedUrl: URL;
	try {
		parsedUrl = new URL(normalizedUrl);
	} catch {
		return {
			kind: "web",
			platform: null,
			normalizedUrl,
			hostname: null,
		};
	}

	const hostname = parsedUrl.hostname.toLowerCase();
	const platform = getPlatformByHostname(hostname);

	if (isLocationUrl(parsedUrl)) {
		return {
			kind: "location",
			platform: platform ?? "Mapas",
			normalizedUrl,
			hostname,
		};
	}

	if (isReelUrl(parsedUrl)) {
		return {
			kind: "reel",
			platform: platform ?? "Reel",
			normalizedUrl,
			hostname,
		};
	}

	if (isVideoUrl(parsedUrl)) {
		return {
			kind: "video",
			platform: platform ?? "Video",
			normalizedUrl,
			hostname,
		};
	}

	if (isSocialUrl(parsedUrl)) {
		return {
			kind: "social",
			platform: platform ?? "Social",
			normalizedUrl,
			hostname,
		};
	}

	return {
		kind: "web",
		platform,
		normalizedUrl,
		hostname,
	};
}
