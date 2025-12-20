# Render Python 3.13 Fix - FINAL SOLUTION

## Problem
Render is STILL using Python 3.13 despite our changes. The error shows:
- `/opt/render/project/src/.venv/lib/python3.13/` - Python 3.13 is being used
- pandas/numpy trying to build from source (no wheels for 3.13)
- setuptools import error

## Root Cause
Render might not be reading `backend/runtime.txt`. It needs to be at the **repository root** OR we need to explicitly set it in Render dashboard.

## Solution Applied

### 1. Created `runtime.txt` at Repository Root
Created `runtime.txt` in the root directory (same level as `backend/`, `frontend/`):
```
python-3.11.7
```

### 2. Added setuptools/wheel to requirements.txt
Added at the top of `backend/requirements.txt`:
```
setuptools>=65.5.0
wheel>=0.40.0
```

### 3. Updated render.yaml build command
Changed to:
```
pip install --upgrade pip setuptools wheel && pip install -r backend/requirements.txt
```

## CRITICAL: Manual Steps in Render Dashboard

**You MUST do this in Render Dashboard:**

1. **Go to your service** → **Settings** → **Environment**

2. **Check for PYTHON_VERSION variable:**
   - If it exists and is set to `3.13` or anything else, **DELETE IT**
   - Or change it to `3.11.7`

3. **Add/Update these environment variables:**
   - `PYTHON_VERSION` = `3.11.7` (explicit)
   - `PIP_VERSION` = `24.0` (optional, but helps)

4. **Save and trigger a new deploy**

## Why This Should Work

- **runtime.txt at root**: Render checks root directory first
- **Explicit PYTHON_VERSION**: Environment variable takes precedence
- **setuptools/wheel**: Fixes the import error
- **pandas 2.0.3**: Has wheels for Python 3.11

## Verification

After deploying, check build logs for:
- ✅ "Using Python 3.11.7" (NOT 3.13)
- ✅ "Installing pandas from wheel" (NOT building from source)
- ✅ No setuptools errors
- ✅ Build completes successfully

## If STILL Using Python 3.13

If Render still uses Python 3.13 after this:

1. **Check Render Dashboard**:
   - Settings → Build & Deploy → Environment
   - Look for ANY Python-related variables
   - Delete them all, then add `PYTHON_VERSION=3.11.7`

2. **Check runtime.txt location**:
   - Should be at repository root (same level as `backend/`)
   - File should contain exactly: `python-3.11.7`

3. **Try Python 3.10 as fallback**:
   - Change `runtime.txt` to: `python-3.10.12`
   - Change `PYTHON_VERSION` to: `3.10.12`
   - Python 3.10 has even better package support

The key is setting `PYTHON_VERSION=3.11.7` in Render dashboard environment variables - this is the most reliable way.

