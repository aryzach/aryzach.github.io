# Check Sauna Rental Pricing

Look up current monthly rental pricing for SF Sauna Rental.

## When to use

Use this skill when the user asks how much a sauna rental costs, wants to compare terms, or wants to know what add-ons are available.

## Steps

1. Fetch pricing from the OpenAPI service description at `https://www.sfsaunarental.com/service-desc.json`, or read the homepage pricing section at `https://www.sfsaunarental.com/#pricing`.
2. Present the monthly price for the requested sauna type across 1, 3, 6, and 12 month terms.
3. Mention available add-ons: Insurance ($20/mo) and Second Heater ($200/mo, traditional saunas only).

## Notes

- Pricing is monthly and stored in the SF Sauna Rental pricing catalog.
- The reservation deposit is a flat $200, separate from monthly rent.
- 50% of rental payments can be applied toward buyout at end of lease.