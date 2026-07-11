// Server-side mirror of client sauna type labels.
const LABELS: Record<string, string> = {
  indoor_infrared: "Indoor Infrared Sauna",
  outdoor_infrared: "Outdoor Infrared Sauna",
  indoor_traditional: "Indoor Traditional Sauna",
  outdoor_traditional_latest: "Outdoor Traditional Sauna",
  indoor_outdoor_traditional_original: "Indoor Traditional Original Collection Sauna",
  indoor_outdoor_traditional_latest: "Outdoor Traditional Original Collection Sauna",
};

export function saunaTypeLabel(id: string | null | undefined): string {
  if (!id) return "Sauna";
  return LABELS[id] ?? id;
}