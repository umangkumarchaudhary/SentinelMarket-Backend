# Netlify 404 Fix - Final Solution

## Problem
Next.js 16 App Router is showing 404 errors on Netlify because the Next.js runtime plugin is not installed.

## Solution Applied

### 1. Installed Netlify Next.js Plugin
Added `@netlify/plugin-nextjs` to `frontend/package.json` devDependencies.

### 2. Updated `netlify.toml`
- Removed `publish = ".next"` (plugin handles this)
- Added explicit plugin configuration:
```toml
[[plugins]]
  package = "@netlify/plugin-nextjs"
```

## Why This Works

Next.js 16 with App Router requires the Netlify Next.js plugin to:
- Handle server-side rendering
- Route requests correctly
- Serve static and dynamic pages
- Handle API routes

Without the plugin, Netlify treats it as a static site and can't handle Next.js routing.

## Next Steps

1. **Commit and push**:
```bash
git add frontend/package.json netlify.toml
git commit -m "Fix Netlify 404 - install Next.js plugin"
git push
```

2. **Netlify will automatically**:
   - Install the plugin during build
   - Configure Next.js runtime
   - Serve your app correctly

3. **Verify**:
   - Wait for build to complete
   - Visit `https://sentinelmarket.netlify.app`
   - Should see your dashboard, not 404

## If Still Not Working

Check in Netlify Dashboard:
1. **Site settings** → **Build & deploy** → **Plugins**
   - Should see "@netlify/plugin-nextjs" listed
   - If not, click "Install plugin" and search for it

2. **Build logs**:
   - Should see "Installing @netlify/plugin-nextjs"
   - Should see "Next.js runtime detected"

3. **Environment variables**:
   - Ensure `NEXT_PUBLIC_API_URL` is set to your Render backend URL

The plugin is now in package.json, so it will be installed automatically on the next deploy.

