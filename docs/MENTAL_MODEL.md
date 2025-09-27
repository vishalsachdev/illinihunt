---
theme: default
background: https://source.unsplash.com/1920x1080/?technology,university
class: text-center
highlighter: shiki
lineNumbers: false
info: |
  ## IlliniHunt Mental Model
  A comprehensive guide to understanding the Product Hunt-style platform for University of Illinois
drawings:
  persist: false
transition: slide-left
title: IlliniHunt Mental Model
---

# IlliniHunt Mental Model
## 🧠 Understanding the Codebase Architecture

*A comprehensive guide for vibe coding on the University of Illinois project discovery platform*

<div class="pt-12">
  <span @click="$slidev.nav.next" class="px-2 py-1 rounded cursor-pointer" hover="bg-white bg-opacity-10">
    Press Space for next page <carbon:arrow-right class="inline"/>
  </span>
</div>

---
layout: center
class: text-center
---

# 🎯 What is IlliniHunt?

<div class="grid grid-cols-2 gap-8 mt-8">

<div>

## Core Concept
**Product Hunt for University of Illinois**

- 🎓 **University-Focused**: @illinois.edu authentication only
- 🎯 **Problem-Centered**: Categories based on problems solved
- 💬 **Community Engagement**: Voting, comments, collections
- 📱 **Mobile-First**: Responsive design

</div>

<div>

## Key Features
- ✅ Project submission & discovery
- ✅ Real-time voting system
- ✅ Threaded comments (3 levels)
- ✅ User profiles & portfolios
- ✅ Project collections & bookmarks
- ✅ Admin dashboard

</div>

</div>

---
layout: two-cols
---

# 🏗️ Tech Stack

## Frontend
- **React 18** + TypeScript
- **Vite** for build tooling
- **Tailwind CSS** + shadcn/ui
- **React Router** for routing
- **React Hook Form** + Zod validation

## Backend & Database
- **Supabase** (PostgreSQL + Auth)
- **Row Level Security (RLS)**
- **Real-time subscriptions**
- **Google OAuth** with domain restrictions

::right::

## Deployment & DevOps
- **Vercel** for hosting
- **GitHub Actions** for CI/CD
- **TypeScript** strict mode
- **ESLint** for code quality

## Design System
- **UIUC Orange**: `#FF6B35`
- **UIUC Blue**: `#13294B`
- **Lucide React** icons
- **Mobile-first** responsive design

---
layout: center
---

# 📊 Database Schema

<div class="grid grid-cols-2 gap-8 mt-8">

<div>

## Core Tables
```sql
users (extends Supabase auth.users)
├── id, email, username, full_name
├── avatar_url, bio, github_url
├── year_of_study, department

projects (main content)
├── name, tagline, description
├── category_id, user_id
├── upvotes_count, comments_count

votes (user voting)
├── user_id, project_id (unique)

comments (threaded discussions)
├── content, user_id, project_id
├── parent_id, thread_depth
```

</div>

<div>

## Organization Tables
```sql
categories (8 problem-focused)
├── Learning & Education Tools 🎓
├── Social & Communication 👥
├── Productivity & Organization 📅
├── Health & Wellness ❤️
├── Creative & Entertainment 🎨
├── Research & Data Analysis 📊
├── Business & Entrepreneurship 📈
└── Emerging Technology ⚡

collections & bookmarks
├── collections: user_id, name, is_public
├── bookmarks: user_id, project_id
└── collection_projects: many-to-many
```

</div>

</div>

---
layout: two-cols
---

# 🎨 User Flows & Pages

## Public Pages
- **`/`** - HomePage: Hero + Featured + Categories
- **`/project/:id`** - ProjectDetailPage: Full project view
- **`/user/:id`** - UserProfilePage: Public user profile

## Protected Pages
- **`/submit`** - SubmitProjectPage: Project submission
- **`/dashboard`** - DashboardPage: Project management
- **`/profile/edit`** - EditProfilePage: Profile editing
- **`/edit-project/:id`** - EditProjectPage: Project editing
- **`/collections`** - CollectionsPage: Collection management

::right::

## Key User Journeys

