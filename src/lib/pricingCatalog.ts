// Catalog for the new /pricing experience.
// Maps product URL slugs -> sauna_types.id in the database + display data.

import traditionalOutdoorAsset from "@/assets/traditional-outdoor.png.asset.json";
import originalCollectionAsset from "@/assets/original-collection.png.asset.json";
import infraredOutdoorAsset from "@/assets/infrared-outdoor.png.asset.json";

export type Category = "traditional" | "infrared";

export interface PricingTier {
  months: 1 | 3 | 6 | 12;
  monthly: number;
  installFee: number; // 0 = Free
  badge?: "Most Popular" | "Best Value";
}

export interface Product {
  slug: string; // URL segment under category
  saunaTypeId: string | null; // matches sauna_types.id, null if not yet in DB
  name: string;
  category: Category;
  categoryLabel: string;
  placement: "Indoor" | "Outdoor";
  shortDescription: string;
  longDescription: string;
  image: string;
  reservationFee: number;
  tiers: PricingTier[];
}

const TRAD_TIERS = (installShort: number): PricingTier[] => [
  { months: 1, monthly: 1199, installFee: installShort },
  { months: 3, monthly: 599, installFee: installShort },
  { months: 6, monthly: 499, installFee: 0, badge: "Most Popular" },
  { months: 12, monthly: 399, installFee: 0, badge: "Best Value" },
];

const INFRARED_INDOOR_TIERS: PricingTier[] = [
  { months: 1, monthly: 549, installFee: 150 },
  { months: 3, monthly: 399, installFee: 150 },
  { months: 6, monthly: 299, installFee: 0, badge: "Most Popular" },
  { months: 12, monthly: 199, installFee: 0, badge: "Best Value" },
];

const INFRARED_OUTDOOR_TIERS: PricingTier[] = [
  { months: 1, monthly: 599, installFee: 150 },
  { months: 3, monthly: 399, installFee: 150 },
  { months: 6, monthly: 349, installFee: 0, badge: "Most Popular" },
  { months: 12, monthly: 299, installFee: 0, badge: "Best Value" },
];

// Original Collection (older-generation, converted from infrared) uses
// the lower Original Collection pricing.
const ORIGINAL_TIERS: PricingTier[] = [
  { months: 1, monthly: 899, installFee: 350 },
  { months: 3, monthly: 499, installFee: 350 },
  { months: 6, monthly: 399, installFee: 0, badge: "Most Popular" },
  { months: 12, monthly: 299, installFee: 0, badge: "Best Value" },
];

// Portrait placeholder imagery — swap for real photography later.
const PLACEHOLDER_TRAD_INDOOR = "https://images.unsplash.com/photo-1613767973936-64d1e34d8484?auto=format&fit=crop&w=1200&q=80";
const PLACEHOLDER_TRAD_OUTDOOR = traditionalOutdoorAsset.url;
const IMG_ORIGINAL_COLLECTION = originalCollectionAsset.url;
const PLACEHOLDER_INFRARED_INDOOR = "https://images.unsplash.com/photo-1591343395082-e120087004b4?auto=format&fit=crop&w=1200&q=80";
const PLACEHOLDER_INFRARED_OUTDOOR = infraredOutdoorAsset.url;

