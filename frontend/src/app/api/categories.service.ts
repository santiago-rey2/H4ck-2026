import { appFetch } from "@/app/api/appFetch";

export interface CategoryDto {
	id: number;
	name: string;
	description?: string | null;
	created_at?: string;
	updated_at?: string;
	active?: boolean;
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
