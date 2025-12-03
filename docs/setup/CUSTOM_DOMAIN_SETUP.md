# Custom Domain Setup for Supabase Authentication

## Overview

To change the Supabase URL (`catzwowmxluzwbhdyhnf.supabase.co`) to a custom domain, you need to configure a custom domain in Supabase and update several places in your codebase.

## Important Note

The URL shown in the Google OAuth sign-in dialog is controlled by Supabase during the authentication flow. You can customize this by setting up a custom domain in Supabase, which will replace the default `*.supabase.co` domain.

## Step-by-Step Guide

### 1. Configure Custom Domain in Supabase Dashboard

1. Go to https://supabase.com/dashboard
2. Select your project: **illinihunt** (ID: `catzwowmxluzwbhdyhnf`)
3. Navigate to: **Settings** → **API** → **Custom Domains**
4. Click **Add Custom Domain**
5. Enter your custom domain (e.g., `auth.illinihunt.org` or `api.illinihunt.org`)
6. Follow Supabase's DNS configuration instructions:
   - Add CNAME records pointing to Supabase's provided value
   - Wait for DNS propagation (can take up to 48 hours)
   - Verify domain ownership
7. Once verified, Supabase will provide you with your new custom domain URL

### 2. Update Environment Variables

After setting up the custom domain, update your environment variables:

#### Local Development (`.env.local`)
```bash
# Old URL (remove this)
# VITE_SUPABASE_URL=https://catzwowmxluzwbhdyhnf.supabase.co

# New URL (use your custom domain)
VITE_SUPABASE_URL=https://auth.illinihunt.org
# Or whatever custom domain you configured
VITE_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_ACCESS_TOKEN=your_access_token_here
```

#### Vercel Environment Variables

1. Go to https://vercel.com/dashboard
2. Select your **illinihunt** project
3. Go to **Settings** → **Environment Variables**
4. Update `VITE_SUPABASE_URL`:
   - Remove old: `https://catzwowmxluzwbhdyhnf.supabase.co`
   - Add new: `https://auth.illinihunt.org` (or your custom domain)
5. Save and redeploy your application

**Important**: After updating Vercel environment variables, trigger a new deployment:
```bash
# Option 1: Push a commit (triggers auto-deploy)
git commit --allow-empty -m "chore: trigger redeploy after Supabase URL update"
git push origin main

# Option 2: Redeploy from Vercel dashboard
```

### 3. Update Google OAuth Redirect URIs

After setting up the custom domain, you must update Google Cloud Console:

1. Go to https://console.cloud.google.com
2. Select your project
3. Navigate to: **APIs & Services** → **Credentials** → **OAuth 2.0 Client IDs**
4. Click on your OAuth client ID
5. In **Authorized redirect URIs**, update:

   **Remove:**
   ```
   https://catzwowmxluzwbhdyhnf.supabase.co/auth/v1/callback
   ```

   **Add:**
   ```
   https://auth.illinihunt.org/auth/v1/callback
   ```
   (Replace with your actual custom domain)

6. Click **Save**
7. **Wait 5-10 minutes** for Google's cache to update

### 4. Update Supabase Redirect URLs

1. Go to https://supabase.com/dashboard
2. Select your project
3. Navigate to: **Authentication** → **URL Configuration**
4. Update **Site URL** if needed:
   ```
   https://illinihunt.org
   ```
5. Verify **Redirect URLs** include:
   ```
   https://illinihunt.org
   https://illinihunt.org/
   https://illinihunt-*.vercel.app
   https://illinihunt-*.vercel.app/
   http://localhost:5173
   http://localhost:5173/
   ```

### 5. Files That Reference the Supabase URL

#### Code Files (No Changes Needed)

The following files automatically use the `VITE_SUPABASE_URL` environment variable, so no code changes are required:

- ✅ `src/lib/supabase.ts` - Uses `import.meta.env.VITE_SUPABASE_URL`
- ✅ `src/contexts/AuthContext.tsx` - Uses Supabase client from `supabase.ts`
- ✅ All authentication flows automatically use the configured URL

#### Documentation Files (Update for Reference)

Update these documentation files to reflect the new custom domain:

1. **CLAUDE.md** (Line 19):
   ```markdown
   VITE_SUPABASE_URL=https://auth.illinihunt.org
   ```

2. **README.md** - Update if it contains the old URL

3. **QUICKSTART.md** - Update if it contains the old URL

4. **CONTRIBUTING.md** - Update if it contains the old URL

### 6. Update Content Security Policy (CSP)

If you have custom domains, update the CSP header in `vercel.json`:

**Current** (allows all Supabase domains):
```json
"connect-src 'self' https://*.supabase.co wss://*.supabase.co"
```

**Updated** (add your custom domain):
```json
"connect-src 'self' https://*.supabase.co wss://*.supabase.co https://auth.illinihunt.org wss://auth.illinihunt.org"
```

**Location**: `vercel.json` line 44

### 7. Testing Checklist

After making all changes:

- [ ] Test Google OAuth sign-in on production
- [ ] Test Google OAuth sign-in on preview deployment
- [ ] Test Google OAuth sign-in locally
- [ ] Test email OTP authentication (if used)
- [ ] Verify database connections work
- [ ] Check browser console for any CORS errors
- [ ] Verify the auth dialog shows your custom domain (not `*.supabase.co`)

### 8. Rollback Plan

If something goes wrong, you can rollback:

1. **Revert Vercel environment variable** to the old Supabase URL
2. **Revert Google OAuth redirect URI** to the old URL
3. **Redeploy** your application
4. Test that authentication works with the old URL

## Common Issues

### Issue: "Invalid redirect URL" after changing domain

**Solution:**
- Wait 5-10 minutes after updating Google Cloud Console
- Clear browser cookies and cache
- Verify the exact URL matches (no trailing slashes)
- Check that DNS has fully propagated (can take up to 48 hours)

### Issue: DNS not resolving

**Solution:**
- Check DNS records are correctly configured
- Use `dig` or `nslookup` to verify DNS resolution
- Wait for DNS propagation (TTL-dependent, usually 1-48 hours)
- Verify domain is verified in Supabase dashboard

### Issue: Custom domain shows SSL certificate error

**Solution:**
- Supabase handles SSL certificates automatically
- Wait for certificate provisioning (can take a few hours)
- Contact Supabase support if certificate doesn't provision

## Additional Resources

- [Supabase Custom Domains Documentation](https://supabase.com/docs/guides/platform/custom-domains)
- [Supabase Authentication Configuration](https://supabase.com/docs/guides/auth)
- [Google OAuth Setup Guide](https://support.google.com/cloud/answer/6158849)

## Summary

**What Changes:**
1. ✅ Environment variables (`.env.local` and Vercel)
2. ✅ Google Cloud Console OAuth redirect URI
3. ✅ Documentation files (for reference)
4. ✅ Content Security Policy in `vercel.json` (optional, but recommended)

**What Stays the Same:**
- ✅ All code files (they use environment variables)
- ✅ Authentication flow logic
- ✅ Database schema and queries

**Important:**
- The custom domain must be verified in Supabase before use
- DNS changes can take up to 48 hours to propagate
- Google OAuth changes require a few minutes to take effect
- Always test in all environments after changes

---

**Last Updated**: Created for custom domain setup
**Supabase Project**: `catzwowmxluzwbhdyhnf`
**Current URL**: `https://catzwowmxluzwbhdyhnf.supabase.co`

