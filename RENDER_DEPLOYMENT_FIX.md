# Render Deployment Fix - Pandas Build Error

## Problem
Pandas 2.2.0 is trying to compile from source on Render because Python 3.13 doesn't have pre-built wheels, causing build failures.

## Solution

### 1. Updated `backend/requirements.txt`
- Changed `pandas==2.2.0` → `pandas==2.1.4` (has pre-built wheels)
- Changed `numpy==1.26.3` → `numpy==1.24.4` (compatible with pandas 2.1.4)
- Updated `scikit-learn` and `scipy` to compatible versions

### 2. Updated `render.yaml`
- Set `PYTHON_VERSION=3.11.7` (instead of 3.11.0)

## Next Steps

1. **Commit the changes**:
```bash
git add backend/requirements.txt render.yaml
git commit -m "Fix pandas build error for Render deployment"
git push
```

2. **In Render Dashboard**:
   - Go to your service settings
   - Under "Environment", ensure `PYTHON_VERSION=3.11.7` is set
   - Trigger a new deploy

3. **Verify the build**:
   - Check build logs - should see pandas installing from pre-built wheels
   - No compilation errors should occur

## Why This Works

- **Python 3.11.7**: Stable version with wide package support
- **pandas 2.1.4**: Has pre-built wheels for Python 3.11, no compilation needed
- **numpy 1.24.4**: Compatible with pandas 2.1.4 and has pre-built wheels

## Alternative: If Still Failing

If you still get build errors, try:

1. **Use even older stable versions**:
```txt
pandas==2.0.3
numpy==1.24.3
```

2. **Or use Python 3.10**:
```yaml
PYTHON_VERSION: 3.10.12
```

The current fix should work for most cases. The key is using Python 3.11 with pandas 2.1.4.

