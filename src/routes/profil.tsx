import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Plus, Trash2, X, Upload, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { DashboardLayout } from "@/components/dashboard-layout";
import { cropToSquare } from "@/lib/image-utils";

export const Route = createFileRoute("/profil")({
  component: ProfilPage,
});

type Experience = {
  poste: string;
  entreprise: string;
  date_debut: string;
  date_fin: string;
  poste_actuel: boolean;
  description: string;
};

type Formation = {
  diplome: string;
  ecole: string;
  annee: string;
};

type ProfileForm = {
  prenom: string;
  nom: string;
  email: string;
  telephone: string;
  titre_professionnel: string;
  ville: string;
  pays: string;
  resume: string;
  photo_url: string | null;
  experiences: Experience[];
  formations: Formation[];
  competences: string[];
  langues: string[];
};

const emptyExperience: Experience = {
  poste: "",
  entreprise: "",
  date_debut: "",
  date_fin: "",
  poste_actuel: false,
  description: "",
};

const emptyFormation: Formation = { diplome: "", ecole: "", annee: "" };

const initialForm: ProfileForm = {
  prenom: "",
  nom: "",
  email: "",
  telephone: "",
  titre_professionnel: "",
  ville: "",
  pays: "",
  resume: "",
  photo_url: null,
  experiences: [],
  formations: [],
  competences: [],
  langues: [],
};

function wordCount(s: string) {
  return s.trim() ? s.trim().split(/\s+/).length : 0;
}