export const products: Product[] = [
  {
    slug: "indoor",
    saunaTypeId: "indoor_outdoor_traditional_latest",
    name: "Traditional Sauna — Indoor",
    category: "traditional",
    categoryLabel: "Traditional",
    placement: "Indoor",
    shortDescription: "2-person traditional sauna, built for living rooms, garages, and studio apartments.",
    longDescription:
      "Our 2-person indoor traditional sauna, engineered for quiet indoor operation on standard 120V power. Authentic löyly with real stones, cedar interior, and delivered fully assembled.",
    image: PLACEHOLDER_TRAD_INDOOR,
    reservationFee: 500,
    tiers: TRAD_TIERS(350),
  },
  {
    slug: "outdoor",
    saunaTypeId: "outdoor_traditional_latest",
    name: "Traditional Sauna — Outdoor",
    category: "traditional",
    categoryLabel: "Traditional",
    placement: "Outdoor",
    shortDescription: "2-person traditional sauna for backyards, patios, and decks.",
    longDescription:
      "Our 2-person outdoor traditional sauna, weather-sealed for year-round Bay Area use. Runs on standard 120V power with real stones for authentic löyly.",
    image: PLACEHOLDER_TRAD_OUTDOOR,
    reservationFee: 500,
    tiers: TRAD_TIERS(350),
  },
  {
    slug: "original-indoor",
    saunaTypeId: "indoor_traditional",
    name: "Original Collection — Indoor",
    category: "traditional",
    categoryLabel: "Traditional",
    placement: "Indoor",
    shortDescription:
      "Earlier-generation indoor traditional sauna, converted from an infrared model. Same authentic experience, lower monthly price.",
    longDescription:
      "An earlier-generation traditional sauna converted from one of our infrared models. Full stones, cedar interior, and the same authentic traditional experience at a lower monthly price.",
    image: IMG_ORIGINAL_COLLECTION,
    reservationFee: 500,
    tiers: ORIGINAL_TIERS,
  },
  {
    slug: "original-outdoor",
    saunaTypeId: null,
    name: "Original Collection — Outdoor",
    category: "traditional",
    categoryLabel: "Traditional",
    placement: "Outdoor",
    shortDescription:
      "Earlier-generation outdoor traditional sauna, converted from an infrared model. Authentic experience at a lower monthly price.",
    longDescription:
      "An earlier-generation outdoor traditional sauna converted from one of our infrared models. Real stones, cedar interior, and the same authentic experience at a lower price point.",
    image: IMG_ORIGINAL_COLLECTION,
    reservationFee: 500,
    tiers: ORIGINAL_TIERS,
  },
  {
    slug: "indoor",
    saunaTypeId: "indoor_infrared",
    name: "Infrared Sauna — Indoor",
    category: "infrared",
    categoryLabel: "Infrared",
    placement: "Indoor",
    shortDescription: "Gentle, low-EMF infrared heat. Compact enough for any room.",
    longDescription:
      "Our 2-person indoor infrared sauna delivers deep, low-EMF radiant heat at 150°F. Compact footprint, standard 120V power, and delivered fully assembled.",
    image: PLACEHOLDER_INFRARED_INDOOR,
    reservationFee: 200,
    tiers: INFRARED_INDOOR_TIERS,
  },
  {
    slug: "outdoor",
    saunaTypeId: "outdoor_infrared",
    name: "Infrared Sauna — Outdoor",
    category: "infrared",
    categoryLabel: "Infrared",
    placement: "Outdoor",
    shortDescription: "Weather-ready infrared sauna for backyards and patios.",
    longDescription:
      "Our 2-person outdoor infrared sauna delivers gentle, low-EMF radiant heat, sealed for year-round Bay Area weather. Runs on standard 120V.",
    image: PLACEHOLDER_INFRARED_OUTDOOR,
    reservationFee: 200,
    tiers: INFRARED_OUTDOOR_TIERS,
  },
];

export function getProduct(category: Category, slug: string): Product | undefined {
  return products.find((p) => p.category === category && p.slug === slug);
}

export function productsIn(category: Category): Product[] {
  return products.filter((p) => p.category === category);
}

export function startingPrice(category: Category): number {
  const tiers = productsIn(category).flatMap((p) => p.tiers.map((t) => t.monthly));
  return Math.min(...tiers);
}

export const categoryHero: Record<Category, { image: string; blurb: string }> = {
  traditional: {
    image: PLACEHOLDER_TRAD_OUTDOOR,
    blurb:
      "Authentic löyly with real stones. Choose indoor, outdoor, or our Original Collection.",
  },
  infrared: {
    image: PLACEHOLDER_INFRARED_INDOOR,
    blurb:
      "Gentle, low-EMF radiant heat. Choose indoor or outdoor.",
  },
};