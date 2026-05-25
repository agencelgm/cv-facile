import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState, type ReactElement } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  Upload, FileText, Check, Loader2, ArrowRight, ArrowLeft, Sparkles,
  Download, RotateCcw, AlertTriangle, User as UserIcon,
} from "lucide-react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { OutOfCreditsModal } from "@/components/out-of-credits-modal";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { parseCvFile } from "@/lib/cv-parser";
import {
  extractProfileFromText, generateCandidatureContent, saveApplication,
} from "@/lib/candidature.functions";
import {
  generateCvPdf, generateLetterPdf,
  type CandidateInfo, type Template, type CvData,
} from "@/lib/pdf-generator";

export const Route = createFileRoute("/nouvelle-candidature")({
  component: NouvelleCandidaturePage,
});

type Profile = {
  prenom: string; nom: string; email: string; telephone: string;
  titre_professionnel: string | null; resume: string | null;
  ville: string | null; pays: string | null; photo_url: string | null;
  experiences: unknown; formations: unknown;
  competences: string[]; langues: string[];
};

type DocType = "cv" | "lm" | "cv_lm";

function NouvelleCandidaturePage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileReady, setProfileReady] = useState(false);
  const [credits, setCredits] = useState(0);
  const [showCreditsModal, setShowCreditsModal] = useState(false);

  const [jobOffer, setJobOffer] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [template, setTemplate] = useState<Template>("classique");
  const [docType, setDocType] = useState<DocType>("cv_lm");

  const [generating, setGenerating] = useState(false);
  const [progressMsg, setProgressMsg] = useState("");
  const [result, setResult] = useState<{
    cvUrl: string | null; lmUrl: string | null;
  } | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/connexion" });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: p }, { data: c }] = await Promise.all([
        supabase.from("user_profiles").select("*").eq("user_id", user.id).maybeSingle(),
        supabase.from("user_credits").select("balance").eq("user_id", user.id).maybeSingle(),
      ]);
      if (p) {
        setProfile(p as unknown as Profile);
        setProfileReady(Boolean(p.prenom && p.nom && (p.titre_professionnel || p.resume)));
      }
      setCredits(c?.balance ?? 0);
    })();
  }, [user]);

  if (loading || !user) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-16 text-muted-foreground">Chargement…</div>
      </DashboardLayout>
    );
  }

  const cost = docType === "cv_lm" ? 2 : 1;
  const insufficient = credits < cost;

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-3xl">
        <h1 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
          Nouvelle candidature
        </h1>
        <Stepper step={step} />

        {step === 1 && (
          <Step1Source
            profile={profile}
            profileReady={profileReady}
            onProfileExtracted={(p) => {
              setProfile(p);
              setProfileReady(true);
            }}
            onContinue={() => setStep(2)}
          />
        )}

        {step === 2 && (
          <Step2Offer
            jobOffer={jobOffer} setJobOffer={setJobOffer}
            companyName={companyName} setCompanyName={setCompanyName}
            onBack={() => setStep(1)} onContinue={() => setStep(3)}
          />
        )}

        {step === 3 && (
          <Step3Template
            template={template} setTemplate={setTemplate}
            docType={docType} setDocType={setDocType}
            credits={credits} cost={cost} insufficient={insufficient}
            onBack={() => setStep(2)}
            onGenerate={async () => {
              if (!profile) return;
              if (insufficient) {
                setShowCreditsModal(true);
                return;
              }
              await runGeneration({
                profile, jobOffer, companyName, template, docType,
                setStep, setGenerating, setProgressMsg, setResult, setCredits, user,
              });
            }}
            generating={generating}
            onOpenCreditsModal={() => setShowCreditsModal(true)}
          />
        )}

        {step === 4 && (
          <Step4Generating message={progressMsg} />
        )}

        {step === 5 && result && (
          <Step5Result
            cvUrl={result.cvUrl} lmUrl={result.lmUrl}
            onNew={() => {
              setStep(1); setJobOffer(""); setCompanyName(""); setResult(null);
              setTemplate("classique"); setDocType("cv_lm");
            }}
          />
        )}
      </div>
      <OutOfCreditsModal open={showCreditsModal} onClose={() => setShowCreditsModal(false)} />
    </DashboardLayout>
  );
}

