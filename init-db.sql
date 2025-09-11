-- Criar banco de dados se não existir
CREATE DATABASE IF NOT EXISTS zazap2;

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
