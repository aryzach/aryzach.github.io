// Catalog for the new /pricing experience.
// Maps product URL slugs -> sauna_types.id in the database + display data.

import {
  PRICING_TIERS,
  RESERVATION_DEPOSIT_INFRARED,
  RESERVATION_DEPOSIT_TRADITIONAL,
  type SaunaTypeId,
} from "./generatedPricing";
import originalCollectionAsset from "@/assets/original-collection.png.asset.json";
import originalCollectionOutdoorAsset from "@/assets/original-collection-outdoor.png.asset.json";
import originalCollectionIndoorAsset from "@/assets/original-collection-indoor.jpg.asset.json";
import infraredOutdoorAsset from "@/assets/infrared-outdoor.png.asset.json";
import infraredHeroAsset from "@/assets/infrared-hero.jpg.asset.json";
import infraredIndoorAsset from "@/assets/infrared-indoor.png.asset.json";
import traditionalHeroAsset from "@/assets/traditional-hero.png.asset.json";
import traditionalIndoorAsset from "@/assets/traditional-indoor.jpg.asset.json";

// Lovable CDN assets are served from the Lovable-hosted origin. When this
// site is deployed to GitHub Pages, the `/__l5e/...` path doesn't exist on
// that host, so we always resolve asset URLs against the Lovable origin.
const LOVABLE_ASSET_ORIGIN = "https://cedar-home-sanctuary.lovable.app";
const assetUrl = (a: { url: string }) =>
  a.url.startsWith("http") ? a.url : `${LOVABLE_ASSET_ORIGIN}${a.url}`;

export type Category = "traditional" | "infrared" | "original";

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

function tiersFor(id: SaunaTypeId): PricingTier[] {
  const table = PRICING_TIERS[id];
  return ([1, 3, 6, 12] as const).map((months) => {
    const row = table[months];
    const tier: PricingTier = {
      months,
      monthly: row.monthly,
      installFee: row.installFee,
    };
    if (row.badge) tier.badge = row.badge;
    return tier;
  });
}

// Portrait placeholder imagery — swap for real photography later.
const PLACEHOLDER_TRAD_INDOOR = assetUrl(traditionalIndoorAsset);
const PLACEHOLDER_TRAD_OUTDOOR = assetUrl(traditionalHeroAsset);
const IMG_ORIGINAL_COLLECTION_INDOOR = assetUrl(originalCollectionIndoorAsset);
const IMG_ORIGINAL_COLLECTION = assetUrl(originalCollectionAsset);
const IMG_ORIGINAL_COLLECTION_OUTDOOR = assetUrl(originalCollectionOutdoorAsset);
const PLACEHOLDER_INFRARED_INDOOR = assetUrl(infraredIndoorAsset);
const PLACEHOLDER_INFRARED_OUTDOOR = assetUrl(infraredOutdoorAsset);

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
      "2-person sauna, 200°F on a standard home outlet.",
    image: PLACEHOLDER_TRAD_INDOOR,
    reservationFee: RESERVATION_DEPOSIT_TRADITIONAL,
    tiers: tiersFor("indoor_outdoor_traditional_latest"),
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
      "2-person sauna, 200°F on a standard home outlet.",
    image: PLACEHOLDER_TRAD_OUTDOOR,
    reservationFee: RESERVATION_DEPOSIT_TRADITIONAL,
    tiers: tiersFor("outdoor_traditional_latest"),
  },
  {
    slug: "original-indoor",
    // Slug retained as `original-indoor` (not `indoor`) so lookups within the
    // "original" category remain unique when combined with future variants.
    saunaTypeId: "indoor_traditional",
    name: "Original Collection — Indoor",
    category: "original",
    categoryLabel: "Original Collection",
    placement: "Indoor",
    shortDescription:
      "Earlier-generation indoor traditional sauna, converted from an infrared model. Same authentic experience, lower monthly price.",
    longDescription:
      "1st-gen traditional sauna. 200°F on a standard home outlet.",
    image: IMG_ORIGINAL_COLLECTION_INDOOR,
    reservationFee: RESERVATION_DEPOSIT_TRADITIONAL,
    tiers: tiersFor("indoor_traditional"),
  },
  {
    slug: "original-outdoor",
    saunaTypeId: "outdoor_traditional_original",
    name: "Original Collection — Outdoor",
    category: "original",
    categoryLabel: "Original Collection",
    placement: "Outdoor",
    shortDescription:
      "Earlier-generation outdoor traditional sauna, converted from an infrared model. Authentic experience at a lower monthly price.",
    longDescription:
      "1st-gen traditional sauna. 200°F on a standard home outlet.",
    image: IMG_ORIGINAL_COLLECTION_OUTDOOR,
    reservationFee: RESERVATION_DEPOSIT_TRADITIONAL,
    tiers: tiersFor("outdoor_traditional_original"),
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
      "2-person infrared sauna delivering 150°F heat.",
    image: PLACEHOLDER_INFRARED_INDOOR,
    reservationFee: RESERVATION_DEPOSIT_INFRARED,
    tiers: tiersFor("indoor_infrared"),
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
      "2-person infrared sauna delivering 150°F heat.",
    image: PLACEHOLDER_INFRARED_OUTDOOR,
    reservationFee: RESERVATION_DEPOSIT_INFRARED,
    tiers: tiersFor("outdoor_infrared"),
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
    image: assetUrl(traditionalHeroAsset),
    blurb:
      "Authentic löyly with real stones powered from a standard home outlet. Choose indoor, outdoor, or our Original Collection.",
  },
  infrared: {
    image: assetUrl(infraredHeroAsset),
    blurb:
      "Gentle, low-EMF radiant heat. Choose indoor or outdoor.",
  },
  original: {
    image: IMG_ORIGINAL_COLLECTION_INDOOR,
    blurb:
      "Earlier-generation traditional saunas converted from infrared models. Same authentic experience at a lower monthly price.",
  },
};