# Comment Deletion RLS Policy Issue

**Status:** 🔴 Not Working  
**Priority:** High  
**Last Updated:** February 5, 2025

## Issue Description

Users are unable to delete their own comments in the IlliniHunt application. When attempting to delete a comment, the following error occurs:

```
Failed to delete comment: new row violates row-level security policy for table 'comments'
```

## Root Cause Analysis

### Technical Details

The issue stems from Supabase Row Level Security (RLS) policies on the `comments` table. When performing a soft delete operation (setting `is_deleted = true` via UPDATE), the RLS policy is incorrectly interpreting this as a potential policy violation.

**Current RLS Policy:**
```sql
CREATE POLICY "Users can update own comments" ON comments
  FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

**The Problem:** The `WITH CHECK` clause validates the resulting row after the update, and there appears to be a conflict when setting `is_deleted = true` on comments.

### Error Flow

1. User clicks "Delete" on their own comment
2. Frontend calls `CommentsService.deleteComment(commentId)`
3. Service attempts to UPDATE the comment with `is_deleted = true`
4. Supabase RLS policy blocks the operation with "new row violates row-level security policy"
5. User sees error message and comment remains visible

### Debugging Information

**Enhanced Logging Added:**
- Comment ownership verification before deletion attempt
- Detailed logging of user IDs and comment ownership
- RLS error detection and user-friendly error messages
- Session validation and alternative approaches

**Files Modified:**
- `src/lib/database.ts` - Enhanced `deleteComment()` method with better error handling
- `src/components/comment/CommentItem.tsx` - Improved error messaging and UX

## Attempted Solutions

### ✅ Enhanced Error Handling (Completed)
- **File:** `src/components/comment/CommentItem.tsx`
- **Changes:** Added specific error messages for RLS violations
- **Result:** Better user experience with actionable error messages

### ✅ Database Service Improvements (Completed)
- **File:** `src/lib/database.ts`
- **Changes:** Simplified deleteComment method with cleaner error handling
- **Result:** Better debugging information and error reporting

### 🔄 RLS Policy Fix (Pending)
- **File:** `supabase/migrations/20250205000001_fix_comment_deletion_rls.sql`
- **File:** `supabase_rls_fix.sql` (Manual application)
- **Status:** Created but not yet applied due to CLI authentication issues

## Proposed Solution

### RLS Policy Simplification

The fix involves simplifying the comments UPDATE policy by removing the problematic `WITH CHECK` clause:

```sql
-- Current problematic policy
DROP POLICY IF EXISTS "Users can update own comments" ON comments;

-- Simplified policy without WITH CHECK clause
CREATE POLICY "Users can update own comments" ON comments
  FOR UPDATE 
  USING (auth.uid() = user_id);
```

**Why This Works:**
- The `USING` clause ensures users can only update their own comments
- Removing `WITH CHECK` eliminates the post-update validation that was causing the RLS violation
- Soft deletes (setting `is_deleted = true`) will no longer trigger policy violations

## Implementation Steps

### Step 1: Apply RLS Policy Fix 🔴 **REQUIRED**

**Option A: Supabase Dashboard (Recommended)**
1. Navigate to [Supabase Dashboard SQL Editor](https://supabase.com/dashboard/project/catzwowmxluzwbhdyhnf/sql/new)
2. Copy and paste contents of `supabase_rls_fix.sql`
3. Execute the SQL to apply the policy fix

**Option B: Supabase CLI**
```bash
cd /path/to/illinihunt
supabase db push --project-ref catzwowmxluzwbhdyhnf
```

**Option C: Direct Database Connection**
```bash
psql "postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres" \
  -f supabase_rls_fix.sql
