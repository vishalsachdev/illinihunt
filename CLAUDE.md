# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

IlliniHunt V2 is a Product Hunt-style platform for the University of Illinois community (students, faculty, and staff) to showcase projects, apps, and startups. Built with React + TypeScript + Supabase + Vercel.

**Live URL**: https://illinihunt.vercel.app

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
- **Vercel** with automatic deployments from GitHub main branch
- **Build command**: `npm run build` (includes TypeScript compilation)
- **Environment variables** configured in Vercel dashboard

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