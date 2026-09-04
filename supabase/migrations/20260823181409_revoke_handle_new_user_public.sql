/*
# Revoke public execute on handle_new_user (complete)

1. Security
- Revoke EXECUTE from PUBLIC role (covers all roles by default).
- Only the trigger on auth.users (running as superuser) should call this function.
*/

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
