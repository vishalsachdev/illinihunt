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

## 🤝 Contributing

This project is currently in active development for the UIUC community. If you're a UIUC student, faculty, or staff member interested in contributing:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit your changes** (`git commit -m 'Add amazing feature'`)
4. **Push to the branch** (`git push origin feature/amazing-feature`)
5. **Open a Pull Request**

### Code Quality Standards
- **TypeScript**: Strict mode enabled, no `any` types in new code
- **ESLint**: Follow configured rules for consistency
- **Testing**: Add tests for new features (framework TBD)
- **Documentation**: Update relevant docs for significant changes

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