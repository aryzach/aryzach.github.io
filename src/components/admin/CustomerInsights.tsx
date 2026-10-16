import { XeroConnection } from "./XeroConnection";
import { useState } from "react";
import { Search, Users, Receipt, TrendingUp, ArrowUpRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

function Waiting({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="rounded-xl border bg-card p-6" data-waiting-for-data>
      <h3 className="font-semibold">{title}</h3>
      <p
        className="mt-4 text-lg font-medium text-muted-foreground"
        role="status"
      >
        Waiting for data
      </p>
      <p className="mt-2 text-sm text-muted-foreground">{detail}</p>
    </div>
  );
}

export function CustomerInsights({ password }: { password: string }) {
  const [view, setView] = useState<"customers" | "cohorts" | "definitions">(
    "customers",
  );
  const metrics = [
    {
      title: "Realized revenue LTV",
      detail: "Verified revenue, credits and customer identity are required.",
      icon: Users,
    },
    {
      title: "Contribution",
      detail: "Verified revenue and variable costs are required.",
      icon: TrendingUp,
    },
    {
      title: "CAC",
      detail:
        "Acquisition spend and first-installation attribution are required.",
      icon: ArrowUpRight,
    },
    {
      title: "Rental collections",
      detail: "Reconciled rental receipts and refunds are required.",
      icon: Receipt,
    },
  ];
  return (
    <section className="space-y-6 py-4" aria-label="Customer insights">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Customer intelligence
        </p>
        <h2 className="mt-2 text-3xl font-semibold">Customer insights</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Only verified data will appear here. Customer and financial history
          has not yet been loaded into this dashboard.
        </p>
      </div>
      <XeroConnection password={password} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(({ title, detail, icon: Icon }) => (
          <div
            key={title}
            className="rounded-xl border bg-card p-5"
            data-waiting-for-data
          >
            <div className="flex justify-between text-sm text-muted-foreground">
              {title}
              <Icon size={17} />
            </div>
            <p className="my-3 text-xl font-semibold" role="status">
              Waiting for data
            </p>
            <p className="text-xs text-muted-foreground">{detail}</p>
          </div>
        ))}
      </div>
      <Waiting
        title="Rental revenue, collections and refunds"
        detail="Waiting for verified invoice service periods, credit notes and payment history. No estimated chart is shown."
      />
      <div className="flex gap-2 border-b pb-3">
        {(["customers", "cohorts", "definitions"] as const).map((key) => (
          <Button
            key={key}
            variant={view === key ? "default" : "ghost"}
            onClick={() => setView(key)}
          >
            {key === "customers"
              ? "Customer histories"
              : key === "cohorts"
                ? "Retention & payback"
                : "Metric definitions"}
          </Button>
        ))}
      </div>
      {view === "customers" && (
        <div className="grid gap-5 lg:grid-cols-[340px_minmax(0,1fr)]">
          <div className="rounded-xl border bg-card p-5">
            <label className="relative block">
              <Search
                size={16}
                className="absolute left-3 top-3 text-muted-foreground"
              />
              <Input
                aria-label="Search customer histories"
                placeholder="Waiting for data"
                disabled
                className="pl-9"
              />
            </label>
            <p className="mt-4 text-sm text-muted-foreground" role="status">
              Waiting for data
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              Customer history will appear after verified records are loaded.
              Existing operational records have not been changed.
            </p>
          </div>
          <Waiting
            title="Customer timeline"
            detail="Waiting for matched customer, installation, contract and transaction history."
          />
        </div>
      )}
      {view === "cohorts" && (
        <div className="grid gap-5 md:grid-cols-2">
          <Waiting
            title="Rental retention"
            detail="Waiting for first installations and rental end dates."
          />
          <Waiting
            title="LTV and CAC over time"
            detail="Waiting for verified customer revenue, acquisition dates and acquisition spend."
          />
          <Waiting
            title="Acquisition payback"
            detail="Waiting for acquisition costs and cumulative customer contribution."
          />
        </div>
      )}
      {view === "definitions" && (
        <div className="grid gap-4 md:grid-cols-2">
          {[
            [
              "Customer",
              "A first installed rental customer, counted once across renewals. Leads are excluded. Household matching still needs confirmation.",
            ],
            [
              "Realized revenue LTV",
              "Earned rental, delivery and sale revenue less credits, divided by installed customers. Refundable deposits and taxes are excluded. This is historical revenue, not predicted value or profit.",
            ],
            [
              "Contribution",
              "Verified earned revenue less verified variable costs. Missing costs will not be replaced by assumptions.",
            ],
            [
              "CAC",
              "Verified acquisition spend divided by first installations in the same reporting period, using an agreed attribution definition. Missing spend does not mean zero CAC.",
            ],
            [
              "Revenue and cash",
              "Invoices and credits establish earned revenue. Receipts and refunds establish cash. Matching Stripe and Xero records must count each payment once.",
            ],
            [
              "Payback and retention",
              "Payback needs acquisition costs and cumulative contribution. Rental retention needs installation and rental-end history. No forecasts or sample cohorts are shown.",
            ],
          ].map(([title, detail]) => (
            <div key={title} className="rounded-xl border bg-card p-5">
              <h3 className="font-semibold">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{detail}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
