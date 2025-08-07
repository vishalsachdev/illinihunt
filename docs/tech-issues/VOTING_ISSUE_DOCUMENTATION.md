# IlliniHunt Voting System Issue Documentation

**Issue ID:** GitHub Issue #18 - "Upvotes and likes sync"  
**Date:** August 2025  
**Severity:** High - Critical user functionality broken  
**Status:** RESOLVED  

## Issue Overview

The voting system in IlliniHunt experienced critical persistence and user identification issues when users attempted to vote on projects **not owned by themselves**. While voting on their own projects worked correctly, cross-user voting (the primary use case) suffered from multiple technical problems that prevented proper vote persistence and state restoration.

### Core Problem Statement

**Users could not reliably vote on projects created by other users.** The system would:
- Allow multiple votes from the same user on the same project
- Lose vote state on page refresh 
- Show incorrect vote counts and button states
- Fail to properly identify which user was voting

## Technical Root Causes

### 1. Database Query Method Error
**Location:** `src/lib/database.ts:486` - `hasUserLikedComment()` method

```typescript
// ❌ PROBLEMATIC CODE
const { data, error } = await supabase
  .from('comment_likes')
  .select('id')
  .eq('comment_id', commentId)
  .eq('user_id', user.id)
  .single() // ← CRITICAL ERROR: throws when no record exists
```

**Problem:** Using `.single()` instead of `.maybeSingle()` caused the query to throw errors when a user hadn't previously liked a comment (the normal state). This prevented proper like status detection.

**Impact:** Users appeared to have liked all comments, or the system failed to check like status entirely.

### 2. Authentication Race Conditions
**Location:** `src/hooks/useAuth.ts` and `src/components/project/VoteButton.tsx`

**Problem:** Vote status checks (`hasUserVoted`) were being called before user authentication was fully loaded, leading to:
- Incorrect user identification
- Failed database queries with null user IDs
- Inconsistent vote state initialization

```typescript
// ❌ PROBLEMATIC PATTERN
useEffect(() => {
  if (user) {
    checkVoteStatus() // Called too early, user might not be fully loaded
  }
}, [user, projectId])
```

### 3. Database Count Synchronization Issues
**Problem:** The `upvotes_count` and `likes_count` columns in the database were not automatically updated when vote/like records were added or removed, leading to:
- Display counts not matching actual vote records
- Stale counts persisting across sessions
- Manual count corrections being lost

### 4. User Session State Management
**Location:** `src/hooks/useAuth.ts`

**Problem:** Authentication state changes weren't properly triggering vote status re-checks, causing:
- Vote buttons showing wrong states after login/logout
- New user sessions not loading previous vote history
- Cross-user vote state bleeding between sessions

## Symptoms Observed

### Primary User Experience Issues

1. **Vote State Inconsistency**
   - User votes on Project A (owned by User B) 
   - Vote appears successful in UI (count increases, button highlights)
   - Page refresh → vote state lost, count reverts, button unhighlighted

2. **Multiple Voting**
   - Same user could vote multiple times on the same project
   - Each vote would increment the count
   - Database would contain multiple vote records for same user-project pair

3. **Cross-User Confusion**
   - User A's vote states would sometimes show User B's voting history
   - Vote buttons would highlight for projects the current user never voted on
   - Inconsistent behavior between own projects vs. others' projects

4. **Authentication-Dependent Failures**
   - Fresh page loads often showed incorrect vote states
   - Login/logout cycles would reset all vote visualizations
   - Mobile users experienced more frequent state loss

## Code Analysis - The Fix

### 1. Database Query Fix
```typescript
// ✅ CORRECTED CODE
static async hasUserLikedComment(commentId: string) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  try {
    const { data, error } = await supabase
      .from('comment_likes')
      .select('id')
      .eq('comment_id', commentId)
      .eq('user_id', user.id)
      .maybeSingle() // ← FIXED: returns null instead of throwing

    // Handle missing table gracefully
    if (error && (error.code === 'PGRST202' || error.code === '406')) {
      console.warn('Comment likes table not found')
      return false
    }

    return !error && !!data
  } catch (err) {
    console.warn('Error checking like status:', err)
    return false
  }
}
```

