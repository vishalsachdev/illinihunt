# IlliniHunt V2 - Fresh Rebuild Foundation Document

## Project Overview

**IlliniHunt** is a Product Hunt-style platform specifically designed for University of Illinois at Urbana-Champaign (UIUC) students, faculty, and staff to showcase their projects, apps, startups, and innovations. The platform features domain-restricted authentication (@illinois.edu only) and focuses on fostering innovation within the UIUC community.

## Architecture Decision: Supabase + Vercel

### Why This Stack?
- **Reliability**: No Firebase authentication issues or unpredictable pricing
- **Simplicity**: Frontend-only deployment, no server management
- **Cost Predictable**: $0-25/month vs Firebase's volatile pricing
- **Modern**: Latest React patterns with built-in real-time features
- **Scalable**: Supabase handles scaling automatically
- **University-Friendly**: Perfect for educational projects

## Tech Stack

### Frontend
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite (fast development and builds)
- **Routing**: React Router v6
- **UI Components**: shadcn/ui + Radix UI primitives
- **Styling**: Tailwind CSS with UIUC color scheme
- **State Management**: React Query for server state, React Context for auth
- **Forms**: React Hook Form + Zod validation

### Backend
- **Platform**: Supabase Cloud
- **Database**: PostgreSQL with Row Level Security
- **Authentication**: Supabase Auth with Google OAuth
- **Real-time**: Supabase real-time subscriptions
- **Storage**: Supabase Storage for images
- **API**: Auto-generated REST and GraphQL APIs

### Deployment & DevOps
- **Frontend Hosting**: Vercel (auto-deployment from GitHub)
- **Backend**: Supabase Cloud (managed)
- **Domain**: illinihunt.org (existing)
- **SSL**: Automatic via Vercel
- **Environment**: Vercel environment variables

## Database Schema Design

### Core Tables

```sql
-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  github_url TEXT,
  linkedin_url TEXT,
  website_url TEXT,
  year_of_study TEXT, -- Freshman, Sophomore, Junior, Senior, Graduate, Staff, Faculty
  department TEXT,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Projects table (main content)
CREATE TABLE public.projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  tagline TEXT NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT,
  website_url TEXT,
  github_url TEXT,
  category_id UUID REFERENCES categories(id),
  user_id UUID REFERENCES users(id) NOT NULL,
  upvotes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active', -- active, featured, archived
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Categories table
CREATE TABLE public.categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  icon TEXT, -- Lucide icon name
  color TEXT DEFAULT '#FF6B35', -- UIUC orange
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Votes table
CREATE TABLE public.votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) NOT NULL,
  project_id UUID REFERENCES projects(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, project_id)
);

-- Comments table (with threading support)
CREATE TABLE public.comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL,
  user_id UUID REFERENCES users(id) NOT NULL,
  project_id UUID REFERENCES projects(id) NOT NULL,
  parent_id UUID REFERENCES comments(id), -- for threading
  thread_depth INTEGER DEFAULT 0, -- performance optimization
  likes_count INTEGER DEFAULT 0,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Comment likes table
CREATE TABLE public.comment_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) NOT NULL,
  comment_id UUID REFERENCES comments(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, comment_id)
);

-- User roles table
CREATE TABLE public.user_roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) NOT NULL,
  role TEXT NOT NULL DEFAULT 'user', -- user, moderator, admin
  granted_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Row Level Security (RLS) Policies

```sql
-- Users can read all profiles but only update their own
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles" ON users
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Projects are publicly readable, users can create/update their own
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Projects are publicly readable" ON projects
  FOR SELECT USING (true);

CREATE POLICY "Users can create projects" ON projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects" ON projects
  FOR UPDATE USING (auth.uid() = user_id);

-- Similar policies for votes, comments, etc.
```

## Authentication System

### Authentication Flow
1. **Google OAuth**: Only @illinois.edu emails allowed
2. **Profile Creation**: Automatic profile creation on first login
3. **Domain Validation**: Server-side validation of email domain
4. **Session Management**: Supabase handles JWT tokens automatically

### Implementation Details
```typescript
// Supabase client configuration
const supabaseUrl = 'https://your-project.supabase.co'
const supabaseAnonKey = 'your-anon-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    redirectTo: `${window.location.origin}/auth/callback`
  }
})

