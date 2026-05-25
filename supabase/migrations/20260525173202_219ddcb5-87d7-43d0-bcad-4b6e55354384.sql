CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.user_profiles (user_id, prenom, nom, email, telephone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'prenom', ''),
    COALESCE(NEW.raw_user_meta_data->>'nom', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'telephone', '')
  );
  INSERT INTO public.user_credits (user_id, balance) VALUES (NEW.id, 4);
  INSERT INTO public.credit_transactions (user_id, type, amount, description, balance_after)
  VALUES (NEW.id, 'bonus', 4, 'Crédits de bienvenue', 4);
  RETURN NEW;
END;
$function$;