-- Remove SELECT policy on otp_verifications so OTP codes are never readable by clients.
-- All OTP reads/writes go through server functions using the service role.
DROP POLICY IF EXISTS "own otp select" ON public.otp_verifications;
