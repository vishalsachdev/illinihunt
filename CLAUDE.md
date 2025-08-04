# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

IlliniHunt V2 is a Product Hunt-style platform for the University of Illinois community (students, faculty, and staff) to showcase projects, apps, and startups. Built with React + TypeScript + Supabase + Vercel.

**Live URL**: https://illinihunt.vercel.app
and https://illinihunt.org/
and https://www.illinihunt.org/

## Local Development Setup

### Prerequisites

- **Node.js 18+** and npm
- **Git** for version control
- **Claude Code** (optional but recommended for MCP Supabase access)

### Initial Setup

1. **Clone Repository**:
   ```bash
   git clone <repository-url>
   cd illinihunt
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Environment Configuration**:
   ```bash
   # Create environment file
   cp .env.example .env.local  # If exists, or create manually
   
   # Required environment variables in .env.local:
   VITE_SUPABASE_URL=https://catzwowmxluzwbhdyhnf.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   SUPABASE_ACCESS_TOKEN=sbp_53e258dade59eae29159f842b50f049327e3e6eb
   ```

4. **Verify Setup**:
   ```bash
   # Test TypeScript compilation
   npm run type-check
   
   # Test build process
   npm run build
   
   # Test Supabase connectivity
   npx supabase projects list
   ```

5. **Start Development Server**:
   ```bash
   npm run dev
   # Server runs on http://localhost:5173
   ```

### New Developer Checklist

**✅ Code Quality Setup**:
```bash
# ESLint is already configured (.eslintrc.json)
npm run lint  # Should show minimal warnings

# TypeScript strict mode enabled
npm run type-check  # Should pass without errors
```

**✅ Authentication Test**:
- Visit http://localhost:5173
- Click "Sign In with Google"
- Use an @illinois.edu email address
- Verify domain restriction works (non-illinois emails should be rejected)

**✅ Database Access Test**:
```bash
# Test MCP Supabase access (if using Claude Code)
mcp__supabase__list_projects

# Test CLI access
npx supabase projects list

# Should show illinihunt project (catzwowmxluzwbhdyhnf)
```

**✅ Development Workflow Test**:
```bash
# Make a small change to a component
# Verify hot reload works
# Test build process
npm run build
```

### IDE Configuration

**VS Code Recommended Extensions**:
- TypeScript and JavaScript Language Features (built-in)
- ESLint
- Tailwind CSS IntelliSense
- Prettier (optional, but configure to match project style)

**TypeScript Configuration**:
- Strict mode enabled in `tsconfig.json`
- Path mapping configured for `@/` imports
- Supabase types should be imported from `src/lib/supabase-types.ts`

### Common Setup Issues

**Port 5173 Already in Use**:
```bash
# Kill existing process or use different port
npx kill-port 5173
# or
npm run dev -- --port 3000
```

**Environment Variables Not Loading**:
- Ensure `.env.local` is in project root
- Restart dev server after adding variables
- Check for typos in variable names (case-sensitive)

**Supabase Connection Issues**:
- Verify `SUPABASE_ACCESS_TOKEN` is valid (check Supabase Dashboard)
- Test with `npx supabase projects list`
- Ensure token has necessary permissions

**TypeScript Errors on First Run**:
```bash
# Generate fresh Supabase types
npx supabase gen types typescript --project-id catzwowmxluzwbhdyhnf > src/lib/supabase-types.ts

# Clear TypeScript cache
rm -rf node_modules/.cache
npm run type-check
```

## Development Commands

```bash
# Development
npm run dev              # Start Vite dev server
npm run build           # Build for production (runs TypeScript check + Vite build)
npm run preview         # Preview production build locally
npm run type-check      # Run TypeScript compiler without emitting files
npm run lint            # Run ESLint with TypeScript support

# Supabase CLI (requires SUPABASE_ACCESS_TOKEN in .env.local)
npx supabase projects list                                    # List all projects
npx supabase gen types typescript --project-id catzwowmxluzwbhdyhnf  # Generate TypeScript types
npx supabase db pull --project-id catzwowmxluzwbhdyhnf       # Pull database schema
npx supabase db push --project-id catzwowmxluzwbhdyhnf       # Push migrations
npx supabase functions list --project-ref catzwowmxluzwbhdyhnf       # List Edge Functions

# No test commands are configured in this project
```

## Database Development Workflow

### Schema Changes and Migration Process

When making database schema changes:

1. **Plan the Change**:
   ```bash
   # Check current schema state
   npx supabase db pull --project-id catzwowmxluzwbhdyhnf
   ```

2. **Create Migration** (using MCP for complex changes):
   ```typescript
   // Use mcp__supabase__apply_migration for DDL operations
   await mcp__supabase__apply_migration({
     project_id: "catzwowmxluzwbhdyhnf",
     name: "add_user_preferences_table",
     query: `CREATE TABLE user_preferences (...)`
   })
   ```

3. **Generate Updated Types**:
   ```bash
   # After schema changes, regenerate TypeScript types
   npx supabase gen types typescript --project-id catzwowmxluzwbhdyhnf > src/lib/supabase-types.ts
   ```

4. **Update Application Code**:
   - Update `src/lib/database.ts` service methods
   - Update component TypeScript interfaces
   - Test locally with new schema

5. **Verify Migration**:
   ```bash
   # Check migration was applied
   npx supabase db pull --project-id catzwowmxluzwbhdyhnf
   # Verify types compile
   npm run type-check
   ```

### When to Regenerate Types

**Always regenerate types after**:
- Adding/removing tables
- Adding/removing columns
- Changing column types
- Modifying RLS policies that affect data access
- Any DDL operations

**Type Generation Best Practices**:
- Commit type files to version control
- Generate types on both local and production environments
- Test compilation after type updates
- Update service layer methods to match new types

### RLS Policy Management

**Testing RLS Policies**:
```sql
-- Use MCP to test policies with different user contexts
SELECT * FROM projects WHERE user_id = auth.uid(); -- Test user-specific access
```

**Policy Development Workflow**:
1. Create policy using Supabase Dashboard for complex policies
2. Test policy with sample data using `mcp__supabase__execute_sql`
3. Verify policy works with application auth flow
4. Document policy purpose in schema comments

## Architecture Overview

### Frontend Stack
- **React 18** with TypeScript and Vite
- **Tailwind CSS** with custom UIUC brand colors (`uiuc-orange: #FF6B35`, `uiuc-blue: #13294B`)
- **shadcn/ui** components built on Radix UI primitives
- **React Router** for client-side routing with protected routes
- **React Hook Form** with Zod validation for forms
- **Lucide React** for icons

