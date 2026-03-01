const ABSOLUTE_URL_REGEX = /^[a-zA-Z][a-zA-Z\d+.-]*:\/\//;

export function hostMatches(hostname: string, domain: string): boolean {
	return hostname === domain || hostname.endsWith(`.${domain}`);
}

export function hostMatchesAny(hostname: string, domains: string[]): boolean {
	return domains.some((domain) => hostMatches(hostname, domain));
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
