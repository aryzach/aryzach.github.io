// Server-side mirror of client sauna type labels.
const LABELS: Record<string, string> = {
  outdoor_traditional_standard: "Outdoor Traditional",
  indoor_traditional_standard: "Indoor Traditional",
  outdoor_infrared_standard: "Outdoor Infrared",
  indoor_infrared_standard: "Indoor Infrared",
  outdoor_traditional_original: "Original Collection Outdoor",
  indoor_traditional_original: "Original Collection Indoor",
};

export function saunaTypeLabel(id: string | null | undefined): string {
  if (!id) return "Sauna";
  return LABELS[id] ?? id;
}