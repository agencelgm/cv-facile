import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/inscription")({
  component: InscriptionPage,
});

const COUNTRIES = [
  { code: "+225", label: "🇨🇮 Côte d'Ivoire" },
  { code: "+226", label: "🇧🇫 Burkina Faso" },
  { code: "+229", label: "🇧🇯 Bénin" },
  { code: "+228", label: "🇹🇬 Togo" },
  { code: "+221", label: "🇸🇳 Sénégal" },
  { code: "+223", label: "🇲🇱 Mali" },
  { code: "+224", label: "🇬🇳 Guinée" },
  { code: "+237", label: "🇨🇲 Cameroun" },
];

function InscriptionPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-6xl px-6 py-4">
          <Link to="/" className="font-display text-xl font-bold">
            CV<span className="text-primary">Facile</span>
          </Link>
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center px-6 py-12">
        <Step1 />
      </main>
    </div>
  );
}

function Step1() {
  const navigate = useNavigate();
  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [pwd2, setPwd2] = useState("");
  const [indicatif, setIndicatif] = useState("+225");
  const [tel, setTel] = useState("");
  const [accept, setAccept] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (pwd.length < 8) return setError("Le mot de passe doit faire 8 caractères minimum.");
    if (pwd !== pwd2) return setError("Les mots de passe ne correspondent pas.");
    if (!accept) return setError("Veuillez accepter les conditions d'utilisation.");
    const telephone = indicatif + tel.replace(/\D/g, "");
    setLoading(true);
    const { error: signErr } = await supabase.auth.signUp({
      email,
      password: pwd,
      options: { data: { prenom, nom, telephone } },
    });
    if (signErr) {
      setLoading(false);
      setError(signErr.message);
      return;
    }
    setLoading(false);
    navigate({ to: "/onboarding" });
  };

  return (
    <div className="w-full max-w-lg rounded-xl border border-border bg-card p-8 shadow-sm">
      <h1 className="text-2xl font-bold text-foreground">Créez votre compte</h1>
      <p className="mt-1 text-sm text-muted-foreground">4 crédits offerts à l'inscription.</p>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Prénom" value={prenom} onChange={setPrenom} required />
          <Field label="Nom" value={nom} onChange={setNom} required />
        </div>
        <Field label="Email" type="email" value={email} onChange={setEmail} required />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Mot de passe" type="password" value={pwd} onChange={setPwd} required />
          <Field label="Confirmation" type="password" value={pwd2} onChange={setPwd2} required />
        </div>
        <div>
          <span className="mb-1 block text-sm font-medium text-foreground">Numéro WhatsApp</span>
          <div className="flex gap-2">
            <select
              value={indicatif}
              onChange={(e) => setIndicatif(e.target.value)}
              className="rounded-xl border border-input bg-background px-3 py-2.5 text-foreground outline-none focus:ring-2 ring-primary/30"
            >
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>{c.code} {c.label}</option>
              ))}
            </select>
            <input
              type="tel"
              value={tel}
              onChange={(e) => setTel(e.target.value)}
              required
              placeholder="07 00 00 00 00"
              className="flex-1 rounded-xl border border-input bg-background px-4 py-2.5 text-foreground outline-none focus:ring-2 ring-primary/30"
            />
          </div>
        </div>
        <label className="flex items-start gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={accept}
            onChange={(e) => setAccept(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-input accent-primary"
          />
          <span>J'accepte les conditions d'utilisation de CVFacile.</span>
        </label>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-primary py-3 font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 disabled:opacity-60"
        >
          {loading ? "Création…" : "Créer mon compte"}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Déjà un compte ?{" "}
        <Link to="/connexion" className="font-semibold text-primary hover:underline">Se connecter</Link>
      </p>
    </div>
  );
}

function Field({
  label, type = "text", value, onChange, required,
}: {
  label: string; type?: string; value: string;
  onChange: (v: string) => void; required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-foreground">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-foreground outline-none focus:ring-2 ring-primary/30"
      />
    </label>
  );
}