/* ============ Generation orchestration ============ */
async function runGeneration(args: {
  profile: Profile;
  jobOffer: string;
  companyName: string;
  template: Template;
  docType: DocType;
  setStep: (n: number) => void;
  setGenerating: (b: boolean) => void;
  setProgressMsg: (s: string) => void;
  setResult: (r: { cvUrl: string | null; lmUrl: string | null }) => void;
  setCredits: (n: number) => void;
  user: { id: string };
}) {
  const {
    profile, jobOffer, companyName, template, docType,
    setStep, setGenerating, setProgressMsg, setResult, setCredits, user,
  } = args;

  setGenerating(true); setStep(4);
  const msgs = [
    "Analyse de l'offre d'emploi…",
    "Adaptation de votre profil au poste…",
    "Rédaction de votre CV personnalisé…",
    "Mise en page de votre document…",
  ];
  let i = 0;
  setProgressMsg(msgs[0]);
  const ticker = setInterval(() => { i = (i + 1) % msgs.length; setProgressMsg(msgs[i]); }, 3000);

  try {
    const out = await generateCandidatureContent({
      data: {
        profile: {
          prenom: profile.prenom, nom: profile.nom, email: profile.email,
          telephone: profile.telephone,
          titre_professionnel: profile.titre_professionnel ?? "",
          resume: profile.resume ?? "",
          ville: profile.ville ?? "", pays: profile.pays ?? "",
          photo_url: profile.photo_url,
          experiences: (profile.experiences as unknown[]) ?? [],
          formations: (profile.formations as unknown[]) ?? [],
          competences: profile.competences ?? [],
          langues: profile.langues ?? [],
        },
        jobOffer, companyName, template, docType,
      },
    });

    const candidate: CandidateInfo = {
      prenom: profile.prenom, nom: profile.nom, email: profile.email,
      telephone: profile.telephone, ville: profile.ville ?? "", pays: profile.pays ?? "",
      photo_url: profile.photo_url,
    };

    let cvPdfUrl: string | null = null;
    let lmPdfUrl: string | null = null;
    const ts = Date.now();

    if (out.cv) {
      const blob = await generateCvPdf(candidate, out.cv as CvData, template);
      const path = `${user.id}/cv-${ts}.pdf`;
      const { error } = await supabase.storage.from("candidatures").upload(path, blob, {
        contentType: "application/pdf", upsert: false,
      });
      if (error) throw new Error("Erreur upload CV : " + error.message);
      const { data: signed } = await supabase.storage.from("candidatures").createSignedUrl(path, 60 * 60 * 24 * 7);
      cvPdfUrl = signed?.signedUrl ?? null;
    }
    if (out.lm) {
      const blob = generateLetterPdf(candidate, out.lm, companyName, out.jobTitle);
      const path = `${user.id}/lm-${ts}.pdf`;
      const { error } = await supabase.storage.from("candidatures").upload(path, blob, {
        contentType: "application/pdf", upsert: false,
      });
      if (error) throw new Error("Erreur upload lettre : " + error.message);
      const { data: signed } = await supabase.storage.from("candidatures").createSignedUrl(path, 60 * 60 * 24 * 7);
      lmPdfUrl = signed?.signedUrl ?? null;
    }

    await saveApplication({
      data: {
        job_title: out.jobTitle,
        company_name: companyName,
        job_offer_text: jobOffer,
        template_id: template,
        cv_generated: Boolean(out.cv),
        lm_generated: Boolean(out.lm),
        cv_pdf_url: cvPdfUrl,
        lm_pdf_url: lmPdfUrl,
        credits_used: out.creditsUsed,
      },
    });

    // Refresh credits
    const { data: c } = await supabase.from("user_credits").select("balance").eq("user_id", user.id).maybeSingle();
    setCredits(c?.balance ?? 0);

    setResult({ cvUrl: cvPdfUrl, lmUrl: lmPdfUrl });
    setStep(5);
    toast.success("Votre candidature est prête !");
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Échec de la génération";
    toast.error(msg);
    setStep(3);
  } finally {
    clearInterval(ticker);
    setGenerating(false);
  }
}

