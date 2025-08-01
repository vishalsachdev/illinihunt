# Production Checklist for React/Vite/Vercel Apps

## Pre-Deployment Checks

### 1. Build & Type Safety
- [ ] `npm run build` passes without errors
- [ ] `npm run type-check` shows no TypeScript errors
- [ ] `npm run lint` passes (or has only acceptable warnings)

### 2. Environment Configuration
- [ ] All required env vars are in Vercel dashboard
- [ ] Environment validation in code with proper error messages
- [ ] No hardcoded API keys or secrets in code

### 3. Routing & Navigation
- [ ] `vercel.json` has rewrites for SPA routing
- [ ] 404 page exists for unmatched routes
- [ ] Direct URL access works for all routes

### 4. Caching Strategy
- [ ] HTML files have no-cache headers
- [ ] Static assets have long-term cache headers
- [ ] Service worker (if any) handles updates properly

### 5. Authentication Flow
- [ ] Auth state persists across page refreshes
- [ ] No loading flash when opening new tabs
- [ ] Proper error messages for auth failures
- [ ] Protected routes redirect correctly

### 6. Error Handling
- [ ] Error boundaries prevent white screen crashes
- [ ] API errors show user-friendly messages
- [ ] Network failures are handled gracefully
- [ ] Console is clean (no errors in production)

### 7. Performance
- [ ] Bundle size < 1MB (or justified if larger)
- [ ] Images are optimized/compressed
- [ ] Lazy loading for non-critical routes
- [ ] Initial load time < 3 seconds

### 8. Mobile Experience
- [ ] Responsive design works on all screen sizes
- [ ] Touch targets are at least 44x44 pixels
- [ ] Viewport meta tag is set correctly
- [ ] No horizontal scroll on mobile

### 9. SEO & Social
- [ ] Meta tags for title and description
- [ ] Open Graph tags for social sharing
- [ ] Favicon is set and working
- [ ] Robots.txt if needed

### 10. Security
- [ ] CORS is properly configured
- [ ] Authentication tokens stored securely
- [ ] XSS protection headers set
- [ ] No sensitive data in client-side code

## Common Issues & Solutions

### Issue: "Loading..." stuck on new tabs
**Solution**: Cache auth initialization state between tabs

### Issue: 404 on page refresh
**Solution**: Add SPA rewrites to vercel.json

### Issue: Stale content after deployment
**Solution**: Set proper cache headers for HTML vs assets

### Issue: White screen in production
**Solution**: Add error boundaries and check console for errors

### Issue: Slow initial load
**Solution**: Code split routes and optimize bundle size

## Testing Checklist

1. **New User Flow**
   - [ ] Can sign up successfully
   - [ ] Email validation works
   - [ ] Profile creation completes

2. **Returning User Flow**
   - [ ] Can sign in
   - [ ] Session persists
   - [ ] Can sign out

3. **Core Features**
   - [ ] All CRUD operations work
   - [ ] Real-time updates function
   - [ ] File uploads succeed

4. **Edge Cases**
   - [ ] Works in incognito mode
   - [ ] Works with ad blockers
   - [ ] Handles network disconnection

## Monitoring

- Set up Vercel Analytics for performance tracking
- Monitor error rates in browser console
- Check Supabase logs for API errors
- Review user feedback regularly