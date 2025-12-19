# Deployment Guide: Sentinel Market

This guide will help you deploy the Sentinel Market application to:
- **Backend**: Render (onrender.com)
- **Frontend**: Netlify

## 📁 Project Structure

```
Sentinel Market/                    ← Your repository root
├── backend/                        ← Deploy to Render
│   ├── main.py                     ← FastAPI entry point
│   ├── requirements.txt            ← Python dependencies
│   ├── src/                        ← Data engineering modules
│   │   ├── data/
│   │   │   ├── pipeline/          ← ETL pipelines
│   │   │   ├── storage/            ← Data warehouse & lake
│   │   │   ├── validation/         ← Data quality
│   │   │   └── streaming/          ← Stream processing
│   │   └── ...
│   └── ...
├── frontend/                       ← Deploy to Netlify
│   ├── package.json
│   ├── next.config.ts
│   ├── app/                        ← Next.js pages
│   └── ...
├── SentinelMarket/                  ← KEEP THIS! Needed by backend
│   ├── src/                        ← ML models & detectors
│   │   ├── data/                   ← Stock data fetcher
│   │   ├── detectors/              ← Risk scoring
│   │   └── ml/                     ← ML models
│   └── ...
├── render.yaml                     ← Render deployment config
└── netlify.toml                    ← Netlify deployment config
```

**⚠️ IMPORTANT**: The `SentinelMarket/` folder MUST be in your repository! The backend imports from it (`from src.data.stock_data_fetcher import StockDataFetcher`). Keep it at the root level, same as `backend/` and `frontend/`.

## 🚀 Step 1: Prepare Your Repository

### Option A: Deploy Entire Repository (Recommended) ✅
**Keep the entire `Sentinel Market` folder structure as-is.** Both Render and Netlify will deploy from the same repository but use different subdirectories.

**Key Point**: The `SentinelMarket/` folder must stay in the repo because:
- Backend imports ML code from `SentinelMarket/src/`
- Render needs access to it during deployment
- It's referenced in `backend/main.py` (line 18-22)

### Option B: Separate Repositories
If you prefer separate repos:
1. Create `sentinel-market-backend` repo with: `backend/`, `SentinelMarket/`, `render.yaml`
2. Create `sentinel-market-frontend` repo with: `frontend/`, `netlify.toml`

**We'll use Option A (single repo) in this guide.**

## 🔧 Step 2: Deploy Backend to Render

