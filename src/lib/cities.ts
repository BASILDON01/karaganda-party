/**
 * Города Казахстана, в которых доступна платформа.
 * Порядок: крупные города сначала.
 */
export const CITIES = [
  "Алматы",
  "Астана",
  "Шымкент",
  "Караганда",
  "Актобе",
  "Тараз",
  "Павлодар",
  "Усть-Каменогорск",
  "Семей",
  "Атырау",
  "Актау",
  "Костанай",
  "Уральск",
  "Петропавловск",
  "Кызылорда",
  "Талдыкорган",
  "Кокшетау",
  "Туркестан",
  "Жанаозен",
  "Конаев",
  "Капшагай",
  "Риддер",
  "Балхаш",
  "Сарань",
  "Жанатас",
  "Экибастуз",
  "Темиртау",
  "Кандыагаш",
  "Жанаарка",
] as const;

export type CitySlug = (typeof CITIES)[number];

export const DEFAULT_CITY = "Караганда";

export function getCities(): string[] {
  return [...CITIES];
}

export function isCityValid(city: string): boolean {
  return CITIES.some((c) => c === city.trim());
}

export function getDefaultCity(): string {
  return DEFAULT_CITY;
}