### Backend & Database
- **Supabase** handles authentication, database, and real-time features
- **PostgreSQL** database with Row Level Security (RLS) policies
- **Google OAuth** restricted to @illinois.edu email domains
- Environment variables: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`

### Supabase Access Methods
1. **MCP Supabase Server**: Available through Claude Code for programmatic operations
   - `mcp__supabase__list_projects` - List all projects  
   - `mcp__supabase__list_tables` - Get database schema
   - `mcp__supabase__execute_sql` - Run SQL queries
   - `mcp__supabase__apply_migration` - Apply database migrations
   - `mcp__supabase__get_advisors` - Security and performance advisories

2. **Supabase CLI**: Direct command-line access with personal access token
   - Project management and schema operations
   - TypeScript type generation
   - Database migrations and functions
   - No database password required for most operations

**Project Details**:
- **Project ID**: `catzwowmxluzwbhdyhnf`
- **Project Name**: `illinihunt`
- **Region**: `us-east-2`
- **Status**: `ACTIVE_HEALTHY`
- **Database**: PostgreSQL 17.4.1.064

### Supabase Workflow Examples

**When to Use MCP vs CLI vs Dashboard**:

**Use MCP Server (via Claude Code) for**:
```typescript
// Real-time data analysis and queries
mcp__supabase__execute_sql({
  project_id: "catzwowmxluzwbhdyhnf",
  query: "SELECT COUNT(*) as total_users FROM users WHERE created_at >= NOW() - INTERVAL '7 days'"
})

// Schema exploration and inspection
mcp__supabase__list_tables({ project_id: "catzwowmxluzwbhdyhnf" })

// Applying reviewed migrations during development
mcp__supabase__apply_migration({
  project_id: "catzwowmxluzwbhdyhnf", 
  name: "add_project_tags",
  query: "ALTER TABLE projects ADD COLUMN tags TEXT[]"
})

// Getting security and performance insights
mcp__supabase__get_advisors({ project_id: "catzwowmxluzwbhdyhnf", type: "security" })
```

**Use CLI for**:
```bash
# Type generation workflows
npx supabase gen types typescript --project-id catzwowmxluzwbhdyhnf > src/lib/supabase-types.ts

# Schema synchronization
npx supabase db pull --project-id catzwowmxluzwbhdyhnf

# Project management operations
npx supabase projects list
npx supabase functions list --project-ref catzwowmxluzwbhdyhnf

