import { useQuery } from "@tanstack/react-query";
import { getCategories } from "@/app/api/categories.service";
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
