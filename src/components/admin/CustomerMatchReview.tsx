export function CustomerMatchReview() {
  return (
    <section aria-label="Customer match review" className="rounded-xl border bg-card p-5">
      <h3 className="font-semibold">Review customer matches</h3>
      <p className="mt-3 font-medium" role="status">Waiting for data</p>
      <p className="mt-2 text-sm text-muted-foreground">
        Historical import has not been enabled. Every Xero-to-app match will need your approval,
        including exact email matches. You can select a different customer, defer a decision,
        or exclude a contact with a reason.
      </p>
      <p className="mt-2 text-sm text-muted-foreground">
        Xero customers missing from the app will be flagged for review. After you confirm they
        are customers, you can create a customer profile without creating a reservation or
        sending emails. Suppliers and other non-customers can be excluded.
      </p>
      <p className="mt-2 text-sm text-muted-foreground">
        No matches have been approved and no customer profiles have been created by this workflow.
      </p>
    </section>
  );
}
