export interface DataItem {
	id: number;
	texto: string;
	tags: string[];
	formato: string;
	fecha: string;
	// Campos opcionales para links
	title?: string;
	description?: string;
	image?: string;
	// Campos opcionales para eventos
	eventDate?: string; // Fecha del evento (YYYY-MM-DD)
	eventTime?: string; // Hora del evento (HH:mm)
}

export interface DataResponse {
	items: DataItem[];
}

export interface PaginatedDataResponse {
	items: DataItem[];
	skip: number;
	limit: number;
	hasMore: boolean;
	nextSkip: number | null;
	total?: number | null;
	source: "backend" | "local";
}

export interface BackendCategoryResponse {
	id?: number;
	name: string;
	description?: string | null;
}

export interface BackendItemResponse {
	id: number;
	name: string;
	description?: string | null;
	format?: string | null;
	created_at?: string;
	updated_at?: string;
	categories?: BackendCategoryResponse[];
}

export interface BackendPaginatedItemsResponse {
	items: BackendItemResponse[];
	skip: number;
	limit: number;
	has_more?: boolean;
	hasMore?: boolean;
	next_skip?: number | null;
	nextSkip?: number | null;
	total?: number | null;
}
