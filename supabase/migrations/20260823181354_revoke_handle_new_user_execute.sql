/*
# Revoke public execute on handle_new_user trigger function

1. Security
- Revoke EXECUTE on handle_new_user() from anon and authenticated roles.
- This function is only meant to be called by the database trigger on auth.users, not via the REST API.
*/

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;
