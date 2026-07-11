// Server-side mirror of client sauna type labels.
const LABELS: Record<string, string> = {
  outdoor_traditional_latest: "Outdoor Traditional",
  indoor_outdoor_traditional_latest: "Indoor Traditional",
  outdoor_infrared: "Outdoor Infrared",
  indoor_infrared: "Indoor Infrared",
  outdoor_traditional_original: "Original Collection Outdoor",
  indoor_traditional: "Original Collection Indoor",
};

export function saunaTypeLabel(id: string | null | undefined): string {
  if (!id) return "Sauna";
  return LABELS[id] ?? id;
}