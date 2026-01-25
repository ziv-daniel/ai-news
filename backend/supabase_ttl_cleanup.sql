-- AI News RAG - Article TTL Cleanup
-- This script sets up automatic deletion of articles older than 6 hours

-- Create a function to delete old articles
CREATE OR REPLACE FUNCTION cleanup_old_articles()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM articles
  WHERE collected_at < NOW() - INTERVAL '6 hours';

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  RAISE NOTICE 'Deleted % old articles', deleted_count;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- To run manually:
-- SELECT cleanup_old_articles();

-- To set up automatic cleanup with pg_cron (requires pg_cron extension):
-- Run this in Supabase SQL Editor:

-- Enable pg_cron extension (if not already enabled)
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule cleanup to run every hour
-- SELECT cron.schedule(
--   'cleanup-old-articles',    -- job name
--   '0 * * * *',               -- every hour at minute 0
--   'SELECT cleanup_old_articles();'
-- );

-- To view scheduled jobs:
-- SELECT * FROM cron.job;

-- To remove a scheduled job:
-- SELECT cron.unschedule('cleanup-old-articles');

-- Alternative: Use Supabase Edge Function with a cron trigger
-- This is the recommended approach for Supabase hosted projects
