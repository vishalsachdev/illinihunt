# AGENTS.md

## Project Overview

IlliniHunt V2 is a Product Hunt-style platform for the University of Illinois community to showcase projects, apps, and startups. This file provides instructions for AI agents working with this codebase.

## Project Structure

```
illinihunt/
├── src/                      # React TypeScript application
│   ├── App.tsx              # Main app component with routing
│   ├── components/          # Reusable UI components
│   │   ├── auth/           # Authentication components
│   │   ├── project/        # Project-related components
│   │   ├── comment/        # Comment system components
│   │   └── ui/             # Base UI components (shadcn/ui)
│   ├── contexts/           # React context providers
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Library configurations
│   │   ├── supabase.ts     # Supabase client setup
│   │   ├── database.ts     # Database service layer
│   │   └── types/database.ts # Generated TypeScript types
│   └── pages/              # Page components
├── public/                  # Static assets
├── supabase/               # Supabase configuration
│   └── migrations/         # Database migrations
└── package.json            # Node.js dependencies
```

## Code Style and Conventions

### TypeScript Requirements
- Use TypeScript strict mode
- Avoid `any` types where possible
- Properly type all function parameters and return values
- Use interfaces for object shapes, types for unions/aliases

### React Patterns
- Use functional components with hooks
- Prefer named exports for components
- Use custom hooks for business logic
- Implement proper error boundaries
- Follow React 18 best practices

### Naming Conventions
- Components: PascalCase (e.g., `ProjectCard.tsx`)
- Hooks: camelCase with 'use' prefix (e.g., `useAuth.ts`)
- Utilities: camelCase (e.g., `formatDate.ts`)
- Constants: UPPER_SNAKE_CASE (e.g., `MAX_UPLOAD_SIZE`)
- CSS classes: Tailwind utility classes only

### File Organization
- One component per file
- Group related components in folders
- Keep components close to where they're used
- Shared components in `components/ui`

## Testing Instructions

### Build Verification
```bash
# Always run these checks before committing:
npm run type-check    # TypeScript compilation check
npm run lint          # ESLint validation
npm run build         # Production build test
```

### Local Development
```bash
# Start development server
npm run dev

# The app should be accessible at http://localhost:5173
```

### Database Changes
```bash
# After any database schema changes:
npx supabase gen types typescript --project-id catzwowmxluzwbhdyhnf > src/types/database.ts

# Verify types compile:
npm run type-check
```

## Authentication Requirements

- Only @illinois.edu email addresses are allowed
- Google OAuth is the primary authentication method
- All authenticated routes must use the `ProtectedRoute` component
- Check authentication state using the `useAuth` hook

## Database Conventions

### Supabase Integration
- Project ID: `catzwowmxluzwbhdyhnf`
- Always use Row Level Security (RLS) policies
- Use generated TypeScript types from `src/types/database.ts`
- Implement optimistic updates for better UX

### Query Patterns
```typescript
// Always handle errors properly
const { data, error } = await supabase
  .from('table_name')
  .select('*')
  
if (error) {
  console.error('Error:', error)
  // Handle error appropriately
}
```

## UI/UX Guidelines

### Design System
- **See [src/docs/DESIGN_SYSTEM.md](src/docs/DESIGN_SYSTEM.md) for complete specifications**
- Primary colors: UIUC Orange (#FF6B35), UIUC Blue (#13294B)
- Use shadcn/ui components as base
- Follow Tailwind CSS utility-first approach
- Ensure mobile responsiveness

### Component Library
- Base components from `@radix-ui`
- Icons from `lucide-react`
- Forms with `react-hook-form` and `zod` validation
- Toast notifications for user feedback

## Performance Requirements

### Bundle Size
- Keep total bundle under 800 kB
- Use dynamic imports for large components
- Implement code splitting for routes

### Build Metrics
- TypeScript compilation: < 5 seconds
- Build time: < 10 seconds
- First Contentful Paint: < 1.8s
- Largest Contentful Paint: < 2.5s

## Security Guidelines

### Environment Variables
- Never commit `.env` files
- Use `VITE_` prefix for client-side variables
- Validate all environment variables at startup

### Data Validation
- Sanitize all user inputs
- Use Zod schemas for form validation
- Implement proper CORS policies
- Follow OWASP security best practices

## Deployment

### Production Deployment
- Automatic deployment via Vercel on `main` branch push
- Environment variables managed in Vercel dashboard
- Domain: https://illinihunt.vercel.app

### Pre-deployment Checklist
1. Run `npm run type-check`
2. Run `npm run build`
3. Remove all `console.log` statements
4. Verify no hardcoded secrets
5. Test authentication flow
6. Check responsive design

## PR Message Guidelines

When creating pull requests:
1. Use conventional commit format (feat:, fix:, chore:, etc.)
2. Include brief description of changes
3. Reference any related issues
4. List breaking changes if any
5. Include testing instructions

## Common Commands

```bash
# Development
npm install           # Install dependencies
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build

# Code Quality
npm run type-check   # TypeScript validation
npm run lint         # ESLint check
npm run lint:fix     # Auto-fix linting issues

# Supabase
npx supabase gen types typescript --project-id catzwowmxluzwbhdyhnf > src/types/database.ts
npx supabase db pull --project-id catzwowmxluzwbhdyhnf
npx supabase migration new <name>
```

## Troubleshooting

### Common Issues

1. **Port already in use**
   ```bash
   npx kill-port 5173
   # or
   npm run dev -- --port 3000
   ```

2. **Type errors after schema change**
   - Regenerate types using the command above
   - Clear TypeScript cache: `rm -rf node_modules/.cache`

3. **Authentication failures**
   - Verify @illinois.edu email restriction
   - Check Supabase environment variables
   - Ensure Google OAuth is configured

4. **Build failures**
   - Clear node_modules and reinstall
   - Check for missing dependencies
   - Verify all imports resolve correctly

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Vite Documentation](https://vitejs.dev)
- [React Documentation](https://react.dev)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [shadcn/ui Components](https://ui.shadcn.com)

## Contact

For questions about project architecture or development guidelines, refer to the CLAUDE.md file or consult the project maintainers.