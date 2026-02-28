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
