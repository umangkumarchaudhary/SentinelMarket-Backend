# Supabase Connection Guide

## What You Have vs What You Need

### ✅ What You Have:
- **Project URL**: `https://fkoirgvbutyklignkvqu.supabase.co`
- **API Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### ❌ What You Need:
- **Database Connection String** (for PostgreSQL connection)

---

## Step 1: Get Database Connection String

1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Select your project
3. Click **Settings** (gear icon) in the left sidebar
4. Click **Database** in the settings menu
5. Scroll down to **Connection string** section
6. Select **URI** tab
7. Copy the connection string

It will look like:
```
postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
```

OR the direct connection:
```
postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```

**Important:** You need your **database password** (not the API key).

---

## Step 2: Find Your Database Password

If you don't remember your database password:

1. In Supabase dashboard, go to **Settings** > **Database**
2. Look for **Database password** section
3. If you forgot it, click **Reset database password**
4. Copy the new password (save it securely!)

---

## Step 3: Construct Connection String

Based on your project reference: `fkoirgvbutyklignkvqu`

Your connection string should be:
```
postgresql://postgres:[YOUR-PASSWORD]@db.fkoirgvbutyklignkvqu.supabase.co:5432/postgres
```

Replace `[YOUR-PASSWORD]` with your actual database password.

---

## Step 4: Configure Backend

1. Create `.env` file in `backend/` directory:
   ```bash
   cd backend
   # Create .env file
   ```

2. Add your connection string to `backend/.env`:
   ```
   DATABASE_URL=postgresql://postgres:YOUR_ACTUAL_PASSWORD@db.fkoirgvbutyklignkvqu.supabase.co:5432/postgres
   ```

3. Replace `YOUR_ACTUAL_PASSWORD` with your database password

---

## Step 5: Run SQL Schema

1. In Supabase dashboard, go to **SQL Editor**
2. Click **New Query**
3. Copy entire contents of `database/schema.sql`
4. Paste into SQL Editor
5. Click **Run** (or press Ctrl+Enter)

You should see: "Success. No rows returned"

---

## Step 6: Test Connection

```bash
cd backend
python main.py
```

You should see:
```
✅ Database connection successful
```

---

## Alternative: Use Connection Pooling

For better performance, use the connection pooler:

```
postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
```

Check your Supabase dashboard for the exact pooler URL in the Connection string section.

---

## Troubleshooting

### "Password authentication failed"
- Make sure you're using the **database password**, not the API key
- Reset your database password if needed

### "Connection refused"
- Check if your IP is allowed (Supabase allows all by default)
- Verify the connection string format
- Try the pooler connection string instead

### "relation does not exist"
- Make sure you ran the `schema.sql` file
- Check if tables were created in Supabase Table Editor

---

## Quick Reference

**Your Project Details:**
- Project URL: `https://fkoirgvbutyklignkvqu.supabase.co`
- Project Reference: `fkoirgvbutyklignkvqu`
- Database Host: `db.fkoirgvbutyklignkvqu.supabase.co`
- Port: `5432`
- Database: `postgres`
- User: `postgres`
- Password: **[Your database password - get from Settings > Database]**

**Connection String Format:**
```
postgresql://postgres:[PASSWORD]@db.fkoirgvbutyklignkvqu.supabase.co:5432/postgres
```

---

**Next Steps:**
1. ✅ Get database password from Supabase Settings > Database
2. ✅ Create `backend/.env` with connection string
3. ✅ Run `database/schema.sql` in Supabase SQL Editor
4. ✅ Test connection

