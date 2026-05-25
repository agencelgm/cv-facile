import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "crypto";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const Route = createFileRoute("/api/public/chariow-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.CHARIOW_WEBHOOK_SECRET;
        if (!secret) return new Response("Missing secret", { status: 500 });

        const signature =
          request.headers.get("x-chariow-signature") ||
          request.headers.get("chariow-signature") ||
          request.headers.get("x-webhook-signature");
        const body = await request.text();

        if (!signature) return new Response("Missing signature", { status: 401 });

        const expected = createHmac("sha256", secret).update(body).digest("hex");
        let valid = false;
        try {
          const a = Buffer.from(signature);
          const b = Buffer.from(expected);
          valid = a.length === b.length && timingSafeEqual(a, b);
        } catch {
          valid = false;
        }
        if (!valid) return new Response("Invalid signature", { status: 401 });

        let payload: any;
        try {
          payload = JSON.parse(body);
        } catch {
          return new Response("Invalid JSON", { status: 400 });
        }

        const eventType: string = payload.event || payload.type || "";
        const session = payload.data?.object || payload.data || payload.session || payload;
        const sessionId: string | undefined =
          session?.id || session?.session_id || payload?.session_id;
        const status: string | undefined =
          session?.status || session?.payment_status || payload?.status;

        if (!sessionId) return new Response("Missing session id", { status: 400 });

        const isSuccess =
          /success|completed|paid|succeeded/i.test(eventType) ||
          /success|completed|paid|succeeded/i.test(status ?? "");
        const isFailed =
          /fail|cancel|expired/i.test(eventType) ||
          /fail|cancel|expired/i.test(status ?? "");

        if (isSuccess) {
          const { error } = await supabaseAdmin.rpc("credit_payment", {
            _session_id: sessionId,
          });
          if (error) {
            console.error("credit_payment error", error);
            return new Response("DB error", { status: 500 });
          }
        } else if (isFailed) {
          await supabaseAdmin
            .from("payments")
            .update({ status: "failed" })
            .eq("chariow_session_id", sessionId);
        }

        return new Response("ok");
      },
    },
  },
});
