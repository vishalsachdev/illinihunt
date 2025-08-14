-- Make the project upvotes count trigger more robust

-- Drop the existing trigger first
DROP TRIGGER IF EXISTS project_upvotes_count_trigger ON public.votes;

-- Create a new, more robust function to update the upvotes count
CREATE OR REPLACE FUNCTION public.update_project_upvotes_count_robust()
RETURNS TRIGGER AS $$
BEGIN
  -- Recalculate the total number of votes for the project and update the count
  -- This is more robust than incrementing/decrementing
  UPDATE public.projects
  SET upvotes_count = (
    SELECT COUNT(*)
    FROM public.votes
    WHERE project_id = COALESCE(NEW.project_id, OLD.project_id)
  )
  WHERE id = COALESCE(NEW.project_id, OLD.project_id);

  RETURN NULL; -- The result of the trigger is ignored
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger to use the new robust function
CREATE TRIGGER project_upvotes_count_trigger
  AFTER INSERT OR DELETE ON public.votes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_project_upvotes_count_robust();

-- Note: This file replaces the old trigger logic with a more reliable counting mechanism.
-- This should resolve the vote count inconsistency issues.
