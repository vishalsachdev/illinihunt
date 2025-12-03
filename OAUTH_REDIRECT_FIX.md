# Google OAuth Redirect Fix - Verification Checklist

## ✅ Code Changes (COMPLETED)

The following code changes have been implemented and pushed to the `design-refresh-neon-glass` branch:

### AuthContext.tsx
- **Line 312-314**: Google OAuth redirect now uses `https://illinihunt.org` in production
- **Line 329-331**: Email OTP redirect also uses production URL
- **Logic**: Uses `import.meta.env.PROD` to detect production vs development

```tsx
redirectTo: import.meta.env.PROD 
  ? 'https://illinihunt.org' 
  : window.location.origin
```

## 🔧 Supabase Dashboard Configuration (ACTION REQUIRED)

You need to verify the following settings in your Supabase dashboard:

### 1. Navigate to Authentication Settings
1. Go to https://supabase.com/dashboard
2. Select your `illinihunt` project
3. Go to: **Authentication** → **URL Configuration**

### 2. Add Redirect URLs
Ensure these URLs are listed in **Redirect URLs**:

```
https://illinihunt.org
https://illinihunt.org/
http://localhost:5173
http://localhost:5173/
```

### 3. Site URL
Set the **Site URL** to:
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

**Note**: Replace `YOUR-PROJECT-REF` with your actual Supabase project reference ID.

## 🧪 Testing Steps

After deploying the `design-refresh-neon-glass` branch on Vercel:

1. **Visit the deployed site**: https://illinihunt.org (or Vercel preview URL)
2. **Click "Sign in with Google"**
3. **Verify the redirect URL** in the browser address bar during OAuth flow
4. **Expected behavior**: 
   - Should redirect to Google OAuth
   - After authentication, should return to `https://illinihunt.org`
   - Should NOT redirect to `localhost`

## 🚨 Common Issues & Solutions

### Issue: Still redirecting to localhost
**Solutions**:
1. Clear browser cookies/cache
2. Verify Supabase Redirect URLs include `https://illinihunt.org`
3. Ensure environment variables are set correctly in Vercel
4. Check that the branch is deployed (not running locally)

### Issue: "redirect_uri_mismatch" error
**Solutions**:
1. Add `https://YOUR-PROJECT-REF.supabase.co/auth/v1/callback` to Google Cloud Console
2. Wait 5-10 minutes for Google's cache to update

### Issue: Environment variables not working
**Solutions**:
1. In Vercel, go to **Settings** → **Environment Variables**
2. Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set
3. Re-deploy after changing environment variables

## 📝 Deployment Status

- ✅ Code changes committed
- ✅ Branch pushed to GitHub: `design-refresh-neon-glass`
- ⏳ Vercel preview deployment (check your Vercel dashboard)
- ⏳ Supabase redirect URLs configured (verify in dashboard)

## 🔐 Security Notes

- Production redirects are hardcoded to `https://illinihunt.org`
- Localhost redirects only work in development mode (`import.meta.env.PROD === false`)
- Email domain restriction (`@illinois.edu`) is enforced server-side
