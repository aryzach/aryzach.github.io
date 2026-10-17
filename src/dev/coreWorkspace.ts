import { emptyRentalWorkspace, type RentalWorkspace } from '@/lib/rentalModel';

export const storageKey = 'sf-sauna-core-records-preview-v1';
export function readWorkspace(): RentalWorkspace {
  // Local drafts only. No migration export or production records are bundled here.
  try {
    const stored = JSON.parse(sessionStorage.getItem(storageKey) || 'null');
    if (stored && ['customers', 'rentals', 'assets', 'assignments'].every(key => Array.isArray(stored[key]))) return stored;
  } catch { /* A fresh workspace is safe if tab storage is unavailable. */ }
  return emptyRentalWorkspace();
}
