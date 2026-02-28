import { Badge } from "@/components/ui/badge";
import type { DataItem } from "@/app/types/data";
import { Copy, Check, FileText, StickyNote, Link2, ExternalLink, Calendar, Clock } from "lucide-react";
import { useState } from "react";
import { motion } from "motion/react";
import { useCountdown } from "@/app/hooks/useCountdown";

interface DataItemCardProps {
  item: DataItem;
}

export function DataItemCard({ item }: DataItemCardProps) {
  const [copied, setCopied] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(item.texto);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formattedDate = new Date(item.fecha).toLocaleDateString("es-ES", {
    month: "short",
    day: "numeric",
  });

  const isNota = item.formato === "nota";
  const isLink = item.formato === "link";
  const isEvento = item.formato === "evento";
  const Icon = isNota ? StickyNote : isLink ? Link2 : isEvento ? Calendar : FileText;
  const MAX_VISIBLE_TAGS = 3;
  const visibleTags = item.tags.slice(0, MAX_VISIBLE_TAGS);
  const hiddenTags = item.tags.slice(MAX_VISIBLE_TAGS);
  const remainingCount = hiddenTags.length;

  // Configuración de colores según formato
  const formatStyles = {
    dato: {
      bg: "bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/40 dark:to-blue-900/40",
      border: "border-blue-200 dark:border-blue-800",
      iconBg: "bg-blue-100 dark:bg-blue-900/40",
      iconColor: "text-blue-600 dark:text-blue-400",
      tagBg: "bg-blue-100/50 dark:bg-blue-900/30",
    },
    nota: {
      bg: "bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/40 dark:to-amber-900/40",
      border: "border-amber-200 dark:border-amber-800",
      iconBg: "bg-amber-100 dark:bg-amber-900/40",
      iconColor: "text-amber-600 dark:text-amber-400",
      tagBg: "bg-amber-100/50 dark:bg-amber-900/30",
    },
    link: {
      bg: "bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/40 dark:to-purple-900/40",
      border: "border-purple-200 dark:border-purple-800",
      iconBg: "bg-purple-100 dark:bg-purple-900/40",
      iconColor: "text-purple-600 dark:text-purple-400",
      tagBg: "bg-purple-100/50 dark:bg-purple-900/30",
    },
    evento: {
      bg: "bg-gradient-to-br from-cyan-50 to-cyan-100 dark:from-cyan-950/40 dark:to-cyan-900/40",
      border: "border-cyan-200 dark:border-cyan-800",
      iconBg: "bg-cyan-100 dark:bg-cyan-900/40",
      iconColor: "text-cyan-600 dark:text-cyan-400",
      tagBg: "bg-cyan-100/50 dark:bg-cyan-900/30",
    },
  };

  const styles = formatStyles[item.formato as keyof typeof formatStyles] || formatStyles.dato;

  // Componente Footer reutilizable
  const Footer = () => (
    <div className="space-y-2">
      {/* Tags */}
      <div className="flex flex-wrap gap-1.5">
        {visibleTags.map((tag) => (
          <Badge 
            key={tag} 
            variant="secondary" 
            className={`text-[10px] px-2 py-0.5 border-0 ${styles.tagBg}`}
          >
            {tag}
          </Badge>
        ))}
        {remainingCount > 0 && (
          <div 
            className="relative"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
          >
            <Badge 
              variant="secondary" 
              className={`text-[10px] px-2 py-0.5 border-0 cursor-help transition-colors ${styles.tagBg} opacity-70 hover:opacity-100`}
            >
              +{remainingCount}
            </Badge>
            
            {/* Tooltip */}
            {showTooltip && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 pointer-events-none">
                <div className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs rounded-lg px-3 py-2 shadow-xl whitespace-nowrap">
                  <div className="flex flex-wrap gap-1.5 max-w-[200px]">
                    {hiddenTags.map((tag) => (
                      <span key={tag} className="inline-block">
                        {tag}
                      </span>
                    ))}
                  </div>
                  {/* Flecha del tooltip */}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
                    <div className="border-4 border-transparent border-t-slate-900 dark:border-t-slate-100" />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Fecha */}
      <div className={`text-xs font-medium ${styles.iconColor}`}>
        {formattedDate}
      </div>
    </div>
  );

  // Para eventos, renderizar con fecha y hora y countdown
  if (isEvento && item.eventDate) {
    const countdown = useCountdown(item.eventDate, item.eventTime);
    const eventDate = new Date(item.eventDate);
    const formattedEventDate = eventDate.toLocaleDateString("es-ES", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
    
    return (
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className={`relative overflow-hidden rounded-2xl border ${styles.border} ${styles.bg} backdrop-blur-sm transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 hover:brightness-105 h-full flex flex-col`}
      >
        <div className="p-5 h-full flex flex-col">
          {/* Icono flotante */}
          <div className="absolute top-4 right-4">
            <div className={`p-2 rounded-xl ${styles.iconBg} ${styles.iconColor}`}>
              <Calendar className="w-4 h-4" />
            </div>
          </div>

          {/* Título del evento */}
          <h3 className="font-bold text-base leading-tight text-slate-900 dark:text-slate-100 pr-12 mb-4">
            {item.texto}
          </h3>

          {/* Cuenta atrás */}
          {!countdown.isExpired ? (
            <div className="flex-1 flex items-center justify-center my-4">
              <div className="grid grid-cols-3 gap-3 w-full">
                {/* Días */}
                <div className={`flex flex-col items-center p-3 rounded-xl ${styles.iconBg}`}>
                  <div className={`text-2xl font-bold ${styles.iconColor}`}>
                    {countdown.days}
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    {countdown.days === 1 ? 'día' : 'días'}
                  </div>
                </div>
                {/* Horas */}
                <div className={`flex flex-col items-center p-3 rounded-xl ${styles.iconBg}`}>
                  <div className={`text-2xl font-bold ${styles.iconColor}`}>
                    {countdown.hours.toString().padStart(2, '0')}
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    hrs
                  </div>
                </div>
                {/* Minutos */}
                <div className={`flex flex-col items-center p-3 rounded-xl ${styles.iconBg}`}>
                  <div className={`text-2xl font-bold ${styles.iconColor}`}>
                    {countdown.minutes.toString().padStart(2, '0')}
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    min
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center my-4">
              <div className={`text-center p-4 rounded-xl ${styles.iconBg}`}>
                <Clock className={`w-8 h-8 mx-auto mb-2 ${styles.iconColor}`} />
                <p className={`text-sm font-semibold ${styles.iconColor}`}>Evento finalizado</p>
              </div>
            </div>
          )}

          {/* Fecha y hora exacta */}
          <div className={`text-center py-3 px-4 rounded-lg ${styles.iconBg} mb-3`}>
            <div className="text-xs text-slate-600 dark:text-slate-400 mb-1">
              {formattedEventDate}
            </div>
            {item.eventTime && (
              <div className={`text-sm font-bold ${styles.iconColor}`}>
                {item.eventTime}
              </div>
            )}
          </div>

          {/* Footer con tags */}
          <div className="flex flex-wrap gap-1.5">
            {visibleTags.map((tag) => (
              <Badge 
                key={tag} 
                variant="secondary" 
                className={`text-[10px] px-2 py-0.5 border-0 ${styles.tagBg}`}
              >
                {tag}
              </Badge>
            ))}
            {remainingCount > 0 && (
              <div 
                className="relative"
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
              >
                <Badge 
                  variant="secondary" 
                  className={`text-[10px] px-2 py-0.5 border-0 cursor-help transition-colors ${styles.tagBg} opacity-70 hover:opacity-100`}
                >
                  +{remainingCount}
                </Badge>
                
                {showTooltip && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 pointer-events-none">
                    <div className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs rounded-lg px-3 py-2 shadow-xl whitespace-nowrap">
                      <div className="flex flex-wrap gap-1.5 max-w-[200px]">
                        {hiddenTags.map((tag) => (
                          <span key={tag} className="inline-block">
                            {tag}
                          </span>
                        ))}
                      </div>
                      <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
                        <div className="border-4 border-transparent border-t-slate-900 dark:border-t-slate-100" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  // Para links, renderizar con preview
  if (isLink && item.title) {
    return (
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className={`relative overflow-hidden rounded-2xl border ${styles.border} ${styles.bg} backdrop-blur-sm transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 hover:brightness-105 h-full flex flex-col cursor-pointer group`}
        onClick={() => window.open(item.texto, "_blank")}
      >
        {/* Imagen del link */}
        {item.image && (
          <div className="relative w-full h-32 overflow-hidden bg-gradient-to-br from-slate-300 to-slate-400 dark:from-slate-700 dark:to-slate-800">
            <img
              src={item.image}
              alt={item.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          </div>
        )}

        <div className="p-4 space-y-3 flex-1 flex flex-col">
          {/* Header con icono */}
          <div className="flex items-start gap-2">
            <div className={`p-1.5 rounded-lg ${styles.iconBg} ${styles.iconColor} flex-shrink-0`}>
              <Icon className="w-3.5 h-3.5" />
            </div>
            <div className="flex-1 min-w-0">
              {/* Título */}
              <h3 className="font-semibold text-sm line-clamp-2 text-slate-900 dark:text-slate-100">
                {item.title}
              </h3>

              {/* Descripción */}
              {item.description && (
                <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mt-1">
                  {item.description}
                </p>
              )}
            </div>
          </div>

          {/* URL */}
          <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors flex-1">
            <ExternalLink className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{new URL(item.texto).hostname}</span>
          </div>

          {/* Footer */}
          <Footer />
        </div>
      </motion.div>
    );
  }

  // Para datos y notas
  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className={`relative overflow-hidden rounded-2xl border ${styles.border} ${styles.bg} backdrop-blur-sm transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 hover:brightness-105 h-full flex flex-col`}
    >
      <div className="p-5 space-y-4 h-full flex flex-col">
        {/* Header con icono y botón copiar */}
        <div className="flex items-start justify-between gap-3">
          <div className={`p-2 rounded-xl ${styles.iconBg} ${styles.iconColor}`}>
            <Icon className="w-4 h-4" />
          </div>
          <button
            onClick={handleCopy}
            className={`p-2 rounded-xl hover:bg-white/50 dark:hover:bg-black/20 transition-all duration-200 ${styles.iconColor}`}
            title="Copiar"
          >
            {copied ? (
              <Check className="w-4 h-4 text-green-600 dark:text-green-500" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Contenido principal */}
        <p className="font-medium text-sm leading-relaxed text-slate-900 dark:text-slate-100 flex-1 overflow-y-auto">
          {item.texto}
        </p>

        {/* Footer */}
        <Footer />
      </div>
    </motion.div>
  );
}
