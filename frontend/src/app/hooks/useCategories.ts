import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	type CreateCategoryPayload,
	createCategory,
	deleteCategory,
	getCategories,
	getCategoryItems,
} from "@/app/api/categories.service";
import { categoriesKeys } from "@/app/queries/keys";

const DEFAULT_CATEGORY_LIMIT = 200;

export function useCategories(limit = DEFAULT_CATEGORY_LIMIT) {
	const safeLimit = Math.max(1, limit);

	return useQuery({
		queryKey: categoriesKeys.list({ skip: 0, limit: safeLimit }),
		queryFn: () => getCategories({ skip: 0, limit: safeLimit }),
		staleTime: 5 * 60_000,
		retry: 1,
	});
}

export function useCategoryItems(categoryId: number | null, enabled = true) {
	return useQuery({
		queryKey: categoriesKeys.items(categoryId ?? 0),
		queryFn: () => getCategoryItems(categoryId as number),
		enabled: enabled && categoryId !== null && categoryId > 0,
		staleTime: 60_000,
	});
}

export function useCreateCategoryMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (payload: CreateCategoryPayload) => createCategory(payload),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: categoriesKeys.all });
		},
	});
}

export function useDeleteCategoryMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (categoryId: number) => deleteCategory(categoryId),
		onSuccess: (_, categoryId) => {
			queryClient.invalidateQueries({ queryKey: categoriesKeys.all });
			queryClient.removeQueries({
				queryKey: categoriesKeys.detail(categoryId),
			});
			queryClient.removeQueries({ queryKey: categoriesKeys.items(categoryId) });
		},
	});
}