/* ============ Stepper ============ */
function Stepper({ step }: { step: number }) {
  const items = ["Source", "Offre", "Modèle", "Génération"];
  const current = Math.min(step, 4);
  return (
    <ol className="mt-6 flex items-center gap-2 overflow-x-auto pb-2">
      {items.map((label, idx) => {
        const n = idx + 1;
        const done = n < current || step === 5;
        const active = n === current && step !== 5;
        return (
          <li key={label} className="flex items-center gap-2">
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                done ? "bg-secondary text-secondary-foreground"
                : active ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
              }`}
            >
              {done ? <Check className="h-4 w-4" /> : n}
            </span>
            <span className={`text-xs font-medium ${active ? "text-foreground" : "text-muted-foreground"}`}>{label}</span>
            {n < items.length && <span className="mx-1 h-px w-6 bg-border" />}
          </li>
        );
      })}
    </ol>
  );
}

/* ============ Step 1: Source ============ */
function Step1Source({
  profile, profileReady, onProfileExtracted, onContinue,
}: {
  profile: Profile | null;
  profileReady: boolean;
  onProfileExtracted: (p: Profile) => void;
  onContinue: () => void;
}) {
  const { user } = useAuth();
  const [choice, setChoice] = useState<"upload" | "existing" | null>(profileReady ? "existing" : null);
  const [analyzing, setAnalyzing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const extractFn = useServerFn(extractProfileFromText);

  const handleFile = async (f: File) => {
    setAnalyzing(true);
    try {
      const { text } = await parseCvFile(f);
      if (text.length < 30) throw new Error("Le fichier semble vide ou illisible.");
      const data = await extractFn({ data: { text: text.slice(0, 40_000) } });
      // Save into profile
      if (!user) throw new Error("Non connecté");
      const payload = {
        prenom: String(data.prenom ?? profile?.prenom ?? ""),
        nom: String(data.nom ?? profile?.nom ?? ""),
        email: String(data.email ?? profile?.email ?? user.email ?? ""),
        telephone: String(data.telephone ?? profile?.telephone ?? ""),
        titre_professionnel: String(data.titre_professionnel ?? ""),
        resume: String(data.resume ?? ""),
        ville: String(data.ville ?? ""),
        pays: String(data.pays ?? ""),
        experiences: Array.isArray(data.experiences) ? data.experiences : [],
        formations: Array.isArray(data.formations) ? data.formations : [],
        competences: Array.isArray(data.competences) ? data.competences.map(String) : [],
        langues: Array.isArray(data.langues) ? data.langues.map(String) : [],
      };
      const { error } = await supabase.from("user_profiles").update(payload).eq("user_id", user.id);
      if (error) throw new Error(error.message);
      const { data: refreshed } = await supabase.from("user_profiles").select("*").eq("user_id", user.id).maybeSingle();
      onProfileExtracted(refreshed as unknown as Profile);
      toast.success("CV analysé et profil pré-rempli !");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Échec de l'analyse du CV");
    } finally {
      setAnalyzing(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  };

  return (
    <div className="mt-8 space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <button
          onClick={() => setChoice("upload")}
          className={`rounded-xl border bg-card p-5 text-left shadow-sm transition hover:border-primary ${
            choice === "upload" ? "border-primary ring-2 ring-primary/20" : "border-border"
          }`}
        >
          <Upload className="h-6 w-6 text-primary" />
          <h3 className="mt-3 font-semibold text-foreground">Importer mon CV</h3>
          <p className="mt-1 text-sm text-muted-foreground">PDF ou Word (.docx). L'IA extrait les infos automatiquement.</p>
        </button>
        <button
          onClick={() => setChoice("existing")}
          className={`rounded-xl border bg-card p-5 text-left shadow-sm transition hover:border-primary ${
            choice === "existing" ? "border-primary ring-2 ring-primary/20" : "border-border"
          }`}
        >
          <UserIcon className="h-6 w-6 text-primary" />
          <h3 className="mt-3 font-semibold text-foreground">Utiliser mon profil</h3>
          <p className="mt-1 text-sm text-muted-foreground">Repartir des informations déjà saisies sur votre profil.</p>
        </button>
      </div>

      {choice === "upload" && (
        <div
          onDrop={onDrop}
          onDragOver={(e) => e.preventDefault()}
          className="rounded-xl border-2 border-dashed border-border bg-card p-8 text-center"
        >
          {analyzing ? (
            <div className="flex flex-col items-center gap-3 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span>Analyse de votre CV en cours…</span>
            </div>
          ) : (
            <>
              <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-3 text-sm text-foreground">Glissez-déposez votre CV ici</p>
              <p className="text-xs text-muted-foreground">PDF ou DOCX, 10 Mo max</p>
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:opacity-90"
              >
                Parcourir
              </button>
              <input
                ref={inputRef} type="file" hidden
                accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
              />
            </>
          )}
        </div>
      )}

      {choice === "existing" && (
        <div className="rounded-xl border border-border bg-card p-5">
          {profileReady && profile ? (
            <>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-foreground">{profile.prenom} {profile.nom}</h3>
                  <p className="text-sm text-muted-foreground">{profile.titre_professionnel ?? "—"}</p>
                  <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{profile.resume ?? ""}</p>
                </div>
                <Link to="/profil" className="rounded-xl border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted">
                  Modifier sur /profil
                </Link>
              </div>
            </>
          ) : (
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Votre profil est vide.</p>
              <Link to="/profil" className="mt-3 inline-block rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">
                Compléter mon profil
              </Link>
            </div>
          )}
        </div>
      )}

      <div className="flex justify-end">
        <button
          onClick={onContinue}
          disabled={!profileReady}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 disabled:opacity-50"
        >
          Continuer <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

/* ============ Step 2: Offer ============ */
function Step2Offer({
  jobOffer, setJobOffer, companyName, setCompanyName, onBack, onContinue,
}: {
  jobOffer: string; setJobOffer: (s: string) => void;
  companyName: string; setCompanyName: (s: string) => void;
  onBack: () => void; onContinue: () => void;
}) {
  const len = jobOffer.length;
  const ok = len >= 100;
  return (
    <div className="mt-8 space-y-4">
      <div>
        <label className="text-sm font-medium text-foreground">Offre d'emploi *</label>
        <textarea
          value={jobOffer} onChange={(e) => setJobOffer(e.target.value)}
          placeholder="Collez l'offre d'emploi complète ici…"
          rows={12}
          className="mt-1 w-full rounded-xl border border-border bg-card p-3 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
        <p className={`mt-1 text-xs ${ok ? "text-secondary" : "text-muted-foreground"}`}>
          {len} caractère{len > 1 ? "s" : ""} {ok ? "✓" : `(min. 100)`}
        </p>
      </div>
      <div>
        <label className="text-sm font-medium text-foreground">Nom de l'entreprise (optionnel)</label>
        <input
          value={companyName} onChange={(e) => setCompanyName(e.target.value)}
          placeholder="Ex. Acme Inc."
          className="mt-1 w-full rounded-xl border border-border bg-card p-3 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>
      <div className="flex justify-between">
        <button onClick={onBack} className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-medium hover:bg-muted">
          <ArrowLeft className="h-4 w-4" /> Retour
        </button>
        <button
          onClick={onContinue} disabled={!ok}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:opacity-90 disabled:opacity-50"
        >
          Continuer <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

/* ============ Step 3: Template + options ============ */
function Step3Template({
  template, setTemplate, docType, setDocType,
  credits, cost, insufficient, onBack, onGenerate, generating, onOpenCreditsModal,
}: {
  template: Template; setTemplate: (t: Template) => void;
  docType: DocType; setDocType: (d: DocType) => void;
  credits: number; cost: number; insufficient: boolean;
  onBack: () => void; onGenerate: () => void; generating: boolean;
  onOpenCreditsModal: () => void;
}) {
  const tmpls: { id: Template; label: string; desc: string; preview: ReactElement }[] = [
    { id: "classique", label: "Classique", desc: "Sobre, photo ronde centrée", preview: <PreviewClassique /> },
    { id: "moderne", label: "Moderne", desc: "Sidebar bleue", preview: <PreviewModerne /> },
    { id: "professionnel", label: "Professionnel", desc: "En-tête sombre + 2 colonnes", preview: <PreviewPro /> },
  ];
  return (
    <div className="mt-8 space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-foreground">Choisissez un modèle</h3>
        <div className="mt-3 grid gap-4 sm:grid-cols-3">
          {tmpls.map((t) => (
            <button
              key={t.id} onClick={() => setTemplate(t.id)}
              className={`rounded-xl border bg-card p-3 text-left shadow-sm transition hover:border-primary ${
                template === t.id ? "border-primary ring-2 ring-primary/20" : "border-border"
              }`}
            >
              <div className="overflow-hidden rounded-lg border border-border bg-muted">{t.preview}</div>
              <div className="mt-2 font-semibold text-foreground">{t.label}</div>
              <div className="text-xs text-muted-foreground">{t.desc}</div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-foreground">Document(s) à générer</h3>
        <div className="mt-2 space-y-2">
          {[
            { id: "cv" as const, label: "CV uniquement", cost: 1 },
            { id: "lm" as const, label: "Lettre de motivation uniquement", cost: 1 },
            { id: "cv_lm" as const, label: "CV + Lettre de motivation", cost: 2 },
          ].map((opt) => (
            <label key={opt.id} className={`flex cursor-pointer items-center justify-between rounded-xl border p-3 ${
              docType === opt.id ? "border-primary bg-primary/5" : "border-border bg-card"
            }`}>
              <span className="flex items-center gap-3 text-sm font-medium text-foreground">
                <input type="radio" name="doctype" checked={docType === opt.id} onChange={() => setDocType(opt.id)} className="accent-primary" />
                {opt.label}
              </span>
              <span className="text-xs font-semibold text-primary">{opt.cost} crédit{opt.cost > 1 ? "s" : ""}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <span>Coût : <strong>{cost} crédit{cost > 1 ? "s" : ""}</strong></span>
          <span className="text-muted-foreground">Solde : <strong className={insufficient ? "text-destructive" : "text-foreground"}>{credits}</strong></span>
        </div>
        {insufficient && (
          <div className="mt-3 flex items-start gap-3 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            <AlertTriangle className="mt-0.5 h-4 w-4" />
            <div className="flex-1">
              <p className="font-semibold">Solde insuffisant</p>
              <p className="text-xs">Il vous faut {cost} crédit{cost > 1 ? "s" : ""} pour générer cette candidature.</p>
            </div>
            <button onClick={onOpenCreditsModal} className="rounded-lg bg-destructive px-3 py-1.5 text-xs font-semibold text-destructive-foreground">
              Acheter des crédits
            </button>
          </div>
        )}
      </div>

      <div className="flex justify-between">
        <button onClick={onBack} className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-medium hover:bg-muted">
          <ArrowLeft className="h-4 w-4" /> Retour
        </button>
        <button
          onClick={onGenerate} disabled={generating}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:opacity-90 disabled:opacity-50"
        >
          {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          Générer ma candidature 🚀
        </button>
      </div>
    </div>
  );
}

/* ============ Template previews (small visual) ============ */
function PreviewClassique() {
  return (
    <div className="flex aspect-[3/4] flex-col items-center gap-1 bg-white p-2 text-[6px] text-slate-700">
      <div className="h-5 w-5 rounded-full bg-slate-300" />
      <div className="h-1 w-12 rounded bg-slate-400" />
      <div className="h-0.5 w-10 rounded bg-primary" />
      <div className="mt-1 w-full space-y-0.5">
        <div className="h-0.5 w-full rounded bg-slate-200" />
        <div className="h-0.5 w-5/6 rounded bg-slate-200" />
        <div className="h-0.5 w-4/6 rounded bg-slate-200" />
      </div>
    </div>
  );
}
function PreviewModerne() {
  return (
    <div className="flex aspect-[3/4] gap-1 bg-white p-1">
      <div className="flex w-1/3 flex-col items-center gap-1 bg-primary p-1">
        <div className="h-4 w-4 rounded-full bg-white/80" />
        <div className="h-0.5 w-6 rounded bg-white/60" />
        <div className="h-0.5 w-5 rounded bg-white/60" />
      </div>
      <div className="flex-1 space-y-0.5 p-1">
        <div className="h-1 w-2/3 rounded bg-slate-400" />
        <div className="h-0.5 w-full rounded bg-slate-200" />
        <div className="h-0.5 w-5/6 rounded bg-slate-200" />
        <div className="h-0.5 w-4/6 rounded bg-slate-200" />
      </div>
    </div>
  );
}
function PreviewPro() {
  return (
    <div className="flex aspect-[3/4] flex-col bg-white">
      <div className="flex items-center gap-1 bg-slate-800 p-1">
        <div className="h-3 w-3 rounded-full bg-slate-300" />
        <div className="space-y-0.5">
          <div className="h-0.5 w-8 rounded bg-white/80" />
          <div className="h-0.5 w-6 rounded bg-accent" />
        </div>
      </div>
      <div className="flex flex-1 gap-1 p-1">
        <div className="w-1/3 space-y-0.5">
          <div className="h-0.5 w-full rounded bg-slate-200" />
          <div className="h-0.5 w-5/6 rounded bg-slate-200" />
        </div>
        <div className="flex-1 space-y-0.5">
          <div className="h-0.5 w-full rounded bg-slate-200" />
          <div className="h-0.5 w-5/6 rounded bg-slate-200" />
          <div className="h-0.5 w-4/6 rounded bg-slate-200" />
        </div>
      </div>
    </div>
  );
}

/* ============ Step 4: Generating ============ */
function Step4Generating({ message }: { message: string }) {
  return (
    <div className="mt-12 rounded-xl border border-border bg-card p-10 text-center shadow-sm">
      <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary" />
      <h3 className="mt-4 font-display text-lg font-bold text-foreground">Génération en cours</h3>
      <p className="mt-2 text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

/* ============ Step 5: Result ============ */
function Step5Result({
  cvUrl, lmUrl, onNew,
}: {
  cvUrl: string | null; lmUrl: string | null; onNew: () => void;
}) {
  const previewUrl = cvUrl ?? lmUrl;
  return (
    <div className="mt-8 space-y-6">
      <div className="rounded-xl bg-secondary/10 p-4 text-center text-sm font-medium text-secondary">
        🎉 Votre candidature est prête !
      </div>
      {previewUrl && (
        <div className="overflow-hidden rounded-xl border border-border bg-muted">
          <iframe src={previewUrl} title="Aperçu PDF" className="h-[520px] w-full" />
        </div>
      )}
      <div className="flex flex-wrap gap-3">
        {cvUrl && (
          <a href={cvUrl} target="_blank" rel="noreferrer" download
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:opacity-90">
            <Download className="h-4 w-4" /> Télécharger mon CV PDF
          </a>
        )}
        {lmUrl && (
          <a href={lmUrl} target="_blank" rel="noreferrer" download
            className="inline-flex items-center gap-2 rounded-xl bg-secondary px-4 py-2.5 text-sm font-semibold text-secondary-foreground shadow-sm hover:opacity-90">
            <Download className="h-4 w-4" /> Télécharger ma Lettre PDF
          </a>
        )}
        <button onClick={onNew}
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium hover:bg-muted">
          <RotateCcw className="h-4 w-4" /> Nouvelle candidature
        </button>
      </div>
    </div>
  );
}