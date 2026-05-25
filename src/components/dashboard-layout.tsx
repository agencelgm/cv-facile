import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import {
  LayoutDashboard,
  FilePlus,
  User as UserIcon,
  Gem,
  LogOut,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

const nav = [
  { to: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { to: "/nouvelle-candidature", label: "Nouvelle candidature", icon: FilePlus },
  { to: "/profil", label: "Profil", icon: UserIcon },
  { to: "/credits", label: "Crédits", icon: Gem },
] as const;

export function DashboardLayout({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [prenom, setPrenom] = useState<string>("");
  const [credits, setCredits] = useState<number>(0);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/connexion" });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    let active = true;
    (async () => {
      const [p, c] = await Promise.all([
        supabase.from("user_profiles").select("prenom").eq("user_id", user.id).maybeSingle(),
        supabase.from("user_credits").select("balance").eq("user_id", user.id).maybeSingle(),
      ]);
      if (!active) return;
      setPrenom((p.data?.prenom as string) ?? "");
      setCredits(c.data?.balance ?? 0);
    })();
    return () => {
      active = false;
    };
  }, [user, pathname]);

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

  const lowCredits = credits === 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-border bg-card md:flex">
        <Link to="/dashboard" className="flex h-16 items-center px-6 font-display text-xl font-bold">
          CV<span className="text-primary">Facile</span>
        </Link>
        <nav className="flex-1 space-y-1 px-3 py-4">
          {nav.map((item) => {
            const active = pathname === item.to;
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <button
          onClick={signOut}
          className="m-3 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
        >
          <LogOut className="h-4 w-4" />
          Déconnexion
        </button>
      </aside>

      {/* Main */}
      <div className="md:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-border bg-background/85 px-4 backdrop-blur md:px-8">
          <h2 className="truncate text-base font-semibold text-foreground sm:text-lg">
            Bonjour {prenom || ""} <span aria-hidden>👋</span>
          </h2>
          <Link
            to="/credits"
            className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold shadow-sm transition ${
              lowCredits
                ? "bg-destructive/10 text-destructive hover:bg-destructive/15"
                : "bg-primary/10 text-primary hover:bg-primary/15"
            }`}
          >
            <span aria-hidden>💎</span>
            <span>{credits} crédits</span>
            {lowCredits && <span className="ml-1 font-bold">· Recharger</span>}
          </Link>
        </header>
        <main className="px-4 py-6 pb-24 md:px-8 md:pb-10">{children}</main>
      </div>

      {/* Mobile bottom bar */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-border bg-card/95 backdrop-blur md:hidden">
        {nav.map((item) => {
          const active = pathname === item.to;
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition ${
                active ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="truncate">{item.label.split(" ")[0]}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}