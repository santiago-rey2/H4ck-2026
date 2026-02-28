import { useDataItems } from "@/app/hooks/useDataItems";
import { DataItemCard } from "./DataItemCard";
import { motion } from "motion/react";
import { Loader2 } from "lucide-react";

function getSizeByFormat(formato: string): string {
  switch (formato) {
    case "nota":
      return "2x1";
    case "link":
    case "dato":
    default:
      return "1x1";
  }
}

export function DataItemsList() {
  const { data, isLoading, error } = useDataItems();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-96 bg-red-50 dark:bg-red-900/20 rounded-lg p-6">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 font-semibold">
            Error al cargar los datos
          </p>
          <p className="text-sm text-red-500 dark:text-red-300 mt-2">
            {error instanceof Error ? error.message : "Error desconocido"}
          </p>
        </div>
      </div>
    );
  }

  if (!data?.items || data.items.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <p className="text-slate-500">No hay datos disponibles</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 auto-rows-fr" style={{ gridAutoFlow: "dense" }}>
      {data.items.map((item, index) => (
        <motion.div
          key={item.id}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: index * 0.05, duration: 0.3 }}
          className={
            getSizeByFormat(item.formato) === "2x1" ? "col-span-1 sm:col-span-2" :
            getSizeByFormat(item.formato) === "2x2" ? "col-span-1 sm:col-span-2 sm:row-span-2" :
            "col-span-1"
          }
        >
          <DataItemCard item={item} />
        </motion.div>
      ))}
    </div>
  );
}
