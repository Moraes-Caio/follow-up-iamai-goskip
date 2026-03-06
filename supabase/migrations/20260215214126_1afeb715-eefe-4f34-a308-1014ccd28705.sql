
-- Alterar colunas gender de enum para text para permitir gênero customizado
ALTER TABLE patients ALTER COLUMN gender TYPE text USING gender::text;
ALTER TABLE patients ALTER COLUMN responsible_gender TYPE text USING responsible_gender::text;
