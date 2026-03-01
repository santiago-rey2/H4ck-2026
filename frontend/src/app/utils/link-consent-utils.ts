import { hostMatches, normalizeLinkTarget } from "./link-url-utils";

const CONSENT_GATEWAY_DOMAINS = ["consent.google.com", "consent.youtube.com"];
const CONSENT_TEXT_MARKERS = [
	"antes de ir a",
	"before you continue",
	"avant de continuer",
	"prima di continuare",
];

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
