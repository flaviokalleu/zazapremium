-- Criar banco de dados se não existir (PostgreSQL)
DO $$
BEGIN
   IF NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = 'zazap2') THEN
      EXECUTE 'CREATE DATABASE zazap2';
   END IF;
END
$$;

-- Criar usuário se não existir
DO $$ 
BEGIN
   IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'zazap_user') THEN
      CREATE ROLE zazap_user LOGIN PASSWORD '99480231a';
   END IF;
END
$$;

-- Conceder privilégios
GRANT ALL PRIVILEGES ON DATABASE zazap2 TO zazap_user;
