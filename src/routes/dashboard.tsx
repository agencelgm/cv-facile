import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { FileText, Plus, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { DashboardLayout } from "@/components/dashboard-layout";

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
});

type Application = {
  id: string;
  poste: string;
  entreprise: string | null;
  status: string;
  created_at: string;
};

function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [apps, setApps] = useState<Application[] | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: profile }, { data: appData }] = await Promise.all([
        supabase.from("user_profiles").select("onboarding_completed").eq("user_id", user.id).maybeSingle(),
        supabase.from("applications").select("id,poste,entreprise,status,created_at").eq("user_id", user.id).order("created_at", { ascending: false }),
      ]);
      if (profile && !profile.onboarding_completed) {
        navigate({ to: "/onboarding" });
        return;
      }
      setApps((appData as Application[]) ?? []);
    })();
  }, [user, navigate]);

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
              Mes candidatures
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Retrouvez ici toutes les candidatures que vous avez générées.
            </p>
          </div>
          <Link
            to="/nouvelle-candidature"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            Nouvelle candidature
          </Link>
        </div>

        <section className="mt-6">
          {apps === null ? (
            <div className="rounded-xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
              Chargement…
            </div>
          ) : apps.length === 0 ? (
            <EmptyState />
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2">
              {apps.map((a) => (
                <li
                  key={a.id}
                  className="rounded-xl border border-border bg-card p-5 shadow-sm transition hover:shadow-md"
                >
                  <div className="flex items-start gap-3">
                    <div className="rounded-lg bg-primary/10 p-2 text-primary">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-semibold text-foreground">{a.poste}</h3>
                      {a.entreprise && (
                        <p className="truncate text-sm text-muted-foreground">{a.entreprise}</p>
                      )}
                      <p className="mt-2 text-xs text-muted-foreground">
                        {new Date(a.created_at).toLocaleDateString("fr-FR", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}

function EmptyState() {
  return (
    <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center shadow-sm">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Sparkles className="h-7 w-7" />
      </div>
      <h3 className="mt-4 font-display text-lg font-bold text-foreground">
        Vous n'avez pas encore généré de candidature
      </h3>
      <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
        Commencez par créer votre première candidature. Notre IA s'occupe du reste.
      </p>
      <Link
        to="/nouvelle-candidature"
        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90"
      >
        <Plus className="h-4 w-4" />
        Commencer
      </Link>
    </div>
  );
}