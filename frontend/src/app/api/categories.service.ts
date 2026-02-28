import { appFetch } from "@/app/api/appFetch";
import { mapBackendItem } from "@/app/api/items.service";
import type { DataItem } from "@/app/types/data";

export interface CategoryDto {
	id: number;
	name: string;
	description?: string | null;
	created_at?: string;
	updated_at?: string;
	active?: boolean;
}

export interface CreateCategoryPayload {
	name: string;
	description?: string | null;
}

interface CategoryItemDto {
	id: number;
	name: string;
	description?: string | null;
	format?: string | null;
	created_at?: string;
	updated_at?: string;
	categories?: Array<{
		id?: number;
		name: string;
		description?: string | null;
	}>;
}

export async function getCategories(params?: {
	skip?: number;
	limit?: number;
}): Promise<CategoryDto[]> {
	const query = new URLSearchParams({
		skip: String(Math.max(0, params?.skip ?? 0)),
		limit: String(Math.max(1, params?.limit ?? 100)),
	});

	return appFetch<CategoryDto[]>(`/categories/?${query.toString()}`);
}

export async function createCategory(
	payload: CreateCategoryPayload,
): Promise<CategoryDto> {
	return appFetch<CategoryDto>("/categories/", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(payload),
	});
}

export async function deleteCategory(categoryId: number): Promise<CategoryDto> {
	return appFetch<CategoryDto>(`/categories/${categoryId}`, {
		method: "DELETE",
	});
}

export async function getCategoryItems(
	categoryId: number,
): Promise<DataItem[]> {
	const payload = await appFetch<CategoryItemDto[]>(
		`/categories/${categoryId}/items`,
	);
	return payload.map(mapBackendItem);
}
