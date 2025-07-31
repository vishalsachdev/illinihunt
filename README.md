# IlliniHunt V2 🚀

> **A Product Hunt-style platform for the University of Illinois community to discover and showcase innovative student projects, research, and startups.**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-illinihunt.vercel.app-blue?style=for-the-badge&logo=vercel)](https://illinihunt.vercel.app)
[![GitHub](https://img.shields.io/badge/GitHub-View%20Source-black?style=for-the-badge&logo=github)](https://github.com/vishalsachdev/illinihunt)

## 🎯 What is IlliniHunt?

IlliniHunt is a **problem-solving discovery platform** designed specifically for the UIUC community. Instead of just showcasing technology, we help students, faculty, and staff discover projects that solve real-world problems.

### 🌟 Key Features

- **🎓 University-Focused**: Restricted to @illinois.edu authentication
- **🎯 Problem-Centered**: Categories based on what problems projects solve, not just technology used
- **💬 Community Engagement**: Threaded comments, voting, and project collections
- **📊 Comprehensive Profiles**: User profiles with project portfolios and academic context
- **🔍 Smart Discovery**: Advanced filtering and search capabilities
- **📱 Mobile-First Design**: Responsive UI optimized for all devices

## 🎨 Problem-Focused Categories

Our innovative categorization system helps users discover projects by the problems they solve:

| Category | Description | Icon |
|----------|-------------|------|
| **Learning & Education Tools** | Educational platforms, study aids, tutoring systems | 🎓 |
| **Social & Communication** | Social networks, messaging, collaboration tools | 👥 |
| **Productivity & Organization** | Task management, scheduling, workflow automation | 📅 |
| **Health & Wellness** | Fitness tracking, mental health, medical devices | ❤️ |
| **Creative & Entertainment** | Games, media platforms, creative tools | 🎨 |
| **Research & Data Analysis** | Data visualization, research tools, analysis platforms | 📊 |
| **Business & Entrepreneurship** | Fintech, e-commerce, startup tools | 📈 |
| **Emerging Technology** | AI/ML, IoT, blockchain, cutting-edge tech | ⚡ |

## 🚀 Live Platform

**Production URLs:**
- Primary: https://illinihunt.vercel.app
- Custom Domain: https://illinihunt.org
- Status: ✅ **Production Ready**

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for build tooling and development
- **Tailwind CSS** with custom UIUC brand colors
- **shadcn/ui** components built on Radix UI
- **React Router** for client-side routing
- **React Hook Form** with Zod validation
- **Lucide React** for icons

### Backend & Database
- **Supabase** for backend-as-a-service
- **PostgreSQL** with Row Level Security (RLS)
- **Real-time subscriptions** for live updates
- **Google OAuth** with domain restrictions

### Deployment & DevOps
- **Vercel** for frontend hosting
- **GitHub Actions** for CI/CD
- **TypeScript** strict mode for type safety
- **ESLint** for code quality

## 🏗️ Architecture Overview

### Core Features Implemented
- ✅ **Project Submission & Discovery** - Full CRUD with categories and search
- ✅ **User Authentication** - Google OAuth restricted to @illinois.edu
- ✅ **Voting System** - Real-time upvoting with optimistic UI
- ✅ **Comment System** - Threaded discussions (3 levels deep)
- ✅ **User Profiles** - Comprehensive profiles with project portfolios
- ✅ **Project Collections** - Bookmark and organize favorite projects
- ✅ **Admin Dashboard** - Project management for creators
- ✅ **Real-time Activity** - Live updates for new submissions

### Database Schema
```sql
-- Core tables
users                 -- Extended Supabase auth.users
categories            -- Problem-focused project categories  
projects              -- Project submissions with metadata
votes                 -- User voting system
comments              -- Threaded comment system
collections           -- User project collections
bookmarks             -- Individual project bookmarks
```

## 🎨 Design System

### Brand Colors
- **UIUC Orange**: `#FF6B35` - Primary brand color
- **UIUC Blue**: `#13294B` - Secondary brand color
- **Supporting Colors**: Complementary palette for categories and UI elements

### Typography
- **Font Family**: Inter (system font stack fallback)
- **Consistent Hierarchy**: H1-H6 with proper scaling
- **Accessibility**: WCAG AA compliant contrast ratios

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or pnpm
- Supabase account

### Environment Setup
```bash
# Clone the repository
git clone https://github.com/vishalsachdev/illinihunt.git
cd illinihunt

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Add your Supabase credentials to .env.local
```

### Development Commands
```bash
# Start development server
npm run dev              # Vite dev server at http://localhost:5173

# Build for production  
npm run build           # TypeScript check + Vite build

# Preview production build
npm run preview         # Test production build locally

# Code quality
npm run type-check      # TypeScript compilation check
npm run lint            # ESLint with TypeScript support
```

### Database Setup
```bash
# Using Supabase CLI (optional)
npx supabase start      # Start local Supabase
npx supabase db reset   # Apply all migrations
```

## 📁 Project Structure

```
src/
├── components/         # Reusable UI components
│   ├── auth/          # Authentication components
│   ├── comment/       # Comment system components  
│   ├── project/       # Project-related components
│   └── ui/            # shadcn/ui primitives
├── contexts/          # React Context providers
├── hooks/             # Custom React hooks
├── lib/               # Utilities and configurations
│   ├── categoryIcons.tsx  # Icon mapping system
│   ├── database.ts        # Supabase service layer
│   ├── supabase.ts        # Supabase client config
│   └── validations.ts     # Zod schemas
├── pages/             # Route components
└── types/             # TypeScript type definitions

supabase/
├── migrations/        # Database migrations
└── config.toml       # Supabase configuration
```

## 📋 Development Roadmap

### ✅ Recently Completed (January 2025)
- **Category System Redesign** - Problem-focused categorization
- **Project Detail Pages** - Individual project pages with full context
- **Comment System** - Threaded discussions with real-time updates  
- **User Profiles** - Complete profile system with project portfolios
- **Collections & Bookmarks** - Project organization features
- **Enhanced Analytics** - PostHog integration planning

### 🚧 Current Priorities
- **Project Editing Forms** - Allow creators to update their projects
- **Advanced Search** - Tag system and enhanced filtering
- **Admin Panel** - Content moderation and featured project curation

### 🔮 Future Enhancements
- **Course Integration** - Connect projects to UIUC courses
- **Faculty Collaboration** - Professor and research mentor features
- **Industry Partnerships** - Connect projects to career opportunities
- **Mobile App** - Native iOS/Android applications

## 🤝 Contributing to IlliniHunt

**Welcome UIUC Students!** 🎓 IlliniHunt is built by students, for students. Contributing offers unique opportunities for portfolio building, academic credit, and real-world experience with modern web development.

### 🚀 Quick Start for Students
1. **Read our [Contributing Guide](CONTRIBUTING.md)** - Comprehensive guide for UIUC contributors
2. **Browse [Student-Friendly Issues](https://github.com/vishalsachdev/illinihunt/labels/student-friendly)** - Perfect starting points
3. **Try AI-Assisted Development** - Use @claude for help and learning
4. **Connect Course Projects** - Integrate with CS/ECE/BADM coursework

### 🤖 AI-Powered Development Workflow

IlliniHunt now includes **Claude Code automation** to help students learn and contribute more effectively:

**How It Works:**
- Mention **@claude** in any issue or PR comment
- Get automatic code suggestions, reviews, and implementations  
- Learn best practices through AI explanations and guidance

**Example Commands:**
```markdown
@claude implement user notification system with real-time updates

@claude review this component for accessibility and performance

@claude fix the TypeScript error in the ProjectCard component
```

**Learning Benefits:**
- 📚 **Code Explanations**: Understand complex patterns and architecture
- 🏆 **Best Practices**: Learn React, TypeScript, and Supabase through AI guidance
- 🔍 **Code Reviews**: Get detailed feedback on your contributions
- 🤝 **Collaborative Learning**: Work alongside AI to tackle challenging features

### 🎯 Contribution Opportunities

#### 🟢 **Beginner-Friendly** (New to web development)
- UI improvements and visual fixes
- Documentation updates and examples
- Simple component modifications
- Icon and styling enhancements

#### 🟡 **Intermediate** (Some React/JS experience)
- New feature components and pages
- Database schema improvements
- API integration enhancements
- Performance optimizations

#### 🔴 **Advanced** (Experienced developers)
- Architecture improvements and refactoring
- Complex feature implementations
- Security enhancements and audits
- DevOps and deployment improvements

### 🏫 Academic Integration

**Course Project Opportunities:**
- **CS 225**: Data structures for search/filtering algorithms
- **CS 411**: Database optimization and query improvements
- **CS 465**: UI/UX research and design improvements
- **CS 519**: Data visualization and analytics features
- **BADM 350**: Business model analysis and user engagement

**Research Opportunities:**
- Human-computer interaction studies
- Software engineering methodology research
- Social computing and community analysis
- AI-assisted development effectiveness studies

**Getting Academic Credit:**
1. Use our [Course Project Template](https://github.com/vishalsachdev/illinihunt/issues/new?template=course_project.yml)
2. Discuss integration with your professor
3. Document learning outcomes and contributions
4. Present results in class or research papers

### 🛠️ Development Workflow

```bash
# 1. Fork and clone
git clone https://github.com/YOUR_USERNAME/illinihunt.git
cd illinihunt

# 2. Install dependencies
npm install

# 3. Set up environment
cp .env.example .env.local
# Add Supabase credentials

# 4. Start development
npm run dev

# 5. Create feature branch
git checkout -b feature/your-feature-name

# 6. Use AI assistance
# Comment on issues with @claude for help
```

### 🎨 Code Quality Standards
- **TypeScript**: Strict mode enabled, avoid `any` types
- **React**: Functional components with hooks
- **Styling**: Tailwind CSS with design system
- **AI Review**: Use @claude for code review and suggestions
- **Testing**: Add tests for new features when applicable

### 🌟 Student Success Stories

*Coming soon: Showcase of UIUC students who have:*
- Landed tech internships through IlliniHunt contributions
- Published research papers based on their work
- Received academic credit for open source contributions
- Built impressive portfolio projects for career advancement

### 📞 Getting Help

- **GitHub Discussions**: Ask questions and share ideas
- **Issue Comments**: Tag maintainers or use @claude for AI help
- **Contributing Guide**: [Detailed instructions](CONTRIBUTING.md)
- **AI Assistant**: Get coding help and explanations anytime

### 🎊 Recognition

Contributors receive:
- GitHub contributor recognition
- LinkedIn recommendations for significant contributions
- Portfolio project showcase opportunities
- Potential research collaboration and co-authorship
- Academic credit coordination with professors

## 📊 Platform Analytics

- **Target Users**: UIUC students, faculty, and staff
- **Authentication**: Google OAuth with @illinois.edu domain restriction
- **Categories**: 8 problem-focused categories
- **Features**: 15+ major features implemented
- **Deployment**: Production-ready with CI/CD pipeline

## 📞 Contact & Support

- **Platform**: [illinihunt.vercel.app](https://illinihunt.vercel.app)
- **GitHub**: [github.com/vishalsachdev/illinihunt](https://github.com/vishalsachdev/illinihunt)
- **Issues**: Report bugs and feature requests via GitHub Issues

## 📄 License

This project is developed for the University of Illinois community. See LICENSE file for details.

---

**Built with ❤️ for the University of Illinois community**

*Transforming how students discover and showcase innovative projects that solve real-world problems.*