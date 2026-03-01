import { hostMatches, hostMatchesAny } from "../link-url-utils";
import { LOCATION_DOMAINS } from "./constants";

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
