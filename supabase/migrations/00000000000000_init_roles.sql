-- Создание пользователей для Supabase
-- Этот скрипт выполняется при инициализации PostgreSQL

-- Получаем пароль из переменной окружения (установлен в POSTGRES_PASSWORD)
-- Все пользователи будут использовать тот же пароль для простоты

-- Создаем роли если их нет
DO $$
BEGIN
  -- Роль для аутентификации
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'authenticator') THEN
    CREATE ROLE authenticator WITH LOGIN PASSWORD 'postgres';
  END IF;

  -- Роль для anon доступа
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'anon') THEN
    CREATE ROLE anon NOINHERIT;
  END IF;

  -- Роль для authenticated пользователей
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'authenticated') THEN
    CREATE ROLE authenticated NOINHERIT;
  END IF;

  -- Роль для service_role
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'service_role') THEN
    CREATE ROLE service_role NOINHERIT BYPASSRLS;
  END IF;

  -- Роль для supabase_auth_admin (используем тот же пароль)
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'supabase_auth_admin') THEN
    CREATE ROLE supabase_auth_admin WITH LOGIN CREATEDB CREATEROLE;
    ALTER ROLE supabase_auth_admin WITH PASSWORD 'postgres';
  END IF;

  -- Роль для supabase_storage_admin
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'supabase_storage_admin') THEN
    CREATE ROLE supabase_storage_admin WITH LOGIN CREATEDB;
    ALTER ROLE supabase_storage_admin WITH PASSWORD 'postgres';
  END IF;

  -- Роль для supabase_admin (superuser)
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'supabase_admin') THEN
    CREATE ROLE supabase_admin WITH LOGIN SUPERUSER CREATEDB CREATEROLE;
    ALTER ROLE supabase_admin WITH PASSWORD 'postgres';
  END IF;

  -- Устанавливаем пароль для authenticator
  ALTER ROLE authenticator WITH PASSWORD 'postgres';

END
$$;

-- Даем права authenticator чтобы он мог переключаться между ролями
GRANT anon TO authenticator;
GRANT authenticated TO authenticator;
GRANT service_role TO authenticator;

-- Даем права на базу данных
GRANT ALL ON DATABASE postgres TO supabase_auth_admin;
GRANT ALL ON DATABASE postgres TO supabase_storage_admin;
GRANT ALL ON DATABASE postgres TO supabase_admin;

-- Даем права на схему public
GRANT ALL ON SCHEMA public TO supabase_auth_admin;
GRANT ALL ON SCHEMA public TO supabase_storage_admin;
GRANT ALL ON SCHEMA public TO supabase_admin;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;

-- Устанавливаем права по умолчанию для будущих таблиц
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO supabase_auth_admin;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO supabase_storage_admin;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO supabase_admin;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;

-- Создаем схемы для Supabase сервисов
CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS storage;
CREATE SCHEMA IF NOT EXISTS realtime;
CREATE SCHEMA IF NOT EXISTS _realtime;

-- Даем права на схемы
GRANT ALL ON SCHEMA auth TO supabase_auth_admin;
GRANT ALL ON SCHEMA storage TO supabase_storage_admin;
GRANT ALL ON SCHEMA realtime TO supabase_admin;
GRANT ALL ON SCHEMA _realtime TO supabase_admin;