### 2. Enhanced Authentication State Management
```typescript
// ✅ IMPROVED AUTH HANDLING
useEffect(() => {
  if (user) {
    checkVoteStatus()
  } else {
    // Reset vote state when user logs out
    setHasVoted(false)
  }
}, [user, projectId])

// Additional session state change handling
if (event === 'SIGNED_IN' && session?.user) {
  setState(prev => ({ 
    ...prev, 
    user: session.user, 
    session,
    loading: false 
  }))
  await loadUserProfile(session.user, session)
}
```

### 3. Optimistic UI with Rollback
```typescript
// ✅ ROBUST VOTE HANDLING
const handleVote = async () => {
  // Store current state for rollback
  const previousVoteCount = voteCount
  const previousHasVoted = hasVoted
  
  try {
    if (hasVoted) {
      // Optimistically update UI
      setVoteCount(prev => prev - 1)
      setHasVoted(false)
      
      // Remove vote
      const { error } = await ProjectsService.unvoteProject(projectId)
      if (error) throw error
      
      // Update parent component
      onVoteChange?.(voteCount - 1)
    } else {
      // Similar pattern for adding votes...
    }
  } catch (error) {
    // Rollback on error - CRITICAL for user experience
    setVoteCount(previousVoteCount)
    setHasVoted(previousHasVoted)
    console.error('Vote error:', error)
    alert('Failed to vote. Please try again.')
  }
}
```

## Resolution Summary

### Database Layer Fixes
1. **Query Method Correction:** Changed `.single()` to `.maybeSingle()` in all user status check methods
2. **Error Handling:** Added comprehensive error handling for missing tables and network failures
3. **User Validation:** Enhanced user authentication checks before database operations

### Component Layer Fixes  
1. **State Synchronization:** Improved `useEffect` dependencies and state management
2. **Rollback Mechanisms:** Added optimistic UI updates with error rollback
3. **Authentication Integration:** Better integration with auth state changes

### Service Layer Fixes
1. **Retry Logic:** Added retry mechanisms for network-related failures
2. **Logging:** Enhanced debugging capabilities with structured logging
3. **Validation:** Added input validation and sanitization

## Key Learnings

### 1. Cross-User State Management Complexity
Voting systems involve complex state relationships between:
- Current user authentication state
- Target project/comment ownership
- Historical interaction records
- Real-time UI synchronization

### 2. Database Query Patterns
- **Always use `.maybeSingle()`** when checking for existence of optional records
- **Never use `.single()`** for user status checks (likes, votes, bookmarks)
- **Handle missing tables gracefully** - features may not be available in all environments

### 3. Authentication Race Conditions
- User authentication loading is asynchronous and unpredictable
- Vote status checks must wait for complete auth initialization
- State management must handle authentication changes gracefully

### 4. Optimistic UI Best Practices
- Always store previous state before optimistic updates
- Implement comprehensive rollback mechanisms
- Provide clear user feedback for failed operations

### 5. Database Count Synchronization
- Consider database triggers for automatic count updates
- Manual count management is error-prone and leads to data inconsistency
- Real-time counts should reflect actual relationship records

## Future Prevention Strategies

1. **Comprehensive Testing:** Test all voting scenarios with multiple user accounts
2. **Authentication Testing:** Test vote persistence across login/logout cycles  
3. **Database Constraints:** Use proper foreign key constraints and unique indexes
4. **Error Monitoring:** Implement proper error tracking for vote-related operations
5. **State Validation:** Regular validation of vote counts against actual records

## Files Modified in Resolution

- `src/lib/database.ts` - Query method fixes and error handling
- `src/components/project/VoteButton.tsx` - Enhanced state management and rollback
- `src/components/comment/CommentItem.tsx` - Like state synchronization  
- `src/hooks/useAuth.ts` - Authentication state management improvements

---

**Note:** This issue highlighted the importance of robust cross-user feature testing and proper database query patterns in multi-user applications. The resolution ensures reliable voting functionality across all user scenarios.