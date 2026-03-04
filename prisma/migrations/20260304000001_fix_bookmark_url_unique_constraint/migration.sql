-- Drop the broken unique constraint that incorrectly prevents more than one
-- non-primary URL per bookmark (effectively limiting to max 2 URLs total).
-- Primary URL enforcement is handled in application logic instead.

DROP INDEX IF EXISTS "BookmarkUrl_bookmarkId_isPrimary_key";
