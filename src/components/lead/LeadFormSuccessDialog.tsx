import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ExternalLink } from "lucide-react";
import { getStripeReservationConfig } from "@/lib/reservationConfig";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Shown after any site lead form is submitted. */
const LeadFormSuccessDialog = ({ open, onOpenChange }: Props) => {
  const [link, setLink] = useState<string | null>(null);

  useEffect(() => {
    if (!open || link) return;
    let cancelled = false;
    getStripeReservationConfig()
      .then(({ baseLink }) => {
        if (!cancelled) setLink(baseLink);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [open, link]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <CheckCircle2 className="text-primary mb-1" size={40} />
          <DialogTitle className="text-left">Thanks, we'll be in touch shortly.</DialogTitle>
          <DialogDescription className="text-left">
            If you'd like to reserve a sauna, lock-in your sauna with a refundable reservation
            deposit and we'll set one aside for you.
          </DialogDescription>
        </DialogHeader>
        <Button
          size="lg"
          className="w-full"
          disabled={!link}
          onClick={() => {
            if (link) window.open(link, "_blank", "noopener,noreferrer");
          }}
        >
          Pay $200 Reservation Deposit
          <ExternalLink className="ml-2" size={16} />
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default LeadFormSuccessDialog;