# Batch operations and automation scripts
npx supabase db push --project-id catzwowmxluzwbhdyhnf
```

**Use Supabase Dashboard for**:
- **Visual RLS Policy Creation**: Complex policies with multiple conditions
- **User Management**: Viewing authentication logs, managing user accounts
- **Performance Monitoring**: Database metrics, query performance analysis  
- **Storage Management**: File uploads, bucket configuration
- **Edge Functions**: Visual function deployment and log monitoring

**Typical Development Workflows**:

**Adding a New Feature with Database Changes**:
1. **Plan**: Use Dashboard to visualize current schema
2. **Implement**: Use MCP to apply migration during development
3. **Types**: Use CLI to regenerate TypeScript types
4. **Test**: Use MCP to query and verify data structure
5. **Deploy**: Changes auto-deploy via Vercel integration

**Debugging Authentication Issues**:
1. **Check Users**: Dashboard > Authentication > Users
2. **Test Policies**: MCP `execute_sql` with user context
3. **Verify Tokens**: CLI `projects list` to test token validity
4. **Monitor Logs**: Dashboard > Logs for real-time auth events

**Performance Optimization**:
1. **Identify Issues**: MCP `get_advisors` for performance recommendations
2. **Analyze Queries**: MCP `execute_sql` with `EXPLAIN ANALYZE`
3. **Monitor Metrics**: Dashboard for database performance graphs
4. **Apply Fixes**: MCP for index creation, CLI for schema updates

### Key Architecture Patterns

#### Authentication Flow
The app uses a layered authentication system:

1. **`useAuth` hook** (`src/hooks/useAuth.ts`) - Core auth state management
2. **`AuthPromptContext`** (`src/contexts/AuthPromptContext.tsx`) - Handles auth prompts with user-friendly messaging
3. **`ProtectedRoute` component** - Wraps protected pages and redirects unauthenticated users
4. **Domain restriction** - Only @illinois.edu emails can authenticate

#### Database Layer
- **`ProjectsService`** in `src/lib/database.ts` - All project-related database operations
- **`CategoriesService`** in `src/lib/database.ts` - Category management
- **Typed queries** using generated TypeScript types from Supabase schema
- **Real-time subscriptions** available through Supabase client

#### Component Structure
```
src/components/
├── auth/           # Authentication components (LoginButton, UserMenu, AuthPrompt)
├── project/        # Project-related components (ProjectCard, ProjectForm, ProjectGrid, VoteButton)
└── ui/            # Reusable UI components (shadcn/ui primitives)
```

#### State Management
- **React Context** for authentication state and prompts
- **React Hook Form** for form state
- **Supabase real-time** for live data updates
- **Custom hooks** like `useWindowSize` for responsive behavior

## Key Implementation Details

### Style Guide & Design System
**Reference File**: `/Users/vishal/Desktop/illinihunt/STYLE_GUIDE.md`

A comprehensive design system document with:
- **Brand Colors**: UIUC Orange (#FF6B35) and UIUC Blue (#13294B) with Tailwind class references
- **Typography Scale**: Inter font family with consistent heading hierarchy and body text patterns
- **Component Patterns**: Code examples for buttons, forms, cards, badges with proper variants
- **Layout Principles**: Container widths, grid systems, and responsive design patterns
- **Spacing Scale**: Tailwind spacing guidelines and consistent usage patterns
- **Accessibility Guidelines**: Color contrast requirements, ARIA labeling, semantic HTML
- **Usage Rules**: Comprehensive do's and don'ts for maintaining design consistency
- **Development Workflow**: Step-by-step process for implementing new UI components

**Important**: Always reference STYLE_GUIDE.md when creating new components or modifying existing UI elements to ensure brand consistency and accessibility compliance.

**Implementation Note**: The style guide was initially created as a client-facing page but has been converted to a development reference document. The client-facing components have been removed to keep the production app clean while maintaining comprehensive design system documentation for future development.

### Responsive Design
The app uses a custom `useWindowSize` hook to force React re-renders on window resize, ensuring Tailwind responsive classes update properly during browser resizing.

### UIUC Branding
- Custom Tailwind colors for University of Illinois brand consistency
- Inclusive messaging that welcomes students, faculty, and staff
- Professional design matching university standards

### Form Validation
All forms use React Hook Form with Zod schemas defined in `src/lib/validations.ts`.

### Database Schema Key Tables
Complete schema available via `mcp__supabase__list_tables` with full column details:

- **`users`** - User profiles linked to Supabase auth (6 live rows)
  - Core fields: id, email, username, full_name, avatar_url, bio
  - Academic: year_of_study, department, is_verified
  - Social: github_url, linkedin_url, website_url
  - RLS enabled with foreign key to auth.users

- **`projects`** - Project submissions with voting counts (1 live row)
  - Project data: name, tagline, description, image_url
  - Links: website_url, github_url, category_id, user_id
  - Stats: upvotes_count, comments_count, status
  - RLS enabled with cascade relationships

- **`categories`** - Project categories with colors and icons (8 live rows)
  - Fields: name, description, icon, color, is_active
  - Problem-focused categories (not technology-based)

- **`votes`** - User votes on projects (one per user per project)
  - Simple relationship: user_id, project_id, created_at
  - Unique constraint prevents duplicate voting

- **`comments`** - Threaded comment system (0 live rows currently)
  - Threading: parent_id, thread_depth for nested conversations
  - Content: content, user_id, project_id, likes_count
  - Moderation: is_deleted flag for soft deletes

- **`comment_likes`** - Like system for comments
- **`bookmarks`** - User project bookmarks
- **`collections`** - User-created project collections  
- **`collection_projects`** - Many-to-many for collections

### Environment Setup
Required environment variables in `.env.local`:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_ACCESS_TOKEN=your_personal_access_token
```

**Supabase CLI Access**: Token is configured for both MCP server and CLI operations.

### Deployment
- **Vercel** with GitHub integration for automatic deployments
- **Build command**: `npm run build` (includes TypeScript compilation)
- **Environment variables** configured in Vercel dashboard
- **Automatic deployment**: Every push to main branch triggers production deployment
- **Preview deployments**: All pull requests get preview deployments automatically

## Important Files to Understand

### Core Application Structure
- `src/App.tsx` - Main app structure with routing and auth providers
- `src/pages/HomePage.tsx` - Landing page with hero section and project grid
- `src/lib/supabase.ts` - Supabase client configuration
- `src/lib/database.ts` - Database service layer with typed methods
- `src/contexts/AuthPromptContext.tsx` - Authentication UX management
- `src/hooks/useAuth.ts` - Core authentication hook
- `tailwind.config.js` - Custom UIUC colors and design tokens

### Priority 1 Feature Pages (Recently Added)
- `src/pages/ProjectDetailPage.tsx` - Individual project pages with voting and links
- `src/pages/UserProfilePage.tsx` - User profiles with project portfolios and stats
- `src/pages/DashboardPage.tsx` - Project management interface for creators
- `src/pages/EditProfilePage.tsx` - Profile editing form for authenticated users

### Comment System Components
- `src/components/comment/CommentList.tsx` - Main comment container with threading
- `src/components/comment/CommentItem.tsx` - Individual comment with actions (edit/delete/reply)
- `src/components/comment/CommentForm.tsx` - Comment creation and editing form

