# Render Python 3.13 Fix - Force Python 3.11

## Problem
Render is using Python 3.13 by default, which pandas doesn't support. Pandas tries to compile from source and fails.

## Solution

### 1. Created `backend/runtime.txt`
This file explicitly tells Render to use Python 3.11.7:
```
python-3.11.7
```

### 2. Updated `backend/requirements.txt`
- Changed to `pandas==2.0.3` (very stable, has wheels for Python 3.11)
- Changed to `numpy==1.24.3` (compatible with pandas 2.0.3)

### 3. Updated `render.yaml`
- Added `PIP_VERSION=24.0` to ensure consistent pip
- Added `pip install --upgrade pip` to build command

## Why This Works

- **runtime.txt**: Render checks this file first for Python version
- **pandas 2.0.3**: Stable version with guaranteed pre-built wheels for Python 3.11
- **Python 3.11.7**: Widely supported, all packages have wheels

## Next Steps

1. **Commit all files**:
```bash
git add backend/runtime.txt backend/requirements.txt render.yaml
git commit -m "Force Python 3.11.7 for Render deployment"
git push
```

2. **In Render Dashboard**:
   - Go to your service → Settings → Environment
   - **Delete** any `PYTHON_VERSION` environment variable (runtime.txt takes precedence)
   - Or set it to `3.11.7` to be explicit
   - Trigger a new deploy

3. **Verify**:
   - Check build logs - should see "Using Python 3.11.7"
   - Should see pandas installing from pre-built wheels (no compilation)
   - Build should complete successfully

## If Still Using Python 3.13

If Render still uses Python 3.13 after this:

1. **Check runtime.txt location**: Must be in `backend/runtime.txt` (not root)
2. **Check Render settings**: Go to Settings → Build & Deploy → Environment
   - Remove any `PYTHON_VERSION` variable
   - Let runtime.txt handle it
3. **Manual override**: In Render dashboard, set environment variable:
   - Key: `PYTHON_VERSION`
   - Value: `3.11.7`

The `runtime.txt` file is the standard way to specify Python version for Render/Heroku-style deployments.

