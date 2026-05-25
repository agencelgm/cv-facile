import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { getRequestHost } from "@tanstack/react-start/server";

const PACKS = {
  starter: { credits: 10, amount: 1000 },
  pro: { credits: 55, amount: 5000 },
  premium: { credits: 120, amount: 10000 },
} as const;

const Input = z.union([
  z.object({ pack: z.enum(["starter", "pro", "premium"]) }),
  z.object({ custom_amount: z.number().int().min(1000).max(1000000) }),
]);

export const createPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => Input.parse(input))
  .handler(async ({ data, context }) => {
    const { userId } = context;

    let amount_fcfa: number;
    let credits_purchased: number;

    if ("pack" in data) {
      const p = PACKS[data.pack];
      amount_fcfa = p.amount;
      credits_purchased = p.credits;
    } else {
      amount_fcfa = data.custom_amount;
      credits_purchased = Math.floor(data.custom_amount / 100);
    }

    const apiKey = process.env.CHARIOW_API_KEY;
    if (!apiKey) throw new Error("CHARIOW_API_KEY manquant");

    const host = getRequestHost();
    const protocol = host.startsWith("localhost") ? "http" : "https";
    const origin = `${protocol}://${host}`;

    // Create a pending payment record first
    const { data: payment, error: insErr } = await supabaseAdmin
      .from("payments")
      .insert({
        user_id: userId,
        amount_fcfa,
        credits_purchased,
        status: "pending",
      })
      .select("id")
      .single();
    if (insErr) throw new Error(insErr.message);

    // Call Chariow to create a checkout session
    const chariowRes = await fetch("https://api.chariow.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: amount_fcfa,
        currency: "XOF",
        description: `${credits_purchased} crédits CVFacile`,
        success_url: `${origin}/credits?status=success&payment_id=${payment.id}`,
        cancel_url: `${origin}/credits?status=cancel&payment_id=${payment.id}`,
        metadata: {
          payment_id: payment.id,
          user_id: userId,
          credits_purchased,
        },
      }),
    });

    if (!chariowRes.ok) {
      const text = await chariowRes.text().catch(() => "");
      await supabaseAdmin
        .from("payments")
        .update({ status: "failed" })
        .eq("id", payment.id);
      throw new Error(`Chariow error: ${chariowRes.status} ${text}`);
    }

    const session = (await chariowRes.json()) as {
      id?: string;
      session_id?: string;
      url?: string;
      checkout_url?: string;
      payment_url?: string;
    };

    const sessionId = session.id ?? session.session_id;
    const checkoutUrl = session.url ?? session.checkout_url ?? session.payment_url;

    if (!sessionId || !checkoutUrl) {
      throw new Error("Réponse Chariow invalide");
    }

    await supabaseAdmin
      .from("payments")
      .update({ chariow_session_id: sessionId })
      .eq("id", payment.id);

    return { checkout_url: checkoutUrl };
  });