### Key Configuration Files
- `.env.local` - Environment variables (Supabase URLs, access tokens)
- `.eslintrc.json` - Code quality configuration
- `src/lib/validations.ts` - Zod schemas for form validation
- `src/lib/supabase-types.ts` - Generated TypeScript types from Supabase schema

## Development Notes

### Code Quality
- TypeScript strict mode enabled
- ESLint configured for React and TypeScript
- Build process includes type checking before Vite build
- No test framework currently configured

### Styling Approach
- Tailwind utility-first CSS with custom UIUC brand colors
- shadcn/ui component system for consistent UI primitives
- Responsive design with mobile-first approach
- Custom CSS utilities in `src/index.css` for specialized needs

### Authentication Security
- Row Level Security (RLS) policies enforce data access rules
- @illinois.edu domain restriction in authentication flow
- Protected routes prevent unauthorized access to submission forms
- User session persistence across browser sessions

## Security Checklist

### Authentication & Authorization

**✅ Implemented Security Measures**:
- **Google OAuth Integration**: Single sign-on with trusted provider
- **Domain Restriction**: Only @illinois.edu emails allowed (`src/hooks/useAuth.ts:42`)
- **Session Management**: Secure token handling via Supabase auth
- **Protected Routes**: `ProtectedRoute` component prevents unauthorized access
- **Automatic Logout**: Invalid domains trigger immediate logout

**🔍 Security Verification Steps**:
```bash
# Test domain restriction
# 1. Try signing in with non-illinois email (should fail)
# 2. Verify error message appears: "Only @illinois.edu email addresses are allowed"
# 3. Check network tab for proper auth flow

# Verify RLS policies
mcp__supabase__execute_sql({
  project_id: "catzwowmxluzwbhdyhnf", 
  query: "SELECT * FROM projects" // Should work (public read)
})

mcp__supabase__execute_sql({
  project_id: "catzwowmxluzwbhdyhnf",
  query: "INSERT INTO projects (name, user_id) VALUES ('test', 'unauthorized')" // Should fail
})
```

### Database Security

**✅ Row Level Security (RLS) Policies**:
- **`users` table**: Users can only modify their own records
- **`projects` table**: Public read, authenticated write, owner modify/delete
- **`votes` table**: Users can only vote once per project, own votes only
- **`comments` table**: Public read, authenticated write, owner modify/delete
- **`bookmarks` table**: Private - users can only see their own bookmarks
- **`collections` table**: Owner-only access with public sharing option

**🔍 RLS Policy Testing**:
```sql
-- Test user data isolation
SELECT * FROM users WHERE id != auth.uid(); -- Should return empty

-- Test voting restrictions  
INSERT INTO votes (user_id, project_id) VALUES ('other-user-id', 'some-project'); -- Should fail

-- Test comment permissions
UPDATE comments SET content = 'hacked' WHERE user_id != auth.uid(); -- Should fail
```

**🔒 Database Security Best Practices**:
- No direct database credentials in frontend code
- All database access through Supabase client with RLS
- Sensitive operations use service role (backend only)
- Input sanitization through typed Supabase client

### Environment & Secrets Security

**✅ Environment Security Measures**:
```bash
# Environment variables properly scoped
VITE_SUPABASE_URL=             # Public (safe to expose)
VITE_SUPABASE_ANON_KEY=        # Public (RLS enforced)
SUPABASE_ACCESS_TOKEN=         # Private (development only)

# No hardcoded secrets in codebase
grep -r "supabase\.co" src/     # Should only find environment variable references
grep -r "eyJ" src/             # Should not find embedded JWTs
```

**🔍 Secret Management Verification**:
- No API keys in source code
- Environment variables in `.env.local` (gitignored)
- Production secrets managed via Vercel environment variables
- Supabase anon key is safe to expose (RLS enforced)

### Frontend Security

**✅ Client-Side Security**:
- **XSS Prevention**: React's built-in XSS protection via JSX
- **Input Validation**: Zod schemas for all form inputs (`src/lib/validations.ts`)
- **Type Safety**: TypeScript prevents many runtime security issues
- **Content Security**: No dangerouslySetInnerHTML usage
- **Safe Navigation**: React Router with proper route protection

**🔍 Frontend Security Testing**:
```typescript
// Test input validation
const testInputs = [
  '<script>alert("xss")</script>',
  'javascript:alert("xss")',
  '../../etc/passwd',
  'DROP TABLE users;'
]

// These should be properly escaped/validated by Zod schemas
```

### API Security

**✅ API Security Measures**:
- **Authenticated Endpoints**: All write operations require authentication
- **Rate Limiting**: Supabase built-in rate limiting on auth endpoints
- **CORS Configuration**: Properly configured for illinihunt.vercel.app domain
- **HTTPS Only**: All communications encrypted via HTTPS
- **JWT Validation**: Supabase handles JWT validation automatically

**🔍 API Security Verification**:
```bash
# Test unauthenticated access
curl -X POST https://catzwowmxluzwbhdyhnf.supabase.co/rest/v1/projects \
  -H "Content-Type: application/json" \
  -d '{"name":"unauthorized"}' 
# Should return 401 Unauthorized

# Verify HTTPS enforcement
curl -k http://illinihunt.vercel.app  # Should redirect to HTTPS
```

### Content & Data Security

