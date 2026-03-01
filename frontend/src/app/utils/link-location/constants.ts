export const LOCATION_DOMAINS = [
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

export const LOCATION_NAME_QUERY_KEYS = ["q", "query", "destination", "daddr"];

export const IGNORED_LOCATION_NAME_SEGMENTS = new Set([
	"maps",
	"map",
	"place",
	"dir",
	"search",
	"data",
	"location",
	"loc",
]);

export const COORDINATE_ONLY_REGEX =
	/^(?:loc:|coords?:)?\s*\(?\s*-?\d{1,2}(?:\.\d+)?\s*[,\s]\s*-?\d{1,3}(?:\.\d+)?(?:\s*,\s*\d+(?:\.\d+)?z?)?\s*\)?$/i;