function ProfilPage() {
  const { user } = useAuth();
  const [form, setForm] = useState<ProfileForm>(initialForm);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const dirtyRef = useRef(false);
  const formRef = useRef(form);
  formRef.current = form;

  // Load profile
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) {
        setForm({
          prenom: data.prenom ?? "",
          nom: data.nom ?? "",
          email: data.email ?? "",
          telephone: data.telephone ?? "",
          titre_professionnel: data.titre_professionnel ?? "",
          ville: data.ville ?? "",
          pays: data.pays ?? "",
          resume: data.resume ?? "",
          photo_url: data.photo_url ?? null,
          experiences: (data.experiences as Experience[]) ?? [],
          formations: (data.formations as Formation[]) ?? [],
          competences: (data.competences as string[]) ?? [],
          langues: (data.langues as string[]) ?? [],
        });
      }
      setLoaded(true);
    })();
  }, [user]);

  const update = useCallback(<K extends keyof ProfileForm>(key: K, value: ProfileForm[K]) => {
    dirtyRef.current = true;
    setForm((f) => ({ ...f, [key]: value }));
  }, []);

  const save = useCallback(
    async (silent = false) => {
      if (!user) return;
      setSaving(true);
      const f = formRef.current;
      const { error } = await supabase
        .from("user_profiles")
        .update({
          prenom: f.prenom,
          nom: f.nom,
          email: f.email,
          telephone: f.telephone,
          titre_professionnel: f.titre_professionnel || null,
          ville: f.ville || null,
          pays: f.pays || null,
          resume: f.resume || null,
          photo_url: f.photo_url,
          experiences: f.experiences,
          formations: f.formations,
          competences: f.competences,
          langues: f.langues,
        })
        .eq("user_id", user.id);
      setSaving(false);
      if (error) {
        toast.error("Échec de la sauvegarde", { description: error.message });
        return false;
      }
      dirtyRef.current = false;
      if (!silent) toast.success("Profil enregistré avec succès");
      return true;
    },
    [user],
  );

  // Autosave every 30s if dirty
  useEffect(() => {
    if (!loaded || !user) return;
    const id = setInterval(() => {
      if (dirtyRef.current) save(true);
    }, 30_000);
    return () => clearInterval(id);
  }, [loaded, user, save]);

  const handlePhoto = async (file: File) => {
    if (!user) return;
    if (!["image/jpeg", "image/png", "image/jpg"].includes(file.type)) {
      toast.error("Format invalide", { description: "Utilisez JPG ou PNG." });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image trop lourde", { description: "Maximum 5 Mo." });
      return;
    }
    setUploading(true);
    try {
      const cropped = await cropToSquare(file);
      const path = `${user.id}/avatar-${Date.now()}.png`;
      const { error } = await supabase.storage
        .from("avatars")
        .upload(path, cropped, { contentType: "image/png", upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      update("photo_url", data.publicUrl);
      toast.success("Photo mise à jour");
    } catch (e) {
      toast.error("Échec de l'upload", { description: (e as Error).message });
    } finally {
      setUploading(false);
    }
  };

  const resumeWords = useMemo(() => wordCount(form.resume), [form.resume]);

  if (!loaded) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          Chargement…
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-3xl space-y-8">
        <header>
          <h1 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
            Mon profil
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Ces informations seront utilisées pour générer vos CV et lettres.
          </p>
        </header>

        {/* Photo */}
        <Card title="Photo de profil">
          <div className="flex items-center gap-5">
            <div className="h-24 w-24 overflow-hidden rounded-full border border-border bg-muted">
              {form.photo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={form.photo_url} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-muted-foreground text-2xl font-bold">
                  {form.prenom?.[0] ?? "?"}
                </div>
              )}
            </div>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-muted">
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              Changer la photo
              <input
                type="file"
                accept="image/jpeg,image/png"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handlePhoto(f);
                  e.target.value = "";
                }}
              />
            </label>
          </div>
        </Card>

        {/* Identité */}
        <Card title="Informations personnelles">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Prénom">
              <input className={inputCls} value={form.prenom} onChange={(e) => update("prenom", e.target.value)} />
            </Field>
            <Field label="Nom">
              <input className={inputCls} value={form.nom} onChange={(e) => update("nom", e.target.value)} />
            </Field>
            <Field label="Email professionnel">
              <input type="email" className={inputCls} value={form.email} onChange={(e) => update("email", e.target.value)} />
            </Field>
            <Field label="Téléphone">
              <input className={inputCls} value={form.telephone} onChange={(e) => update("telephone", e.target.value)} />
            </Field>
            <Field label="Titre professionnel" hint="Ex : Comptable, Ingénieur Commercial">
              <input className={inputCls} value={form.titre_professionnel} onChange={(e) => update("titre_professionnel", e.target.value)} />
            </Field>
            <Field label="Ville">
              <input className={inputCls} value={form.ville} onChange={(e) => update("ville", e.target.value)} />
            </Field>
            <Field label="Pays">
              <input className={inputCls} value={form.pays} onChange={(e) => update("pays", e.target.value)} />
            </Field>
          </div>
        </Card>

        {/* Résumé */}
        <Card title="Résumé professionnel">
          <textarea
            rows={5}
            className={inputCls}
            value={form.resume}
            onChange={(e) => {
              const words = e.target.value.trim().split(/\s+/).filter(Boolean);
              if (words.length > 300) return;
              update("resume", e.target.value);
            }}
            placeholder="Quelques phrases décrivant votre parcours et votre valeur ajoutée."
          />
          <p className="mt-2 text-xs text-muted-foreground">{resumeWords} / 300 mots</p>
        </Card>

        {/* Expériences */}
        <Card
          title="Expériences"
          action={
            <button
              onClick={() => update("experiences", [...form.experiences, { ...emptyExperience }])}
              className="inline-flex items-center gap-1 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/15"
            >
              <Plus className="h-3.5 w-3.5" /> Ajouter
            </button>
          }
        >
          {form.experiences.length === 0 && (
            <p className="text-sm text-muted-foreground">Aucune expérience ajoutée.</p>
          )}
          <div className="space-y-4">
            {form.experiences.map((exp, i) => (
              <div key={i} className="rounded-xl border border-border p-4">
                <div className="flex justify-end">
                  <button
                    onClick={() => update("experiences", form.experiences.filter((_, j) => j !== i))}
                    className="text-muted-foreground hover:text-destructive"
                    aria-label="Supprimer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Poste">
                    <input className={inputCls} value={exp.poste} onChange={(e) => updateItem("experiences", i, "poste", e.target.value, form, update)} />
                  </Field>
                  <Field label="Entreprise">
                    <input className={inputCls} value={exp.entreprise} onChange={(e) => updateItem("experiences", i, "entreprise", e.target.value, form, update)} />
                  </Field>
                  <Field label="Date de début">
                    <input type="month" className={inputCls} value={exp.date_debut} onChange={(e) => updateItem("experiences", i, "date_debut", e.target.value, form, update)} />
                  </Field>
                  <Field label="Date de fin">
                    <input
                      type="month"
                      className={inputCls}
                      value={exp.date_fin}
                      disabled={exp.poste_actuel}
                      onChange={(e) => updateItem("experiences", i, "date_fin", e.target.value, form, update)}
                    />
                  </Field>
                </div>
                <label className="mt-3 inline-flex items-center gap-2 text-sm text-foreground">
                  <input
                    type="checkbox"
                    checked={exp.poste_actuel}
                    onChange={(e) => {
                      const next = [...form.experiences];
                      next[i] = { ...next[i], poste_actuel: e.target.checked, date_fin: e.target.checked ? "" : next[i].date_fin };
                      update("experiences", next);
                    }}
                  />
                  Poste actuel
                </label>
                <Field label="Description des missions" className="mt-3">
                  <textarea rows={3} className={inputCls} value={exp.description} onChange={(e) => updateItem("experiences", i, "description", e.target.value, form, update)} />
                </Field>
              </div>
            ))}
          </div>
        </Card>

        {/* Formations */}
        <Card
          title="Formations"
          action={
            <button
              onClick={() => update("formations", [...form.formations, { ...emptyFormation }])}
              className="inline-flex items-center gap-1 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/15"
            >
              <Plus className="h-3.5 w-3.5" /> Ajouter
            </button>
          }
        >
          {form.formations.length === 0 && (
            <p className="text-sm text-muted-foreground">Aucune formation ajoutée.</p>
          )}
          <div className="space-y-4">
            {form.formations.map((f, i) => (
              <div key={i} className="rounded-xl border border-border p-4">
                <div className="flex justify-end">
                  <button
                    onClick={() => update("formations", form.formations.filter((_, j) => j !== i))}
                    className="text-muted-foreground hover:text-destructive"
                    aria-label="Supprimer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <Field label="Diplôme">
                    <input className={inputCls} value={f.diplome} onChange={(e) => updateItem("formations", i, "diplome", e.target.value, form, update)} />
                  </Field>
                  <Field label="École">
                    <input className={inputCls} value={f.ecole} onChange={(e) => updateItem("formations", i, "ecole", e.target.value, form, update)} />
                  </Field>
                  <Field label="Année">
                    <input className={inputCls} value={f.annee} onChange={(e) => updateItem("formations", i, "annee", e.target.value, form, update)} />
                  </Field>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Compétences */}
        <Card title="Compétences">
          <TagInput
            values={form.competences}
            onChange={(v) => update("competences", v)}
            placeholder="Tapez une compétence puis Entrée"
          />
        </Card>

        {/* Langues */}
        <Card title="Langues">
          <TagInput
            values={form.langues}
            onChange={(v) => update("langues", v)}
            placeholder="Ex : Français, Anglais"
          />
        </Card>

        {/* Save */}
        <div className="sticky bottom-20 z-10 flex justify-end md:bottom-4">
          <button
            onClick={() => save(false)}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition hover:opacity-90 disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Enregistrer
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}

/* ---------- helpers ---------- */

const inputCls =
  "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50";

function Card({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-card p-5 shadow-sm sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="font-display text-base font-bold text-foreground sm:text-lg">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function Field({
  label,
  hint,
  className,
  children,
}: {
  label: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`block ${className ?? ""}`}>
      <span className="mb-1 block text-xs font-semibold text-foreground">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-muted-foreground">{hint}</span>}
    </label>
  );
}

function updateItem<K extends "experiences" | "formations">(
  key: K,
  index: number,
  field: string,
  value: string,
  form: ProfileForm,
  update: <KK extends keyof ProfileForm>(k: KK, v: ProfileForm[KK]) => void,
) {
  const arr = [...(form[key] as Array<Record<string, unknown>>)];
  arr[index] = { ...arr[index], [field]: value };
  update(key, arr as ProfileForm[K]);
}

function TagInput({
  values,
  onChange,
  placeholder,
}: {
  values: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
}) {
  const [text, setText] = useState("");
  const add = () => {
    const v = text.trim();
    if (!v) return;
    if (values.includes(v)) {
      setText("");
      return;
    }
    onChange([...values, v]);
    setText("");
  };
  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {values.map((v) => (
          <span
            key={v}
            className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary"
          >
            {v}
            <button
              type="button"
              onClick={() => onChange(values.filter((x) => x !== v))}
              className="hover:text-destructive"
              aria-label={`Retirer ${v}`}
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
      </div>
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            add();
          } else if (e.key === "Backspace" && !text && values.length) {
            onChange(values.slice(0, -1));
          }
        }}
        onBlur={add}
        placeholder={placeholder}
        className={`${inputCls} mt-3`}
      />
    </div>
  );
}