**✅ Content Security**:
- **User Content Validation**: All user inputs validated via Zod
- **File Upload Security**: Image uploads to Supabase Storage with type restrictions
- **URL Validation**: External links properly validated before display
- **Content Filtering**: No user-generated HTML (markdown/text only)

**🔍 Content Security Testing**:
- Test file upload with non-image files (should reject)
- Test project URLs with malicious protocols (should validate)
- Test project descriptions with XSS attempts (should escape)

### Privacy & Compliance

**✅ Privacy Measures**:
- **Minimal Data Collection**: Only necessary user data collected
- **Data Retention**: User controls their own data deletion
- **Email Privacy**: Email addresses only visible to user themselves
- **Analytics**: No third-party tracking without consent
- **University Compliance**: Restricted to @illinois.edu (controlled environment)

### Security Monitoring

**🔍 Regular Security Audits**:
```bash
# Use Supabase security advisors
mcp__supabase__get_advisors({ 
  project_id: "catzwowmxluzwbhdyhnf", 
  type: "security" 
})

# Check for dependency vulnerabilities
npm audit

# Monitor authentication logs
# Check Supabase Dashboard > Authentication > Logs
```

**⚠️ Security Alerts**:
- Monitor failed login attempts
- Track unusual voting patterns
- Watch for RLS policy violations
- Alert on new admin user additions

### Security Incident Response

**📋 Incident Response Plan**:
1. **Immediate Response**: Revoke compromised tokens via Supabase Dashboard
2. **User Communication**: Notify affected users via platform announcement
3. **Data Assessment**: Use MCP tools to assess data exposure scope
4. **Recovery**: Reset user sessions, update security policies as needed
5. **Prevention**: Update RLS policies, add monitoring for similar incidents

**🚨 Emergency Contacts**:
- Supabase Support: via Dashboard for critical security issues
- University IT: For university-wide security concerns

## Priority 1 Features Implementation (January 30, 2025)

### 1. Project Detail Pages (`src/pages/ProjectDetailPage.tsx`)
**Complete implementation** of individual project pages with:

- **Full project information display**: Name, tagline, description, creator info, category badges
- **Project statistics**: Upvote counts, comment counts, creation date
- **Interactive voting**: Integrated VoteButton component for real-time voting
- **External links**: Website and GitHub repository links with proper icons
- **Creator information sidebar**: Avatar, name, profile link, and project ownership indicators
- **Project management**: Dashboard link for project owners
- **Responsive design**: Mobile-first layout with sticky sidebar on desktop
- **Error handling**: Proper loading states and 404 handling for missing projects
- **SEO-friendly URLs**: `/project/:id` routing structure

**Technical Implementation**:
```typescript
// Key type definition for project details
type ProjectDetail = {
  id: string
  name: string
  tagline: string
  description: string
  image_url: string | null
  upvotes_count: number
  comments_count: number
  users: {
    id: string
    username: string | null
    full_name: string | null
    avatar_url: string | null
  } | null
  categories: {
    id: string
    name: string
    color: string
    icon: string | null
  } | null
}
```

### 2. Threaded Comment System (`src/components/comment/`)
**Complete comment system** with real-time interactions:

#### Components Architecture:
- **`CommentList.tsx`** - Main container with thread organization and refresh functionality
- **`CommentItem.tsx`** - Individual comment display with edit/delete/reply actions
- **`CommentForm.tsx`** - Comment creation and editing form with authentication integration

#### Key Features:
- **Threaded conversations**: Nested replies with visual threading (border-left styling)
- **Real-time updates**: Automatic refresh and optimistic UI updates
- **CRUD operations**: Create, read, update, delete comments with proper permissions
- **Authentication integration**: Seamless auth prompts for unauthenticated users
- **Rich text support**: Preserves line breaks and formatting in comments
- **Loading states**: Proper loading indicators and error handling
- **Thread depth management**: Prevents excessive nesting with reasonable depth limits

**Technical Implementation**:
```typescript
// Thread organization algorithm
const organizeComments = (comments: CommentData[]): ThreadedComment[] => {
  const commentMap = new Map<string, ThreadedComment>()
  const rootComments: ThreadedComment[] = []
  
  // Create threaded structure with parent-child relationships
  // Sort root comments by creation date (newest first)
  // Sort replies within threads (oldest first for conversation flow)
}
```

### 3. Enhanced User Profiles (`src/pages/UserProfilePage.tsx`)
**Comprehensive user profile system** with:

- **Profile information display**: Avatar, full name, username, bio, verification status
- **Academic details**: Department, year of study, university affiliation
- **Social links**: GitHub, LinkedIn, personal website integration
- **Project portfolio**: Grid display of user's submitted projects
- **User statistics**: Project count, total upvotes, total comments received
- **Recent activity**: Timeline of user's latest projects
- **Profile editing**: Edit button for profile owners linking to edit page
- **Responsive design**: Mobile-optimized layout with sidebar stats on desktop

**Route Structure**: `/user/:id` with proper error handling for non-existent users

### 4. Project Management Dashboard (`src/pages/DashboardPage.tsx`)
**Complete project management interface** for creators:

#### Dashboard Features:
- **Welcome interface**: Personalized greeting with user avatar
- **Statistics overview**: 4-card stats layout showing:
  - Total projects submitted
  - Total upvotes received across all projects
  - Total comments received across all projects
  - Profile views (placeholder for future implementation)
- **Project management**: List view of all user projects with:
  - Project thumbnails and basic information
  - Real-time stats (upvotes, comments, creation date)
  - Quick action buttons (View, Edit, Visit Website, GitHub)
  - Status indicators and category badges
