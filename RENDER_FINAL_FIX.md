# Render Python 3.13 Fix - ULTIMATE SOLUTION

## Problem
Render keeps using Python 3.13 despite all our attempts. The error path shows:
- `/opt/render/project/src/.venv/lib/python3.13/` - Python 3.13 is being used
- setuptools import error
- pandas/numpy trying to build from source

## Root Cause
Render's build system defaults to Python 3.13 and our configuration isn't being respected.

## Solution Applied

### 1. Updated `render.yaml` Build Command
Changed to explicitly use `python3.11` with fallback:
```yaml
buildCommand: python3.11 -m pip install --upgrade pip setuptools wheel && python3.11 -m pip install -r backend/requirements.txt || python3 -m pip install --upgrade pip setuptools wheel && python3 -m pip install -r backend/requirements.txt
```

This:
- First tries `python3.11` explicitly
- Falls back to `python3` if 3.11 isn't available
- Ensures setuptools/wheel are installed first

### 2. Created `build.sh` Script (Alternative)
If the above doesn't work, use this build script approach.

## CRITICAL: Render Dashboard Configuration

**You MUST configure this in Render Dashboard:**

1. **Go to your service** → **Settings** → **Build & Deploy**

2. **Build Command** - Replace with:
   ```
   python3.11 -m pip install --upgrade pip setuptools wheel && python3.11 -m pip install -r backend/requirements.txt
   ```
   
   Or if Python 3.11 isn't available:
   ```
   python3 -m pip install --upgrade pip setuptools wheel && python3 -m pip install -r backend/requirements.txt
   ```

3. **Environment Variables**:
   - `PYTHON_VERSION` = `3.11.7`
   - Delete any other Python-related variables

4. **Python Version** (if there's a dropdown):
   - Select "Python 3.11" or "3.11.7"
   - NOT "Python 3.13" or "Latest"

## Alternative: Use Python 3.10

If Python 3.11 still doesn't work, try Python 3.10:

1. **In Render Dashboard**:
   - Set `PYTHON_VERSION` = `3.10.12`
   - Build command: `python3.10 -m pip install --upgrade pip setuptools wheel && python3.10 -m pip install -r backend/requirements.txt`

2. **Update `runtime.txt`**:
   ```
   python-3.10.12
   ```

3. **Update `render.yaml`**:
   ```yaml
   PYTHON_VERSION: 3.10.12
   ```

## Why This Should Work

- **Explicit python3.11**: Forces Render to use Python 3.11 if available
- **Fallback to python3**: Works if only system Python is available
- **setuptools/wheel first**: Fixes the import error
- **Dashboard configuration**: Most reliable way to set Python version

## Verification

After deploying, check build logs for:
- ✅ "Using Python 3.11" or "Python 3.10" (NOT 3.13)
- ✅ "Installing pandas from wheel" (NOT building from source)
- ✅ No setuptools errors
- ✅ Build completes successfully

## If STILL Using Python 3.13

**Last resort - Contact Render Support:**
1. Go to Render Dashboard → Support
2. Ask them to:
   - Force Python 3.11.7 for your service
   - Or explain why Python 3.13 is being used despite configuration

**Or use Docker:**
Create a `Dockerfile` that explicitly uses Python 3.11:
```dockerfile
FROM python:3.11.7-slim
WORKDIR /app
COPY backend/requirements.txt .
RUN pip install --upgrade pip setuptools wheel && pip install -r requirements.txt
COPY backend/ .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

The key is setting the Python version **explicitly in the Render Dashboard**, not just in code files.

