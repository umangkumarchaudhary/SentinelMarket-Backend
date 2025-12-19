# Quick Deployment Reference

## 📍 Where to Put the SentinelMarket Folder

**Answer: Keep it in the repository root, same level as `backend/` and `frontend/`**

```
Your Repository/
├── backend/              ← Deploy to Render
├── frontend/             ← Deploy to Netlify  
├── SentinelMarket/       ← Needed by backend (keep in repo!)
├── render.yaml           ← Render config
└── netlify.toml          ← Netlify config
```

**Why?** The backend imports from `SentinelMarket/src/`, so it must be accessible during deployment.

## 🚀 Quick Steps

### Backend (Render)
1. Push entire repo to GitHub
2. In Render: New Web Service → Connect repo
3. **Root Directory**: Leave empty (or `.`)
4. **Build Command**: `pip install -r backend/requirements.txt`
5. **Start Command**: `cd backend && python -m uvicorn main:app --host 0.0.0.0 --port $PORT`
6. Add environment variables (see DEPLOYMENT_GUIDE.md)

### Frontend (Netlify)
1. Same repo (or separate, your choice)
2. In Netlify: Import project → Connect repo
3. **Base directory**: `frontend`
4. **Build command**: `npm install && npm run build`
5. **Publish directory**: `.next`
6. **Environment variable**: `NEXT_PUBLIC_API_URL=https://your-backend.onrender.com`

## ✅ Checklist

- [ ] Repository on GitHub with all folders
- [ ] Backend URL from Render: `https://xxx.onrender.com`
- [ ] Frontend `NEXT_PUBLIC_API_URL` set to backend URL
- [ ] CORS in backend allows Netlify domain
- [ ] Test both endpoints work

## 🔗 Important URLs

After deployment, you'll have:
- **Backend**: `https://sentinel-market-backend.onrender.com`
- **Frontend**: `https://your-site-123.netlify.app`

Update frontend's `NEXT_PUBLIC_API_URL` to point to your backend URL!

