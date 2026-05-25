import { createFileRoute, Link } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard-layout";
import { FilePlus } from "lucide-react";

export const Route = createFileRoute("/nouvelle-candidature")({
  component: NouvelleCandidaturePage,
});

function NouvelleCandidaturePage() {
  return (
    <DashboardLayout>
      <div className="mx-auto max-w-3xl">
        <h1 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
          Nouvelle candidature
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Collez l'offre d'emploi pour générer votre CV et votre lettre de motivation.
        </p>

        <div className="mt-8 rounded-xl border border-dashed border-border bg-card p-10 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <FilePlus className="h-6 w-6" />
          </div>
          <h2 className="mt-4 font-display text-lg font-bold text-foreground">
            Bientôt disponible
          </h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
            La génération automatique de candidature arrive très bientôt. En attendant, complétez votre profil.
          </p>
          <Link
            to="/profil"
            className="mt-6 inline-block rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90"
          >
            Compléter mon profil
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
}