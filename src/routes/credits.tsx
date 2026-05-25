import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Gem } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { DashboardLayout } from "@/components/dashboard-layout";
import { CreditPacks } from "@/components/credit-packs";

type Tx = {
  id: string;
  created_at: string;
  type: string;
  amount: number;
  description: string | null;
  balance_after: number;
};

export const Route = createFileRoute("/credits")({
  component: CreditsPage,
  validateSearch: (s: Record<string, unknown>) => ({
    status: typeof s.status === "string" ? (s.status as string) : undefined,
  }),
});

function CreditsPage() {
  const { user } = useAuth();
  const { status } = Route.useSearch();
  const [credits, setCredits] = useState(0);
  const [txs, setTxs] = useState<Tx[]>([]);

  useEffect(() => {
    if (status === "success") {
      toast.success("Paiement reçu ! Vos crédits seront disponibles dans quelques instants.");
    } else if (status === "cancel") {
      toast.error("Paiement annulé.");
    }
  }, [status]);

  useEffect(() => {
    if (!user) return;
    let active = true;
    const load = async () => {
      const [{ data: c }, { data: t }] = await Promise.all([
        supabase.from("user_credits").select("balance").eq("user_id", user.id).maybeSingle(),
        supabase
          .from("credit_transactions")
          .select("id, created_at, type, amount, description, balance_after")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(50),
      ]);
      if (!active) return;
      setCredits(c?.balance ?? 0);
      setTxs((t as Tx[]) ?? []);
    };
    load();
    // Poll briefly after a success to catch webhook crediting
    if (status === "success") {
      const interval = setInterval(load, 3000);
      setTimeout(() => clearInterval(interval), 30000);
      return () => {
        active = false;
        clearInterval(interval);
      };
    }
    return () => {
      active = false;
    };
  }, [user, status]);

  const fmtDate = (s: string) =>
    new Date(s).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" });

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-5xl">
        <h1 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
          Mes crédits
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          1 crédit = 1 CV ou 1 lettre de motivation
        </p>

        <div className="mt-6 rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Gem className="h-6 w-6" />
          </div>
          <div className="mt-4 text-5xl font-extrabold text-primary sm:text-6xl">
            💎 {credits}
          </div>
          <p className="mt-2 text-sm text-muted-foreground">crédits disponibles</p>
        </div>

        <div className="mt-10">
          <h2 className="font-display text-xl font-bold text-foreground">
            Recharger mon compte
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Paiement sécurisé via Chariow (Mobile Money, carte bancaire).
          </p>
          <div className="mt-4">
            <CreditPacks />
          </div>
        </div>

        <div className="mt-10">
          <h2 className="font-display text-xl font-bold text-foreground">
            Historique des transactions
          </h2>
          <div className="mt-4 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            {txs.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                Aucune transaction pour le moment.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-left text-xs font-semibold uppercase text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Action</th>
                      <th className="px-4 py-3 text-right">Crédits</th>
                      <th className="px-4 py-3 text-right">Solde</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {txs.map((tx) => (
                      <tr key={tx.id} className="text-foreground">
                        <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                          {fmtDate(tx.created_at)}
                        </td>
                        <td className="px-4 py-3">{tx.description ?? tx.type}</td>
                        <td
                          className={`px-4 py-3 text-right font-semibold ${
                            tx.amount > 0 ? "text-secondary" : "text-destructive"
                          }`}
                        >
                          {tx.amount > 0 ? "+" : ""}
                          {tx.amount}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold">
                          {tx.balance_after}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}