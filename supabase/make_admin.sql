-- Make specific user an admin
UPDATE public.profiles
SET role = 'admin'
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'jaydensaxton.c@outlook.com'
);

