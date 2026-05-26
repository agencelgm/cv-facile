import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Sparkles,
  FileText,
  Download,
  Check,
  Zap,
  Clock,
  CreditCard,
  ArrowRight,
  Users,
  Target,
  TrendingUp,
  Shield,
} from "lucide-react";

export const Route = createFileRoute("/")({
  component: Index,
});

function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-black/40 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link to="/" className="font-display text-xl font-bold text-white">
          CV<span className="text-gradient-animated">Facile</span>
        </Link>
        <nav className="flex items-center gap-2 sm:gap-4 text-sm">
          <Link
            to="/connexion"
            className="px-3 py-2 text-white/60 hover:text-white transition-colors"
          >
            Connexion
          </Link>
          <Link
            to="/inscription"
            className="rounded-xl bg-primary px-4 py-2 font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition-all hover:opacity-90 hover:-translate-y-px"
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
    <section className="relative overflow-hidden hero-gradient min-h-[92vh] flex items-center">
      {/* Animated gradient orbs */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="animate-orb-1 absolute -top-32 -left-32 h-[500px] w-[500px] rounded-full bg-[oklch(0.45_0.22_256)] opacity-25 blur-[120px]" />
        <div className="animate-orb-2 absolute top-1/3 -right-40 h-[420px] w-[420px] rounded-full bg-[oklch(0.38_0.18_280)] opacity-20 blur-[100px]" />
        <div className="animate-orb-3 absolute -bottom-24 left-1/3 h-[350px] w-[350px] rounded-full bg-[oklch(0.55_0.15_210)] opacity-15 blur-[90px]" />
        {/* Subtle dot grid */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(oklch(1 0 0 / 0.5) 1px, transparent 1px), linear-gradient(90deg, oklch(1 0 0 / 0.5) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      <div className="relative mx-auto max-w-5xl px-6 pt-24 pb-28 text-center">
        {/* Social proof pill */}
        <div className="animate-fade-up inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-4 py-1.5 text-xs font-semibold text-white/80 backdrop-blur-sm mb-8">
          <Users className="h-3.5 w-3.5 text-primary" />
          Rejoignez 5 000+ candidats
          <span className="ml-1 h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
        </div>

        {/* Headline */}
        <h1 className="animate-fade-up-1 font-display text-4xl font-extrabold tracking-tight text-white sm:text-6xl lg:text-7xl leading-[1.08]">
          Votre CV adapté à{" "}
          <span className="text-gradient-animated">chaque offre</span>
          {" "}en 60 secondes
        </h1>

        {/* Subtext */}
        <p className="animate-fade-up-2 mx-auto mt-6 max-w-2xl text-base text-white/60 sm:text-lg leading-relaxed">
          Collez l'offre d'emploi, notre IA identifie les mots-clés du recruteur
          et génère votre CV et lettre de motivation parfaitement adaptés.
        </p>

        {/* CTA row */}
        <div className="animate-fade-up-3 mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            to="/inscription"
            className="group inline-flex items-center gap-2 rounded-xl bg-primary px-7 py-3.5 text-base font-semibold text-primary-foreground shadow-2xl shadow-primary/40 transition-all hover:opacity-95 hover:-translate-y-0.5 hover:shadow-primary/60"
          >
            <Sparkles className="h-4 w-4 transition-transform group-hover:rotate-12" />
            Créer mon CV gratuitement
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <Link
            to="/connexion"
            className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/8 px-7 py-3.5 text-base font-semibold text-white/80 backdrop-blur-sm transition-all hover:bg-white/12 hover:text-white hover:border-white/30"
          >
            Déjà membre ? Se connecter
          </Link>
        </div>

        {/* Micro-stats */}
        <div className="animate-fade-up-3 mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-white/50">
          {[
            { Icon: Clock, text: "60 secondes" },
            { Icon: CreditCard, text: "4 crédits offerts" },
            { Icon: Shield, text: "Sans carte bancaire" },
          ].map(({ Icon, text }) => (
            <span key={text} className="flex items-center gap-1.5">
              <Icon className="h-3.5 w-3.5 text-primary/70" />
              {text}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function Stats() {
  const items = [
    { value: "5 000+", label: "CVs générés", Icon: FileText },
    { value: "3×", label: "plus d'entretiens", Icon: TrendingUp },
    { value: "7 sec", label: "pour convaincre un recruteur", Icon: Zap },
    { value: "100%", label: "personnalisé par IA", Icon: Target },
  ];

  return (
    <section className="border-y border-border bg-background py-16">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
          {items.map(({ value, label, Icon }) => (
            <div
              key={label}
              className="group flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-6 text-center shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <Icon className="h-5 w-5" />
              </div>
              <div className="font-display text-3xl font-extrabold text-foreground sm:text-4xl">
                {value}
              </div>
              <div className="text-xs font-medium text-muted-foreground leading-snug">
                {label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeaturesBento() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-24">
      <div className="mb-14 text-center">
        <h2 className="font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-5xl">
          Pourquoi CVFacile ?
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
          Tout ce dont vous avez besoin pour décrocher votre entretien.
        </p>
      </div>

      <div className="grid auto-rows-[minmax(140px,auto)] grid-cols-12 gap-4">
        {/* Card 1 — large left, 2 rows */}
        <div className="col-span-12 row-span-2 rounded-2xl border border-border bg-card p-8 shadow-sm transition-shadow hover:shadow-md lg:col-span-7">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/10">
            <Target className="h-6 w-6 text-destructive" />
          </div>
          <h3 className="mt-5 font-display text-2xl font-bold text-foreground">
            Adapté à chaque offre d'emploi
          </h3>
          <p className="mt-3 max-w-md text-muted-foreground leading-relaxed">
            Les recruteurs scannent votre CV en 7 secondes. Notre IA lit l'offre,
            extrait les mots-clés exacts et les insère intelligemment dans votre CV
            pour passer les filtres ATS automatiques.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {["Mots-clés ATS", "Adapté en temps réel", "Taux de réponse ×3"].map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-primary/20 bg-primary/8 px-3 py-1 text-xs font-semibold text-primary"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Card 2 — tall right, 2 rows */}
        <div className="col-span-12 row-span-2 rounded-2xl border border-primary/20 bg-primary/5 p-8 shadow-sm transition-shadow hover:shadow-md lg:col-span-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <h3 className="mt-5 font-display text-xl font-bold text-foreground">
            Génération en 60 secondes
          </h3>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
            Collez l'offre, cliquez. L'IA fait le reste : reformulation de vos
            expériences, bullet points percutants, lettre personnalisée.
          </p>
          <div className="mt-6 space-y-2.5">
            {[
              "Analyse de l'offre d'emploi",
              "Extraction des mots-clés",
              "Rédaction du CV sur mesure",
              "Génération de la lettre",
            ].map((step, i) => (
              <div key={step} className="flex items-center gap-3 text-xs">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                  {i + 1}
                </div>
                <span className="flex-1 truncate text-muted-foreground">{step}</span>
                <Check className="h-3.5 w-3.5 text-green-500 shrink-0" />
              </div>
            ))}
          </div>
        </div>

        {/* Card 3 */}
        <div className="col-span-12 rounded-2xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md sm:col-span-6 lg:col-span-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/10">
            <Download className="h-5 w-5 text-green-600" />
          </div>
          <h3 className="mt-4 font-display text-lg font-bold text-foreground">PDF prêt à l'envoi</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Téléchargez votre CV en PDF professionnel, formaté et prêt pour les recruteurs.
          </p>
        </div>

        {/* Card 4 */}
        <div className="col-span-12 rounded-2xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md sm:col-span-6 lg:col-span-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10">
            <FileText className="h-5 w-5 text-orange-600" />
          </div>
          <h3 className="mt-4 font-display text-lg font-bold text-foreground">Lettre de motivation</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Chaque lettre est unique, sur-mesure pour le poste et l'entreprise ciblée.
          </p>
        </div>

        {/* Card 5 */}
        <div className="col-span-12 rounded-2xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md sm:col-span-6 lg:col-span-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10">
            <Shield className="h-5 w-5 text-violet-600" />
          </div>
          <h3 className="mt-4 font-display text-lg font-bold text-foreground">Sans engagement</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            4 crédits offerts dès l'inscription. Pas de carte bancaire requise.
          </p>
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      n: "01",
      Icon: Users,
      title: "Créez votre compte",
      desc: "4 crédits offerts après vérification WhatsApp. Aucune carte bancaire.",
      color: "text-primary bg-primary/10",
    },
    {
      n: "02",
      Icon: FileText,
      title: "Collez l'offre d'emploi",
      desc: "Une simple copie-coller de l'annonce. L'IA s'occupe du reste.",
      color: "text-violet-600 bg-violet-500/10",
    },
    {
      n: "03",
      Icon: Sparkles,
      title: "Générez en 60 secondes",
      desc: "CV et lettre de motivation parfaitement alignés sur le poste.",
      color: "text-orange-600 bg-orange-500/10",
    },
    {
      n: "04",
      Icon: Download,
      title: "Téléchargez et postulez",
      desc: "PDF professionnel prêt à envoyer au recruteur.",
      color: "text-green-600 bg-green-500/10",
    },
  ];

  return (
    <section className="border-y border-border bg-muted/30 py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-16 text-center">
          <h2 className="font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-5xl">
            Comment ça marche
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Quatre étapes simples pour une candidature qui sort du lot.
          </p>
        </div>

        <div className="relative grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Horizontal connecting line (desktop only) */}
          <div
            aria-hidden
            className="absolute left-0 right-0 top-10 hidden h-px bg-gradient-to-r from-transparent via-border to-transparent lg:block"
          />

          {steps.map(({ n, Icon, title, desc, color }) => (
            <div key={n} className="relative flex flex-col items-center text-center">
              <div className="relative z-10 flex h-20 w-20 flex-col items-center justify-center rounded-2xl border border-border bg-card shadow-sm">
                <span className="font-display text-2xl font-extrabold text-foreground/20 leading-none">
                  {n}
                </span>
                <div className={`mt-1 flex h-7 w-7 items-center justify-center rounded-lg ${color}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <h3 className="mt-5 font-display text-lg font-bold text-foreground">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const testimonials = [
  {
    initials: "AM",
    name: "Awa M.",
    role: "Assistante RH, Abidjan",
    colorClass: "bg-primary text-primary-foreground",
    quote:
      "J'ai postulé à 5 offres en une journée avec des CV différents. J'ai eu 3 réponses la semaine suivante. Incroyable !",
  },
  {
    initials: "KD",
    name: "Kofi D.",
    role: "Ingénieur logiciel, Dakar",
    colorClass: "bg-violet-600 text-white",
    quote:
      "Avant je passais 2h sur chaque CV. Maintenant c'est 60 secondes et le résultat est bien meilleur. Je recommande à 100%.",
  },
  {
    initials: "FB",
    name: "Fatou B.",
    role: "Étudiante en master, Ouagadougou",
    colorClass: "bg-green-600 text-white",
    quote:
      "La lettre de motivation est vraiment personnalisée. Mon profil était parfaitement mis en valeur pour le poste.",
  },
];

function Testimonials() {
  return (
    <section className="bg-background py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-14 text-center">
          <h2 className="font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-5xl">
            Ils ont décroché leur entretien
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Des candidats comme vous qui ont fait confiance à CVFacile.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-3">
          {testimonials.map(({ initials, name, role, colorClass, quote }) => (
            <div
              key={name}
              className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-7 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex gap-0.5 text-yellow-400">
                {"★★★★★".split("").map((s, i) => (
                  <span key={i}>{s}</span>
                ))}
              </div>
              <p className="flex-1 text-sm text-muted-foreground leading-relaxed">
                "{quote}"
              </p>
              <div className="flex items-center gap-3 pt-2 border-t border-border">
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ${colorClass}`}
                >
                  {initials}
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground">{name}</div>
                  <div className="text-xs text-muted-foreground">{role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Pricing() {
  const features = [
    "1 CV professionnel = 1 crédit",
    "1 Lettre de motivation = 1 crédit",
    "Téléchargement PDF immédiat",
    "Adapté aux filtres ATS",
    "Sans engagement, sans abonnement",
  ];

  return (
    <section className="bg-muted/30 border-y border-border py-24">
      <div className="mx-auto max-w-2xl px-6 text-center">
        <h2 className="font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-5xl">
          Tarification simple
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-muted-foreground">
          Payez uniquement ce que vous utilisez. Commencez gratuitement.
        </p>

        {/* Gradient border card */}
        <div
          className="relative mt-12 rounded-3xl p-px shadow-2xl shadow-primary/10"
          style={{
            background:
              "linear-gradient(135deg, oklch(0.585 0.19 256 / 0.6), oklch(0.5 0.18 280 / 0.4), oklch(0.585 0.19 256 / 0.2))",
          }}
        >
          <div className="rounded-[calc(1.5rem-1px)] bg-card px-10 py-12">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-bold text-primary">
              <Sparkles className="h-3 w-3" />
              Offre de lancement
            </span>

            <div className="mt-6">
              <div className="font-display text-7xl font-extrabold text-gradient-animated">
                4
              </div>
              <div className="font-display text-2xl font-bold text-foreground -mt-1">
                crédits offerts
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                à l'inscription, sans carte bancaire
              </p>
            </div>

            <ul className="mt-10 space-y-3 text-left">
              {features.map((f) => (
                <li key={f} className="flex items-center gap-3 text-sm text-foreground">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15">
                    <Check className="h-3 w-3 text-primary" />
                  </div>
                  {f}
                </li>
              ))}
            </ul>

            <Link
              to="/inscription"
              className="group mt-10 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition-all hover:opacity-95 hover:-translate-y-0.5 hover:shadow-primary/50"
            >
              Commencer gratuitement
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function CTABanner() {
  return (
    <section className="relative overflow-hidden hero-gradient py-20">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 h-[300px] w-[600px] rounded-full bg-primary opacity-20 blur-[80px]" />
      </div>
      <div className="relative mx-auto max-w-3xl px-6 text-center">
        <h2 className="font-display text-3xl font-extrabold text-white sm:text-5xl">
          Prêt à décrocher votre prochain entretien ?
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-white/60">
          Rejoignez 5 000+ candidats qui utilisent CVFacile pour créer des CV
          sur mesure en 60 secondes.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            to="/inscription"
            className="group inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3.5 font-semibold text-gray-900 shadow-xl shadow-black/30 transition-all hover:-translate-y-0.5 hover:shadow-black/40"
          >
            <Sparkles className="h-4 w-4 text-primary transition-transform group-hover:rotate-12" />
            Créer mon CV gratuitement
          </Link>
          <Link
            to="/connexion"
            className="rounded-xl border border-white/20 px-8 py-3.5 font-semibold text-white/70 transition-all hover:border-white/40 hover:text-white"
          >
            Se connecter
          </Link>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <Link to="/" className="font-display text-xl font-bold text-foreground">
              CV<span className="text-primary">Facile</span>
            </Link>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              CV et lettres de motivation sur mesure générés par IA en 60 secondes.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-foreground mb-4">Produit</h4>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li>
                <Link to="/inscription" className="hover:text-foreground transition-colors">
                  Inscription gratuite
                </Link>
              </li>
              <li>
                <Link to="/connexion" className="hover:text-foreground transition-colors">
                  Connexion
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="hover:text-foreground transition-colors">
                  Tableau de bord
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-foreground mb-4">Fonctionnalités</h4>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li>Génération de CV IA</li>
              <li>Lettre de motivation IA</li>
              <li>Export PDF</li>
              <li>Adaptation aux offres ATS</li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-foreground mb-4">Informations</h4>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li>
                <Link to="/" className="hover:text-foreground transition-colors">
                  Accueil
                </Link>
              </li>
              <li>Mentions légales</li>
              <li>Confidentialité</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-border pt-8 text-xs text-muted-foreground sm:flex-row">
          <span>© {new Date().getFullYear()} CVFacile. Tous droits réservés.</span>
          <span>Fait avec ❤️ pour les candidats francophones</span>
        </div>
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
        <Stats />
        <FeaturesBento />
        <HowItWorks />
        <Testimonials />
        <Pricing />
        <CTABanner />
      </main>
      <Footer />
    </div>
  );
}
