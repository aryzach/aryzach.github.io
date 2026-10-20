// One commercial-policy implementation for the form, contract API, PDF and billing records.
export const RENTAL_TERMS_VERSION = 2;
export const PREMIUM_MONTHLY = 100;
export const UPFRONT_DISCOUNT_PERCENT = 10;
export const STANDARD_TRADITIONAL_TIERS: Record<number, { monthly: number; installFee: number }> = {
  1: { monthly: 1200, installFee: 500 },
  3: { monthly: 800, installFee: 500 },
  6: { monthly: 600, installFee: 500 },
  12: { monthly: 500, installFee: 0 },
  24: { monthly: 300, installFee: 0 },
};
export function standardTraditionalTier(id: string, months: number) {
  return ['indoor_traditional_standard', 'outdoor_traditional_standard'].includes(id)
    ? STANDARD_TRADITIONAL_TIERS[months] ?? null : null;
}
export const PREMIUM_DESCRIPTION = 'The ultimate sauna experience, including priority installation, guaranteed servicing within 3 business days, priority customer support, and a premium sauna accessory kit.';
export const PREMIUM_BENEFITS = [
  'Priority installation scheduling',
  'Guaranteed service visit within 3 business days for covered equipment issues, subject to service-area eligibility and safe access',
  'Priority customer support', 'Premium sauna towels', 'Wooden bucket and ladle', 'Sauna hats',
];
export const SECOND_HEATER_DESCRIPTION = 'A second heater allows the sauna to heat up in under 30 minutes and requires an additional suitable outlet or electrical circuit and remains subject to SF Sauna confirming electrical compatibility.';
export const OPTION_LABELS = {
  insurance_selected: 'Damage Protection', second_heater_selected: 'Second Heater',
  pay_upfront_selected: 'Pay Upfront & Save 10%', premium_selected: 'SF Sauna Premium',
};
export type RentalChoices = { [K in keyof typeof OPTION_LABELS]: boolean | null };
export function unansweredOptions(choices: RentalChoices): string[] {
  return Object.entries(OPTION_LABELS).filter(([key]) => typeof choices[key as keyof RentalChoices] !== 'boolean').map(([, label]) => label);
}
export interface RentalCommercialTerms {
  version: 2;
  currency: 'USD';
  choices: { [K in keyof RentalChoices]: boolean };
  base_monthly_cents: number;
  commitment_months: number;
  base_initial_cents: number;
  upfront_discount_percent: number;
  upfront_savings_cents: number;
  initial_rental_cents: number;
  premium_monthly_cents: number;
  insurance_monthly_cents: number;
  second_heater_monthly_cents: number;
  monthly_addons_cents: number;
  initial_commitment_cents: number;
  initial_recurring_cents: number;
  renewal_monthly_cents: number;
  installation_cents: number;
  delivery_cents: number;
  security_deposit_cents: number;
  stair_charge_cents: number | null;
  base_rent_due_on_delivery_cents: number;
  premium_benefits: string[];
  payment_terms: string[];
}
export function rentalCommercialTerms(input: {
  monthly: number; months: number; choices: RentalChoices; installation?: number;
  delivery?: number; securityDeposit?: number; stairs?: number | null;
  insuranceMonthly?: number; secondHeaterMonthly?: number;
}): RentalCommercialTerms {
  const unanswered = unansweredOptions(input.choices);
  if (unanswered.length) throw new Error(`Choose Yes or No for: ${unanswered.join(', ')}.`);
  if (!Number.isSafeInteger(input.months) || input.months < 1 || input.months > 120) throw new Error('Invalid initial commitment.');
  const cents = (n: number) => {
    if (!Number.isFinite(n) || n < 0 || !Number.isSafeInteger(Math.round(n * 100))) throw new Error('Invalid rental amount.');
    return Math.round(n * 100);
  };
  const choices = { ...input.choices } as RentalCommercialTerms['choices'];
  const base = cents(input.monthly), initial = base * input.months;
  if (!Number.isSafeInteger(initial)) throw new Error('Rental amount is too large.');
  const savings = choices.pay_upfront_selected ? Math.round(initial * UPFRONT_DISCOUNT_PERCENT / 100) : 0;
  const premium = choices.premium_selected ? cents(PREMIUM_MONTHLY) : 0;
  const insurance = choices.insurance_selected ? cents(input.insuranceMonthly ?? 20) : 0;
  const heater = choices.second_heater_selected ? cents(input.secondHeaterMonthly ?? 200) : 0;
  const addons = premium + insurance + heater;
  return {
    version: RENTAL_TERMS_VERSION, currency: 'USD', choices, base_monthly_cents: base, commitment_months: input.months,
    base_initial_cents: initial, upfront_discount_percent: choices.pay_upfront_selected ? UPFRONT_DISCOUNT_PERCENT : 0,
    upfront_savings_cents: savings, initial_rental_cents: initial - savings,
    premium_monthly_cents: premium, insurance_monthly_cents: insurance, second_heater_monthly_cents: heater,
    monthly_addons_cents: addons, initial_commitment_cents: initial - savings + addons * input.months,
    initial_recurring_cents: (choices.pay_upfront_selected ? 0 : base) + addons,
    renewal_monthly_cents: base + addons,
    installation_cents: cents(input.installation ?? 0), delivery_cents: cents(input.delivery ?? 0),
    security_deposit_cents: cents(input.securityDeposit ?? 0), stair_charge_cents: input.stairs == null ? null : cents(input.stairs),
    // A one-month commitment does not require the same month's rent twice.
    base_rent_due_on_delivery_cents: choices.pay_upfront_selected ? initial - savings : base * Math.min(2, input.months),
    premium_benefits: choices.premium_selected ? [...PREMIUM_BENEFITS] : [],
    payment_terms: [
      choices.pay_upfront_selected
        ? 'The entire discounted initial-term base rent is due upon delivery, before the rental begins. It replaces first and last month base rent; prepaid rent must not be charged again during the initial term.'
        : 'Base rent is billed monthly. First and last month base rent are due upon delivery (one month only for a one-month commitment).',
      'The 10% upfront discount applies only to base rent for the initial commitment. Installation, delivery, security deposits, taxes and all add-ons are excluded. The discount does not apply to month-to-month renewals.',
      'Selected add-ons are billed monthly without an upfront discount. SF Sauna Premium is $100/month throughout the rental and continues on month-to-month renewal unless canceled under the applicable terms. Accessories are included at no additional charge and there is no Premium setup fee.',
      'After the initial commitment, base rent continues month-to-month at the selected undiscounted monthly rate. Previously prepaid rent is not charged again; renewal base rent starts only after the prepaid period ends.',
      'Reservation payments remain credited to the balance under the existing payment process. Security deposits, applicable fees and taxes remain payable under the Master Agreement; no reservation credit or tax amount is assumed in these rental totals.',
    ],
  };
}
export function commercialPriceRows(t: RentalCommercialTerms): { label: string; cents: number; monthly?: boolean }[] {
  return [
    { label: 'SF Sauna Premium', cents: t.premium_monthly_cents, monthly: true },
    { label: 'Upfront savings (initial base rent only)', cents: -t.upfront_savings_cents },
    { label: t.choices.pay_upfront_selected ? 'Total upfront base rental' : 'Initial-term base rental', cents: t.initial_rental_cents },
    { label: 'Monthly billing during initial term', cents: t.initial_recurring_cents, monthly: true },
    { label: 'Month-to-month renewal (before any add-on cancellation)', cents: t.renewal_monthly_cents, monthly: true },
    { label: 'Initial commitment including monthly add-ons (before fees and tax)', cents: t.initial_commitment_cents },
  ];
}
