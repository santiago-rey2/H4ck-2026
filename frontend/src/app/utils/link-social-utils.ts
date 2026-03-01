import { hostMatchesAny } from "./link-url-utils";

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

export function isSocialUrl(url: URL): boolean {
	const hostname = url.hostname.toLowerCase();
	return hostMatchesAny(hostname, SOCIAL_DOMAINS);
}
