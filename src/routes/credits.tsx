import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Gem } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { DashboardLayout } from "@/components/dashboard-layout";

export const Route = createFileRoute("/credits")({
  component: CreditsPage,
});

function CreditsPage() {
  const { user } = useAuth();
  const [credits, setCredits] = useState(0);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("user_credits")
        .select("balance")
        .eq("user_id", user.id)
        .maybeSingle();
      setCredits(data?.balance ?? 0);
    })();
  }, [user]);

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-3xl">
        <h1 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
          Mes crédits
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          1 crédit = 1 CV ou 1 lettre de motivation générée.
        </p>

        <div className="mt-8 rounded-xl border border-border bg-card p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Gem className="h-6 w-6" />
          </div>
          <div className="mt-5 text-5xl font-extrabold text-primary">{credits}</div>
          <p className="mt-1 text-sm text-muted-foreground">crédits disponibles</p>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {[
              { credits: 5, price: "1 000 FCFA" },
              { credits: 15, price: "2 500 FCFA", best: true },
              { credits: 40, price: "5 000 FCFA" },
            ].map((p) => (
              <div
                key={p.credits}
                className={`rounded-xl border p-5 text-left shadow-sm ${
                  p.best ? "border-primary bg-primary/5" : "border-border bg-background"
                }`}
              >
                {p.best && (
                  <span className="inline-block rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold uppercase text-primary-foreground">
                    Populaire
                  </span>
                )}
                <div className="mt-2 text-2xl font-bold text-foreground">{p.credits} crédits</div>
                <div className="mt-1 text-sm text-muted-foreground">{p.price}</div>
                <button className="mt-4 w-full rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90">
                  Recharger
                </button>
              </div>
            ))}
          </div>

          <p className="mt-6 text-xs text-muted-foreground">
            Paiement bientôt disponible. <Link to="/dashboard" className="underline">Retour au tableau de bord</Link>
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}