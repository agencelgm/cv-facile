import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Index,
});

function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link to="/" className="font-display text-xl font-bold text-foreground">
          CV<span className="text-primary">Facile</span>
        </Link>
        <nav className="flex items-center gap-2 sm:gap-4 text-sm">
          <Link to="/connexion" className="px-3 py-2 text-muted-foreground hover:text-foreground">
            Connexion
          </Link>
          <Link
            to="/inscription"
            className="rounded-xl bg-primary px-4 py-2 font-semibold text-primary-foreground shadow-sm transition hover:opacity-90"
          >
            Inscription
          </Link>
        </nav>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[radial-gradient(60%_60%_at_50%_0%,oklch(0.94_0.06_256)_0%,transparent_70%)]"
      />
      <div className="mx-auto max-w-5xl px-6 pt-20 pb-24 text-center">
        <span className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
          Nouveau · IA pour candidats
        </span>
        <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-foreground sm:text-6xl">
          Créez un CV professionnel adapté à chaque offre d'emploi
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          Collez l'offre d'emploi, notre IA génère votre CV et votre lettre de
          motivation en 60 secondes.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            to="/inscription"
            className="rounded-xl bg-primary px-6 py-3 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition hover:opacity-90"
          >
            Créer mon CV gratuitement
          </Link>
          <span className="text-sm text-muted-foreground">4 crédits offerts · sans carte bancaire</span>
        </div>
      </div>
    </section>
  );
}

function ProblemSolution() {
  const items = [
    {
      title: "Le problème",
      body: "Les recruteurs scannent les CV en 7 secondes. Un CV générique finit ignoré, même avec une expérience solide.",
      tone: "bg-destructive/5 border-destructive/20 text-destructive",
      label: "Avant",
    },
    {
      title: "La solution",
      body: "CVFacile lit l'offre d'emploi, identifie les mots-clés du recruteur et adapte votre CV en quelques secondes.",
      tone: "bg-success/5 border-success/20 text-success",
      label: "Avec CVFacile",
    },
    {
      title: "Le résultat",
      body: "Un CV et une lettre alignés sur chaque offre. Plus de réponses, plus d'entretiens, moins de stress.",
      tone: "bg-accent/10 border-accent/30 text-accent-foreground",
      label: "Après",
    },
  ];
  return (
    <section className="mx-auto max-w-6xl px-6 py-20">
      <div className="grid gap-6 md:grid-cols-3">
        {items.map((it) => (
          <div
            key={it.title}
            className="rounded-xl border border-border bg-card p-6 shadow-sm"
          >
            <span className={`inline-block rounded-full border px-3 py-1 text-xs font-semibold ${it.tone}`}>
              {it.label}
            </span>
            <h3 className="mt-4 text-xl font-bold text-foreground">{it.title}</h3>
            <p className="mt-2 text-muted-foreground">{it.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { t: "Créez votre compte", d: "4 crédits offerts immédiatement après vérification WhatsApp." },
    { t: "Collez l'offre d'emploi", d: "Une simple copie-coller suffit, l'IA s'occupe du reste." },
    { t: "Générez en 60 secondes", d: "CV et lettre de motivation parfaitement adaptés." },
    { t: "Téléchargez et postulez", d: "Format PDF prêt à envoyer au recruteur." },
  ];
  return (
    <section className="bg-muted/40 border-y border-border">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="text-center text-3xl font-bold text-foreground sm:text-4xl">
          Comment ça marche
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-muted-foreground">
          Quatre étapes simples pour une candidature qui sort du lot.
        </p>
        <ol className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <li
              key={s.t}
              className="rounded-xl border border-border bg-card p-6 shadow-sm"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground">
                {i + 1}
              </div>
              <h3 className="mt-4 text-lg font-bold text-foreground">{s.t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.d}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function Pricing() {
  return (
    <section className="mx-auto max-w-3xl px-6 py-20 text-center">
      <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
        Une tarification simple
      </h2>
      <div className="mt-10 rounded-xl border border-border bg-card p-10 shadow-sm">
        <div className="text-5xl font-extrabold text-primary">4 crédits</div>
        <p className="mt-2 text-muted-foreground">offerts à l'inscription</p>
        <div className="mx-auto mt-8 max-w-sm border-t border-border pt-6 text-sm text-muted-foreground">
          <div className="flex items-center justify-between py-2">
            <span>1 CV</span><span className="font-semibold text-foreground">1 crédit</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span>1 Lettre de motivation</span><span className="font-semibold text-foreground">1 crédit</span>
          </div>
        </div>
        <Link
          to="/inscription"
          className="mt-8 inline-block rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition hover:opacity-90"
        >
          Commencer gratuitement
        </Link>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 text-sm text-muted-foreground sm:flex-row">
        <div className="font-display font-bold text-foreground">
          CV<span className="text-primary">Facile</span>
        </div>
        <nav className="flex gap-6">
          <Link to="/" className="hover:text-foreground">Accueil</Link>
          <Link to="/connexion" className="hover:text-foreground">Connexion</Link>
          <Link to="/inscription" className="hover:text-foreground">Inscription</Link>
        </nav>
        <div>© {new Date().getFullYear()} CVFacile</div>
      </div>
    </footer>
  );
}

function Index() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <Hero />
        <ProblemSolution />
        <HowItWorks />
        <Pricing />
      </main>
      <Footer />
    </div>
  );
}
