import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { createPayment } from "@/lib/payments.functions";
import { toast } from "sonner";

type Compact = boolean;

export function CreditPacks({ compact = false }: { compact?: Compact }) {
  const buy = useServerFn(createPayment);
  const [loading, setLoading] = useState<string | null>(null);
  const [custom, setCustom] = useState<number>(1000);

  const handleBuy = async (
    payload: { pack: "starter" | "pro" | "premium" } | { custom_amount: number },
    key: string,
  ) => {
    setLoading(key);
    try {
      const res = await buy({ data: payload });
      window.location.href = res.checkout_url;
    } catch (e: any) {
      toast.error(e?.message ?? "Erreur lors de la création du paiement");
      setLoading(null);
    }
  };

  const customCredits = Math.floor(custom / 100);
  const padding = compact ? "p-4" : "p-5";
  const grid = compact
    ? "grid gap-3 sm:grid-cols-2"
    : "grid gap-4 md:grid-cols-2 lg:grid-cols-4";

  return (
    <div className={grid}>
      {/* Starter */}
      <div className={`relative rounded-xl border border-border bg-card ${padding} shadow-sm`}>
        <div className="text-sm font-semibold text-muted-foreground">Starter</div>
        <div className="mt-2 text-3xl font-extrabold text-foreground">10 crédits</div>
        <div className="mt-1 text-sm text-muted-foreground">1 000 FCFA</div>
        <button
          disabled={loading !== null}
          onClick={() => handleBuy({ pack: "starter" }, "starter")}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 disabled:opacity-60"
        >
          {loading === "starter" && <Loader2 className="h-4 w-4 animate-spin" />}
          Acheter
        </button>
      </div>

      {/* Pro */}
      <div className={`relative rounded-xl border-2 border-accent bg-card ${padding} shadow-md`}>
        <span className="absolute -top-3 left-4 rounded-full bg-accent px-3 py-1 text-[10px] font-bold uppercase text-white shadow">
          Populaire
        </span>
        <div className="text-sm font-semibold text-muted-foreground">Pro</div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-foreground">55 crédits</span>
        </div>
        <div className="mt-1 inline-block rounded-full bg-secondary/10 px-2 py-0.5 text-xs font-semibold text-secondary">
          🎁 +5 offerts
        </div>
        <div className="mt-2 text-sm text-muted-foreground">5 000 FCFA</div>
        <div className="text-xs text-muted-foreground">Soit 91 FCFA par crédit</div>
        <button
          disabled={loading !== null}
          onClick={() => handleBuy({ pack: "pro" }, "pro")}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 disabled:opacity-60"
        >
          {loading === "pro" && <Loader2 className="h-4 w-4 animate-spin" />}
          Acheter
        </button>
      </div>

      {/* Premium */}
      <div className={`relative rounded-xl border-2 border-primary bg-card ${padding} shadow-md`}>
        <div className="text-sm font-semibold text-muted-foreground">Premium</div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-foreground">120 crédits</span>
        </div>
        <div className="mt-1 inline-block rounded-full bg-secondary/10 px-2 py-0.5 text-xs font-semibold text-secondary">
          🎁 +20 offerts
        </div>
        <div className="mt-2 text-sm text-muted-foreground">10 000 FCFA</div>
        <div className="text-xs text-muted-foreground">Soit 83 FCFA par crédit</div>
        <button
          disabled={loading !== null}
          onClick={() => handleBuy({ pack: "premium" }, "premium")}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 disabled:opacity-60"
        >
          {loading === "premium" && <Loader2 className="h-4 w-4 animate-spin" />}
          Acheter
        </button>
      </div>

      {/* Custom */}
      <div className={`relative rounded-xl border border-border bg-card ${padding} shadow-sm`}>
        <div className="text-sm font-semibold text-muted-foreground">Personnalisé</div>
        <div className="mt-2">
          <label className="block text-xs text-muted-foreground">Montant (FCFA)</label>
          <input
            type="number"
            min={1000}
            step={500}
            value={custom}
            onChange={(e) => setCustom(Math.max(0, Number(e.target.value) || 0))}
            className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="mt-2 text-sm text-foreground">
          = <span className="font-bold text-primary">{customCredits}</span> crédit{customCredits > 1 ? "s" : ""}
        </div>
        <div className="text-xs text-muted-foreground">Minimum 1 000 FCFA</div>
        <button
          disabled={loading !== null || custom < 1000}
          onClick={() => handleBuy({ custom_amount: custom }, "custom")}
          className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 disabled:opacity-60"
        >
          {loading === "custom" && <Loader2 className="h-4 w-4 animate-spin" />}
          Acheter
        </button>
      </div>
    </div>
  );
}
