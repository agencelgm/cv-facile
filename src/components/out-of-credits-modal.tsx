import { X } from "lucide-react";
import { CreditPacks } from "./credit-packs";

export function OutOfCreditsModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-3xl rounded-2xl bg-background p-6 shadow-2xl">
        <button
          onClick={onClose}
          aria-label="Fermer"
          className="absolute right-4 top-4 rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </button>
        <h2 className="font-display text-xl font-bold text-foreground sm:text-2xl">
          💎 Plus de crédits pour continuer
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Rechargez votre solde pour générer un CV ou une lettre de motivation.
        </p>
        <div className="mt-5">
          <CreditPacks compact />
        </div>
      </div>
    </div>
  );
}
