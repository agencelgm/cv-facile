REVOKE EXECUTE ON FUNCTION public.credit_payment(TEXT) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.debit_credits(UUID, INTEGER, TEXT) FROM PUBLIC, anon, authenticated;