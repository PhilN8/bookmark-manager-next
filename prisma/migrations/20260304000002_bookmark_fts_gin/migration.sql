-- Migration: full-text search support on Bookmark
-- Adds a tsvector column, a trigger to keep it up-to-date, and a GIN index.

-- 1. Add the tsvector column (nullable so existing rows are backfilled below)
ALTER TABLE "Bookmark"
  ADD COLUMN IF NOT EXISTS "searchVector" tsvector;

-- 2. Back-fill existing rows
UPDATE "Bookmark"
SET "searchVector" = to_tsvector(
  'english',
  coalesce(title, '') || ' ' || coalesce(description, '')
);

-- 3. GIN index for fast full-text lookups
CREATE INDEX IF NOT EXISTS "Bookmark_searchVector_idx"
  ON "Bookmark" USING gin("searchVector");

-- 4. Trigger function: regenerate searchVector on INSERT or UPDATE
CREATE OR REPLACE FUNCTION bookmark_search_vector_update()
RETURNS trigger AS $$
BEGIN
  NEW."searchVector" := to_tsvector(
    'english',
    coalesce(NEW.title, '') || ' ' || coalesce(NEW.description, '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Attach trigger to the table (drop first to make migration re-runnable)
DROP TRIGGER IF EXISTS bookmark_search_vector_trigger ON "Bookmark";

CREATE TRIGGER bookmark_search_vector_trigger
BEFORE INSERT OR UPDATE OF title, description
ON "Bookmark"
FOR EACH ROW
EXECUTE FUNCTION bookmark_search_vector_update();
