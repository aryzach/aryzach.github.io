/** Explicit field projection: never return raw Xero/database objects. */
type Row = Record<string, unknown>;
function row(value: unknown): Row {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Invalid source record");
  }
  return value as Row;
}
function fields(value: unknown, names: string[]): Row {
  const source = row(value);
  return Object.fromEntries(
    names.filter((name) => Object.hasOwn(source, name)).map((name) => {
      const value = source[name];
      if (
        value !== null &&
        !["string", "number", "boolean"].includes(typeof value)
      ) throw new Error("Invalid scalar");
      if (typeof value === "string" && value.length > 2048) {
        throw new Error("Field limit");
      }
      return [name, value];
    }),
  );
}
function list(value: unknown, limit: number): unknown[] {
  if (!Array.isArray(value) || value.length > limit) {
    throw new Error("Invalid or oversized list");
  }
  return value;
}
export function projectXero(resource: string, value: unknown): Row {
  const source = row(value);
  const result = fields(source, [
    "ContactID",
    "InvoiceID",
    "CreditNoteID",
    "PaymentID",
    "Date",
    "DateString",
    "Type",
    "Status",
    "CurrencyCode",
    "IsCustomer",
    "IsSupplier",
  ]);
  if (resource === "Contacts") {
    Object.assign(result, fields(source, ["Name", "EmailAddress"]));
  }
  if (source.Contact) result.Contact = fields(source.Contact, ["ContactID"]);
  if (source.Invoice) {
    result.Invoice = fields(source.Invoice, ["InvoiceID", "Type"]);
  }
  if (source.CreditNote) {
    result.CreditNote = fields(source.CreditNote, ["CreditNoteID", "Type"]);
  }
  if (source.LineItems !== undefined) {
    result.LineItems = list(source.LineItems, 200).map((item) => {
      const line = row(item);
      const projected = fields(line, ["LineItemID", "AccountCode"]);
      if (line.Tracking !== undefined) {
        projected.Tracking = list(line.Tracking, 4).map((tracking) =>
          fields(tracking, [
            "TrackingCategoryID",
            "TrackingOptionID",
            "Name",
            "Option",
          ])
        );
      }
      return projected;
    });
  }
  return result;
}
