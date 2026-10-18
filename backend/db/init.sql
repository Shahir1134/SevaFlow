-- HealthConnect India — PostgreSQL init script
-- Runs once on first container start (when pgdata volume is empty)
-- This enables the pgvector extension required for embedding storage

CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_trgm;  -- for text search on provider names

-- Verify
SELECT extname, extversion FROM pg_extension WHERE extname IN ('vector', 'uuid-ossp', 'pg_trgm');
