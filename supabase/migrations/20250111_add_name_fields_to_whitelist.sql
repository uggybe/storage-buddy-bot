-- Add last_name and first_name fields to whitelist table
ALTER TABLE public.whitelist
ADD COLUMN IF NOT EXISTS last_name TEXT,
ADD COLUMN IF NOT EXISTS first_name TEXT;

-- Make 'name' field nullable (it was NOT NULL before)
ALTER TABLE public.whitelist
ALTER COLUMN name DROP NOT NULL;

-- Migrate existing data from 'name' field to last_name and first_name
-- Split by space: first word = last_name, rest = first_name
UPDATE public.whitelist
SET
  last_name = SPLIT_PART(name, ' ', 1),
  first_name = CASE
    WHEN array_length(string_to_array(name, ' '), 1) > 1
    THEN substring(name from length(SPLIT_PART(name, ' ', 1)) + 2)
    ELSE NULL
  END
WHERE name IS NOT NULL AND name != '';

-- Add comment to explain the fields
COMMENT ON COLUMN public.whitelist.last_name IS 'Фамилия пользователя (опционально)';
COMMENT ON COLUMN public.whitelist.first_name IS 'Имя и отчество пользователя (опционально)';
COMMENT ON COLUMN public.whitelist.name IS 'Старое поле для имени (deprecated, используйте last_name и first_name)';
