
REVOKE EXECUTE ON FUNCTION public.debit_credits(UUID, INTEGER, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.debit_credits(UUID, INTEGER, TEXT) TO service_role;
