# 📌 Quick Reference

**Fast access to common tasks and resources.**

## 🚀 Common Commands

```bash
# Development
npm run dev                    # Start dev server (localhost:5173)
npm run build                  # Production build
npm run preview                # Preview production build

# Quality
npm run type-check             # TypeScript validation
npm run lint                   # ESLint check

# Git
git status                     # Check changes
git add .                      # Stage all changes
git commit -m "message"        # Commit changes
git push origin main           # Push to main
```

## 📖 Essential Documentation

| Task | Documentation |
|------|---------------|
| **Get Started** | [README.md](README.md) |
| **Configure OAuth** | [docs/setup/OAUTH_REDIRECT_FIX.md](docs/setup/OAUTH_REDIRECT_FIX.md) |
| **Understand Architecture** | [docs/MENTAL_MODEL.md](docs/MENTAL_MODEL.md) |
| **Design Guidelines** | [docs/design/DESIGN_REFRESH_SUMMARY.md](docs/design/DESIGN_REFRESH_SUMMARY.md) |
| **Contribute Code** | [CONTRIBUTING.md](CONTRIBUTING.md) |
| **Deploy to Production** | [docs/setup/PRODUCTION_CHECKLIST.md](docs/setup/PRODUCTION_CHECKLIST.md) |
| **All Documentation** | [docs/INDEX.md](docs/INDEX.md) ⭐ |

## 🔧 Environment Setup

**`.env.local` required:**
```bash
VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

## 🌐 URLs

- **Production**: https://illinihunt.org
- **Preview**: https://illinihunt-*.vercel.app
- **Local**: http://localhost:5173
- **Supabase**: https://supabase.com/dashboard
- **Vercel**: https://vercel.com/dashboard

## 🐛 Common Issues

| Problem | Solution |
|---------|----------|
| OAuth redirects to localhost | Check [OAuth Setup Guide](docs/setup/OAUTH_REDIRECT_FIX.md) |
| TypeScript errors | Run `npm run type-check` |
| Build fails | Clear `node_modules` and reinstall |
| Supabase connection fails | Verify `.env.local` variables |

## 🎨 Design Tokens

```css
/* Colors */
--midnight: #050A14
--neon-orange: #FF6B35
--neon-blue: #4B9CD3
--neon-purple: #8B5CF6

/* UIUC Brand */
--uiuc-orange: #FF6B35
--uiuc-blue: #13294B
```

## 📞 Get Help

- 💬 **Discussions**: https://github.com/vishalsachdev/illinihunt/discussions
- 🐛 **Issues**: https://github.com/vishalsachdev/illinihunt/issues
- 📧 **Email**: vishal@illinois.edu
- 📖 **Full Docs**: [docs/INDEX.md](docs/INDEX.md)
