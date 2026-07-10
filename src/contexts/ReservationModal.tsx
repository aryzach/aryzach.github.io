import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import ReservationModal, { type ReservationSource } from "@/components/reservation/ReservationModal";

interface OpenOptions {
  saunaTypeId?: string;
  source?: ReservationSource;
}

interface Ctx {
  open: (opts?: OpenOptions) => void;
  close: () => void;
}

const ReservationModalCtx = createContext<Ctx | null>(null);

export function ReservationModalProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{ open: boolean; saunaTypeId?: string; source: ReservationSource }>({
    open: false,
    source: "Unknown",
  });

  const open = useCallback((opts?: OpenOptions) => {
    setState({ open: true, saunaTypeId: opts?.saunaTypeId, source: opts?.source ?? "Direct Link" });
  }, []);
  const close = useCallback(() => setState((s) => ({ ...s, open: false })), []);

  return (
    <ReservationModalCtx.Provider value={{ open, close }}>
      {children}
      {state.open && (
        <ReservationModal
          initialSaunaTypeId={state.saunaTypeId}
          source={state.source}
          onClose={close}
        />
      )}
    </ReservationModalCtx.Provider>
  );
}

export function useReservationModal(): Ctx {
  const ctx = useContext(ReservationModalCtx);
  if (!ctx) throw new Error("useReservationModal must be used inside ReservationModalProvider");
  return ctx;
}