# Netlify 404 Fix for Next.js 16

## Problem
Getting 404 errors on Netlify deployment even though build succeeds.

## Solution

The issue is that Next.js 16 App Router needs proper configuration for Netlify. Here are the fixes:

### Option 1: Let Netlify Auto-Detect (Recommended)

1. **Update `netlify.toml`** (already done):
```toml
[build]
  base = "frontend"
  command = "npm install && npm run build"
  # Don't specify publish - let Netlify handle it

[build.environment]
  NODE_VERSION = "20"
  NEXT_PUBLIC_API_URL = "https://your-backend-name.onrender.com"
```

2. **In Netlify Dashboard**:
   - Go to Site settings → Build & deploy
   - **Publish directory**: Leave EMPTY (or set to `.next`)
   - Netlify will auto-detect Next.js and use the runtime

### Option 2: Explicit Next.js Plugin

If Option 1 doesn't work, install the plugin:

1. **Add to `frontend/package.json`**:
```json
{
  "devDependencies": {
    "@netlify/plugin-nextjs": "^4.39.0"
  }
}
```

2. **Update `netlify.toml`**:
```toml
[build]
  base = "frontend"
  command = "npm install && npm run build"

[[plugins]]
  package = "@netlify/plugin-nextjs"
```

### Option 3: Manual Configuration in Netlify Dashboard

1. Go to **Site settings** → **Build & deploy** → **Build settings**
2. Set:
   - **Base directory**: `frontend`
   - **Build command**: `npm install && npm run build`
   - **Publish directory**: `.next` (or leave empty)
3. Go to **Plugins** and ensure Next.js plugin is enabled

## Next Steps

1. **Commit and push** the updated `netlify.toml`:
```bash
git add netlify.toml frontend/next.config.ts
git commit -m "Fix Netlify Next.js deployment"
git push
```

2. **Trigger a new deploy** in Netlify (or it will auto-deploy)

3. **Check the deploy logs** to ensure:
   - Build completes successfully
   - Next.js plugin is detected/used
   - No errors in deployment

## Verification

After deployment, check:
- ✅ Site loads at root URL (`https://sentinelmarket.netlify.app`)
- ✅ Routes work (`/alerts`, `/analytics`, etc.)
- ✅ No 404 errors

## If Still Not Working

1. Check Netlify deploy logs for errors
2. Verify `NEXT_PUBLIC_API_URL` is set correctly
3. Check browser console for API errors
4. Ensure backend is running and accessible

