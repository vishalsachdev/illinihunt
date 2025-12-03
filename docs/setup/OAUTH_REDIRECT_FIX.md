# Google OAuth Redirect Fix - Verification Checklist

## ✅ Code Changes (COMPLETED)

The OAuth redirect issue has been fixed with an improved, environment-agnostic solution.

### AuthContext.tsx
- **Line 312**: Google OAuth redirect now uses `window.location.origin`
- **Line 329**: Email OTP redirect also uses `window.location.origin`
- **Why this works**: Automatically adapts to any environment without hardcoding

```tsx
// Google Sign-In
redirectTo: window.location.origin

// Email OTP
emailRedirectTo: window.location.origin
```

### Why This Solution is Better

**Previous Approach** (Hardcoded):
```tsx
redirectTo: import.meta.env.PROD 
  ? 'https://illinihunt.org' 
  : window.location.origin
```

**Problem**: 
- Vercel preview deployments also set `PROD=true`
- Preview URLs (e.g., `https://illinihunt-abc123.vercel.app`) would redirect to production
- Made it impossible to test auth on preview deployments

**New Approach** (Dynamic):
```tsx
redirectTo: window.location.origin
```

**Benefits**:
- ✅ **Production**: `https://illinihunt.org` → Works perfectly
- ✅ **Preview**: `https://illinihunt-[hash].vercel.app` → Now works!
- ✅ **Local**: `http://localhost:5173` → Works as before
- ✅ **No hardcoding**: Adapts to any environment automatically

## 🔧 Supabase Dashboard Configuration (REQUIRED)

You need to configure your Supabase project to allow redirects from ALL environments:

### 1. Navigate to Authentication Settings
1. Go to https://supabase.com/dashboard
2. Select your `illinihunt` project
3. Go to: **Authentication** → **URL Configuration**

### 2. Add Redirect URLs

Add ALL these patterns to **Redirect URLs**:

```
https://illinihunt.org
https://illinihunt.org/
https://illinihunt-*.vercel.app
https://illinihunt-*.vercel.app/
http://localhost:5173
http://localhost:5173/
```

**Note**: The wildcard pattern `https://illinihunt-*.vercel.app` allows ANY Vercel preview deployment to work with OAuth.

### 3. Site URL
Set the **Site URL** to your production domain:
```
https://illinihunt.org
```

### 4. Google OAuth Provider Settings
Go to: **Authentication** → **Providers** → **Google**

Verify:
- ✅ Google provider is enabled
- ✅ Client ID is configured
- ✅ Client Secret is configured
- ✅ **Authorized redirect URIs** in Google Cloud Console includes:
  - `https://YOUR-PROJECT-REF.supabase.co/auth/v1/callback`

### 5. Google Cloud Console
In your Google Cloud Console OAuth settings, verify **Authorized redirect URIs** includes:

```
https://YOUR-PROJECT-REF.supabase.co/auth/v1/callback
```

**Note**: Replace `YOUR-PROJECT-REF` with your actual Supabase project reference ID (e.g., `abcdefghijklmnop`).

## 🧪 Testing in Different Environments

### Production
1. Visit: `https://illinihunt.org`
2. Click "Sign in with Google"
3. Should redirect back to: `https://illinihunt.org`

### Vercel Preview
1. Visit: `https://illinihunt-abc123.vercel.app` (any preview URL)
2. Click "Sign in with Google"
3. Should redirect back to: `https://illinihunt-abc123.vercel.app`

### Local Development
1. Visit: `http://localhost:5173`
2. Click "Sign in with Google"
3. Should redirect back to: `http://localhost:5173`

## 🚨 Common Issues & Solutions

### Issue: "Invalid redirect URL" error
**Solutions**:
1. Verify the wildcard pattern `https://illinihunt-*.vercel.app` is in Supabase Redirect URLs
2. The exact URL must be added to Supabase (wildcards may not work in all Supabase versions)
3. If wildcards don't work, you may need to manually add each preview URL

### Issue: "redirect_uri_mismatch" error from Google
**Solutions**:
1. Verify `https://YOUR-PROJECT-REF.supabase.co/auth/v1/callback` is in Google Cloud Console
2. Wait 5-10 minutes for Google's cache to update after adding the URI
3. Make sure there are no trailing slashes or typos

### Issue: Localhost redirect doesn't work
**Solutions**:
1. Ensure `http://localhost:5173` (not https) is in Supabase Redirect URLs
2. Check that your dev server is running on port 5173
3. Clear browser cookies and try again

### Issue: Vercel preview still redirects to production
**Solutions**:
1. Clear browser cache/cookies
2. Verify the code change is actually deployed to the preview
3. Check that Supabase allows the preview URL pattern

## 📝 Deployment Status

- ✅ Code updated to use `window.location.origin`
- ✅ Solution merged to main branch
- ⏳ Supabase redirect URLs configured (verify in dashboard)
- ⏳ Google Cloud Console redirect URI configured

## 🔐 Security Notes

- `window.location.origin` is safe because Supabase validates against allowed redirect URLs
- All redirect URLs must be explicitly whitelisted in Supabase dashboard
- Email domain restriction (`@illinois.edu`) is enforced server-side
- OAuth callback is handled by Supabase, not your application directly

## 🎯 Best Practices

1. **Always use `window.location.origin`** for OAuth redirects unless you have a specific reason not to
2. **Use wildcard patterns** in Supabase for preview deployments when possible
3. **Test auth in all environments** (production, preview, local) before merging
4. **Keep Google Cloud Console redirect URIs minimal** - only add the Supabase callback URL
5. **Document environment-specific configuration** for future team members

## ✅ Checklist for New Deployments

- [ ] Production URL added to Supabase Redirect URLs
- [ ] Wildcard pattern for preview URLs added to Supabase
- [ ] Localhost URL added to Supabase Redirect URLs
- [ ] Google Cloud Console has Supabase callback URL
- [ ] Tested sign-in on production
- [ ] Tested sign-in on at least one preview deployment
- [ ] Tested sign-in locally

---

**Last Updated**: Post-fix by online agent (December 2025)
**Solution**: Dynamic `window.location.origin` approach
