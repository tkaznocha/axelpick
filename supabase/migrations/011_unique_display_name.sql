-- Enforce case-insensitive uniqueness on display names
CREATE UNIQUE INDEX users_display_name_lower_idx ON public.users (lower(display_name));