// Google OAuth with domain restriction
const signInWithGoogle = async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      queryParams: {
        hd: 'illinois.edu' // Restrict to illinois.edu domain
      },
      redirectTo: `${window.location.origin}/auth/callback`
    }
  })
  if (error) throw error
}
```

## Feature Specifications

### Core Features (MVP)

#### 1. Authentication & User Management
- Google OAuth with @illinois.edu restriction
- User profile creation and editing
- Profile fields: name, bio, GitHub, LinkedIn, year of study, department
- Avatar upload via Supabase Storage

#### 2. Project Submissions
- Project creation form with validation
- Fields: name, tagline, description, website URL, GitHub URL, category
- Image upload for project screenshots
- Draft and publish functionality

#### 3. Project Discovery
- Home page with project feed (sorted by recent, popular, featured)
- Project detail pages with full descriptions
- Category-based filtering
- Search functionality
- Responsive grid layout

#### 4. Voting System
- One vote per user per project
- Real-time vote count updates
- Vote button with smooth animations
- Vote history for users

#### 5. Comment System
- Basic comments on projects
- Real-time comment updates
- Comment threading (up to 3 levels deep)
- Comment likes/reactions
- Comment moderation

### Enhanced Features (Post-MVP)

#### 1. Real-time Features
- Live vote count updates
- Real-time comment posting
- Online user indicators
- Typing indicators for comments

#### 2. Social Features
- User following system
- Project bookmarking
- Activity feed
- Email notifications for interactions

#### 3. Moderation & Admin
- Content moderation dashboard
- User role management
- Project featuring system
- Analytics and reporting

#### 4. Discovery & Engagement
- Trending projects algorithm
- Weekly/monthly showcases
- Project collections/lists
- Tag system for projects

## UI/UX Design System

### Color Palette (UIUC Theme)
```css
:root {
  /* UIUC Official Colors */
  --uiuc-orange: #FF6B35;
  --uiuc-blue: #13294B;
  --uiuc-light-orange: #FFB577;
  --uiuc-light-blue: #4B7BA8;
  
  /* Semantic Colors */
  --primary: var(--uiuc-orange);
  --secondary: var(--uiuc-blue);
  --accent: var(--uiuc-light-orange);
  
  /* Neutral Colors */
  --background: #FFFFFF;
  --surface: #F8F9FA;
  --border: #E5E7EB;
  --text-primary: #1F2937;
  --text-secondary: #6B7280;
}
```

### Component System
- **Design System**: shadcn/ui components with UIUC customization
- **Icons**: Lucide React icons
- **Typography**: Inter font family
- **Responsive**: Mobile-first approach with Tailwind breakpoints
- **Dark Mode**: Optional dark theme support

### Layout Structure
```
Header (Navigation + Auth)
├── Logo + Navigation Links
├── Search Bar
└── User Menu / Sign In Button

Main Content Area
├── Hero Section (for homepage)
├── Project Grid/List
├── Sidebar (filters, categories)
└── Pagination

Footer
├── Links (About, Contact, Privacy)
├── UIUC Branding
└── Social Links
```

## Development Workflow

### Project Structure
```
illinihunt-v2/
├── public/                 # Static assets
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── ui/            # shadcn/ui components
│   │   ├── auth/          # Authentication components
│   │   ├── project/       # Project-related components
│   │   └── comment/       # Comment system components
│   ├── pages/             # Page components
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utilities and configurations
│   │   ├── supabase.ts    # Supabase client
│   │   ├── auth.ts        # Auth utilities
│   │   └── utils.ts       # General utilities
│   ├── types/             # TypeScript type definitions
│   └── styles/            # Global styles and Tailwind config
├── supabase/              # Database migrations and types
│   ├── migrations/        # SQL migration files
│   └── types.ts          # Generated TypeScript types
├── .env.local             # Environment variables
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

