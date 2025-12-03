# 📚 IlliniHunt Documentation

Welcome to the IlliniHunt documentation! This guide will help you find exactly what you need.

## 🚀 Quick Start

**New to IlliniHunt?** Start here:
1. [README.md](../README.md) - Project overview, features, and getting started
2. [CLAUDE.md](../CLAUDE.md) - Developer quick reference and essential commands
3. [CONTRIBUTING.md](../CONTRIBUTING.md) - How to contribute to the project

## 📖 Documentation Structure

### 🔧 Setup & Configuration (`/docs/setup`)
**Everything you need to get IlliniHunt running:**

- **[OAuth Setup Guide](setup/OAUTH_REDIRECT_FIX.md)** - Complete OAuth configuration for all environments
  - ✅ Works on production, preview, and local
  - 🔐 Supabase and Google Cloud Console setup
  - 🐛 Common issues and solutions

- **[Production Checklist](setup/PRODUCTION_CHECKLIST.md)** - Pre-deployment verification
  - Environment variables
  - Security settings
  - Performance optimization

### 🎨 Design & UX (`/docs/design`)
**Design system, principles, and improvements:**

- **[Design Refresh Summary](design/DESIGN_REFRESH_SUMMARY.md)** - Neon Glass design system overview
  - Color palette and utilities
  - Component updates
  - Visual improvements

- **[UX Review](design/UX_REVIEW.md)** - First principles UX analysis
  - Core UX principles
  - Issues identified
  - Priority matrix

- **[UX Improvements Summary](design/UX_IMPROVEMENTS_SUMMARY.md)** - Implemented improvements
  - Metrics and impact
  - Accessibility enhancements
  - Mobile optimization

- **[Style Guide](STYLE_GUIDE.md)** - Brand colors, typography, component patterns

### 🧑‍💻 Development (`/docs/development`)
**Technical guides for developers:**

- **[Performance Optimizations](development/PERFORMANCE_OPTIMIZATIONS.md)** - Speed and efficiency
  - Code splitting
  - Lazy loading
  - Caching strategies

- **[Claude Code Guide](CLAUDE_CODE_GUIDE.md)** - AI-assisted development workflow
- **[Database ERD](DATABASE_ERD.md)** - Schema and relationships

### 📋 Planning & Roadmap (`/docs`)
**Project planning and future direction:**

- **[Mental Model](MENTAL_MODEL.md)** - Complete architecture guide
  - System overview
  - Data flow
  - Component hierarchy

- **[Feature Roadmap](FEATURE_ROADMAP.md)** - Upcoming features
- **[Improvement Roadmap](IMPROVEMENT_ROADMAP.md)** - Planned enhancements
- **[Academic Integration](ACADEMIC_INTEGRATION.md)** - Course integration opportunities

### 🔌 Integrations
- **[PostHog Analytics](POSTHOG_ANALYTICS.md)** - User behavior tracking

## 🎯 Find What You Need

### "I want to..."

**...set up the project locally**
→ [README.md](../README.md) → Quick Setup section

**...configure OAuth for production**
→ [OAuth Setup Guide](setup/OAUTH_REDIRECT_FIX.md)

**...understand the design system**
→ [Design Refresh Summary](design/DESIGN_REFRESH_SUMMARY.md)

**...contribute code**
→ [CONTRIBUTING.md](../CONTRIBUTING.md) → [Claude Code Guide](CLAUDE_CODE_GUIDE.md)

**...understand the architecture**
→ [Mental Model](MENTAL_MODEL.md)

**...fix a bug**
→ [CLAUDE.md](../CLAUDE.md) → Troubleshooting section

**...deploy to production**
→ [Production Checklist](setup/PRODUCTION_CHECKLIST.md)

**...see what's coming next**
→ [Feature Roadmap](FEATURE_ROADMAP.md)

## 📁 File Organization

```
illinihunt/
├── README.md                    # Start here!
├── CLAUDE.md                    # Developer quick reference
├── CONTRIBUTING.md              # Contribution guide
├── AGENTS.md                    # AI agent workflows
│
├── docs/
│   ├── INDEX.md                 # This file
│   │
│   ├── setup/                   # 🔧 Configuration
│   │   ├── OAUTH_REDIRECT_FIX.md
│   │   └── PRODUCTION_CHECKLIST.md
│   │
│   ├── design/                  # 🎨 Design & UX
│   │   ├── DESIGN_REFRESH_SUMMARY.md
│   │   ├── UX_REVIEW.md
│   │   ├── UX_IMPROVEMENTS_SUMMARY.md
│   │   └── STYLE_GUIDE.md
│   │
│   ├── development/             # 🧑‍💻 Technical
│   │   ├── PERFORMANCE_OPTIMIZATIONS.md
│   │   ├── CLAUDE_CODE_GUIDE.md
│   │   └── DATABASE_ERD.md
│   │
│   └── [Planning files]         # 📋 Roadmaps, architecture
│       ├── MENTAL_MODEL.md
│       ├── FEATURE_ROADMAP.md
│       ├── IMPROVEMENT_ROADMAP.md
│       ├── ACADEMIC_INTEGRATION.md
│       └── POSTHOG_ANALYTICS.md
```

## 🆕 Recent Updates

### December 2025
- ✅ **OAuth Fix**: Dynamic `window.location.origin` solution for all environments
- ✅ **Neon Glass Design**: Complete visual refresh with premium aesthetics
- ✅ **UX Improvements**: Accessibility, mobile optimization, dark header
- ✅ **Documentation Reorganization**: Streamlined structure for better navigation

## 🤝 Contributing to Documentation

Found outdated info? Want to add examples? Documentation contributions are welcome!

1. Follow the existing structure
2. Use clear headers and examples
3. Keep language beginner-friendly
4. Add links between related docs

## 📞 Need Help?

- 💬 **General Questions**: [GitHub Discussions](https://github.com/vishalsachdev/illinihunt/discussions)
- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/vishalsachdev/illinihunt/issues)
- 📧 **Direct Contact**: vishal@illinois.edu

---

**Last Updated**: December 2025  
**Maintained by**: IlliniHunt Team
