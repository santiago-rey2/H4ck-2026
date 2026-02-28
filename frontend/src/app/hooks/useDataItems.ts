import { useQuery } from "@tanstack/react-query";
import type { DataResponse } from "../types/data";

async function fetchDataItems(): Promise<DataResponse> {
  // TODO: Cambiar esto cuando el backend esté listo
  // Actualmente carga desde archivo JSON local en /public/data.json
  // 
  // Cuando el backend esté funcional, reemplazar con:
  // const response = await fetch("http://localhost:8000/api/items");
  // o usar la función appFetch que maneja auth y base URL:
  // import { appFetch } from "../api";
  // const data = await appFetch<DataResponse>("/api/items");
  // return data;
  
  const response = await fetch("/data.json");
  if (!response.ok) {
    throw new Error("Failed to fetch data");
  }
  return response.json();
}

export function useDataItems() {
  return useQuery({
    queryKey: ["dataItems"],
    queryFn: fetchDataItems,
  });
}
