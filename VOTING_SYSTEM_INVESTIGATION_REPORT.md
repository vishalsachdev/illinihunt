# IlliniHunt Voting System Investigation Report

**Project ID**: catzwowmxluzwbhdyhnf  
**Date**: 2025-08-08  
**Investigation Focus**: Vote count discrepancies and RLS policy issues

## Executive Summary

Based on the investigation of the IlliniHunt codebase and database schema, I've identified the potential causes of the voting system issues and created comprehensive SQL scripts to diagnose and fix them.

## Issues Identified

### 1. Vote Count Discrepancies
**Problem**: 6 projects (AgentLab, Bare Basics, Body Craft, inSight, GameLink AI, StockSense App Development) show `upvotes_count=0` but actually have 1 vote in the votes table.

**Likely Causes**:
- Trigger function `update_project_upvotes_count()` may have failed during vote insertion
- Manual database updates that bypassed the trigger
- Trigger was temporarily disabled or recreated incorrectly
- RLS policies preventing proper trigger execution

### 2. Database Schema Analysis

From examining the migration files, the voting system is properly designed with:

```sql
-- Trigger function (from initial_schema.sql line 94-108)
CREATE OR REPLACE FUNCTION update_project_upvotes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE projects 
    SET upvotes_count = upvotes_count + 1 
    WHERE id = NEW.project_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE projects 
    SET upvotes_count = upvotes_count - 1 
    WHERE id = OLD.project_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger (lines 111-114)
CREATE TRIGGER project_upvotes_count_trigger
  AFTER INSERT OR DELETE ON votes
  FOR EACH ROW
  EXECUTE FUNCTION update_project_upvotes_count();
```

### 3. RLS Policies Analysis

From `20250127000002_rls_policies.sql`, the votes table has these policies:
- "Votes are publicly readable" (SELECT)
- "Users can vote on projects" (INSERT) 
- "Users can remove their votes" (DELETE)

**Potential Issue**: Duplicate policies could exist if migrations were run multiple times.

### 4. Application Layer Analysis

From `src/lib/database.ts`, the voting logic is sound:
- `voteProject()` (lines 144-151): Inserts vote record
- `unvoteProject()` (lines 154-163): Deletes vote record
- `hasUserVoted()` (lines 166-197): Checks vote status

The application correctly relies on the database trigger to update `upvotes_count`.

## Solution Implementation

### Step 1: Run Diagnostic Queries
Execute the SQL file `voting_system_diagnosis_fix.sql` in Supabase Dashboard to:
1. Identify all projects with vote count mismatches
2. Check for duplicate RLS policies
3. Verify trigger function exists and is active
4. Check for orphaned or duplicate votes

### Step 2: Fix Vote Count Discrepancies
The script includes an UPDATE statement to sync all project vote counts:

```sql
UPDATE projects 
SET upvotes_count = vote_counts.actual_count
FROM (
    SELECT 
        p.id,
        COUNT(v.id) as actual_count
    FROM projects p
    LEFT JOIN votes v ON p.id = v.project_id
    GROUP BY p.id
) as vote_counts
WHERE projects.id = vote_counts.id
AND projects.upvotes_count != vote_counts.actual_count;
```

### Step 3: Clean Up Duplicate RLS Policies
If duplicates are found, drop and recreate the policies:

```sql
-- Example for duplicate policies (uncomment as needed)
DROP POLICY IF EXISTS "Users can vote on projects" ON votes;
CREATE POLICY "Users can vote on projects" ON votes
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

### Step 4: Recreate Trigger Function
To ensure the trigger is working properly, the script:
1. Drops existing trigger and function
2. Recreates with improved logic (prevents negative counts)
3. Adds `updated_at` timestamp updates
4. Uses `SECURITY DEFINER` for proper permissions

### Step 5: Verification
Multiple verification queries to ensure:
- All vote counts are accurate
- No orphaned votes exist
- No duplicate votes exist
- Trigger is functioning properly

## Immediate Actions Required

1. **Execute the diagnostic SQL**: Run `voting_system_diagnosis_fix.sql` in Supabase Dashboard
2. **Review the results**: Check which specific projects have mismatches
3. **Apply the fixes**: Run the UPDATE statements to sync vote counts
4. **Clean up policies**: Remove any duplicate RLS policies found
5. **Test the system**: Create/remove test votes to verify trigger works

## Prevention Measures

1. **Monitor vote counts**: Regular checks comparing `upvotes_count` vs actual votes
2. **Audit RLS policies**: Periodic review to prevent duplicates
3. **Trigger monitoring**: Verify trigger remains active after schema changes
4. **Error logging**: Enhanced error handling in the application layer

## Files Created

1. `/home/runner/work/illinihunt/illinihunt/voting_system_diagnosis_fix.sql` - Complete diagnostic and fix script
2. `/home/runner/work/illinihunt/illinihunt/VOTING_SYSTEM_INVESTIGATION_REPORT.md` - This report

## Next Steps

After executing the fix:
1. Verify all 6 mentioned projects show correct vote counts
2. Test voting functionality on a few projects
3. Monitor for 24-48 hours to ensure no new discrepancies appear
4. Consider adding database constraints or checks to prevent future issues

## Technical Notes

- The trigger function uses `SECURITY DEFINER` to ensure proper permissions
- Added `GREATEST(upvotes_count - 1, 0)` to prevent negative vote counts
- Included `updated_at` timestamp updates for audit trails
- All operations are designed to be safe and reversible