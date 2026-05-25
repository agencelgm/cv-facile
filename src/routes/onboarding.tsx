import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  Upload, FileText, PenLine, ChevronRight, Plus, Trash2, Loader2, Camera, ArrowRight,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { parseCvFile } from "@/lib/cv-parser";
import { extractProfileFromText } from "@/lib/candidature.functions";
import { cropToSquare } from "@/lib/image-utils";
import type { Experience, Formation } from "@/lib/cv-types";

export const Route = createFileRoute("/onboarding")({
  component: OnboardingPage,
});

type Step =
  | "choice"
  | "upload"
  | "upload-review"
  | "info"
  | "resume"
  | "experiences"
  | "formations"
  | "skills"
  | "photo";

const MANUAL_STEPS: Step[] = ["info", "resume", "experiences", "formations", "skills", "photo"];
const STEP_LABELS: Record<string, string> = {
  info: "Informations personnelles",
  resume: "Profil",
  experiences: "Expériences",
  formations: "Formations",
  skills: "Compétences & Langues",
  photo: "Photo",
};

function stepIndex(step: Step): number {
  return MANUAL_STEPS.indexOf(step);
}

/* ──────────────────── Page ──────────────────── */

function OnboardingPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("choice");

  // form state
  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");
  const [titre, setTitre] = useState("");
  const [email, setEmail] = useState("");
  const [telephone, setTelephone] = useState("");
  const [ville, setVille] = useState("");
  const [pays, setPays] = useState("");
  const [resume, setResumeText] = useState("");
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [formations, setFormations] = useState<Formation[]>([]);
  const [competences, setCompetences] = useState<string[]>([]);
  const [langues, setLangues] = useState<string[]>([]);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/connexion" });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    // Pre-fill with existing profile data
    supabase.from("user_profiles").select("*").eq("user_id", user.id).maybeSingle().then(({ data: p }) => {
      if (!p) return;
      if (p.onboarding_completed) { navigate({ to: "/dashboard" }); return; }
      setPrenom(p.prenom ?? "");
      setNom(p.nom ?? "");
      setEmail(p.email ?? "");
      setTelephone(p.telephone ?? "");
      setTitre(p.titre_professionnel ?? "");
      setVille(p.ville ?? "");
      setPays(p.pays ?? "");
      setResumeText(p.resume ?? "");
      setExperiences(Array.isArray(p.experiences) ? (p.experiences as unknown as Experience[]) : []);
      setFormations(Array.isArray(p.formations) ? (p.formations as unknown as Formation[]) : []);
      setCompetences(p.competences ?? []);
      setLangues(p.langues ?? []);
      setPhotoUrl(p.photo_url ?? null);
    });
  }, [user, navigate]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const markComplete = async (extraData?: Record<string, unknown>) => {
    await supabase.from("user_profiles").update({ onboarding_completed: true, ...extraData }).eq("user_id", user.id);
    navigate({ to: "/dashboard" });
  };

  const skip = () => markComplete();

  const savePartial = async (fields: Record<string, unknown>) => {
    await supabase.from("user_profiles").update(fields).eq("user_id", user.id);
  };

  /* ── handlers ── */

  const handleSkip = () => skip();

  const handleInfoNext = async () => {
    setSaving(true);
    try {
      await savePartial({ prenom, nom, titre_professionnel: titre, email, telephone, ville, pays });
      setStep("resume");
    } finally { setSaving(false); }
  };

  const handleResumeNext = async () => {
    setSaving(true);
    try {
      await savePartial({ resume });
      setStep("experiences");
    } finally { setSaving(false); }
  };

  const handleExperiencesNext = async () => {
    setSaving(true);
    try {
      await savePartial({ experiences: experiences as unknown[] });
      setStep("formations");
    } finally { setSaving(false); }
  };

  const handleFormationsNext = async () => {
    setSaving(true);
    try {
      await savePartial({ formations: formations as unknown[] });
      setStep("skills");
    } finally { setSaving(false); }
  };

  const handleSkillsNext = async () => {
    setSaving(true);
    try {
      await savePartial({ competences, langues });
      setStep("photo");
    } finally { setSaving(false); }
  };

  const handlePhotoFinish = async () => {
    await markComplete({ photo_url: photoUrl });
  };

  const handlePhotoUpload = async (file: File) => {
    if (!["image/jpeg", "image/png", "image/jpg"].includes(file.type)) {
      toast.error("Format invalide. Utilisez JPG ou PNG.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image trop lourde (max 5 Mo).");
      return;
    }
    setUploading(true);
    try {
      const cropped = await cropToSquare(file);
      const path = `${user.id}/avatar-${Date.now()}.png`;
      const { error } = await supabase.storage.from("avatars").upload(path, cropped, { contentType: "image/png", upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      setPhotoUrl(data.publicUrl);
      toast.success("Photo ajoutée !");
    } catch (e) {
      toast.error("Échec de l'upload", { description: (e as Error).message });
    } finally {
      setUploading(false);
    }
  };

  /* ── upload CV ── */

  const extractFn = useServerFn(extractProfileFromText);

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    try {
      const { text } = await parseCvFile(file);
      if (text.length < 20) { toast.error("CV vide ou illisible."); return; }
      toast.info("Analyse en cours…");
      const parsed = await extractFn({ data: { text } });
      // Apply parsed data
      if (parsed.prenom) setPrenom(parsed.prenom);
      if (parsed.nom) setNom(parsed.nom);
      if (parsed.email) setEmail(parsed.email);
      if (parsed.telephone) setTelephone(parsed.telephone);
      if (parsed.titre_professionnel) setTitre(parsed.titre_professionnel);
      if (parsed.resume) setResumeText(parsed.resume);
      if (parsed.ville) setVille(parsed.ville);
      if (parsed.pays) setPays(parsed.pays);
      if (Array.isArray(parsed.experiences) && parsed.experiences.length > 0) {
        setExperiences(parsed.experiences.map((e: Record<string, unknown>) => ({
          poste: String(e.poste ?? ""),
          entreprise: String(e.entreprise ?? ""),
          periode: e.date_debut
            ? `${e.date_debut} – ${e.poste_actuel ? "Présent" : (e.date_fin ?? "")}`
            : String(e.periode ?? ""),
          description: String(e.description ?? ""),
        })));
      }
      if (Array.isArray(parsed.formations) && parsed.formations.length > 0) {
        setFormations(parsed.formations.map((f: Record<string, unknown>) => ({
          diplome: String(f.diplome ?? ""),
          ecole: String(f.ecole ?? ""),
          annee: String(f.annee ?? ""),
        })));
      }
      if (Array.isArray(parsed.competences)) setCompetences(parsed.competences);
      if (Array.isArray(parsed.langues)) setLangues(parsed.langues);
      setStep("upload-review");
    } catch (e) {
      toast.error("Erreur d'analyse", { description: (e as Error).message });
    } finally {
      setUploading(false);
    }
  };

  const handleUploadSave = async () => {
    setSaving(true);
    try {
      await supabase.from("user_profiles").update({
        prenom, nom, titre_professionnel: titre, email, telephone, ville, pays,
        resume, experiences: experiences as unknown[], formations: formations as unknown[],
        competences, langues, onboarding_completed: true,
      }).eq("user_id", user.id);
      toast.success("Profil enregistré !");
      navigate({ to: "/dashboard" });
    } catch (e) {
      toast.error("Erreur de sauvegarde", { description: (e as Error).message });
    } finally {
      setSaving(false);
    }
  };

  /* ── render ── */

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-6 py-4">
          <span className="font-display text-xl font-bold">
            CV<span className="text-primary">Facile</span>
          </span>
          {step !== "choice" && (
            <button onClick={handleSkip} className="text-sm text-muted-foreground hover:text-foreground">
              Passer pour l'instant →
            </button>
          )}
        </div>
      </header>

      <main className="flex flex-1 items-start justify-center px-6 py-10">
        <div className="w-full max-w-xl">

          {/* Progress bar (manual steps) */}
          {MANUAL_STEPS.includes(step) && (
            <div className="mb-6">
              <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                <span>{STEP_LABELS[step]}</span>
                <span>Étape {stepIndex(step) + 1} / {MANUAL_STEPS.length}</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-muted">
                <div
                  className="h-1.5 rounded-full bg-primary transition-all"
                  style={{ width: `${((stepIndex(step) + 1) / MANUAL_STEPS.length) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* ── Choice ── */}
          {step === "choice" && (
            <ChoiceScreen
              onUpload={() => setStep("upload")}
              onManual={() => setStep("info")}
              onSkip={handleSkip}
            />
          )}

          {/* ── Upload ── */}
          {step === "upload" && (
            <UploadScreen uploading={uploading} onFile={handleFileUpload} onBack={() => setStep("choice")} />
          )}

          {/* ── Upload review ── */}
          {step === "upload-review" && (
            <UploadReviewScreen
              data={{ prenom, nom, titre, email, telephone, ville, pays, resume, experiences, formations, competences, langues }}
              saving={saving}
              onSave={handleUploadSave}
              onBack={() => setStep("upload")}
            />
          )}

          {/* ── Info ── */}
          {step === "info" && (
            <StepCard title="Informations personnelles">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Prénom" value={prenom} onChange={setPrenom} required />
                <Field label="Nom" value={nom} onChange={setNom} required />
              </div>
              <Field label="Titre professionnel" value={titre} onChange={setTitre} placeholder="Ex. Développeur Web Senior" />
              <Field label="Email" value={email} onChange={setEmail} type="email" />
              <Field label="Téléphone" value={telephone} onChange={setTelephone} />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Ville" value={ville} onChange={setVille} />
                <Field label="Pays" value={pays} onChange={setPays} />
              </div>
              <StepActions saving={saving} onNext={handleInfoNext} onSkip={() => setStep("resume")} />
            </StepCard>
          )}

          {/* ── Resume ── */}
          {step === "resume" && (
            <StepCard title="Profil professionnel" hint="Décrivez-vous en 3-5 phrases : votre expertise, vos points forts, vos objectifs.">
              <div className="space-y-1">
                <textarea
                  value={resume}
                  onChange={e => setResumeText(e.target.value)}
                  rows={6}
                  placeholder="Ex. Développeur web passionné avec 5 ans d'expérience…"
                  className="w-full resize-none rounded-xl border border-border bg-background p-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <p className="text-right text-xs text-muted-foreground">{resume.split(/\s+/).filter(Boolean).length} mots</p>
              </div>
              <StepActions saving={saving} onNext={handleResumeNext} onSkip={() => setStep("experiences")} />
            </StepCard>
          )}

          {/* ── Experiences ── */}
          {step === "experiences" && (
            <StepCard title="Expériences professionnelles">
              <ExperiencesList items={experiences} onChange={setExperiences} />
              <StepActions saving={saving} onNext={handleExperiencesNext} onSkip={() => setStep("formations")} />
            </StepCard>
          )}

          {/* ── Formations ── */}
          {step === "formations" && (
            <StepCard title="Formations">
              <FormationsList items={formations} onChange={setFormations} />
              <StepActions saving={saving} onNext={handleFormationsNext} onSkip={() => setStep("skills")} />
            </StepCard>
          )}

          {/* ── Skills ── */}
          {step === "skills" && (
            <StepCard title="Compétences & Langues">
              <TagInput label="Compétences" tags={competences} onChange={setCompetences} placeholder="Ex. JavaScript, Excel, Photoshop…" />
              <TagInput label="Langues" tags={langues} onChange={setLangues} placeholder="Ex. Français, Anglais, Dioula…" />
              <StepActions saving={saving} onNext={handleSkillsNext} onSkip={() => setStep("photo")} />
            </StepCard>
          )}

          {/* ── Photo ── */}
          {step === "photo" && (
            <StepCard
              title="Photo de profil"
              hint="En Afrique de l'Ouest, la photo est attendue sur un CV. Elle sera automatiquement adaptée à chaque modèle."
            >
              <PhotoUploadStep
                photoUrl={photoUrl}
                uploading={uploading}
                onFile={handlePhotoUpload}
              />
              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => markComplete()}
                  className="flex-1 rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted"
                >
                  Passer sans photo
                </button>
                <button
                  onClick={handlePhotoFinish}
                  disabled={saving}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50 hover:opacity-90"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                  Terminer
                </button>
              </div>
            </StepCard>
          )}

        </div>
      </main>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   Sub-screens
══════════════════════════════════════════════════ */

function ChoiceScreen({ onUpload, onManual, onSkip }: {
  onUpload: () => void; onManual: () => void; onSkip: () => void;
}) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="font-display text-2xl font-bold text-foreground">Créez votre profil CV</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Votre profil sera utilisé pour générer vos CV. Vous pourrez le modifier à tout moment.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <button
          onClick={onUpload}
          className="flex flex-col items-center gap-3 rounded-2xl border-2 border-border bg-card p-6 text-center shadow-sm transition hover:border-primary hover:shadow-md"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Upload className="h-6 w-6" />
          </div>
          <div>
            <p className="font-semibold text-foreground">Télécharger mon CV</p>
            <p className="mt-1 text-xs text-muted-foreground">PDF ou Word (.docx) — l'IA extrait les infos automatiquement</p>
          </div>
        </button>

        <button
          onClick={onManual}
          className="flex flex-col items-center gap-3 rounded-2xl border-2 border-border bg-card p-6 text-center shadow-sm transition hover:border-primary hover:shadow-md"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary/10 text-secondary">
            <PenLine className="h-6 w-6" />
          </div>
          <div>
            <p className="font-semibold text-foreground">Remplir manuellement</p>
            <p className="mt-1 text-xs text-muted-foreground">On vous guide étape par étape, une section à la fois</p>
          </div>
        </button>
      </div>

      <div className="text-center">
        <button onClick={onSkip} className="text-sm text-muted-foreground underline-offset-2 hover:text-foreground hover:underline">
          Passer pour l'instant, explorer d'abord
        </button>
      </div>
    </div>
  );
}

function UploadScreen({ uploading, onFile, onBack }: {
  uploading: boolean; onFile: (f: File) => void; onBack: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-6">
      <div>
        <button onClick={onBack} className="mb-4 text-sm text-muted-foreground hover:text-foreground">← Retour</button>
        <h2 className="font-display text-xl font-bold text-foreground">Téléchargez votre CV</h2>
        <p className="mt-1 text-sm text-muted-foreground">Formats acceptés : PDF ou Word (.docx), max 10 Mo</p>
      </div>

      <div
        onClick={() => inputRef.current?.click()}
        className="flex cursor-pointer flex-col items-center gap-4 rounded-2xl border-2 border-dashed border-border bg-muted/30 p-10 text-center transition hover:border-primary hover:bg-primary/5"
      >
        {uploading ? (
          <>
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Analyse en cours…</p>
          </>
        ) : (
          <>
            <FileText className="h-10 w-10 text-muted-foreground/60" />
            <div>
              <p className="font-semibold text-foreground">Cliquez pour choisir un fichier</p>
              <p className="text-xs text-muted-foreground">ou glissez-déposez ici</p>
            </div>
          </>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) onFile(f); }}
      />
    </div>
  );
}

function UploadReviewScreen({ data, saving, onSave, onBack }: {
  data: {
    prenom: string; nom: string; titre: string; email: string; telephone: string;
    ville: string; pays: string; resume: string;
    experiences: Experience[]; formations: Formation[];
    competences: string[]; langues: string[];
  };
  saving: boolean; onSave: () => void; onBack: () => void;
}) {
  return (
    <div className="space-y-5">
      <div>
        <button onClick={onBack} className="mb-4 text-sm text-muted-foreground hover:text-foreground">← Modifier le fichier</button>
        <h2 className="font-display text-xl font-bold text-foreground">Vérifiez les informations extraites</h2>
        <p className="mt-1 text-sm text-muted-foreground">L'IA a extrait ces données. Vous pourrez les affiner dans votre profil.</p>
      </div>

      <div className="space-y-3 rounded-xl border border-border bg-card p-5 text-sm">
        <ReviewRow label="Nom" value={`${data.prenom} ${data.nom}`.trim()} />
        <ReviewRow label="Titre" value={data.titre} />
        <ReviewRow label="Email" value={data.email} />
        <ReviewRow label="Téléphone" value={data.telephone} />
        <ReviewRow label="Ville / Pays" value={[data.ville, data.pays].filter(Boolean).join(", ")} />
        <ReviewRow label="Profil" value={data.resume ? `${data.resume.slice(0, 100)}…` : ""} />
        <ReviewRow label="Expériences" value={data.experiences.length > 0 ? `${data.experiences.length} expérience(s) détectée(s)` : ""} />
        <ReviewRow label="Formations" value={data.formations.length > 0 ? `${data.formations.length} formation(s) détectée(s)` : ""} />
        <ReviewRow label="Compétences" value={data.competences.slice(0, 5).join(", ")} />
        <ReviewRow label="Langues" value={data.langues.join(", ")} />
      </div>

      <button
        onClick={onSave}
        disabled={saving}
        className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-sm hover:opacity-90 disabled:opacity-50"
      >
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronRight className="h-4 w-4" />}
        Enregistrer et continuer
      </button>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   Shared step components
══════════════════════════════════════════════════ */

function StepCard({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
      <div>
        <h2 className="font-display text-xl font-bold text-foreground">{title}</h2>
        {hint && <p className="mt-1 text-sm text-muted-foreground">{hint}</p>}
      </div>
      {children}
    </div>
  );
}

function StepActions({ saving, onNext, onSkip }: { saving: boolean; onNext: () => void; onSkip: () => void }) {
  return (
    <div className="flex gap-3 pt-2">
      <button
        onClick={onSkip}
        className="flex-1 rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted"
      >
        Passer cette étape →
      </button>
      <button
        onClick={onNext}
        disabled={saving}
        className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50 hover:opacity-90"
      >
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronRight className="h-4 w-4" />}
        Suivant
      </button>
    </div>
  );
}

function Field({
  label, value, onChange, type = "text", placeholder, required,
}: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string; required?: boolean;
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-semibold text-foreground">{label}{required && <span className="text-destructive ml-0.5">*</span>}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
      />
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div className="flex gap-3">
      <span className="w-28 flex-shrink-0 text-muted-foreground">{label}</span>
      <span className="flex-1 text-foreground">{value}</span>
    </div>
  );
}

/* ── Experiences list ── */

const EMPTY_EXP: Experience = { poste: "", entreprise: "", periode: "", description: "" };

function ExperiencesList({ items, onChange }: { items: Experience[]; onChange: (v: Experience[]) => void }) {
  const update = (i: number, field: keyof Experience, v: string) => {
    const next = [...items];
    next[i] = { ...next[i], [field]: v };
    onChange(next);
  };
  const remove = (i: number) => onChange(items.filter((_, j) => j !== i));
  const add = () => onChange([...items, { ...EMPTY_EXP }]);

  return (
    <div className="space-y-4">
      {items.map((e, i) => (
        <div key={i} className="rounded-xl border border-border bg-background p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Expérience {i + 1}</span>
            <button onClick={() => remove(i)} className="text-muted-foreground hover:text-destructive">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
          <Field label="Poste" value={e.poste} onChange={v => update(i, "poste", v)} />
          <Field label="Entreprise" value={e.entreprise} onChange={v => update(i, "entreprise", v)} />
          <Field label="Période" value={e.periode} onChange={v => update(i, "periode", v)} placeholder="Ex. Jan. 2020 – Présent" />
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Description</label>
            <textarea
              value={e.description}
              onChange={ev => update(i, "description", ev.target.value)}
              rows={3}
              placeholder="Décrivez vos missions et réalisations…"
              className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>
      ))}
      <button
        onClick={add}
        className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border py-2.5 text-sm text-muted-foreground hover:border-primary hover:text-primary"
      >
        <Plus className="h-4 w-4" /> Ajouter une expérience
      </button>
    </div>
  );
}

/* ── Formations list ── */

const EMPTY_FMT: Formation = { diplome: "", ecole: "", annee: "" };

function FormationsList({ items, onChange }: { items: Formation[]; onChange: (v: Formation[]) => void }) {
  const update = (i: number, field: keyof Formation, v: string) => {
    const next = [...items];
    next[i] = { ...next[i], [field]: v };
    onChange(next);
  };
  const remove = (i: number) => onChange(items.filter((_, j) => j !== i));
  const add = () => onChange([...items, { ...EMPTY_FMT }]);

  return (
    <div className="space-y-4">
      {items.map((f, i) => (
        <div key={i} className="rounded-xl border border-border bg-background p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Formation {i + 1}</span>
            <button onClick={() => remove(i)} className="text-muted-foreground hover:text-destructive">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
          <Field label="Diplôme" value={f.diplome} onChange={v => update(i, "diplome", v)} />
          <Field label="École / Université" value={f.ecole} onChange={v => update(i, "ecole", v)} />
          <Field label="Année" value={f.annee} onChange={v => update(i, "annee", v)} placeholder="Ex. 2022" />
        </div>
      ))}
      <button
        onClick={add}
        className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border py-2.5 text-sm text-muted-foreground hover:border-primary hover:text-primary"
      >
        <Plus className="h-4 w-4" /> Ajouter une formation
      </button>
    </div>
  );
}

/* ── Tag input ── */

function TagInput({ label, tags, onChange, placeholder }: {
  label: string; tags: string[]; onChange: (v: string[]) => void; placeholder?: string;
}) {
  const [input, setInput] = useState("");

  const add = () => {
    const v = input.trim();
    if (v && !tags.includes(v)) onChange([...tags, v]);
    setInput("");
  };

  const remove = (i: number) => onChange(tags.filter((_, j) => j !== i));

  return (
    <div className="space-y-2">
      <label className="text-xs font-semibold text-foreground">{label}</label>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
          placeholder={placeholder}
          className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
        <button onClick={add} className="rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">
          <Plus className="h-4 w-4" />
        </button>
      </div>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((t, i) => (
            <span key={i} className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-medium text-foreground">
              {t}
              <button onClick={() => remove(i)} className="text-muted-foreground hover:text-destructive">×</button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Photo upload step ── */

function PhotoUploadStep({ photoUrl, uploading, onFile }: {
  photoUrl: string | null; uploading: boolean; onFile: (f: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex flex-col items-center gap-5">
      <div
        onClick={() => inputRef.current?.click()}
        className="relative flex h-32 w-32 cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-border bg-muted hover:border-primary"
      >
        {photoUrl ? (
          <img src={photoUrl} alt="photo" className="h-full w-full object-cover" />
        ) : uploading ? (
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        ) : (
          <Camera className="h-8 w-8 text-muted-foreground/50" />
        )}
      </div>
      <p className="text-sm text-muted-foreground text-center">
        {photoUrl ? "Cliquez pour changer la photo" : "Cliquez pour ajouter votre photo"}
        <br />
        <span className="text-xs">JPG ou PNG, max 5 Mo</span>
      </p>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/jpg"
        className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) onFile(f); }}
      />
    </div>
  );
}
