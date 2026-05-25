
-- Add columns to applications
ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS job_title TEXT,
  ADD COLUMN IF NOT EXISTS company_name TEXT,
  ADD COLUMN IF NOT EXISTS job_offer_text TEXT,
  ADD COLUMN IF NOT EXISTS template_id TEXT NOT NULL DEFAULT 'classique',
  ADD COLUMN IF NOT EXISTS cv_generated BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS lm_generated BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS cv_pdf_url TEXT,
  ADD COLUMN IF NOT EXISTS lm_pdf_url TEXT,
  ADD COLUMN IF NOT EXISTS credits_used INTEGER NOT NULL DEFAULT 0;

-- Storage bucket for generated PDFs (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('candidatures', 'candidatures', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "own candidatures read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'candidatures' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "own candidatures insert"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'candidatures' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "own candidatures update"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'candidatures' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "own candidatures delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'candidatures' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Atomic credit debit function
CREATE OR REPLACE FUNCTION public.debit_credits(
  _user_id UUID,
  _amount INTEGER,
  _description TEXT
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _new_balance INTEGER;
BEGIN
  IF _amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be positive';
  END IF;

  UPDATE public.user_credits
    SET balance = balance - _amount,
        updated_at = now()
    WHERE user_id = _user_id AND balance >= _amount
    RETURNING balance INTO _new_balance;

  IF _new_balance IS NULL THEN
    RAISE EXCEPTION 'INSUFFICIENT_CREDITS';
  END IF;

  INSERT INTO public.credit_transactions (user_id, type, amount, description, balance_after)
  VALUES (_user_id, 'debit', -_amount, _description, _new_balance);

  RETURN _new_balance;
END;
$$;
