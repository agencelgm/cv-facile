import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Sparkles, Loader2, ChevronLeft, Download } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { OutOfCreditsModal } from "@/components/out-of-credits-modal";
import { CVPreview } from "@/components/cv-preview";
import { CVEditor } from "@/components/cv-editor";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import {
  generateCandidatureContent, saveApplication,
} from "@/lib/candidature.functions";
import {
  generateCvPdf, generateLetterPdf,
  type CandidateInfo, type Template, type CvData,
} from "@/lib/pdf-generator";
import { type EditorCVData, emptyCV } from "@/lib/cv-types";

export const Route = createFileRoute("/nouvelle-candidature")({
  component: NouvelleCandidaturePage,
});

/* ── Types ── */

type Profile = {
  prenom: string; nom: string; email: string; telephone: string;
  titre_professionnel: string | null; resume: string | null;
  ville: string | null; pays: string | null; photo_url: string | null;
  experiences: unknown; formations: unknown;
  competences: string[]; langues: string[];
};

/* ── Mapping helpers ── */

function profileToEditor(p: Profile): EditorCVData {
  return {
    prenom: p.prenom || "",
    nom: p.nom || "",
    email: p.email || "",
    telephone: p.telephone || "",
    ville: p.ville || "",
    pays: p.pays || "",
    photo_url: p.photo_url || null,
    titre: p.titre_professionnel || "",
    resume: p.resume || "",
    experiences: (Array.isArray(p.experiences) ? p.experiences : []).map((e: Record<string, unknown>) => ({
      poste: String(e.poste ?? ""),
      entreprise: String(e.entreprise ?? ""),
      periode: e.date_debut
        ? `${e.date_debut} – ${e.poste_actuel ? "Présent" : (e.date_fin ?? "")}`
        : String(e.periode ?? ""),
      description: String(e.description ?? ""),
    })),
    formations: (Array.isArray(p.formations) ? p.formations : []).map((f: Record<string, unknown>) => ({
      diplome: String(f.diplome ?? ""),
      ecole: String(f.ecole ?? ""),
      annee: String(f.annee ?? ""),
    })),
    competences: p.competences || [],
    langues: p.langues || [],
  };
}

function aiToEditor(p: Profile, cv: CvData): EditorCVData {
  return {
    prenom: p.prenom || "",
    nom: p.nom || "",
    email: p.email || "",
    telephone: p.telephone || "",
    ville: p.ville || "",
    pays: p.pays || "",
    photo_url: p.photo_url || null,
    titre: cv.titre_professionnel || p.titre_professionnel || "",
    resume: cv.resume || p.resume || "",
    experiences: (cv.experiences || []).map(e => ({
      poste: e.poste || "",
      entreprise: e.entreprise || "",
      periode: e.periode || "",
      description: e.description || "",
    })),
    formations: (cv.formations || []).map(f => ({
      diplome: f.diplome || "",
      ecole: f.ecole || "",
      annee: f.annee || "",
    })),
    competences: cv.competences || [],
    langues: cv.langues || [],
  };
}

function toCandidateInfo(d: EditorCVData): CandidateInfo {
  return { prenom: d.prenom, nom: d.nom, email: d.email, telephone: d.telephone, ville: d.ville, pays: d.pays, photo_url: d.photo_url };
}

function toCvData(d: EditorCVData): CvData {
  return { titre_professionnel: d.titre, resume: d.resume, experiences: d.experiences, formations: d.formations, competences: d.competences, langues: d.langues };
}

/* ── Page component ── */

