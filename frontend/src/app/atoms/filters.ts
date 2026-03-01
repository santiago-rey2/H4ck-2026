import { atom } from "jotai";
import type { DataItemFormat } from "@/app/types/data";

export const dataSearchQueryAtom = atom("");
export const selectedFormatsAtom = atom<DataItemFormat[]>([]);
export const selectedTagsAtom = atom<string[]>([]);

export const clearDataFiltersAtom = atom(null, (_get, set) => {
	set(dataSearchQueryAtom, "");
	set(selectedFormatsAtom, []);
	set(selectedTagsAtom, []);
});
