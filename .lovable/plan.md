## Objectif

Permettre de tester l'application sans passer par l'étape de vérification WhatsApp (OTP) à l'inscription. Le code reste en place et sera réactivé plus tard.

## Changements

### 1. `src/routes/inscription.tsx`
- Retirer le stepper en 2 étapes : après création du compte Supabase (`supabase.auth.signUp`), rediriger directement vers `/dashboard`.
- Ne plus appeler `sendOtp` ni afficher `Step2`.
- Conserver le composant `Step2` et toute la logique OTP dans le fichier (commentés ou simplement non utilisés) pour réactivation rapide.

### 2. Crédits offerts (4 crédits)
Actuellement, les 4 crédits offerts sont probablement attribués après vérification OTP dans `verifyOtp` (server function). Comme on saute cette étape :
- Option retenue : modifier le trigger `handle_new_user` (migration SQL) pour initialiser `user_credits.balance = 4` au lieu de `0`, afin que les nouveaux comptes de test aient immédiatement des crédits utilisables.
- Lors de la réactivation de l'OTP, on remettra `balance = 0` et on laissera `verifyOtp` créditer les 4 crédits.

### 3. Aucun autre changement
- Pas de modification de `otp.functions.ts`, `connexion.tsx`, ni des autres routes.
- Les tables `otp_verifications`, secrets `GHL_WEBHOOK_URL`, etc. restent en place.

## Réactivation future

Pour remettre l'OTP : restaurer le flux 2 étapes dans `inscription.tsx` (un seul fichier à éditer) et créer une migration qui repasse le défaut de `user_credits.balance` à `0`.
