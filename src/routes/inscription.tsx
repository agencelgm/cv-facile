import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { sendOtp, verifyOtp } from "@/lib/otp.functions";

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
  const [step, setStep] = useState<1 | 2>(1);
  const [prenom, setPrenom] = useState("");
  const [telephone, setTelephone] = useState("");
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
        {step === 1 ? (
          <Step1
            onDone={(p, t) => {
              setPrenom(p);
              setTelephone(t);
              setStep(2);
            }}
          />
        ) : (
          <Step2 prenom={prenom} telephone={telephone} />
        )}
      </main>
    </div>
  );
}

function Step1({ onDone }: { onDone: (prenom: string, tel: string) => void }) {
  const sendOtpFn = useServerFn(sendOtp);
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
    try {
      await sendOtpFn({ data: { prenom, telephone } });
      onDone(prenom, telephone);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur d'envoi du code.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-lg rounded-xl border border-border bg-card p-8 shadow-sm">
      <Steps current={1} />
      <h1 className="mt-6 text-2xl font-bold text-foreground">Créez votre compte</h1>
      <p className="mt-1 text-sm text-muted-foreground">4 crédits offerts après vérification WhatsApp.</p>
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
          {loading ? "Création…" : "Continuer"}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Déjà un compte ?{" "}
        <Link to="/connexion" className="font-semibold text-primary hover:underline">Se connecter</Link>
      </p>
    </div>
  );
}

function Step2({ prenom, telephone }: { prenom: string; telephone: string }) {
  const navigate = useNavigate();
  const sendOtpFn = useServerFn(sendOtp);
  const verifyOtpFn = useServerFn(verifyOtp);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [remaining, setRemaining] = useState(600); // 10 min
  const [resendIn, setResendIn] = useState(60);
  const tick = useRef<number | null>(null);

  useEffect(() => {
    tick.current = window.setInterval(() => {
      setRemaining((r) => Math.max(0, r - 1));
      setResendIn((r) => Math.max(0, r - 1));
    }, 1000);
    return () => {
      if (tick.current) window.clearInterval(tick.current);
    };
  }, []);

  const fmt = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const onVerify = async (e: FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) return;
    setError(null);
    setLoading(true);
    try {
      await verifyOtpFn({ data: { code } });
      navigate({ to: "/dashboard" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Code invalide.");
    } finally {
      setLoading(false);
    }
  };

  const onResend = async () => {
    if (resendIn > 0) return;
    setError(null);
    setInfo(null);
    try {
      await sendOtpFn({ data: { prenom, telephone } });
      setRemaining(600);
      setResendIn(60);
      setInfo("Nouveau code envoyé sur WhatsApp.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Échec de l'envoi.");
    }
  };

  return (
    <div className="w-full max-w-lg rounded-xl border border-border bg-card p-8 shadow-sm">
      <Steps current={2} />
      <h1 className="mt-6 text-2xl font-bold text-foreground">Vérification WhatsApp</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Entrez le code à 6 chiffres reçu sur WhatsApp au <span className="font-semibold text-foreground">{telephone}</span>.
      </p>
      <form onSubmit={onVerify} className="mt-6 space-y-4">
        <input
          inputMode="numeric"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          className="w-full rounded-xl border border-input bg-background py-4 text-center font-display text-3xl tracking-[0.5em] outline-none focus:ring-2 ring-primary/30"
          placeholder="••••••"
          required
        />
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Expire dans <span className="font-semibold text-foreground">{fmt(remaining)}</span></span>
          <button
            type="button"
            onClick={onResend}
            disabled={resendIn > 0}
            className="font-semibold text-primary disabled:text-muted-foreground"
          >
            {resendIn > 0 ? `Renvoyer dans ${resendIn}s` : "Renvoyer le code"}
          </button>
        </div>
        {info && <p className="text-sm text-success">{info}</p>}
        {error && <p className="text-sm text-destructive">{error}</p>}
        <button
          type="submit"
          disabled={loading || code.length !== 6 || remaining === 0}
          className="w-full rounded-xl bg-primary py-3 font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 disabled:opacity-60"
        >
          {loading ? "Vérification…" : "Vérifier"}
        </button>
      </form>
    </div>
  );
}

function Steps({ current }: { current: 1 | 2 }) {
  return (
    <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-wide">
      <span className={current === 1 ? "text-primary" : "text-success"}>1 · Compte</span>
      <span className="h-px flex-1 bg-border" />
      <span className={current === 2 ? "text-primary" : "text-muted-foreground"}>2 · WhatsApp</span>
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