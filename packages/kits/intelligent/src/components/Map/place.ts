/** A place on the map, as plain data. key is unique per place; order is its position in the list, which numbers its pin. */
export type Place = { key: string; label: string; lat: number; lng: number; category?: string; icon: string | null; order: number };
