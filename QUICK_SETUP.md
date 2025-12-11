# Quick Setup Guide - Supabase Connection

## 🎯 What You Need to Do

### Step 1: Get Your Database Password

1. Go to: https://supabase.com/dashboard
2. Select your project
3. Click **Settings** (⚙️) → **Database**
4. Find **Database password** section
5. If you don't remember it, click **Reset database password**
6. **Copy the password** (save it somewhere safe!)

### Step 2: Create Connection String

Based on your project: `fkoirgvbutyklignkvqu`

Your connection string format:
```
postgresql://postgres:YOUR_PASSWORD@db.fkoirgvbutyklignkvqu.supabase.co:5432/postgres
```

**Replace `YOUR_PASSWORD` with the password from Step 1**

### Step 3: Create .env File

1. Go to `backend/` directory
2. Create a file named `.env` (no extension)
3. Add this line:
   ```
   DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.fkoirgvbutyklignkvqu.supabase.co:5432/postgres
   ```
4. Replace `YOUR_PASSWORD` with your actual password

### Step 4: Run SQL Schema

1. In Supabase dashboard, go to **SQL Editor**
2. Click **New Query**
3. Open `database/schema.sql` file
4. Copy ALL the contents
5. Paste into Supabase SQL Editor
6. Click **Run** (or Ctrl+Enter)

### Step 5: Test

```bash
cd backend
python main.py
```

Look for: `✅ Database connection successful`

---

## 📋 Checklist

- [ ] Got database password from Supabase Settings > Database
- [ ] Created `backend/.env` file
- [ ] Added `DATABASE_URL` with your password
- [ ] Ran `database/schema.sql` in Supabase SQL Editor
- [ ] Tested connection (saw ✅ message)

---

## 🔍 Where to Find Things in Supabase

**Database Password:**
- Settings → Database → Database password

**Connection String:**
- Settings → Database → Connection string → URI tab

**SQL Editor:**
- Left sidebar → SQL Editor

**Table Editor:**
- Left sidebar → Table Editor (to verify tables were created)

---

## ⚠️ Important Notes

1. **Never commit `.env` file** - It contains your password
2. **Database password ≠ API key** - You need the database password
3. **Save your password** - You'll need it for connection
4. **Run schema.sql first** - Tables must exist before connecting

---

## 🆘 If Something Goes Wrong

**"Password authentication failed"**
→ Check you're using database password, not API key

**"Connection refused"**
→ Check connection string format
→ Verify project reference is correct

**"relation does not exist"**
→ Make sure you ran schema.sql
→ Check Table Editor to see if tables exist

---

**Ready? Start with Step 1!** 🚀

