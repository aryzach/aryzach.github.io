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
  'Priority customer support', 'Premium sauna towels', 'Bucket and ladle', 'Sauna hats',
];
export const SECOND_HEATER_DESCRIPTION = 'A second heater allows the sauna to heat up in under 30 minutes and requires an additional suitable outlet or electrical circuit and remains subject to SF Sauna confirming electrical compatibility.';
export const OPTION_LABELS = {
  premium_selected: 'SF Sauna Premium', pay_upfront_selected: 'Pay Upfront & Save 10%',
  second_heater_selected: 'Second Heater', insurance_selected: 'Damage Protection',
};
export const upfrontEligible = (months: number): boolean => months === 12 || months === 24;
export type RentalChoices = { [K in keyof typeof OPTION_LABELS]: boolean | null };
export function unansweredOptions(choices: RentalChoices): string[] {
  return Object.entries(OPTION_LABELS).filter(([key]) => typeof choices[key as keyof RentalChoices] !== 'boolean').map(([, label]) => label);
}
export interface RentalCommercialTerms {
  version: 2;
  currency: 'USD';
  upfront_discount_scope?: 'all_except_installation_and_security_deposit';
  upfront_base_savings_cents?: number;
  upfront_addon_savings_cents?: number;
  upfront_delivery_savings_cents?: number;
  upfront_stair_savings_cents?: number | null;
  upfront_tax_savings_cents?: number | null;
  discounted_delivery_cents?: number;
  discounted_stair_charge_cents?: number | null;
  tax_cents?: number | null;
  discounted_tax_cents?: number | null;
  initial_prepaid_recurring_cents?: number;
  known_upfront_total_cents?: number;
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
  delivery?: number; securityDeposit?: number; stairs?: number | null; taxes?: number | null;
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
  if (choices.pay_upfront_selected && !upfrontEligible(input.months)) throw new Error('Pay upfront is available only for 12- or 24-month leases.');
  const base = cents(input.monthly), initial = base * input.months;
  if (!Number.isSafeInteger(initial)) throw new Error('Rental amount is too large.');
  const discount = (amount: number) => choices.pay_upfront_selected ? Math.round(amount * UPFRONT_DISCOUNT_PERCENT / 100) : 0;
  const baseSavings = discount(initial);
  const premium = choices.premium_selected ? cents(PREMIUM_MONTHLY) : 0;
  const insurance = choices.insurance_selected ? cents(input.insuranceMonthly ?? 20) : 0;
  const heater = choices.second_heater_selected ? cents(input.secondHeaterMonthly ?? 200) : 0;
  const addons = premium + insurance + heater;
  const addonSavings = discount(addons * input.months);
  const delivery = cents(input.delivery ?? 0), deliverySavings = discount(delivery);
  const stairs = input.stairs == null ? null : cents(input.stairs), stairSavings = stairs == null ? null : discount(stairs);
  const taxes = input.taxes == null ? null : cents(input.taxes), taxSavings = taxes == null ? null : discount(taxes);
  const recurringTotal = initial - baseSavings + addons * input.months - addonSavings;
  const savings = baseSavings + addonSavings + deliverySavings + (stairSavings ?? 0) + (taxSavings ?? 0);
  return {
    version: RENTAL_TERMS_VERSION, currency: 'USD', choices, base_monthly_cents: base, commitment_months: input.months,
    base_initial_cents: initial, upfront_discount_percent: choices.pay_upfront_selected ? UPFRONT_DISCOUNT_PERCENT : 0,
    upfront_savings_cents: savings, initial_rental_cents: initial - baseSavings,
    upfront_discount_scope: 'all_except_installation_and_security_deposit',
    upfront_base_savings_cents: baseSavings, upfront_addon_savings_cents: addonSavings,
    upfront_delivery_savings_cents: deliverySavings, upfront_stair_savings_cents: stairSavings,
    upfront_tax_savings_cents: taxSavings, discounted_delivery_cents: delivery - deliverySavings,
    discounted_stair_charge_cents: stairs == null ? null : stairs - (stairSavings ?? 0),
    tax_cents: taxes, discounted_tax_cents: taxes == null ? null : taxes - (taxSavings ?? 0),
    initial_prepaid_recurring_cents: choices.pay_upfront_selected ? recurringTotal : 0,
    known_upfront_total_cents: (choices.pay_upfront_selected ? recurringTotal : base * Math.min(2, input.months)) + cents(input.installation ?? 0) + cents(input.securityDeposit ?? 0) + delivery - deliverySavings + (stairs ?? 0) - (stairSavings ?? 0) + (taxes ?? 0) - (taxSavings ?? 0),
    premium_monthly_cents: premium, insurance_monthly_cents: insurance, second_heater_monthly_cents: heater,
    monthly_addons_cents: addons, initial_commitment_cents: recurringTotal,
    initial_recurring_cents: choices.pay_upfront_selected ? 0 : base + addons,
    renewal_monthly_cents: base + addons,
    installation_cents: cents(input.installation ?? 0), delivery_cents: cents(input.delivery ?? 0),
    security_deposit_cents: cents(input.securityDeposit ?? 0), stair_charge_cents: input.stairs == null ? null : cents(input.stairs),
    // A one-month commitment does not require the same month's rent twice.
    base_rent_due_on_delivery_cents: choices.pay_upfront_selected ? initial - baseSavings : base * Math.min(2, input.months),
    premium_benefits: choices.premium_selected ? [...PREMIUM_BENEFITS] : [],
    payment_terms: [
      choices.pay_upfront_selected
        ? 'The entire initial-term rent and selected add-ons are prepaid upon delivery, before the rental begins. Eligible charges receive 10% off. This replaces advance first and last month rent and monthly add-on billing during the prepaid initial term; prepaid charges must not be collected again.'
        : 'Base rent is billed monthly. First and last month base rent are due upon delivery (one month only for a one-month commitment).',
      'Pay Upfront & Save 10% is available only for 12- or 24-month initial commitments. The discount applies to all initial-term charges except the installation fee and refundable security deposit, including selected add-ons, delivery, confirmed access charges and applicable taxes. Unknown charges and taxes are calculated on the final invoice using the same policy. Renewals are not discounted.',
      'Selected add-ons have monthly rates and are included in the discounted prepaid initial term when upfront payment is chosen; otherwise they are billed monthly. SF Sauna Premium has a $100/month standard rate and continues on month-to-month renewal unless canceled under the applicable terms. Accessories are included at no additional charge and there is no Premium setup fee.',
      'After the initial commitment, base rent continues month-to-month at the selected undiscounted monthly rate. Previously prepaid rent and add-ons are not charged again; undiscounted monthly billing resumes only after the prepaid period ends.',
      'Reservation payments remain credited to the balance under the existing payment process. Security deposits, applicable fees and taxes remain payable under the Master Agreement; no reservation credit or tax amount is assumed in these rental totals.',
    ],
  };
}
export function commercialPriceRows(t: RentalCommercialTerms): { label: string; cents: number; monthly?: boolean }[] {
  const expanded = t.upfront_discount_scope === 'all_except_installation_and_security_deposit';
  return [
    { label: 'SF Sauna Premium', cents: t.premium_monthly_cents, monthly: true },
    ...(t.choices.pay_upfront_selected ? [
      { label: expanded ? 'Upfront savings (eligible charges)' : 'Upfront savings (initial base rent only)', cents: -t.upfront_savings_cents },
      { label: expanded ? 'Total upfront rental and add-ons' : 'Total upfront base rental', cents: expanded ? t.initial_prepaid_recurring_cents! : t.initial_rental_cents },
    ] : [{ label: 'Initial-term base rental', cents: t.initial_rental_cents }]),
  ];
}
