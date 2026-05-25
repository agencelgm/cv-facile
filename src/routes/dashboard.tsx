import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
});

type Profile = {
  prenom: string; nom: string; email: string;
  telephone: string; whatsapp_verified: boolean;
};

function DashboardPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [credits, setCredits] = useState<number>(0);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/connexion" });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [p, c] = await Promise.all([
        supabase.from("user_profiles").select("prenom,nom,email,telephone,whatsapp_verified").eq("user_id", user.id).maybeSingle(),
        supabase.from("user_credits").select("balance").eq("user_id", user.id).maybeSingle(),
      ]);
      setProfile(p.data as Profile | null);
      setCredits(c.data?.balance ?? 0);
    })();
  }, [user]);

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
        Chargement…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="font-display text-xl font-bold">
            CV<span className="text-primary">Facile</span>
          </Link>
          <button
            onClick={signOut}
            className="rounded-xl border border-border px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted"
          >
            Déconnexion
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-12">
        <h1 className="text-3xl font-bold text-foreground">
          Bonjour {profile?.prenom ?? ""} 👋
        </h1>
        <p className="mt-1 text-muted-foreground">Bienvenue sur votre espace CVFacile.</p>

        <div className="mt-8 grid gap-6 md:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm md:col-span-2">
            <h2 className="text-lg font-bold text-foreground">Vos crédits</h2>
            <div className="mt-4 flex items-end gap-2">
              <span className="text-5xl font-extrabold text-primary">{credits}</span>
              <span className="mb-2 text-muted-foreground">crédits disponibles</span>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              1 crédit = 1 CV ou 1 lettre de motivation générée.
            </p>
            <button className="mt-6 rounded-xl bg-primary px-5 py-2.5 font-semibold text-primary-foreground shadow-sm transition hover:opacity-90">
              Créer un CV
            </button>
          </div>
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-bold text-foreground">Votre profil</h2>
            <dl className="mt-4 space-y-2 text-sm">
              <Row k="Nom" v={`${profile?.prenom ?? ""} ${profile?.nom ?? ""}`} />
              <Row k="Email" v={profile?.email ?? ""} />
              <Row k="WhatsApp" v={profile?.telephone ?? ""} />
              <Row
                k="Statut"
                v={profile?.whatsapp_verified ? "Vérifié ✓" : "Non vérifié"}
              />
            </dl>
          </div>
        </div>
      </main>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-muted-foreground">{k}</dt>
      <dd className="font-medium text-foreground text-right">{v}</dd>
    </div>
  );
}