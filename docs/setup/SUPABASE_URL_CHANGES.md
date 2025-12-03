# Quick Reference: Changing Supabase URL

## What You're Seeing

The URL `catzwowmxluzwbhdyhnf.supabase.co` appears in the Google OAuth sign-in dialog because that's your default Supabase project URL.

## Where to Change It

### 🔴 Critical Changes (Required)

#### 1. **Supabase Dashboard - Custom Domain Setup**
   - Location: https://supabase.com/dashboard → Settings → API → Custom Domains
   - Action: Configure a custom domain (e.g., `auth.illinihunt.org`)
   - **This is the most important step** - you must set up the custom domain first

#### 2. **Vercel Environment Variables**
   - Location: https://vercel.com/dashboard → Project Settings → Environment Variables
   - Variable: `VITE_SUPABASE_URL`
   - Current: `https://catzwowmxluzwbhdyhnf.supabase.co`
   - Change to: Your custom domain (e.g., `https://auth.illinihunt.org`)
   - **After changing**: Redeploy your application

#### 3. **Local Environment File**
   - File: `.env.local` (in project root)
   - Variable: `VITE_SUPABASE_URL`
   - Change to match your custom domain

#### 4. **Google Cloud Console - OAuth Redirect URI**
   - Location: https://console.cloud.google.com → APIs & Services → Credentials
   - Action: Update "Authorized redirect URIs"
   - Remove: `https://catzwowmxluzwbhdyhnf.supabase.co/auth/v1/callback`
   - Add: `https://auth.illinihunt.org/auth/v1/callback` (your custom domain)

### 🟡 Code Files to Update

#### 5. **index.html** - Preconnect Link
   - File: `index.html` (line 9)
   - Current:
     ```html
     <link rel="preconnect" href="https://catzwowmxluzwbhdyhnf.supabase.co" crossorigin />
     ```
   - Change to:
     ```html
     <link rel="preconnect" href="https://auth.illinihunt.org" crossorigin />
     ```
   - Note: This is a performance optimization, but should match your custom domain

#### 6. **vercel.json** - Content Security Policy (Optional)
   - File: `vercel.json` (line 44)
   - Current: `connect-src 'self' https://*.supabase.co wss://*.supabase.co`
   - Consider adding your custom domain:
     ```json
     "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://auth.illinihunt.org wss://auth.illinihunt.org"
     ```

### 🟢 Documentation Files (Reference Only)

These files don't affect functionality but should be updated for clarity:

- `CLAUDE.md` - Line 19 (environment variable example)
- `README.md` - If it contains the Supabase URL
- `QUICKSTART.md` - If it contains the Supabase URL
- `CONTRIBUTING.md` - If it contains the Supabase URL

### ✅ Files That DON'T Need Changes

These files automatically use the environment variable:

- ✅ `src/lib/supabase.ts` - Uses `import.meta.env.VITE_SUPABASE_URL`
- ✅ `src/contexts/AuthContext.tsx` - Uses Supabase client
- ✅ All authentication code - Works automatically

## Quick Checklist

- [ ] Set up custom domain in Supabase Dashboard
- [ ] Update `VITE_SUPABASE_URL` in Vercel environment variables
- [ ] Update `VITE_SUPABASE_URL` in local `.env.local`
- [ ] Update Google OAuth redirect URI in Google Cloud Console
- [ ] Update `index.html` preconnect link
- [ ] (Optional) Update `vercel.json` CSP header
- [ ] Redeploy application on Vercel
- [ ] Test authentication in all environments

## Important Notes

1. **DNS Propagation**: Custom domain DNS changes can take up to 48 hours
2. **SSL Certificate**: Supabase automatically provisions SSL for custom domains (may take a few hours)
3. **Google Cache**: OAuth redirect URI changes take 5-10 minutes to propagate
4. **Test Thoroughly**: Test authentication after every change

## Full Documentation

For detailed step-by-step instructions, see:
**[docs/setup/CUSTOM_DOMAIN_SETUP.md](CUSTOM_DOMAIN_SETUP.md)**

## Current Configuration

- **Supabase Project ID**: `catzwowmxluzwbhdyhnf`
- **Current URL**: `https://catzwowmxluzwbhdyhnf.supabase.co`
- **Target Custom Domain**: (To be configured)

