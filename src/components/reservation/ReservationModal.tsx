import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ReservationForm, { type ReservationSource } from "./ReservationForm";

export type { ReservationSource };

interface Props {
  initialSaunaTypeId?: string;
  source: ReservationSource;
  onClose: () => void;
}

const ReservationModal = ({ initialSaunaTypeId, source, onClose }: Props) => (
  <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
    <DialogContent className="max-w-md max-h-[92vh] overflow-y-auto p-0 gap-0">
      <DialogHeader className="p-6 pb-3">
        <DialogTitle className="text-2xl font-semibold tracking-tight">
          Reserve your sauna
        </DialogTitle>
        <DialogDescription className="text-sm">
          A few quick details and we'll set aside your spot.
        </DialogDescription>
      </DialogHeader>
      <ReservationForm
        initialSaunaTypeId={initialSaunaTypeId}
        source={source}
        onDone={onClose}
        className="px-6 pb-6 space-y-4"
      />
    </DialogContent>
  </Dialog>
);

export default ReservationModal;
