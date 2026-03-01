import { appFetch } from "@/app/api/appFetch";
import type {
	BackendItemResponse,
	BackendPaginatedItemsResponse,
	DataItem,
	PaginatedDataResponse,
} from "@/app/types/data";

const DEFAULT_PAGE_LIMIT = 12;

export interface ItemsPageParams {
	skip?: number;
	limit?: number;
	name?: string;
	format?: string;
	hasCategories?: boolean;
	categoryId?: number;
}

export interface CreateItemPayload {
	name: string;
	description?: string | null;
	format?: string | null;
	categoryIds?: number[];
}

export interface UpdateItemPayload {
	name?: string;
	description?: string | null;
	format?: string | null;
	categoryIds?: number[];
}

export interface LinkPreviewDto {
	item_id: number;
	url: string;
	final_url: string;
	title?: string | null;
	description?: string | null;
	image?: string | null;
	logo?: string | null;
	favicon?: string | null;
	site_name?: string | null;
	source: "extruct" | "yt_dlp" | "mixed";
	cache_hit: boolean;
	fetched_at: string;
}

function normalizeFormat(item: BackendItemResponse): DataItem["formato"] {
	const normalized = (item.format ?? "").toLowerCase();

	if (normalized === "link") {
		return "link";
	}

	if (normalized === "long_text") {
		return "nota";
	}

	if (normalized === "short_text") {
		return "dato";
	}

	const maybeUrl = item.name?.trim() ?? "";
	if (/^https?:\/\//i.test(maybeUrl)) {
		return "link";
	}

	return maybeUrl.length > 140 ? "nota" : "dato";
}

export function mapBackendItem(item: BackendItemResponse): DataItem {
	const categories = item.categories ?? [];

	return {
		id: item.id,
		texto: item.name,
		description: item.description ?? undefined,
		tags: categories.map((category) => category.name).filter(Boolean),
		formato: normalizeFormat(item),
		fecha: item.created_at ?? item.updated_at ?? new Date().toISOString(),
	};
}

function normalizePaginatedResponse(
	payload: BackendPaginatedItemsResponse,
	fallbackSkip: number,
	fallbackLimit: number,
): PaginatedDataResponse {
	const items = (payload.items ?? []).map(mapBackendItem);
	const hasMore =
		payload.hasMore ??
		payload.has_more ??
		(payload.items?.length ?? 0) === fallbackLimit;

	return {
		items,
		skip: payload.skip ?? fallbackSkip,
		limit: payload.limit ?? fallbackLimit,
		hasMore,
		nextSkip:
			payload.nextSkip ??
			payload.next_skip ??
			(hasMore ? fallbackSkip + items.length : null),
		total: payload.total ?? null,
		source: "backend",
	};
}

function toCreateBody(payload: CreateItemPayload) {
	return {
		name: payload.name,
		description: payload.description ?? null,
		format: payload.format ?? undefined,
		category_ids: payload.categoryIds ?? [],
	};
}

function toUpdateBody(payload: UpdateItemPayload) {
	return {
		...(payload.name !== undefined ? { name: payload.name } : {}),
		...(payload.description !== undefined
			? { description: payload.description }
			: {}),
		...(payload.format !== undefined ? { format: payload.format } : {}),
		...(payload.categoryIds !== undefined
			? { category_ids: payload.categoryIds }
			: {}),
	};
}

export async function getItemsPage(
	params: ItemsPageParams = {},
): Promise<PaginatedDataResponse> {
	const safeSkip = Math.max(0, params.skip ?? 0);
	const safeLimit = Math.max(1, params.limit ?? DEFAULT_PAGE_LIMIT);

	const query = new URLSearchParams({
		skip: String(safeSkip),
		limit: String(safeLimit),
	});

	if (params.name) {
		query.set("name", params.name);
	}

	if (params.format) {
		query.set("format", params.format);
	}

	if (typeof params.hasCategories === "boolean") {
		query.set("has_categories", String(params.hasCategories));
	}

	if (typeof params.categoryId === "number") {
		query.set("category_id", String(params.categoryId));
	}

	const payload = await appFetch<BackendPaginatedItemsResponse>(
		`/items/?${query.toString()}`,
	);

	return normalizePaginatedResponse(payload, safeSkip, safeLimit);
}

export async function getItemById(itemId: number): Promise<DataItem> {
	const payload = await appFetch<BackendItemResponse>(`/items/${itemId}`);
	return mapBackendItem(payload);
}

export async function createItem(
	payload: CreateItemPayload,
): Promise<DataItem> {
	const created = await appFetch<BackendItemResponse>("/items/", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(toCreateBody(payload)),
	});

	return mapBackendItem(created);
}

export async function createItemFromAudio(file: File): Promise<DataItem> {
	const formData = new FormData();
	formData.append("file", file, file.name);

	const created = await appFetch<BackendItemResponse>("/items/from-audio", {
		method: "POST",
		body: formData,
	});

	return mapBackendItem(created);
}

export async function updateItem(
	itemId: number,
	payload: UpdateItemPayload,
): Promise<DataItem> {
	const updated = await appFetch<BackendItemResponse>(`/items/${itemId}`, {
		method: "PATCH",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(toUpdateBody(payload)),
	});

	return mapBackendItem(updated);
}

export async function deleteItem(itemId: number): Promise<DataItem> {
	const deleted = await appFetch<BackendItemResponse>(`/items/${itemId}`, {
		method: "DELETE",
	});

	return mapBackendItem(deleted);
}

export async function getItemLinkPreview(
	itemId: number,
): Promise<LinkPreviewDto> {
	return appFetch<LinkPreviewDto>(`/items/${itemId}/link-preview`);
}