### Environment Variables
```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Optional: Analytics, Error Tracking
VITE_GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX
VITE_SENTRY_DSN=https://your-sentry-dsn
```

### Development Scripts
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint src --ext ts,tsx",
    "type-check": "tsc --noEmit",
    "supabase:start": "supabase start",
    "supabase:stop": "supabase stop",
    "supabase:reset": "supabase db reset",
    "generate-types": "supabase gen types typescript --local > src/types/supabase.ts"
  }
}
```

## Implementation Phases

### Phase 1: Foundation (Week 1)
**Goal**: Basic project setup with authentication

**Tasks**:
1. Create new GitHub repository
2. Initialize Vite + React + TypeScript project
3. Setup Supabase project and database
4. Install and configure shadcn/ui
5. Implement Google OAuth authentication
6. Create basic routing structure
7. Deploy to Vercel with domain setup

**Deliverables**:
- Working authentication with @illinois.edu restriction
- Basic project structure
- Deployed to production URL
- User profile creation

### Phase 2: Core Features (Week 2)
**Goal**: Project submission and listing functionality

**Tasks**:
1. Create database tables and RLS policies
2. Build project submission form
3. Implement project listing page
4. Add project detail pages
5. Implement voting system
6. Add basic search functionality

**Deliverables**:
- Users can submit projects
- Project listing with voting
- Project detail pages
- Basic search and filtering

### Phase 3: Enhanced UX (Week 3)
**Goal**: Comment system and real-time features

**Tasks**:
1. Implement comment system with threading
2. Add real-time updates for votes and comments
3. Build user profile pages
4. Add image upload functionality
5. Implement responsive design
6. Add loading states and error handling

**Deliverables**:
- Working comment system
- Real-time updates
- Mobile-responsive design
- Image upload for projects and avatars

### Phase 4: Polish & Launch (Week 4)
**Goal**: Final polish and production readiness

**Tasks**:
1. Add SEO optimization and meta tags
2. Implement admin/moderation features
3. Add analytics tracking
4. Performance optimization
5. Testing and bug fixes
6. Documentation and launch preparation

**Deliverables**:
- Production-ready application
- SEO optimization
- Admin features
- Performance monitoring
- Launch documentation

## Success Metrics

### Technical Metrics
- **Performance**: Lighthouse score >90
- **Accessibility**: WCAG AA compliance
- **Mobile**: Responsive design working on all devices
- **Uptime**: >99.9% availability
- **Load Time**: <2 seconds initial page load

### User Metrics
- **Authentication**: <5% drop-off rate on sign-up
- **Engagement**: Users submit projects within first week
- **Retention**: Users return within 7 days
- **Growth**: Word-of-mouth sharing within UIUC community

## Risk Mitigation

### Technical Risks
- **Supabase Outages**: Monitor status page, have fallback plans
- **Rate Limiting**: Implement client-side caching and request optimization
- **Data Loss**: Regular database backups via Supabase
- **Security**: Regular security audits and dependency updates

### Product Risks
- **Low Adoption**: Engage with UIUC student organizations early
- **Content Quality**: Implement moderation tools from launch
- **Spam/Abuse**: Rate limiting and content validation
- **Legal Compliance**: FERPA compliance for student data

## Launch Strategy

### Pre-Launch (2 weeks before)
1. Beta testing with select UIUC students
2. Content moderation guidelines
3. Privacy policy and terms of service
4. Initial project seeding from team

### Launch Week
1. Soft launch to Computer Science students
2. Social media announcement
3. Presentation at student organization meetings
4. Email announcement to relevant mailing lists

### Post-Launch (First Month)
1. Daily monitoring and bug fixes
2. User feedback collection and implementation
3. Feature usage analytics review
4. Community building and engagement

## Long-term Vision

### Year 1 Goals
- 500+ registered UIUC users
- 100+ project submissions
- Active daily engagement
- Recognition by UIUC administration

### Future Expansion
- Multi-university platform
- Career fair integration
- Industry partner connections
- Alumni mentorship features

---

This foundation document serves as the complete blueprint for rebuilding IlliniHunt with modern, reliable technology that will serve the UIUC community effectively for years to come.