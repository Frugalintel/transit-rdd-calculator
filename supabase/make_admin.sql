-- Make specific user the owner admin account
UPDATE public.profiles
SET role = 'admin',
    status = 'active',
    is_owner = true
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'jaydensaxton.c@outlook.com'
);

-- Ensure no second owner remains.
UPDATE public.profiles
SET is_owner = false
WHERE id NOT IN (
  SELECT id FROM auth.users WHERE email = 'jaydensaxton.c@outlook.com'
)
AND is_owner = true;

