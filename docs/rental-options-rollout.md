# Future-booking agreement changes — deployment review

Implementation is prepared in source. Database migrations, Edge Functions, Stripe configuration and the live domain must be reviewed before production activation. The private preview's `/agreement-preview` route uses example details and the actual form; it never creates a booking, stores an agreement or signs anything. `/agreement-preview?legacy=1` demonstrates an existing unsigned booking.

## Booking boundary and preservation

- The migration transaction locks reservations, marks all existing bookings as pricing version 1, and snapshots the database's existing catalog before changing Traditional prices.
- Only reservations inserted after that transaction commits default to version 2. The boundary is booking creation, not contract signature, installation date or deposit payment.
- Existing bookings keep the original form, prices, custom quotes and optional add-ons even when unsigned. Existing draft amounts are retained when the same type/term/variant is regenerated. Existing signed agreements, PDFs, signature hashes and historical lifecycle terms are never backfilled.
- The database rejects subsequent changes to a booking's pricing-version flag or frozen catalog. Changing the booking policy is not a customer/admin edit.
- New standard Traditional indoor/outdoor rates: 1 month $1,200 + $500 installation; 3 months $800 + $500; 6 months $600 + $500; 12 months $500 with free installation; 24 months $300 with free installation. Infrared, Original Collection and customer-specific quotes retain their prices.

## Shared agreement and billing facts

The browser, contract API and PDF use `rentalTerms.ts`. The server calculates prices itself and stores a versioned, cent-denominated `commercial_terms` snapshot in both the Rental Summary and pricing snapshot. It includes the four explicit selections, base rent, total discounted initial rent, savings, monthly add-ons, renewal rate, fees/deposits and the accepted Premium benefits/payment paragraphs. API callers cannot submit their own discount rate or Premium price.

| Months | Initial base rent | Upfront rent | Savings | Installation |
| --- | ---: | ---: | ---: | ---: |
| 1 | $1,200 | $1,080 | $120 | $500 |
| 3 | $2,400 | $2,160 | $240 | $500 |
| 6 | $3,600 | $3,240 | $360 | $500 |
| 12 | $6,000 | $5,400 | $600 | $0 |
| 24 | $7,200 | $6,480 | $720 | $0 |

Premium is $100/month, damage protection $20/month, and the second heater $200/month. All remain monthly and receive no upfront discount. Renewal base rent is the selected undiscounted monthly rate; Premium continues unless canceled under applicable terms. No accessory or Premium setup charge is added. A one-month commitment charges only one month of advance base rent.

The lifecycle signature trigger captures Premium as an add-on and the original commercial snapshot for future signatures only. Committed rental LTV uses the signed initial discounted commitment, while subsequent payments, refunds and settlements remain separate. Accounting and inventory API responses expose the stored plan; the accounting table displays Premium, upfront rent/savings, initial monthly billing and renewal billing.

## Required owner review

1. **Payment timing:** the draft language makes the entire discounted base rent due upon delivery, before rental begins. This replaces first/last month advance base rent. Confirm this timing before deployment.
2. **Premium service promise:** review the guaranteed visit within three business days, covered equipment issues, eligibility, safe access, business-day definition, start of the response clock, remedies and cancellation provisions against the Master Agreement. Accessories are included without an additional fee.
3. **Prepaid refunds/cancellation:** the existing Master Agreement remains incorporated. Confirm whether its cancellation, unused-period and refund language adequately addresses prepaid base rent and Premium cancellation.
4. **Billing operations:** this repository creates only the fixed $200 Stripe reservation-deposit checkout and bank setup; rental invoices/subscriptions are not created here. No new checkout or automatic rental charge has been introduced. Configure the existing operational invoice/subscription process from the stored plan: charge discounted initial base rent once, keep add-ons monthly, exclude prepaid base rent from recurring billing during that term, and resume undiscounted base rent only after the prepaid term. Do not represent the new option as automatic collection until that process is verified.
5. **Taxes and credits:** the $200 reservation payment remains credited by the existing billing process. Do not subtract it twice or discount the deposit. Existing fee/tax treatment is unchanged; rental totals are before tax and unconfirmed site charges. Verify the final invoice's tax and deposit treatment in the existing billing system.

## Production rollout

Use a short booking-creation pause while applying the two migrations, deploying the contract/admin/accounting functions, and publishing the reviewed frontend. Resume booking creation only after the complete version-2 path has been tested in a non-production environment. The migration commit is the activation boundary; do not run it early while old clients/functions can still create agreements. Existing open sessions should reload.

Regenerate the generated pricing mirrors from the updated catalog after activation. The shared policy explicitly supplies version-2 Traditional rates and a frozen legacy fallback, so a pricing-sync build cannot overwrite the new policy or reprice old reservations.

## Verification

- `npm test`: full Node regression suite, including all terms/options, cents/rounding, frozen legacy prices, original commitment LTV and migration preservation checks.
- `npm run typecheck`.
- With the local dev server on port 8080: `npm run test:agreement:browser`. Tests explicit answers, every tier, immediate totals, preview generation, mobile layout and the legacy unsigned-booking flow. Set `AGREEMENT_PREVIEW_ORIGIN` for another origin.
- Actual PDF rendering/text extraction was checked for all five terms against the same server PDF builder, including amounts, benefits and the incorporated master page. Deno PDF regression cases were added as well.
- Production database migrations and real Stripe charges were not executed as tests.
