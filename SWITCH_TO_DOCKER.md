# Switch Render to Docker - Step by Step

## Why Docker?
Docker explicitly uses Python 3.11.7, so Render can't override it.

## Steps

### 1. In Render Dashboard
1. Go to your service → **Settings**
2. Scroll to **"Environment"** section
3. Change from **"Python"** to **""**
4. **Save**Docker

### 2. Commit Dockerfile
```bash
git add Dockerfile
git commit -m "Switch to Docker for Python 3.11.7"
git push
```

### 3. Render will automatically:
- Detect the Dockerfile
- Build using Python 3.11.7
- Deploy your app

## That's it! No need to delete anything.

---

## Alternative: Delete and Recreate (If Docker doesn't work)

If you want to start fresh:

1. **Delete current service** in Render Dashboard
2. **Create new Web Service**
3. **Important settings:**
   - Connect same GitHub repo
   - **Environment**: Choose "Python"
   - **Python Version**: Select "3.11" or "3.11.7" (NOT "Latest" or "3.13")
   - **Build Command**: `pip install --upgrade pip setuptools wheel && pip install -r backend/requirements.txt`
   - **Start Command**: `cd backend && python -m uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Root Directory**: Leave empty (or `.`)

4. **Environment Variables:**
   - Add `PYTHON_VERSION` = `3.11.7`

5. **Create Service**

The key is selecting Python 3.11 in the dropdown when creating the service, NOT "Latest".