- **Quick actions**: New project submission button, profile view link
- **Empty state**: Encouraging first project submission for new users

**Technical Implementation**:
```typescript
// Dashboard stats calculation
const stats = {
  totalProjects: data.length,
  totalUpvotes: data.reduce((sum, p) => sum + p.upvotes_count, 0),
  totalComments: data.reduce((sum, p) => sum + p.comments_count, 0),
  totalViews: 0 // Placeholder for future analytics
}
```

### 5. Enhanced Database Services (`src/lib/database.ts`)
**Significant expansion** of database service layer:

#### New Service Methods:
```typescript
// Project-related services
ProjectsService.getProject(id: string) // Full project details with relations
ProjectsService.getUserProjects(userId: string) // User's project portfolio
ProjectsService.getUserProfile(userId: string) // Complete user profile data

// Comment services
CommentsService.getProjectComments(projectId: string) // Threaded comments
CommentsService.createComment(data: CommentCreateData) // New comment creation
CommentsService.updateComment(id: string, content: string) // Comment editing
CommentsService.deleteComment(id: string) // Comment deletion
CommentsService.createReply(data: ReplyCreateData) // Threaded replies

// Collection services (bonus feature)
CollectionsService.getUserCollections(userId: string) // User's collections
CollectionsService.createCollection(data: CollectionCreateData) // New collections
CollectionsService.addProjectToCollection(collectionId: string, projectId: string)
CollectionsService.removeProjectFromCollection(collectionId: string, projectId: string)
```

#### Enhanced Type System:
- **Complete TypeScript coverage** for all new database operations
- **Proper error handling** with typed error responses
- **Supabase RLS integration** ensuring proper data access permissions
- **Optimistic updates** for real-time UI responsiveness

### 6. Routing and Navigation Updates
**Enhanced routing system** in `src/App.tsx`:

```typescript
// New routes added
<Route path="/project/:id" element={<ProjectDetailPage />} />
<Route path="/user/:id" element={<UserProfilePage />} />
<Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
<Route path="/profile/edit" element={<ProtectedRoute><EditProfilePage /></ProtectedRoute>} />
<Route path="/collections" element={<ProtectedRoute><CollectionsPage /></ProtectedRoute>} />
<Route path="/collections/:id" element={<CollectionViewPage />} />
```

**Navigation integration** in `UserMenu.tsx`:
- Dashboard link for authenticated users
- Profile management options
- Collections access (bonus feature)

### 7. Database Schema Enhancements
**New database migrations** in `supabase/migrations/`:

#### Comments System Schema:
```sql
-- Comments table with threading support
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  thread_depth INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);
```

#### Collections and Bookmarks Schema (Bonus):
```sql
-- User collections for organizing projects
CREATE TABLE collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  projects_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- User bookmarks for individual projects
CREATE TABLE bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  UNIQUE(user_id, project_id)
);
```

### Key Architectural Decisions Made

1. **Component Composition Pattern**: Each major feature (comments, profiles, dashboard) is built as self-contained page components with reusable sub-components

2. **Service Layer Architecture**: All database operations centralized in `database.ts` with typed methods and consistent error handling

3. **Optimistic UI Updates**: Real-time feel through optimistic state updates before server confirmation

4. **Authentication Integration**: Seamless auth prompts throughout the application without breaking user flow

5. **Mobile-First Responsive Design**: All new pages designed for mobile with desktop enhancements

6. **Type Safety**: Comprehensive TypeScript types for all new data structures and API responses

### Production Quality Metrics

**Build Status**: ✅ Successful
- TypeScript compilation: 0 errors
- Vite production build: 604.01 kB (acceptable for feature scope)
- No console pollution in production code

**Code Quality**: ✅ Production Ready
- All debug console statements removed
- Proper error handling throughout
- Consistent code formatting and patterns
- Type safety maintained across all new features

**Feature Completeness**: ✅ Priority 1 Complete
- Project detail pages: Fully implemented with all planned features
- Comment system: Complete with threading, CRUD, and real-time updates
- User profiles: Comprehensive display with project portfolios
- Dashboard: Full project management interface for creators
- Database layer: All necessary services and types implemented

### Session Wrap-Up Insights (August 1, 2025)
**Lesson from comprehensive session wrap-up development**:

**Production Health Assessment**: Systematic approach to maintaining code quality and project health

1. **Code Quality Assessment Results**:
   ```bash
   # Build Status: ✅ Successful
   TypeScript compilation: 0 errors (tsc && vite build)
   Vite production build: 604.01 kB total bundle size
   ESLint warnings: 14 acceptable warnings (no errors)
   
   # Bundle Analysis
   - React vendor: 140.49 kB (45.06 kB gzipped) - largest chunk
   - Supabase vendor: 115.10 kB (30.20 kB gzipped)
   - UI vendor: 96.47 kB (31.04 kB gzipped)
   - Form vendor: 76.69 kB (20.22 kB gzipped)
   ```

2. **ESLint Configuration Setup**:
   ```json
   // Created .eslintrc.json for code quality maintenance
   {
     "parser": "@typescript-eslint/parser",
     "plugins": ["@typescript-eslint", "react-hooks", "react-refresh"],
     "rules": {
       "@typescript-eslint/no-explicit-any": "warn",
       "react-hooks/exhaustive-deps": "warn"
     }
   }
   ```

