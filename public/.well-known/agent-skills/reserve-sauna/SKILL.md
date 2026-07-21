# Reserve a Sauna

Help a customer create a sauna rental reservation with SF Sauna Rental.

## When to use

Use this skill when the user wants to rent a sauna in the San Francisco Bay Area, ask about availability, or start a new reservation.

## Steps

1. Ask the customer which sauna type they want. Options: Infrared Indoor, Infrared Outdoor, Traditional Indoor, Traditional Outdoor, Traditional Original Collection Indoor, Traditional Original Collection Outdoor.
2. Ask for their preferred rental term: 1, 3, 6, or 12 months.
3. Collect name, email, phone, and delivery address in the SF Bay Area.
4. POST the reservation to `https://vwpeuejdgyjcwcymzjxt.supabase.co/functions/v1/reservation-create`.
5. The customer receives a magic link by email to pay the $200 refundable reservation deposit and complete onboarding.

## Pricing

See https://www.sfsaunarental.com/#pricing or `/service-desc.json` for the current OpenAPI description.

## Notes

- Deposits are $200 and fully refundable until the video consultation.
- Delivery is available throughout the SF Bay Area.
- Traditional saunas run 170–230°F; infrared saunas run ~150°F.