import { type ReactNode } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import type { EditorCVData, Experience, Formation } from "@/lib/cv-types";

interface CVEditorProps {
  data: EditorCVData;
  onChange: (data: EditorCVData) => void;
}

export function CVEditor({ data, onChange }: CVEditorProps) {
  const set = (partial: Partial<EditorCVData>) => onChange({ ...data, ...partial });

  return (
    <Accordion
      type="multiple"
      defaultValue={["info", "profil", "experiences", "formations", "competences", "langues"]}
      className="space-y-2"
    >
      {/* ── Informations personnelles ── */}
      <AccordionItem value="info" className="rounded-xl border border-border bg-card overflow-hidden">
        <AccordionTrigger className="px-4 py-3 text-sm font-semibold hover:no-underline">
          Informations personnelles
        </AccordionTrigger>
        <AccordionContent className="px-4 pb-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Prénom">
              <Input value={data.prenom} onChange={e => set({ prenom: e.target.value })} placeholder="Jean" />
            </Field>
            <Field label="Nom">
              <Input value={data.nom} onChange={e => set({ nom: e.target.value })} placeholder="Dupont" />
            </Field>
          </div>
          <Field label="Titre professionnel">
            <Input value={data.titre} onChange={e => set({ titre: e.target.value })} placeholder="Développeur Full-Stack" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Email">
              <Input value={data.email} onChange={e => set({ email: e.target.value })} placeholder="jean@exemple.com" />
            </Field>
            <Field label="Téléphone">
              <Input value={data.telephone} onChange={e => set({ telephone: e.target.value })} placeholder="+33 6 00 00 00 00" />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Ville">
              <Input value={data.ville} onChange={e => set({ ville: e.target.value })} placeholder="Paris" />
            </Field>
            <Field label="Pays">
              <Input value={data.pays} onChange={e => set({ pays: e.target.value })} placeholder="France" />
            </Field>
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* ── Profil ── */}
      <AccordionItem value="profil" className="rounded-xl border border-border bg-card overflow-hidden">
        <AccordionTrigger className="px-4 py-3 text-sm font-semibold hover:no-underline">
          Profil / Résumé
        </AccordionTrigger>
        <AccordionContent className="px-4 pb-4">
          <Textarea
            value={data.resume}
            onChange={e => set({ resume: e.target.value })}
            placeholder="Décrivez votre profil en 3-4 lignes…"
            rows={4}
            className="resize-none"
          />
        </AccordionContent>
      </AccordionItem>

      {/* ── Expériences ── */}
      <AccordionItem value="experiences" className="rounded-xl border border-border bg-card overflow-hidden">
        <AccordionTrigger className="px-4 py-3 text-sm font-semibold hover:no-underline">
          Expériences professionnelles
          <span className="ml-auto mr-2 text-xs font-normal text-muted-foreground">
            {data.experiences.length > 0 ? `${data.experiences.length}` : ""}
          </span>
        </AccordionTrigger>
        <AccordionContent className="px-4 pb-4 space-y-3">
          {data.experiences.map((exp, i) => (
            <ExperienceForm
              key={i}
              exp={exp}
              onChange={updated => {
                const next = [...data.experiences];
                next[i] = updated;
                set({ experiences: next });
              }}
              onDelete={() => set({ experiences: data.experiences.filter((_, j) => j !== i) })}
            />
          ))}
          <Button
            variant="outline" size="sm" className="w-full"
            onClick={() => set({ experiences: [...data.experiences, { poste: "", entreprise: "", periode: "", description: "" }] })}
          >
            <Plus className="h-4 w-4 mr-1.5" /> Ajouter une expérience
          </Button>
        </AccordionContent>
      </AccordionItem>

      {/* ── Formations ── */}
      <AccordionItem value="formations" className="rounded-xl border border-border bg-card overflow-hidden">
        <AccordionTrigger className="px-4 py-3 text-sm font-semibold hover:no-underline">
          Formations
          <span className="ml-auto mr-2 text-xs font-normal text-muted-foreground">
            {data.formations.length > 0 ? `${data.formations.length}` : ""}
          </span>
        </AccordionTrigger>
        <AccordionContent className="px-4 pb-4 space-y-3">
          {data.formations.map((f, i) => (
            <FormationForm
              key={i}
              formation={f}
              onChange={updated => {
                const next = [...data.formations];
                next[i] = updated;
                set({ formations: next });
              }}
              onDelete={() => set({ formations: data.formations.filter((_, j) => j !== i) })}
            />
          ))}
          <Button
            variant="outline" size="sm" className="w-full"
            onClick={() => set({ formations: [...data.formations, { diplome: "", ecole: "", annee: "" }] })}
          >
            <Plus className="h-4 w-4 mr-1.5" /> Ajouter une formation
          </Button>
        </AccordionContent>
      </AccordionItem>

      {/* ── Compétences ── */}
      <AccordionItem value="competences" className="rounded-xl border border-border bg-card overflow-hidden">
        <AccordionTrigger className="px-4 py-3 text-sm font-semibold hover:no-underline">
          Compétences
          <span className="ml-auto mr-2 text-xs font-normal text-muted-foreground">
            {data.competences.length > 0 ? `${data.competences.length}` : ""}
          </span>
        </AccordionTrigger>
        <AccordionContent className="px-4 pb-4 space-y-2">
          {data.competences.map((c, i) => (
            <div key={i} className="flex gap-2">
              <Input
                value={c}
                onChange={e => {
                  const next = [...data.competences];
                  next[i] = e.target.value;
                  set({ competences: next });
                }}
                placeholder="Ex. React, TypeScript, Gestion de projet…"
              />
              <Button
                variant="ghost" size="icon"
                onClick={() => set({ competences: data.competences.filter((_, j) => j !== i) })}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
          <Button
            variant="outline" size="sm" className="w-full"
            onClick={() => set({ competences: [...data.competences, ""] })}
          >
            <Plus className="h-4 w-4 mr-1.5" /> Ajouter une compétence
          </Button>
        </AccordionContent>
      </AccordionItem>

      {/* ── Langues ── */}
      <AccordionItem value="langues" className="rounded-xl border border-border bg-card overflow-hidden">
        <AccordionTrigger className="px-4 py-3 text-sm font-semibold hover:no-underline">
          Langues
          <span className="ml-auto mr-2 text-xs font-normal text-muted-foreground">
            {data.langues.length > 0 ? `${data.langues.length}` : ""}
          </span>
        </AccordionTrigger>
        <AccordionContent className="px-4 pb-4 space-y-2">
          {data.langues.map((l, i) => (
            <div key={i} className="flex gap-2">
              <Input
                value={l}
                onChange={e => {
                  const next = [...data.langues];
                  next[i] = e.target.value;
                  set({ langues: next });
                }}
                placeholder="Ex. Français (natif), Anglais (courant)…"
              />
              <Button
                variant="ghost" size="icon"
                onClick={() => set({ langues: data.langues.filter((_, j) => j !== i) })}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
          <Button
            variant="outline" size="sm" className="w-full"
            onClick={() => set({ langues: [...data.langues, ""] })}
          >
            <Plus className="h-4 w-4 mr-1.5" /> Ajouter une langue
          </Button>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

/* ── Sub-forms ── */

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}

function ExperienceForm({
  exp, onChange, onDelete,
}: {
  exp: Experience;
  onChange: (e: Experience) => void;
  onDelete: () => void;
}) {
  const u = (p: Partial<Experience>) => onChange({ ...exp, ...p });
  return (
    <div className="rounded-lg border border-border bg-background p-3 space-y-2">
      <div className="flex gap-2">
        <Input
          value={exp.poste}
          onChange={e => u({ poste: e.target.value })}
          placeholder="Poste"
          className="flex-1"
        />
        <Button variant="ghost" size="icon" onClick={onDelete}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Input value={exp.entreprise} onChange={e => u({ entreprise: e.target.value })} placeholder="Entreprise" />
        <Input value={exp.periode} onChange={e => u({ periode: e.target.value })} placeholder="Ex. Jan 2022 – Présent" />
      </div>
      <Textarea
        value={exp.description}
        onChange={e => u({ description: e.target.value })}
        placeholder="Description des responsabilités et réalisations…"
        rows={3}
        className="resize-none"
      />
    </div>
  );
}

function FormationForm({
  formation, onChange, onDelete,
}: {
  formation: Formation;
  onChange: (f: Formation) => void;
  onDelete: () => void;
}) {
  const u = (p: Partial<Formation>) => onChange({ ...formation, ...p });
  return (
    <div className="rounded-lg border border-border bg-background p-3 space-y-2">
      <div className="flex gap-2">
        <Input value={formation.diplome} onChange={e => u({ diplome: e.target.value })} placeholder="Diplôme" className="flex-1" />
        <Button variant="ghost" size="icon" onClick={onDelete}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Input value={formation.ecole} onChange={e => u({ ecole: e.target.value })} placeholder="École / Université" />
        <Input value={formation.annee} onChange={e => u({ annee: e.target.value })} placeholder="Ex. 2020 ou 2018-2020" />
      </div>
    </div>
  );
}
