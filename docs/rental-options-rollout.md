# Future-booking agreement changes — deployment review

Production activation completed after the verified database export and owner authorization. The live frontend and contract/admin/accounting functions are deployed; future bookings default to pricing version 2. Existing bookings remain version 1. The private preview's `/agreement-preview` route uses example details and the actual form; it never creates a booking, stores an agreement or signs anything. `/agreement-preview?legacy=1` demonstrates an existing unsigned booking.

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
| 1 | $1,200 | Not available | — | $500 |
| 3 | $2,400 | Not available | — | $500 |
| 6 | $3,600 | Not available | — | $500 |
| 12 | $6,000 | $5,400 | $600 | $0 |
| 24 | $7,200 | $6,480 | $720 | $0 |

Premium is $100/month, damage protection $20/month, and the second heater $200/month. For 12- or 24-month upfront leases, rent and selected add-ons are prepaid for the initial term and receive 10% off. Delivery, confirmed access charges and applicable tax charges also receive 10% off; only installation and the refundable security deposit are excluded. Tax amounts remain unknown until calculated on the invoice and must not be represented as zero. All discounts end at renewal. Renewal base rent is the selected undiscounted monthly rate; Premium continues unless canceled under applicable terms. No accessory or Premium setup charge is added. A one-month commitment charges only one month of advance base rent.

The lifecycle signature trigger captures Premium as an add-on and the original commercial snapshot for future signatures only. Committed rental LTV uses the signed initial discounted commitment, while subsequent payments, refunds and settlements remain separate. Accounting and inventory API responses expose the stored plan; the accounting table displays Premium, upfront rent/savings, initial monthly billing and renewal billing.

## Required owner review

1. **Payment timing:** the draft language makes the entire discounted initial rent and selected add-ons due upon delivery, before rental begins. This replaces first/last month advance base rent. Confirm this timing before deployment.
2. **Premium service promise:** review the guaranteed visit within three business days, covered equipment issues, eligibility, safe access, business-day definition, start of the response clock, remedies and cancellation provisions against the Master Agreement. Accessories are included without an additional fee.
3. **Prepaid refunds/cancellation:** the existing Master Agreement remains incorporated. Confirm whether its cancellation, unused-period and refund language adequately addresses prepaid base rent and Premium cancellation.
4. **Billing operations:** this repository creates only the fixed $200 Stripe reservation-deposit checkout and bank setup; rental invoices/subscriptions are not created here. No new checkout or automatic rental charge has been introduced. Configure the existing operational invoice/subscription process from the stored plan: for eligible 12/24-month upfront leases, collect discounted rent and selected add-ons for the initial term once, discount eligible delivery/access/tax line items, leave installation and security deposit undiscounted, suppress recurring rent and add-on billing for the prepaid term, and resume undiscounted monthly rent and selected add-ons only after that term. Do not represent the new option as automatic collection until that process is verified.
5. **Taxes and credits:** the $200 reservation payment remains credited by the existing billing process. Do not subtract it twice or treat the reservation credit as a charge to discount. Apply 10% to eligible tax and other charges on the final invoice, excluding installation and the security deposit. The preview does not invent a tax rate or unconfirmed access amount; these remain unestimated until invoiced. Verify the final invoice's tax and deposit treatment in the existing billing system.

## Production rollout

Use a short booking-creation pause while applying the two migrations, deploying the contract/admin/accounting functions, and publishing the reviewed frontend. Resume booking creation only after the complete version-2 path has been tested in a non-production environment. The migration commit is the activation boundary; do not run it early while old clients/functions can still create agreements. Existing open sessions should reload.

Regenerate the generated pricing mirrors from the updated catalog after activation. The shared policy explicitly supplies version-2 Traditional rates and a frozen legacy fallback, so a pricing-sync build cannot overwrite the new policy or reprice old reservations.

## Verification

- `npm test`: full Node regression suite, including all terms/options, cents/rounding, frozen legacy prices, original commitment LTV and migration preservation checks.
- `npm run typecheck`.
- With the local dev server on port 8080: `npm run test:agreement:browser`. Tests explicit answers, every tier, immediate totals, preview generation, mobile layout and the legacy unsigned-booking flow. Set `AGREEMENT_PREVIEW_ORIGIN` for another origin.
- Actual PDF rendering/text extraction was checked for all five terms against the same server PDF builder, including amounts, benefits and the incorporated master page. Deno PDF regression cases were added as well.
- Production database migrations and real Stripe charges were not executed as tests.

## October 21 preview refinement

Options display in this order: SF Sauna Premium, Pay Upfront & Save 10%, Second Heater, Damage Protection. The accessory is described as Bucket and ladle. The customer summary omits the initial monthly-billing, renewal total and initial commitment total rows, while the full billing plan retains those facts for accounting. Shorter terms disable upfront Yes and require explicit No; moving from an eligible selected-upfront term to a shorter term clears that choice and requires a new answer.


## Production activation result

Activated after the verified private database export on October 20, 2026 (Pacific time). The two prepared schema changes were applied atomically as `activate_future_booking_rental_options`.

- All 98 existing bookings retain version 1 and a snapshot of the original catalog, including unsigned bookings. Their original-field checksum is unchanged.
- All 19 contracts and the existing rental-terms checksum are unchanged.
- New bookings default to version 2; both standard Traditional catalogs match the approved five tiers.
- Booking creation is open. The temporary rollout trigger remains disabled; it must not be enabled as part of normal operations.
- Contract API v18, admin API v35 and accounting API v17 are active. Admin authentication remains unchanged. The accounting update also prefers the agreed installation fee stored in each signed summary over a later catalog/custom override.
- The export includes all 81 database tables (4,601 rows), schema metadata and original versions of the three affected functions. It excludes Storage file bytes; none were modified by this rollout. It is a verified logical data export, not a tested blank-project disaster-recovery backup.
- Existing reservation-deposit processing is unchanged. Rental/upfront invoicing remains the existing operational billing process; no automatic rental collection or real charge was tested or introduced.
