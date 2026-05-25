CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  chariow_session_id TEXT UNIQUE,
  amount_fcfa INTEGER NOT NULL,
  credits_purchased INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own payments select" ON public.payments
  FOR SELECT USING (auth.uid() = user_id);

CREATE INDEX payments_user_id_idx ON public.payments(user_id);
CREATE INDEX payments_session_idx ON public.payments(chariow_session_id);

CREATE TRIGGER payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Function to atomically credit a user after a successful payment
CREATE OR REPLACE FUNCTION public.credit_payment(_session_id TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _payment RECORD;
  _new_balance INTEGER;
BEGIN
  SELECT * INTO _payment FROM public.payments
    WHERE chariow_session_id = _session_id
    FOR UPDATE;

  IF _payment IS NULL THEN
    RAISE EXCEPTION 'PAYMENT_NOT_FOUND';
  END IF;

  IF _payment.status = 'completed' THEN
    RETURN; -- idempotent
  END IF;

  UPDATE public.user_credits
    SET balance = balance + _payment.credits_purchased,
        updated_at = now()
    WHERE user_id = _payment.user_id
    RETURNING balance INTO _new_balance;

  IF _new_balance IS NULL THEN
    INSERT INTO public.user_credits (user_id, balance)
      VALUES (_payment.user_id, _payment.credits_purchased)
      RETURNING balance INTO _new_balance;
  END IF;

  INSERT INTO public.credit_transactions (user_id, type, amount, description, balance_after)
    VALUES (_payment.user_id, 'purchase', _payment.credits_purchased,
            'Achat de ' || _payment.credits_purchased || ' crédits (' || _payment.amount_fcfa || ' FCFA)',
            _new_balance);

  UPDATE public.payments SET status = 'completed', updated_at = now()
    WHERE id = _payment.id;
END;
$$;