3. **Code Quality Findings**:
   - **Console statements**: Only proper error/warning logging in production (8 instances in database.ts and imageUpload.ts)
   - **Debug code**: None found - codebase is clean
   - **TypeScript warnings**: 3 `any` types in critical areas (acceptable for current phase)
   - **React Hook dependencies**: 7 missing dependency warnings (standard React pattern issues)
   - **Fast Refresh warnings**: 5 component/utility separation warnings (acceptable architectural choice)

4. **Production Readiness Status**:
   ```bash
   ✅ TypeScript compilation passes without errors
   ✅ Vite build successful (2.67s build time)
   ✅ No debug code or inappropriate console statements
   ✅ Clean git history with meaningful commit messages
   ✅ Environment variables properly configured
   ✅ Database layer with proper error handling
   ⚠️ Bundle size 604 kB (room for optimization in Priority 2)
   ```

5. **Git Repository Health**:
   ```bash
   # Clean working state
   Current branch: main (up to date with origin)
   Recent commits: Visual design improvements, proper image upload system
   Uncommitted changes: Minor CLAUDE.md formatting cleanup
   New files: .eslintrc.json (ESLint configuration)
   ```

**Session Wrap-up Best Practices Established**:
- **Assessment Phase**: Always run git status, TypeScript check, and build before committing
- **Quality Gates**: TypeScript errors are blockers, warnings are documented but acceptable
- **Documentation Updates**: Capture architectural decisions and bundle analysis
- **Production Verification**: Verify build success and clean console output
- **Tool Setup**: Create missing configuration files (ESLint) for future development

**Key Architecture Validation**:
- **Authentication Flow**: Google OAuth with @illinois.edu restriction working properly
- **Database Layer**: Supabase integration with proper error handling and RLS
- **Type Safety**: Comprehensive TypeScript coverage with minimal `any` usage
- **UI Components**: shadcn/ui system with UIUC brand consistency
- **Real-time Features**: Comments, voting, and bookmarks with optimistic updates

**Performance Profile**:
- **Build Time**: 2.67 seconds (excellent for development)
- **Bundle Size**: 604 kB total (acceptable for feature scope, potential optimization target)
- **Type Check**: Fast compilation with zero errors
- **Development Experience**: Fast refresh working, proper dev tooling setup

## Performance Monitoring & Bundle Analysis

### Bundle Size Analysis

**Current Bundle Composition (604.01 kB total)**:
```bash
# Generate detailed bundle analysis
npm run build

# Key chunks identified:
# dist/assets/index-[hash].js      (React vendor: 140.49 kB, 45.06 kB gzipped)
# dist/assets/vendor-[hash].js     (Supabase: 115.10 kB, 30.20 kB gzipped)  
# dist/assets/ui-[hash].js         (UI components: 96.47 kB, 31.04 kB gzipped)
# dist/assets/forms-[hash].js      (Form libraries: 76.69 kB, 20.22 kB gzipped)
```

**Bundle Optimization Strategies**:

1. **Code Splitting Opportunities**:
   ```typescript
   // Lazy load heavy components
   const DashboardPage = lazy(() => import('./pages/DashboardPage'))
   const UserProfilePage = lazy(() => import('./pages/UserProfilePage'))
   const ProjectDetailPage = lazy(() => import('./pages/ProjectDetailPage'))
   
   // Split vendor chunks in vite.config.ts
   build: {
     rollupOptions: {
       output: {
         manualChunks: {
           'supabase': ['@supabase/supabase-js'],
           'ui': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
           'forms': ['react-hook-form', 'zod']
         }
       }
     }
   }
   ```

2. **Dynamic Imports for Large Features**:
   ```typescript
   // Lazy load comment system (heavy feature)
   const CommentList = lazy(() => import('./components/comment/CommentList'))
   
   // Conditional loading for admin features
   const AdminPanel = lazy(() => import('./components/admin/AdminPanel'))
   ```

### Performance Monitoring

**Build Performance Metrics**:
```bash
# Monitor build times
time npm run build

# TypeScript compilation performance
time npm run type-check

# Bundle size tracking
npm run build && ls -lah dist/assets/
```

**Runtime Performance Monitoring**:

1. **Core Web Vitals Tracking**:
   ```typescript
   // Add to main.tsx for production monitoring
   import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals'
   
   if (import.meta.env.PROD) {
     getCLS(console.log)
     getFID(console.log)
     getFCP(console.log)
     getLCP(console.log)
     getTTFB(console.log)
   }
   ```

2. **Database Query Performance**:
   ```sql
   -- Monitor slow queries via MCP
   SELECT query, mean_exec_time, calls 
   FROM pg_stat_statements 
   ORDER BY mean_exec_time DESC 
   LIMIT 10;
   
   -- Check for missing indexes
   SELECT schemaname, tablename, attname, n_distinct, correlation 
   FROM pg_stats 
   WHERE tablename = 'projects';
   ```

3. **Authentication Performance**:
   ```typescript
   // Monitor auth response times
   const authStart = performance.now()
   await supabase.auth.signInWithOAuth({ provider: 'google' })
   const authTime = performance.now() - authStart
   console.log(`Auth took ${authTime}ms`)
   ```

### Performance Targets & Thresholds

**Bundle Size Targets**:
- **Total bundle**: < 800 kB (current: 604 kB ✅)
- **Initial load**: < 300 kB (needs code splitting)
- **Gzipped total**: < 200 kB (current: ~126 kB ✅)

