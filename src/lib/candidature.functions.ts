import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-2.5-flash";

async function callAI(messages: Array<{ role: string; content: string }>, json = true): Promise<string> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("LOVABLE_API_KEY manquante");
  const res = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      ...(json ? { response_format: { type: "json_object" } } : {}),
    }),
  });
  if (res.status === 429) throw new Error("Trop de requêtes IA. Réessayez dans un instant.");
  if (res.status === 402) throw new Error("Crédits IA épuisés sur la passerelle.");
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Erreur IA (${res.status}): ${t.slice(0, 200)}`);
  }
  const data = await res.json();
  return data?.choices?.[0]?.message?.content ?? "";
}

/* ---------- 1) Extract profile from raw CV text ---------- */

export const extractProfileFromText = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ text: z.string().min(20).max(40_000) }).parse(d))
  .handler(async ({ data }) => {
    const sys =
      "Tu es un expert RH. Extrais les informations d'un CV en JSON strict en français. " +
      "Schéma: {prenom, nom, email, telephone, titre_professionnel, resume, ville, pays, " +
      "experiences:[{poste,entreprise,date_debut,date_fin,poste_actuel,description}], " +
      "formations:[{diplome,ecole,annee}], competences:[string], langues:[string]}. " +
      "Si une info est absente, mets une chaîne vide ou un tableau vide. Ne renvoie QUE du JSON.";
    const content = await callAI([
      { role: "system", content: sys },
      { role: "user", content: `Voici le CV brut:\n\n${data.text}` },
    ], true);
    try {
      return JSON.parse(content);
    } catch {
      throw new Error("L'IA n'a pas renvoyé un JSON valide.");
    }
  });

/* ---------- 2) Generate candidature (debit + AI) ---------- */

const ProfileSchema = z.object({
  prenom: z.string().default(""),
  nom: z.string().default(""),
  email: z.string().default(""),
  telephone: z.string().default(""),
  titre_professionnel: z.string().default(""),
  resume: z.string().default(""),
  ville: z.string().default(""),
  pays: z.string().default(""),
  photo_url: z.string().nullable().optional(),
  experiences: z.array(z.any()).default([]),
  formations: z.array(z.any()).default([]),
  competences: z.array(z.string()).default([]),
  langues: z.array(z.string()).default([]),
});

const GenSchema = z.object({
  profile: ProfileSchema,
  jobOffer: z.string().min(100).max(20_000),
  companyName: z.string().max(200).optional().default(""),
  template: z.enum(["classique", "moderne", "professionnel"]),
  docType: z.enum(["cv", "lm", "cv_lm"]),
});

export const generateCandidatureContent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => GenSchema.parse(d))
  .handler(async ({ data, context }) => {
    const userId = context.userId;
    const cost = data.docType === "cv_lm" ? 2 : 1;

    // Atomic debit
    const { error: debitErr } = await supabaseAdmin.rpc("debit_credits", {
      _user_id: userId,
      _amount: cost,
      _description: `Génération candidature (${data.docType})`,
    });
    if (debitErr) {
      if (debitErr.message?.includes("INSUFFICIENT_CREDITS")) {
        throw new Error("Crédits insuffisants.");
      }
      throw new Error(debitErr.message);
    }

    const profileJson = JSON.stringify(data.profile);
    const wantCv = data.docType === "cv" || data.docType === "cv_lm";
    const wantLm = data.docType === "lm" || data.docType === "cv_lm";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let cvData: any = null;
    let lmText: string | null = null;

    try {
      if (wantCv) {
        const sys =
          "Tu es un expert en rédaction de CV. À partir d'un profil et d'une offre d'emploi, " +
          "produis un CV adapté en JSON. Reformule les expériences avec des verbes d'action, " +
          "valorise celles qui correspondent à l'offre, adapte le titre professionnel au poste. " +
          "Schéma: {titre_professionnel, resume (3-4 lignes), experiences:[{poste,entreprise,periode,description (puces avec '- ')}], " +
          "formations:[{diplome,ecole,annee}], competences:[string], langues:[string]}. Réponds en JSON STRICT.";
        const out = await callAI([
          { role: "system", content: sys },
          { role: "user", content: `PROFIL:\n${profileJson}\n\nOFFRE:\n${data.jobOffer}` },
        ], true);
        cvData = JSON.parse(out);
      }
      if (wantLm) {
        const sys =
          "Tu es un expert en rédaction de lettres de motivation. Rédige une lettre de 250-300 mots " +
          "en français, structurée en 3 paragraphes (Introduction / Valeur apportée / Conclusion). " +
          "Ton professionnel, mentionne le poste et l'entreprise. Pas de formules de salutation comme " +
          "'Madame, Monsieur' au début (elles seront ajoutées). Renvoie uniquement le texte de la lettre.";
        lmText = await callAI([
          { role: "system", content: sys },
          {
            role: "user",
            content: `Candidat: ${data.profile.prenom} ${data.profile.nom}\nEntreprise: ${data.companyName || "(non précisée)"}\nOFFRE:\n${data.jobOffer}\n\nPROFIL:\n${profileJson}`,
          },
        ], false);
      }
    } catch (err) {
      // Best effort: refund on AI failure
      await supabaseAdmin.from("user_credits").select("balance, user_id").eq("user_id", userId).maybeSingle().then(async ({ data: bal }) => {
        if (!bal) return;
        const newBal = (bal.balance ?? 0) + cost;
        await supabaseAdmin.from("user_credits").update({ balance: newBal, updated_at: new Date().toISOString() }).eq("user_id", userId);
        await supabaseAdmin.from("credit_transactions").insert({
          user_id: userId, type: "refund", amount: cost,
          description: "Remboursement échec génération", balance_after: newBal,
        });
      });
      throw err;
    }

    // Derive a job title for record-keeping (first non-empty line of the offer, truncated)
    const firstLine = data.jobOffer.split("\n").map((l) => l.trim()).find((l) => l.length > 3) ?? "Candidature";
    return {
      jobTitle: firstLine.slice(0, 120),
      cv: cvData,
      lm: lmText,
      creditsUsed: cost,
    };
  });

/* ---------- 3) Save final application (after PDFs uploaded) ---------- */

const SaveSchema = z.object({
  job_title: z.string().min(1).max(200),
  company_name: z.string().max(200).optional().default(""),
  job_offer_text: z.string().min(1).max(40_000),
  template_id: z.enum(["classique", "moderne", "professionnel"]),
  cv_generated: z.boolean(),
  lm_generated: z.boolean(),
  cv_pdf_url: z.string().nullable().optional(),
  lm_pdf_url: z.string().nullable().optional(),
  credits_used: z.number().int().min(0).max(10),
});

export const saveApplication = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => SaveSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await supabaseAdmin
      .from("applications")
      .insert({
        user_id: context.userId,
        poste: data.job_title,
        job_title: data.job_title,
        company_name: data.company_name || null,
        entreprise: data.company_name || null,
        job_offer_text: data.job_offer_text,
        offre: data.job_offer_text,
        template_id: data.template_id,
        cv_generated: data.cv_generated,
        lm_generated: data.lm_generated,
        cv_pdf_url: data.cv_pdf_url ?? null,
        lm_pdf_url: data.lm_pdf_url ?? null,
        credits_used: data.credits_used,
        status: "completed",
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: row.id };
  });