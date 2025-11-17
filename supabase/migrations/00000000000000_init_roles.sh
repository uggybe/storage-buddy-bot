#!/bin/bash
set -e

# Скрипт для создания пользователей Supabase
# Выполняется при инициализации PostgreSQL

echo "Creating Supabase roles and users..."

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
  -- Создаем роли если их нет
  DO \$\$
  BEGIN
    -- Роль для аутентификации
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'authenticator') THEN
      CREATE ROLE authenticator WITH LOGIN PASSWORD '$POSTGRES_PASSWORD';
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

    -- Роль для supabase_auth_admin
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'supabase_auth_admin') THEN
      CREATE ROLE supabase_auth_admin WITH LOGIN PASSWORD '$POSTGRES_PASSWORD';
    END IF;

    -- Роль для supabase_storage_admin
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'supabase_storage_admin') THEN
      CREATE ROLE supabase_storage_admin WITH LOGIN PASSWORD '$POSTGRES_PASSWORD';
    END IF;

    -- Роль для supabase_admin
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'supabase_admin') THEN
      CREATE ROLE supabase_admin WITH LOGIN PASSWORD '$POSTGRES_PASSWORD' SUPERUSER;
    END IF;
  END
  \$\$;

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

  -- Устанавливаем права по умолчанию
  ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO supabase_auth_admin;
  ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO supabase_storage_admin;
  ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO supabase_admin;
  ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO anon;
  ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
EOSQL

echo "Supabase roles created successfully!"
