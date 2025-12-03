# IlliniHunt V2 🚀

> **A Product Hunt-style platform for the University of Illinois community to discover and showcase innovative student projects, research, and startups.**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-illinihunt.vercel.app-blue?style=for-the-badge&logo=vercel)](https://illinihunt.vercel.app)
[![GitHub](https://img.shields.io/badge/GitHub-View%20Source-black?style=for-the-badge&logo=github)](https://github.com/vishalsachdev/illinihunt)

## 🎯 What is IlliniHunt?

IlliniHunt is a **problem-solving discovery platform** designed specifically for the Illinois community. Instead of just showcasing technology, we help students, faculty, and staff discover projects that solve real-world problems.

### 🌟 Key Features

- **🎓 University-Focused**: Restricted to @illinois.edu authentication
- **🎯 Problem-Centered**: Categories based on what problems projects solve, not just technology used
- **💬 Community Engagement**: Threaded comments, voting, and project collections
- **📊 Comprehensive Profiles**: User profiles with project portfolios and academic context
- **📱 Mobile-First Design**: Responsive UI optimized for all devices

## 🎨 Problem-Focused Categories

Our innovative categorization system helps users discover projects by the problems they solve:

| Category | Description | Icon |
|----------|-------------|------|
| **Learning & Education Tools** | Educational platforms, study aids, tutoring systems | 🎓 |
| **Social & Communication** | Social networks, messaging, collaboration tools | 👥 |
| **Productivity & Organization** | Task management, calendars, workflow tools | 📅 |
| **Health & Wellness** | Fitness apps, mental health, medical tools | ❤️ |
| **Creative & Entertainment** | Art tools, games, multimedia platforms | 🎨 |
| **Research & Data Analysis** | Data visualization, research tools, analytics | 📊 |
| **Business & Entrepreneurship** | Startup tools, business apps, marketplace | 📈 |
| **Emerging Technology** | AI/ML, blockchain, IoT, cutting-edge tech | ⚡ |

## 🚀 Live Platform

**Production URLs:**
- Primary: https://illinihunt.vercel.app
- Custom Domain: https://illinihunt.org
- Status: ✅ **Production Ready**

## 🛠️ Tech Stack & Architecture

**Modern, Production-Ready Stack:**
- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Real-time)
- **UI/UX**: shadcn/ui components, UIUC brand colors (`#FF6B35`, `#13294B`)
- **Deployment**: Vercel with auto-deploy from GitHub

**✅ Core Features Complete:**
Project submission, real-time voting, threaded comments, user profiles, collections, admin dashboard

**📚 Documentation:**
- **[📖 Documentation Index](docs/INDEX.md)** - Complete documentation guide
- **[🏗️ Architecture Overview](docs/MENTAL_MODEL.md)** - Full system design
- **[🔧 Developer Guide](CLAUDE.md)** - Quick reference and commands
- **[🎨 Design System](docs/design/DESIGN_REFRESH_SUMMARY.md)** - Neon Glass aesthetic
- **[🔐 OAuth Setup](docs/setup/OAUTH_REDIRECT_FIX.md)** - Authentication configuration

## 🚀 Getting Started

### Quick Setup
```bash
# Clone & Install
git clone https://github.com/vishalsachdev/illinihunt.git && cd illinihunt && npm install

# Environment (.env.local)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key

# Start Development
npm run dev  # http://localhost:5173
```

### Essential Commands
```bash
npm run dev          # Development server
npm run build        # Production build
npm run type-check   # TypeScript validation
npm run lint         # Code quality check
```

**📖 For detailed setup and development workflow, see: [CLAUDE.md](CLAUDE.md)**

## 📋 Current Status & Roadmap

### ✅ Phase 1 Complete: Core Platform
All essential features implemented and production-ready:
- Secure authentication (@illinois.edu only)
- Project submission and discovery
- Real-time voting and comments
- User profiles and collections

### 🔄 Phase 2 Next: Advanced Features
- Advanced search and filtering
- Trending algorithm with analytics
- Admin moderation tools
- Testing framework

**📅 For detailed implementation plans: [docs/IMPROVEMENT_ROADMAP.md](docs/IMPROVEMENT_ROADMAP.md)**

## 🤝 Contributing to IlliniHunt

**Welcome Illinois Students!** 🎓 IlliniHunt is built by students, for students. Contributing offers unique opportunities for portfolio building, academic credit, and real-world experience with modern web development.

### 🚀 Quick Start for Students
1. **Read our [Contributing Guide](CONTRIBUTING.md)** - Comprehensive guide for Illinois contributors
2. **Browse [Student-Friendly Issues](https://github.com/vishalsachdev/illinihunt/labels/student-friendly)** - Perfect starting points
3. **Try AI-Assisted Development** - Use @claude for help and learning

### 🤖 Complete AI-Powered Development Workflow

IlliniHunt features a **revolutionary automated development pipeline** that takes non-technical users from idea to working feature!

#### 🎯 **For Non-Technical Users** (Students, Faculty, Staff)

**Have a great idea but can't code?** No problem! Our automated workflow handles everything:

1. **💡 Submit Your Idea** - Use our GitHub issue templates to describe what you want
2. **🤖 AI Clarification** - @claude asks questions to understand your needs perfectly
3. **📋 Specification Creation** - @claude creates detailed technical plans for your review
4. **✅ Your Approval** - Simple checkbox approval process
5. **⚡ Automatic Implementation** - @claude writes production-ready code
6. **👥 Expert Review** - Experienced developers ensure quality
7. **🚀 Live Deployment** - Your feature goes live automatically!

**🚀 Get Started:** [Submit a Feature Request](https://github.com/vishalsachdev/illinihunt/issues/new?template=feature_request.yml) or [Report a Bug](https://github.com/vishalsachdev/illinihunt/issues/new?template=bug_report.yml)

#### 🧑‍💻 **For Technical Contributors** (Students with coding experience)

**Want to dive deep into modern web development?** Perfect! You'll get hands-on experience with:

- 🏆 **Real-World Impact**: Your code affects real users daily
- 🎓 **Portfolio Building**: Showcase real-world React/TypeScript/Supabase experience
- 🧠 **AI-Assisted Coding**: Learn from @claude's guidance and explanations
- 👥 **Community Building**: Connect with fellow Illinois developers
- 📈 **Career Growth**: Reference from project maintainers

**Development Features:**
- 🔄 **Hot Reload Development** - See changes instantly
- 🧪 **Type-Safe Development** - TypeScript catches errors early
- 🎨 **Component Library** - Pre-built UI components
- 📊 **Real-time Features** - WebSocket subscriptions and optimistic UI
- 🔒 **Security-First** - Row Level Security (RLS) and domain restrictions

**Perfect for:**
- CS/ECE students learning modern web development
- Research projects needing real-world deployment
- Senior design projects and capstone work
- Students interested in startup experience

### 🎓 **Academic Integration Opportunities**

- **CS 411 (Database Systems)** - Real database optimization and schema design
- **CS 421 (Programming Languages)** - TypeScript advanced patterns and functional concepts
- **CS 465 (User Interface Design)** - UI/UX research and A/B testing
- **ECE 408 (Applied Parallel Programming)** - Performance optimization and caching
- **BADM 350 (Intro to Information Systems)** - Business analysis and user research

### 🏅 **Recognition & Rewards**

- **🌟 Contributor Credits** - Your name featured on the platform
- **📝 LinkedIn Recommendations** - From project maintainers
- **🎯 Portfolio Projects** - Real-world examples for internship applications
- **🚀 Startup Experience** - Learn product development and user feedback cycles
- **🎓 Academic Credit** - Work with professors to integrate contributions into coursework

### 📞 Support for Contributors

**Stuck? Need Help?** We've got you covered:

- 🤖 **AI Assistant (@claude)** - Get coding help and explanations 24/7
- 💬 **GitHub Discussions** - Community support and feature discussions
- 📋 **Detailed Issues** - Clear descriptions with acceptance criteria
- 🎥 **Video Walkthroughs** - Screen recordings for complex features
- 👥 **Peer Reviews** - Learn from experienced contributor feedback

**New to open source?** No problem! We have [first-contribution](https://github.com/vishalsachdev/illinihunt/labels/first-contribution) issues perfect for beginners.

## 📊 Platform Analytics

- 🎯 **Target Users**: 50,000+ University of Illinois students, faculty, and staff
- 🚀 **Current Status**: Production-ready with growing user base
- 📈 **Growth Strategy**: Course integration and faculty partnerships
- 🔒 **Security**: Enterprise-grade authentication and data protection

## 📞 Contact & Support

- **🐛 Bug Reports**: [GitHub Issues](https://github.com/vishalsachdev/illinihunt/issues)
- **💡 Feature Requests**: [GitHub Discussions](https://github.com/vishalsachdev/illinihunt/discussions)
- **📧 Direct Contact**: [vishal@illinois.edu](mailto:vishal@illinois.edu)

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

**Built with ❤️ by Illinois students, for Illinois students** 🎓