# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

IlliniHunt V2 is a Product Hunt-style platform for the University of Illinois community (students, faculty, and staff) to showcase projects, apps, and startups. Built with React + TypeScript + Supabase + Vercel.

**Live URL**: https://illinihunt.vercel.app
and https://illinihunt.org/
and https://www.illinihunt.org/


## Development Commands

```bash
# Development
npm run dev              # Start Vite dev server
npm run build           # Build for production (runs TypeScript check + Vite build)
npm run preview         # Preview production build locally
npm run type-check      # Run TypeScript compiler without emitting files
npm run lint            # Run ESLint with TypeScript support

# No test commands are configured in this project
```

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
- `users` - User profiles linked to Supabase auth
- `projects` - Project submissions with voting counts
- `categories` - Project categories with colors and icons
- `votes` - User votes on projects (one per user per project)

### Environment Setup
Required environment variables in `.env.local`:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Deployment
- **Vercel** with GitHub integration for automatic deployments
- **Build command**: `npm run build` (includes TypeScript compilation)
- **Environment variables** configured in Vercel dashboard
- **Automatic deployment**: Every push to main branch triggers production deployment
- **Preview deployments**: All pull requests get preview deployments automatically

## Important Files to Understand

- `src/App.tsx` - Main app structure with routing and auth providers
- `src/pages/HomePage.tsx` - Landing page with hero section and project grid
- `src/lib/supabase.ts` - Supabase client configuration
- `src/lib/database.ts` - Database service layer with typed methods
- `src/contexts/AuthPromptContext.tsx` - Authentication UX management
- `src/hooks/useAuth.ts` - Core authentication hook
- `tailwind.config.js` - Custom UIUC colors and design tokens

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

### Next Development Phase Recommendations

1. **Priority 2 Features**: Enhanced discovery (search, filtering, trending)
2. **Performance Optimization**: Code splitting for the large bundle size
3. **Analytics Integration**: User engagement tracking and project view counts
4. **Advanced Moderation**: Admin tools and content management features
5. **Testing Framework**: Jest/Vitest setup for critical user flows