export interface ItemsInfiniteKeyParams {
	pageSize: number;
	searchQuery?: string;
}

export interface CategoriesKeyParams {
	skip: number;
	limit: number;
}

export const itemsKeys = {
	all: ["items"] as const,
	infinite: (params: ItemsInfiniteKeyParams) =>
		["items", "infinite", params] as const,
	latest: () => ["items", "latest"] as const,
	detail: (itemId: number) => ["items", "detail", itemId] as const,
	linkPreview: (itemId: number) => ["items", "preview", itemId] as const,
};

export const categoriesKeys = {
	all: ["categories"] as const,
	list: (params: CategoriesKeyParams) =>
		["categories", "list", params] as const,
};