```

### Step 2: Verify the Fix ✅ **TESTING**

1. **Test Comment Deletion:**
   - Log in as a user
   - Create a test comment
   - Attempt to delete the comment
   - Verify it gets soft-deleted (`is_deleted = true`)
   - Confirm it disappears from the UI

2. **Verify Security:**
   - Attempt to delete another user's comment (should fail)
   - Verify RLS policies still prevent unauthorized access

3. **Check Error Handling:**
   - Test deletion with various error scenarios
   - Confirm user-friendly error messages appear

### Step 3: Monitor and Validate 📊 **ONGOING**

1. **Database Monitoring:**
   ```sql
   -- Check for RLS policy violations in logs
   SELECT * FROM pg_stat_statements 
   WHERE query LIKE '%comments%' AND calls > 0;
   
   -- Verify successful soft deletes
   SELECT COUNT(*) FROM comments WHERE is_deleted = true;
   ```

2. **Frontend Monitoring:**
   - Monitor browser console for deletion errors
   - Check user feedback for deletion issues
   - Validate comment deletion success rates

## Technical Context

### Database Schema
```sql
comments (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES projects(id),
  user_id UUID REFERENCES users(id),
  content TEXT NOT NULL,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
)
```

### Current RLS Policies
```sql
-- SELECT policy (working)
CREATE POLICY "Comments are publicly readable" ON comments
  FOR SELECT USING (is_deleted = false);

-- UPDATE policy (problematic)
CREATE POLICY "Users can update own comments" ON comments
  FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE policy (working but unused - we use soft deletes)  
CREATE POLICY "Users can delete own comments" ON comments
  FOR DELETE USING (auth.uid() = user_id);
```

### Soft Delete Implementation
```typescript
// Current implementation in CommentsService.deleteComment()
const result = await supabase
  .from('comments')
  .update({ 
    is_deleted: true,
    updated_at: new Date().toISOString()
  })
  .eq('id', commentId)
  .eq('user_id', user.id)
  .select()
```

## Related Issues

### Authentication Context
- **Issue:** RLS policies depend on `auth.uid()` which must be properly set
- **Validation:** Ensure user authentication is working correctly
- **Files:** `src/hooks/useAuth.ts`, `src/contexts/AuthPromptContext.tsx`

### UI/UX Considerations
- **Loading States:** Deletion should show loading indicator
- **Optimistic Updates:** Consider optimistic UI updates with rollback
- **Error Recovery:** Provide clear recovery steps for users

### Performance Impact
- **Database:** Soft deletes accumulate deleted comments (consider cleanup)
- **Queries:** Ensure `is_deleted = false` filters are indexed
- **Monitoring:** Track soft delete volume and performance

## Alternative Solutions Considered

### 1. Hard Deletes Instead of Soft Deletes
**Pros:** Simpler RLS policies, no `is_deleted` field complexity  
**Cons:** Loss of data for moderation, analytics, potential cascading issues  
**Decision:** Rejected - soft deletes provide better data integrity

### 2. Supabase Function for Deletion
**Pros:** Bypasses RLS entirely, centralized logic  
**Cons:** Additional complexity, requires function deployment  
**Decision:** Rejected - RLS policy fix is cleaner

### 3. Client-Side Hiding with Background Cleanup
**Pros:** Immediate UI response  
**Cons:** Data inconsistency risks, complex state management  
**Decision:** Rejected - proper deletion is required

## Success Criteria

### ✅ Functional Requirements
- [ ] Users can delete their own comments without errors
- [ ] Deleted comments disappear from the UI immediately
- [ ] Users cannot delete other users' comments
- [ ] Error messages are clear and actionable

### ✅ Technical Requirements  
- [ ] RLS policies properly enforce comment ownership
- [ ] Soft delete mechanism works correctly
- [ ] Database performance is not impacted
- [ ] No console errors during comment deletion

### ✅ User Experience Requirements
- [ ] Deletion confirms with user before proceeding
- [ ] Loading states are shown during deletion
- [ ] Success feedback is provided after deletion
- [ ] Error recovery options are available

## Contact & Escalation

**Primary Contact:** Development Team  
**Escalation Path:** Database Administrator → DevOps → Supabase Support  
**Documentation:** This file, `CLAUDE.md`, RLS migration files

---

**Next Action Required:** Apply the RLS policy fix via Supabase Dashboard SQL Editor using the provided `supabase_rls_fix.sql` file.