function NouvelleCandidaturePage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const [screen, setScreen] = useState<"ai" | "editor">("ai");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [credits, setCredits] = useState(0);
  const [showCreditsModal, setShowCreditsModal] = useState(false);

  // Screen 1
  const [jobOffer, setJobOffer] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [includeLettre, setIncludeLettre] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Screen 2
  const [cvData, setCvData] = useState<EditorCVData>(emptyCV);
  const [template, setTemplate] = useState<Template>("classique");
  const [lettreContent, setLettreContent] = useState<string | null>(null);
  const [jobTitle, setJobTitle] = useState("");
  const [downloading, setDownloading] = useState(false);

  const generateFn = useServerFn(generateCandidatureContent);
  const saveFn = useServerFn(saveApplication);

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
      if (p) setProfile(p as unknown as Profile);
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

  const cost = includeLettre ? 2 : 1;

  const handleGenerate = async () => {
    if (!profile) {
      toast.error("Profil introuvable. Veuillez compléter votre profil d'abord.");
      return;
    }
    if (credits < cost) { setShowCreditsModal(true); return; }
    setGenerating(true);
    try {
      const docType = includeLettre ? "cv_lm" : "cv";
      const out = await generateFn({
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

      const { data: c } = await supabase.from("user_credits").select("balance").eq("user_id", user.id).maybeSingle();
      setCredits(c?.balance ?? 0);

      setCvData(aiToEditor(profile, out.cv as CvData));
      setLettreContent(out.lm);
      setJobTitle(out.jobTitle);
      setScreen("editor");
      toast.success("CV généré ! Personnalisez-le avant de télécharger.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Échec de la génération");
    } finally {
      setGenerating(false);
    }
  };

  const handleManual = () => {
    if (profile) setCvData(profileToEditor(profile));
    setScreen("editor");
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const candidate = toCandidateInfo(cvData);
      const cvContent = toCvData(cvData);
      const ts = Date.now();
      let cvPdfUrl: string | null = null;
      let lmPdfUrl: string | null = null;

      // Upload CV PDF
      const blob = await generateCvPdf(candidate, cvContent, template);
      const cvPath = `${user.id}/cv-${ts}.pdf`;
      const { error: upErr } = await supabase.storage.from("candidatures").upload(cvPath, blob, { contentType: "application/pdf", upsert: false });
      if (upErr) throw new Error("Erreur upload CV : " + upErr.message);
      const { data: cvSigned } = await supabase.storage.from("candidatures").createSignedUrl(cvPath, 60 * 60 * 24 * 7);
      cvPdfUrl = cvSigned?.signedUrl ?? null;

      // Upload letter PDF if exists
      if (lettreContent) {
        const lmBlob = generateLetterPdf(candidate, lettreContent, companyName, jobTitle || cvData.titre);
        const lmPath = `${user.id}/lm-${ts}.pdf`;
        const { error: lmErr } = await supabase.storage.from("candidatures").upload(lmPath, lmBlob, { contentType: "application/pdf", upsert: false });
        if (lmErr) throw new Error("Erreur upload lettre : " + lmErr.message);
        const { data: lmSigned } = await supabase.storage.from("candidatures").createSignedUrl(lmPath, 60 * 60 * 24 * 7);
        lmPdfUrl = lmSigned?.signedUrl ?? null;
      }

      // Save to Supabase
      await saveFn({
        data: {
          job_title: jobTitle || cvData.titre || "Candidature",
          company_name: companyName,
          job_offer_text: jobOffer || "—",
          template_id: template,
          cv_generated: true,
          lm_generated: Boolean(lettreContent),
          cv_pdf_url: cvPdfUrl,
          lm_pdf_url: lmPdfUrl,
          credits_used: lettreContent ? 2 : 1,
        },
      });

      if (cvPdfUrl) window.open(cvPdfUrl, "_blank");
      if (lmPdfUrl) window.open(lmPdfUrl, "_blank");
      toast.success("CV téléchargé et sauvegardé dans votre tableau de bord !");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Échec du téléchargement");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <DashboardLayout>
      {screen === "ai" ? (
        <AIScreen
          jobOffer={jobOffer} setJobOffer={setJobOffer}
          companyName={companyName} setCompanyName={setCompanyName}
          includeLettre={includeLettre} setIncludeLettre={setIncludeLettre}
          cost={cost} credits={credits}
          generating={generating}
          onGenerate={handleGenerate}
          onManual={handleManual}
          onOpenCreditsModal={() => setShowCreditsModal(true)}
        />
      ) : (
        <EditorScreen
          cvData={cvData} setCvData={setCvData}
          template={template} setTemplate={setTemplate}
          lettreContent={lettreContent}
          downloading={downloading}
          onDownload={handleDownload}
          onBack={() => setScreen("ai")}
        />
      )}
      <OutOfCreditsModal open={showCreditsModal} onClose={() => setShowCreditsModal(false)} />
    </DashboardLayout>
  );
}

/* ══════════════════════════════════════════════════════════
   Screen 1 – AI Generation
══════════════════════════════════════════════════════════ */

function AIScreen({
  jobOffer, setJobOffer, companyName, setCompanyName,
  includeLettre, setIncludeLettre,
  cost, credits, generating,
  onGenerate, onManual, onOpenCreditsModal,
}: {
  jobOffer: string; setJobOffer: (s: string) => void;
  companyName: string; setCompanyName: (s: string) => void;
  includeLettre: boolean; setIncludeLettre: (b: boolean) => void;
  cost: number; credits: number; generating: boolean;
  onGenerate: () => void; onManual: () => void; onOpenCreditsModal: () => void;
}) {
  const len = jobOffer.length;
  const ok = len >= 100;
  const insufficient = credits < cost;

  return (
    <div className="mx-auto max-w-2xl">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="font-display text-3xl font-bold text-foreground">Nouvelle candidature</h1>
        <p className="mt-2 text-muted-foreground">
          Collez l'offre d'emploi et laissez l'IA créer votre CV en 60 secondes
        </p>
      </div>

      <div className="space-y-5 rounded-2xl border border-border bg-card p-6 shadow-sm">
        {/* Job offer */}
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-foreground">Offre d'emploi *</label>
          <textarea
            value={jobOffer}
            onChange={e => setJobOffer(e.target.value)}
            placeholder="Collez l'offre d'emploi complète ici…"
            rows={10}
            className="w-full resize-none rounded-xl border border-border bg-background p-3 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <p className={`text-xs ${ok ? "text-secondary" : "text-muted-foreground"}`}>
            {len} caractère{len > 1 ? "s" : ""} {ok ? "✓" : "(min. 100)"}
          </p>
        </div>

        {/* Company name */}
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-foreground">Nom de l'entreprise</label>
          <input
            value={companyName}
            onChange={e => setCompanyName(e.target.value)}
            placeholder="Ex. Acme Inc."
            className="w-full rounded-xl border border-border bg-background p-3 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* Cover letter checkbox */}
        <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-muted/40 p-3.5 transition hover:bg-muted/60">
          <input
            type="checkbox"
            checked={includeLettre}
            onChange={e => setIncludeLettre(e.target.checked)}
            className="h-4 w-4 accent-primary"
          />
          <div className="flex-1">
            <span className="text-sm font-medium text-foreground">
              Générer aussi la lettre de motivation
            </span>
            <span className="ml-2 inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
              +1 crédit
            </span>
          </div>
        </label>

        {/* Credit summary */}
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-background px-4 py-3 text-sm">
          <span className="text-muted-foreground">
            Coût : <strong className="text-foreground">{cost} crédit{cost > 1 ? "s" : ""}</strong>
          </span>
          <span className="text-muted-foreground">
            Solde : <strong className={insufficient ? "text-destructive" : "text-foreground"}>
              {credits} crédit{credits !== 1 ? "s" : ""}
            </strong>
          </span>
        </div>

        {/* CTA */}
        {insufficient ? (
          <button
            onClick={onOpenCreditsModal}
            className="w-full rounded-xl bg-destructive px-5 py-3 text-sm font-semibold text-destructive-foreground shadow-sm hover:opacity-90"
          >
            Acheter des crédits pour continuer
          </button>
        ) : (
          <button
            onClick={onGenerate}
            disabled={!ok || generating}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-sm hover:opacity-90 disabled:opacity-50"
          >
            {generating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Génération en cours…
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                ✨ Générer mon CV avec l'IA
              </>
            )}
          </button>
        )}
      </div>

      {/* Manual option */}
      <div className="mt-5 text-center">
        <button
          onClick={onManual}
          className="text-sm text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
        >
          Préférer remplir manuellement →
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   Screen 2 – Editor + Live Preview
══════════════════════════════════════════════════════════ */

const TEMPLATES: { id: Template; label: string }[] = [
  { id: "classique", label: "Classique" },
  { id: "moderne", label: "Moderne" },
  { id: "professionnel", label: "Professionnel" },
];

function EditorScreen({
  cvData, setCvData, template, setTemplate,
  lettreContent, downloading, onDownload, onBack,
}: {
  cvData: EditorCVData; setCvData: (d: EditorCVData) => void;
  template: Template; setTemplate: (t: Template) => void;
  lettreContent: string | null;
  downloading: boolean;
  onDownload: () => void;
  onBack: () => void;
}) {
  return (
    <>
      {/* Sticky top controls */}
      <div className="sticky top-16 z-10 -mx-4 md:-mx-8 flex flex-wrap items-center gap-3 border-b border-border bg-background/95 px-4 py-3 backdrop-blur md:px-8 mb-6">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" /> Retour
        </button>

        {/* Template pills */}
        <div className="flex gap-1 rounded-xl border border-border bg-muted p-1">
          {TEMPLATES.map(t => (
            <button
              key={t.id}
              onClick={() => setTemplate(t.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                template === t.id
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Download */}
        <button
          onClick={onDownload}
          disabled={downloading}
          className="ml-auto inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:opacity-90 disabled:opacity-50"
        >
          {downloading
            ? <Loader2 className="h-4 w-4 animate-spin" />
            : <Download className="h-4 w-4" />}
          Télécharger PDF
        </button>
      </div>

      {/* Split layout */}
      <div className="flex gap-6">
        {/* Left: editor */}
        <div className="w-[380px] flex-shrink-0">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Modifier votre CV
          </p>
          <CVEditor data={cvData} onChange={setCvData} />

          {lettreContent && (
            <div className="mt-4 rounded-xl border border-border bg-card p-4">
              <p className="mb-1 text-sm font-semibold text-foreground">Lettre de motivation générée</p>
              <p className="mb-2 text-xs text-muted-foreground">
                Elle sera téléchargée avec votre CV en PDF.
              </p>
              <div className="max-h-28 overflow-hidden rounded-lg bg-muted p-3 text-xs text-muted-foreground">
                {lettreContent}
              </div>
            </div>
          )}
        </div>

        {/* Right: live preview */}
        <div className="min-w-0 flex-1">
          <div className="sticky top-[7.5rem]">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Aperçu en direct
            </p>
            <div className="overflow-hidden rounded-xl shadow-xl ring-1 ring-border">
              <CVPreview data={cvData} template={template} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
