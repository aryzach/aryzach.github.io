import { useState } from 'react';
import { RentalAgreementSheet } from '@/components/contract/RentalAgreementSheet';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
export default function AgreementPreview() {
  const legacy = new URLSearchParams(location.search).has('legacy');
  const [open, setOpen] = useState(true);
  return <><Header/><main className="container mx-auto max-w-3xl px-5 pt-32 space-y-4"><h1 className="text-2xl font-semibold">Rental agreement preview</h1><p className="text-muted-foreground">Explore the form for a future booking using example details. Drafts stay in this tab; no reservation, signature or payment is submitted. Existing bookings keep their original terms.</p><Button onClick={() => setOpen(true)}>Configure Your Rental Agreement</Button></main><RentalAgreementSheet open={open} onOpenChange={setOpen} reservationId="preview-only" token="" previewOnly previewBookingVersion={legacy ? 1 : 2} /></>;
}
