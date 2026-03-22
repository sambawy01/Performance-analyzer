-- 00016_create_ai_queries.sql
-- Natural language query log — tracks what coaches ask and the generated SQL.

CREATE TABLE ai_queries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  query_text text NOT NULL,
  generated_sql text,
  result_data jsonb,
  ai_narrative text,
  source text NOT NULL DEFAULT 'web_app' CHECK (source IN ('web_app', 'whatsapp')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_ai_queries_user ON ai_queries(user_id);

COMMENT ON TABLE ai_queries IS 'NL query audit log. Tracks coach questions, generated SQL, and AI responses.';
