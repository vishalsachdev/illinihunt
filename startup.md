Note for Starting IlliniHunt V2 Fresh Rebuild

  Context & Background

  - Original Project: IlliniHunt was a Product Hunt-style platform for UIUC students with Firebase authentication
  issues
  - Problem: Firebase auth was unreliable, had auto-detection issues, MetaMask interference, and unpredictable
  pricing
  - Decision: Complete fresh rebuild with Supabase + Vercel for reliability and cost predictability
  - Data: No migration needed - starting completely fresh (original was in development)

  Architecture Decisions Made

  - Frontend: React 18 + TypeScript + Vite + React Router
  - Backend: Supabase (Auth + Database + Real-time + Storage)
  - Deployment: Vercel (frontend) + Supabase Cloud (backend)
  - UI: shadcn/ui + Radix UI + Tailwind CSS with UIUC branding
  - Domain: Continue using illinihunt.org

  Key Features to Rebuild

  1. @illinois.edu only authentication (Google OAuth)
  2. Product Hunt-style project submissions with voting
  3. Threaded comment system (3 levels max) with real-time updates
  4. User profiles with social links and project management
  5. Search and filtering by category, popularity, date
  6. UIUC branding (orange #FF6B35 and navy #13294B colors)
  7. Real-time features using Supabase subscriptions (not WebSocket)

  Complete Documentation Created

  Located in /Users/vishal/Desktop/IlliniHunt/NEW_PROJECT_PLANS/:
  - PROJECT_FOUNDATION.md - Main blueprint with architecture and design
  - TECHNICAL_SPECIFICATIONS.md - Detailed implementation guide
  - DATABASE_MIGRATIONS.sql - Ready-to-run Supabase schema
  - COMPONENT_SPECIFICATIONS.md - All React components with TypeScript
  - IMPLEMENTATION_CHECKLIST.md - 28-day step-by-step plan

  Critical Success Factors

  1. Follow the 4-phase plan: Foundation → Core Features → Enhanced Features → Production Polish
  2. Supabase setup first: Database schema, RLS policies, authentication providers
  3. @illinois.edu validation: Must be server-side validated, not just client-side
  4. Real-time with Supabase: Use subscriptions, not custom WebSocket like original
  5. Mobile-first design: Responsive from day 1, not retrofitted

  User's Preferences Captured

  - Keep existing shadcn/ui + Radix component system (worked well)
  - Maintain UIUC orange/navy branding and university focus
  - Start completely fresh - no data migration needed
  - Prioritize reliability over feature complexity initially
  - Use illinihunt.org domain (existing)

  Expected Timeline

  - Week 1: Supabase setup, authentication, basic layout
  - Week 2: Database schema, project submission, voting system
  - Week 3: Comment system, real-time features, user profiles
  - Week 4: Polish, admin features, SEO, launch preparation

  Anti-Patterns to Avoid

  - ❌ Don't use Firebase (authentication issues)
  - ❌ Don't build custom WebSocket server (use Supabase real-time)
  - ❌ Don't use Express.js backend (Supabase handles this)
  - ❌ Don't over-engineer initially (start simple, enhance later)
  - ❌ Don't skip RLS policies (security first)

  When I Start the New Project

  1. Read all documentation in NEW_PROJECT_PLANS folder first
  2. Follow Implementation Checklist day by day
  3. Start with Phase 1: Supabase setup and authentication
  4. Test authentication thoroughly before moving to features
  5. Deploy early and often to catch issues quickly