### 1. Project Discovery
```
HomePage → Category → ProjectGrid → ProjectCard → ProjectDetail
```

### 2. Project Submission
```
Login → SubmitProject → ProjectForm → Success → Redirect
```

### 3. Engagement
```
ProjectDetail → Vote/Comment/Bookmark → Real-time Updates
```

### 4. Management
```
Dashboard → Stats → Edit/Delete → Profile Management
```

---
layout: center
---

# ⚡ Real-time Features

<div class="grid grid-cols-2 gap-8 mt-8">

<div>

## Voting System
- **Optimistic UI**: Immediate vote count updates
- **Real-time sync**: `RealtimeVotesContext` manages live updates
- **Error handling**: Rollback on failure, sync validation
- **Database triggers**: Auto-update `upvotes_count`

## Comment System
- **Threaded comments**: 3 levels deep
- **Soft deletion**: `is_deleted` flag
- **Real-time updates**: New comments appear live

</div>

<div>

## State Management
```typescript
// Context providers
AuthProvider          // User authentication
ErrorProvider         // Global error handling
RealtimeVotesProvider // Live vote updates
AuthPromptProvider    // Auth prompts

// Custom hooks
useAuth()             // Authentication state
useRealtimeVotes()    // Vote management
useWindowSize()       // Responsive utilities
```

</div>

</div>

---
layout: two-cols
---

# 🛡️ Security & Authentication

## Authentication Flow
```
Google OAuth → @illinois.edu validation → 
User profile creation → Session management
```

## Row Level Security (RLS)
- **Users**: View all, update own profile
- **Projects**: Public read, own CRUD operations
- **Votes/Comments**: Own operations only
- **Collections**: Own collections, public visible

::right::

## Protected Routes
```typescript
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth()
  
  if (loading) return <LoadingSpinner />
  if (!user) return <Navigate to="/" />
  
  return <>{children}</>
}
```

## Security Issues (Current)
- 🔴 RLS disabled on comments table
- 🔴 Client-side only domain restriction
- 🔴 20+ redundant auth calls per page load

---
layout: center
---

# 🎨 UI/UX Patterns

<div class="grid grid-cols-2 gap-8 mt-8">

<div>

## Design System
- **Colors**: UIUC Orange (`#FF6B35`), UIUC Blue (`#13294B`)
- **Components**: shadcn/ui primitives
- **Icons**: Lucide React icons
- **Responsive**: Mobile-first with Tailwind

## Key Components
- **ProjectCard**: Main project display with voting overlay
- **VoteButton**: Optimistic voting with real-time sync
- **ProjectForm**: Comprehensive submission/editing
- **CommentList**: Threaded comment display
- **UserMenu**: Profile dropdown navigation

</div>

<div>

## Error Handling
```typescript
// Global error boundary
<ErrorBoundary>
  <App />
</ErrorBoundary>

// Service error handling
const { handleServiceError, showSuccess } = useError()

// Toast notifications
<Toaster position="top-right" richColors />
```

## Performance Optimizations
- **Code splitting**: Lazy-loaded pages
- **Preloading**: Critical routes on interaction
- **Debouncing**: Search queries (300ms)
- **Caching**: Profile data in localStorage

</div>

</div>

---
layout: center
---

# 🔧 Development Patterns

<div class="grid grid-cols-2 gap-8 mt-8">

<div>

## Service Layer Pattern
```typescript
// database.ts - Abstracts all Supabase operations
export const ProjectsService = {
  getProjects: (filters) => supabase.from('projects').select('*'),
  createProject: (data) => supabase.from('projects').insert(data),
  voteProject: (id) => supabase.from('votes').insert({project_id: id}),
  // ... more methods
}
```

## Form Handling
```typescript
// React Hook Form + Zod validation
const form = useForm<ProjectFormData>({
  resolver: zodResolver(projectSchema)
})

const onSubmit = async (data) => {
  // Optimistic UI updates
  // Service calls
  // Error handling
}
```

</div>

<div>