**Build Performance Targets**:
- **TypeScript compilation**: < 5 seconds (current: ~1 second ✅)
- **Vite build**: < 10 seconds (current: 2.67 seconds ✅)
- **Hot reload**: < 100ms (development experience ✅)

**Runtime Performance Targets**:
- **First Contentful Paint (FCP)**: < 1.8 seconds
- **Largest Contentful Paint (LCP)**: < 2.5 seconds  
- **Cumulative Layout Shift (CLS)**: < 0.1
- **First Input Delay (FID)**: < 100ms

**Database Performance Targets**:
- **Simple queries**: < 50ms
- **Complex joins**: < 200ms
- **Authentication**: < 500ms

### Performance Optimization Checklist

**✅ Implemented**:
- TypeScript strict mode for compile-time optimization
- Vite for fast builds and hot reload
- Tailwind CSS for optimized styling
- Supabase for serverless database performance

**🔄 Recommended Optimizations**:
- Implement code splitting for routes
- Add web vitals monitoring  
- Optimize image loading with lazy loading
- Implement service worker for caching
- Bundle analysis automation in CI/CD

**📊 Monitoring Tools**:
- Chrome DevTools Performance tab
- Vite bundle analyzer plugin
- Supabase Dashboard metrics
- Vercel Analytics (if enabled)

### Next Development Phase Recommendations

1. **Priority 2 Features**: Enhanced discovery (search, filtering, trending)
2. **Performance Optimization**: Code splitting for the large bundle size
3. **Analytics Integration**: User engagement tracking and project view counts
4. **Advanced Moderation**: Admin tools and content management features
5. **Testing Framework**: Jest/Vitest setup for critical user flows

## Troubleshooting Guide

### Common Authentication Issues

**Google OAuth Not Working**:
```bash
# Check environment variables
echo $VITE_SUPABASE_URL
echo $VITE_SUPABASE_ANON_KEY

# Verify Supabase project settings
npx supabase projects list
```

**@illinois.edu Domain Restriction Failing**:
- Check `src/hooks/useAuth.ts` domain validation logic
- Verify user email in Supabase Dashboard > Authentication > Users
- Test with different email domains to confirm restriction

**Session Persistence Issues**:
- Clear browser localStorage and try again
- Check Supabase auth settings for session timeout
- Verify `useAuth` hook is properly wrapping components

### Database Connection Issues

**"Connection refused" or "Network unreachable"**:
```bash
# Test database connectivity
npx supabase projects list
mcp__supabase__list_projects  # Via Claude Code MCP

# Check project status
mcp__supabase__get_project --id catzwowmxluzwbhdyhnf
```

**RLS Policy Blocking Data Access**:
```sql
-- Test RLS policies with MCP
SELECT * FROM projects; -- Should work for public read
SELECT * FROM votes WHERE user_id = auth.uid(); -- Test user-specific
```

**Type Errors After Schema Changes**:
```bash
# Regenerate types immediately
npx supabase gen types typescript --project-id catzwowmxluzwbhdyhnf > src/lib/supabase-types.ts

# Check for compilation errors
npm run type-check

# Update database service layer if needed
```

### Build and Deployment Issues

**TypeScript Compilation Errors**:
```bash
# Check for type errors
npm run type-check

# Common fixes:
# 1. Regenerate Supabase types
# 2. Update imports in src/lib/database.ts
# 3. Fix any 'any' types flagged by ESLint
```

**Vite Build Failing**:
```bash
# Clear cache and rebuild
rm -rf node_modules/.vite
npm run build

# Check for import path issues
# Verify all environment variables are set
```

**Vercel Deployment Issues**:
- Verify environment variables in Vercel Dashboard
- Check build logs for missing dependencies
- Ensure `VITE_` prefix on all frontend environment variables

### Performance Issues

**Large Bundle Size (>600kB)**:
```bash
# Analyze bundle composition
npm run build
# Check dist/assets/ for largest chunks

# Consider code splitting for:
# - Supabase client (115kB)
# - UI components (96kB)  
# - Form libraries (76kB)
```

**Slow Database Queries**:
```sql
-- Use MCP to check query performance
EXPLAIN ANALYZE SELECT * FROM projects 
JOIN users ON projects.user_id = users.id;

-- Check for missing indexes
-- Verify RLS policies aren't causing full table scans
```

### Development Environment Issues

**MCP Supabase Server Not Working**:
- Verify `SUPABASE_ACCESS_TOKEN` is set in `.env.local`
- Check token permissions in Supabase Dashboard
- Test with direct CLI commands first

**Hot Reload Not Working**:
```bash
# Restart dev server
npm run dev

# Check for syntax errors in modified files
# Verify import paths are correct
```

**Environment Variable Issues**:
```bash
# Verify .env.local is loaded
source .env.local && echo $SUPABASE_ACCESS_TOKEN

# Check for typos in variable names
# Ensure VITE_ prefix for frontend variables
```

### Quick Diagnostic Commands

**Health Check Script**:
```bash
# Complete system health check
npm run type-check && \
npm run build && \
npx supabase projects list && \
echo "✅ All systems operational"
```

**Database Status Check**:
```bash
# Check database and project health
npx supabase projects list
npx supabase gen types typescript --project-id catzwowmxluzwbhdyhnf --dry-run
```

**Authentication Debug**:
- Open browser DevTools > Application > Local Storage
- Check for `supabase.auth.token` and user session data
- Verify network requests to `/auth/` endpoints succeed