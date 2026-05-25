import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const sendSchema = z.object({
  prenom: z.string().min(1).max(80),
  telephone: z.string().min(6).max(20),
});

export const sendOtp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => sendSchema.parse(d))
  .handler(async ({ data, context }) => {
    const userId = context.userId;
    // Rate-limit: max 1 send / 60s
    const { data: last } = await supabaseAdmin
      .from("otp_verifications")
      .select("created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (last && Date.now() - new Date(last.created_at).getTime() < 60_000) {
      throw new Error("Veuillez patienter avant de redemander un code.");
    }

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const { error: insErr } = await supabaseAdmin.from("otp_verifications").insert({
      user_id: userId,
      telephone: data.telephone,
      otp_code: otp,
      expires_at: expiresAt,
    });
    if (insErr) throw new Error(insErr.message);

    const url = process.env.GHL_WEBHOOK_URL;
    if (!url) throw new Error("Webhook non configuré.");
    try {
      await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prenom: data.prenom,
          telephone: data.telephone,
          otp,
          source: "cvfacile",
        }),
      });
    } catch (e) {
      console.error("Webhook GHL failed", e);
    }
    return { ok: true, expiresAt };
  });

const verifySchema = z.object({ code: z.string().regex(/^\d{6}$/) });

export const verifyOtp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => verifySchema.parse(d))
  .handler(async ({ data, context }) => {
    const userId = context.userId;
    const { data: rec, error } = await supabaseAdmin
      .from("otp_verifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error || !rec) throw new Error("Aucun code en attente. Renvoyez un code.");

    if (rec.blocked_until && new Date(rec.blocked_until) > new Date()) {
      throw new Error("Trop de tentatives. Réessayez plus tard.");
    }
    if (rec.verified) throw new Error("Code déjà utilisé.");
    if (new Date(rec.expires_at) < new Date()) {
      throw new Error("Code expiré. Renvoyez un nouveau code.");
    }

    if (rec.otp_code !== data.code) {
      const newAttempts = rec.attempts + 1;
      const updates: Record<string, unknown> = { attempts: newAttempts };
      if (newAttempts >= 3) {
        updates.blocked_until = new Date(Date.now() + 30 * 60 * 1000).toISOString();
      }
      await supabaseAdmin.from("otp_verifications").update(updates).eq("id", rec.id);
      throw new Error(
        newAttempts >= 3
          ? "Trop de tentatives. Compte temporairement bloqué 30 min."
          : `Code incorrect (${3 - newAttempts} tentative(s) restante(s)).`,
      );
    }

    // Mark verified
    await supabaseAdmin
      .from("otp_verifications")
      .update({ verified: true })
      .eq("id", rec.id);
    await supabaseAdmin
      .from("user_profiles")
      .update({ whatsapp_verified: true })
      .eq("user_id", userId);

    // Grant 4 credits if first verification
    const { data: credits } = await supabaseAdmin
      .from("user_credits")
      .select("balance")
      .eq("user_id", userId)
      .maybeSingle();
    const currentBalance = credits?.balance ?? 0;
    const { data: priorTx } = await supabaseAdmin
      .from("credit_transactions")
      .select("id")
      .eq("user_id", userId)
      .eq("type", "welcome_bonus")
      .limit(1);
    if (!priorTx || priorTx.length === 0) {
      const newBalance = currentBalance + 4;
      await supabaseAdmin
        .from("user_credits")
        .update({ balance: newBalance })
        .eq("user_id", userId);
      await supabaseAdmin.from("credit_transactions").insert({
        user_id: userId,
        type: "welcome_bonus",
        amount: 4,
        description: "Crédits offerts à l'inscription",
        balance_after: newBalance,
      });
    }
    return { ok: true };
  });