## Real-time Updates
```typescript
// RealtimeVotesContext
const { getVoteData, updateVoteCount, updateUserVote } = useRealtimeVotesContext()

// Subscribe to vote changes
useEffect(() => {
  const subscription = supabase
    .channel('votes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'votes' }, 
        handleVoteChange)
    .subscribe()
    
  return () => subscription.unsubscribe()
}, [])
```

</div>

</div>

---
layout: center
---

# 🎯 Vibe Coding Tips

<div class="grid grid-cols-2 gap-8 mt-8">

<div>

## When Adding Features
1. **Check existing patterns**: Look at similar components first
2. **Use service layer**: Add functions to `database.ts`
3. **Follow RLS**: Ensure proper security policies
4. **Optimistic UI**: Update UI immediately, handle errors gracefully
5. **Real-time**: Consider if feature needs live updates

## Common Patterns
- **Protected content**: Wrap in `ProtectedRoute`
- **Loading states**: Use consistent loading spinners
- **Error handling**: Use `useError` hook for consistent UX
- **Form validation**: Use Zod schemas with React Hook Form
- **Real-time data**: Use `useRealtimeVotesContext` for vote-related features

</div>

<div>

## File Organization
```
src/
├── components/         # Reusable UI components
│   ├── auth/          # Authentication components
│   ├── project/       # Project-related components
│   ├── comment/       # Comment system components
│   └── ui/            # shadcn/ui primitives
├── contexts/          # React Context providers
├── hooks/             # Custom React hooks
├── lib/               # Utilities and configurations
├── pages/             # Route components
└── types/             # TypeScript type definitions
```

## Key Commands
```bash
npm run dev          # Start development server
npm run build        # Production build
npm run type-check   # TypeScript validation
npm run lint         # ESLint check
```

</div>

</div>

---
layout: center
---

# 🚨 Current Issues & Opportunities

<div class="grid grid-cols-2 gap-8 mt-8">

<div>

## Critical Issues
- 🔴 **Performance**: 20+ redundant auth calls per page load
- 🔴 **Security**: RLS disabled on comments table
- 🔴 **Auth**: Client-side only domain restriction
- 🟡 **Voting**: Potential sync issues with optimistic updates

## Performance Problems
- Loading screens for logged-in users
- Frozen submit buttons
- Redundant database calls
- Missing rate limiting

</div>

<div>

## Future Enhancements
- 🔮 **Course Integration**: Connect projects to UIUC courses
- 🔮 **Faculty Collaboration**: Professor and research mentor features
- 🔮 **Industry Partnerships**: Connect projects to career opportunities
- 🔮 **Mobile App**: Native iOS/Android applications
- 🔮 **Advanced Search**: Tag system and enhanced filtering
- 🔮 **Admin Panel**: Content moderation and featured project curation

</div>

</div>

---
layout: center
---

# 🎉 Key Takeaways

<div class="grid grid-cols-2 gap-8 mt-8">

<div>

## Architecture Principles
- **Context-driven state management**
- **Service layer abstraction**
- **Optimistic UI updates**
- **Real-time subscriptions**
- **Protected routes with auth guards**

## Development Philosophy
- **Mobile-first design**
- **Problem-focused categorization**
- **Community-driven engagement**
- **University-specific features**
- **AI-assisted development workflow**

</div>

<div>

## Mental Model Summary
1. **IlliniHunt = Product Hunt for UIUC**
2. **Problem-centered categories** (not tech-focused)
3. **Real-time voting and comments**
4. **Supabase backend with RLS security**
5. **React + TypeScript frontend**
6. **Optimistic UI with error handling**
7. **Context-based state management**

</div>

</div>

---
layout: center
class: text-center
---

# 🚀 Ready to Code!

<div class="pt-12">
  <span class="text-6xl">🎓</span>
</div>

<div class="pt-4 text-4xl">
  <span class="text-uiuc-orange">IlliniHunt</span> Mental Model Complete
</div>

<div class="pt-8 text-xl opacity-80">
  You now have the complete mental model for vibe coding on IlliniHunt!
</div>

<div class="pt-8">
  <span class="px-4 py-2 bg-uiuc-blue text-white rounded-lg">
    Happy Coding! 🚀
  </span>
</div>
