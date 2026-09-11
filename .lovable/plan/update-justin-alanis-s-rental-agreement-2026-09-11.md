# Update Justin Alanis’s Rental Agreement

## Scope
Update only the current reservation for `jalanis1@gmail.com` (reservation `71b31016-21f2-4b87-8e4d-7b622b1cc27c`). Its current agreement is an unsigned draft, so no signed record needs replacement.

## Changes
- Add reservation-level delivery and stair-charge overrides so Justin’s waivers persist if he edits or regenerates the draft.
- Set Justin’s delivery fee to $0 and stair charge to $0.
- Add customer-specific wording that delivery is waived for his 24-month commitment and the stair charge is waived for the installation access already shown.
- Add the requested “Future Heater Upgrade” term.
- Preserve his 24-month term, $300/month rent, $1,500 refundable deposit, temperature guarantee/remedy, full-cedar unit term, insurance election, and all other terms.
- Refresh Justin’s existing draft snapshot and pricing snapshot so the web summary and generated signed PDF use the same values and language.

## Technical details
- Add nullable per-reservation fee override fields; no global pricing or shared Master Agreement changes.
- Update the contract service to apply those overrides when creating or regenerating a draft.
- Return the overrides to the customer agreement screen so its calculated values match the saved agreement.
- Update only Justin’s reservation and unsigned draft; do not send email, charge payment, or alter scheduling.
- Verify Justin’s final record and confirm no other reservation received these overrides or terms.
