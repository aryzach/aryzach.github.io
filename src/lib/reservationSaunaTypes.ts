// Central catalog of sauna type options offered in the reservation modal.
// Each option maps to a sauna_types.id in the database and the corresponding
// product page URL.

export interface SaunaTypeOption {
  id: string;
  label: string;
  productHref: string;
}

export const SAUNA_TYPE_OPTIONS: SaunaTypeOption[] = [
  {
    id: "outdoor_traditional_latest",
    label: "Outdoor Traditional",
    productHref: "/pricing/traditional/outdoor",
  },
  {
    id: "indoor_outdoor_traditional_latest",
    label: "Indoor Traditional",
    productHref: "/pricing/traditional/indoor",
  },
  {
    id: "outdoor_infrared",
    label: "Outdoor Infrared",
    productHref: "/pricing/infrared/outdoor",
  },
  {
    id: "indoor_infrared",
    label: "Indoor Infrared",
    productHref: "/pricing/infrared/indoor",
  },
  {
    id: "outdoor_traditional_original",
    label: "Original Collection Outdoor",
    productHref: "/pricing/original/original-outdoor",
  },
  {
    id: "indoor_traditional",
    label: "Original Collection Indoor",
    productHref: "/pricing/original/original-indoor",
  },
];

export function saunaTypeLabel(id: string | null | undefined): string {
  if (!id) return "—";
  return SAUNA_TYPE_OPTIONS.find((o) => o.id === id)?.label ?? id;
}