### 2.1 Create Render Account
1. Go to [render.com](https://render.com)
2. Sign up/login with GitHub
3. Connect your GitHub repository

### 2.2 Create New Web Service
1. Click **"New +"** → **"Web Service"**
2. Connect your repository: `your-username/sentinel-market` (or your repo name)
3. Configure the service:
   - **Name**: `sentinel-market-backend`
   - **Environment**: `Python 3`
   - **Root Directory**: Leave empty (or set to `.`) - This ensures `SentinelMarket/` is accessible
   - **Build Command**: `pip install -r backend/requirements.txt`
   - **Start Command**: `cd backend && python -m uvicorn main:app --host 0.0.0.0 --port $PORT`
   
   **Note**: Root directory should be empty so Render can see both `backend/` and `SentinelMarket/` folders.

### 2.3 Set Environment Variables
In Render dashboard, go to **Environment** tab and add:

**Required:**
```
PYTHON_VERSION=3.11.0
```

**Database (if using PostgreSQL):**
```
DATABASE_URL=postgresql://user:password@host:port/dbname
POSTGRES_HOST=your-postgres-host
POSTGRES_PORT=5432
POSTGRES_USER=your-user
POSTGRES_PASSWORD=your-password
POSTGRES_DB=your-db-name
```

**Optional (for social media features):**
```
TELEGRAM_API_ID=your-telegram-api-id
TELEGRAM_API_HASH=your-telegram-api-hash
TWITTER_BEARER_TOKEN=your-twitter-token
```

### 2.4 Deploy
1. Click **"Create Web Service"**
2. Render will:
   - Clone your repo
   - Install dependencies from `backend/requirements.txt`
   - Start the FastAPI server
3. Wait for deployment (usually 2-5 minutes)
4. Your backend URL will be: `https://sentinel-market-backend.onrender.com` (or your custom name)

### 2.5 Verify Backend
Test your backend:
```bash
curl https://your-backend-name.onrender.com/api/health
```

You should get a JSON response.

## 🌐 Step 3: Deploy Frontend to Netlify

### 3.1 Create Netlify Account
1. Go to [netlify.com](https://netlify.com)
2. Sign up/login with GitHub
3. Connect your GitHub repository

### 3.2 Configure Build Settings
1. Click **"Add new site"** → **"Import an existing project"**
2. Select your repository
3. Configure build settings:
   - **Base directory**: `frontend`
   - **Build command**: `npm install && npm run build`
   - **Publish directory**: `frontend/.next`

### 3.3 Set Environment Variables
In Netlify dashboard, go to **Site settings** → **Environment variables**:

**Required:**
```
NEXT_PUBLIC_API_URL=https://your-backend-name.onrender.com
```

**Important**: Replace `your-backend-name` with your actual Render backend URL!

### 3.4 Deploy
1. Click **"Deploy site"**
2. Netlify will:
   - Install Node.js dependencies
   - Build the Next.js app
   - Deploy to CDN
3. Your frontend URL will be: `https://random-name-123.netlify.app` (or your custom domain)

### 3.5 Update CORS in Backend
Make sure your backend allows requests from Netlify. The `main.py` already has CORS configured, but verify:

```python
# In backend/main.py, around line 200-210
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with your Netlify URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**For production**, update `allow_origins`:
```python
allow_origins=[
    "https://your-site.netlify.app",
    "https://your-custom-domain.com"
]
```

## 📝 Step 4: Update Frontend API URL

The frontend already uses environment variables. Make sure `netlify.toml` has the correct backend URL:

```toml
[build.environment]
  NEXT_PUBLIC_API_URL = "https://your-backend-name.onrender.com"
```

Or set it in Netlify dashboard (recommended).

## ✅ Step 5: Verify Deployment

### Test Backend
```bash
# Health check
curl https://your-backend.onrender.com/api/health

# Stocks endpoint
curl https://your-backend.onrender.com/api/stocks?exchange=nse&limit=5
```

### Test Frontend
1. Open your Netlify URL
2. Check browser console for errors
3. Verify API calls are going to your Render backend

## 🔍 Troubleshooting

### Backend Issues

**Problem**: Module not found errors
- **Solution**: Ensure `SentinelMarket/` folder is in the repository root (same level as `backend/`)

**Problem**: Database connection errors
- **Solution**: 
  1. Create a PostgreSQL database in Render (free tier available)
  2. Copy the `DATABASE_URL` from Render dashboard
  3. Add it to environment variables

**Problem**: Port binding errors
- **Solution**: Make sure start command uses `$PORT` environment variable:
  ```
  cd backend && python -m uvicorn main:app --host 0.0.0.0 --port $PORT
  ```

### Frontend Issues

**Problem**: "Failed to fetch" errors
- **Solution**: 
  1. Check `NEXT_PUBLIC_API_URL` is set correctly in Netlify
  2. Verify backend is running (test Render URL directly)
  3. Check CORS settings in backend

**Problem**: Build fails
- **Solution**: 
  1. Check Node.js version (should be 20)
  2. Verify `package.json` has all dependencies
  3. Check build logs in Netlify dashboard

**Problem**: API calls go to localhost
- **Solution**: 
  1. Rebuild after setting `NEXT_PUBLIC_API_URL`
  2. Clear browser cache
  3. Check `frontend/lib/api.ts` uses `process.env.NEXT_PUBLIC_API_URL`

## 📦 What Gets Deployed Where

### Render (Backend)
- ✅ `backend/` folder
- ✅ `SentinelMarket/` folder (needed for ML imports)
- ✅ `backend/requirements.txt`
- ✅ `render.yaml` (optional, for infrastructure as code)

### Netlify (Frontend)
- ✅ `frontend/` folder
- ✅ `frontend/package.json`
- ✅ `netlify.toml`
- ❌ `backend/` (not needed)
- ❌ `SentinelMarket/` (not needed)

## 🎯 Quick Checklist

- [ ] Repository is on GitHub
- [ ] Backend deployed to Render
- [ ] Backend health endpoint works
- [ ] Frontend deployed to Netlify
- [ ] `NEXT_PUBLIC_API_URL` set in Netlify
- [ ] CORS configured in backend
- [ ] Database connected (if using PostgreSQL)
- [ ] Test frontend can fetch data from backend

## 🔐 Security Notes

1. **Never commit** `.env` files or API keys
2. Use environment variables in Render/Netlify dashboards
3. In production, restrict CORS to your frontend domain only
4. Use HTTPS (both Render and Netlify provide this automatically)

## 📚 Additional Resources

- [Render Documentation](https://render.com/docs)
- [Netlify Documentation](https://docs.netlify.com)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [FastAPI Deployment](https://fastapi.tiangolo.com/deployment/)

## 🆘 Need Help?

If you encounter issues:
1. Check Render/Netlify build logs
2. Test backend endpoints directly with `curl` or Postman
3. Check browser console for frontend errors
4. Verify all environment variables are set correctly

---

**Good luck with your deployment! 🚀**

