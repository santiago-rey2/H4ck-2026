import {
	extractLocationCoordinates,
	type LocationCoordinates,
} from "./coordinates";
import { clamp } from "./helpers";

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
