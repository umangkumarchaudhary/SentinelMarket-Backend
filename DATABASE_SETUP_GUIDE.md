# Database Setup Guide for SentinelMarket

## Quick Start

### Step 1: Create Tables in Supabase

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** (left sidebar)
3. Click **New Query**
4. Copy the entire contents of `database/schema.sql`
5. Paste into the SQL editor
6. Click **Run** (or press Ctrl+Enter)

You should see: "Success. No rows returned"

### Step 2: Get Your Database Connection String

1. In Supabase dashboard, go to **Settings** > **Database**
2. Scroll to **Connection string** section
3. Select **URI** tab
4. Copy the connection string (it looks like):
   ```
   postgresql://postgres:[YOUR-PASSWORD]@[PROJECT-REF].supabase.co:5432/postgres
   ```

### Step 3: Configure Backend

1. Create `.env` file in `backend/` directory:
   ```bash
   cd backend
   cp .env.example .env
   ```

2. Edit `backend/.env` and paste your connection string:
   ```
   DATABASE_URL=postgresql://postgres:your_actual_password@your_project_ref.supabase.co:5432/postgres
   ```

3. Replace:
   - `your_actual_password` with your Supabase database password
   - `your_project_ref` with your Supabase project reference

### Step 4: Install Dependencies

```bash
cd SentinelMarket
pip install -r requirements.txt
```

### Step 5: Test Connection

```bash
cd backend
python main.py
```

You should see:
```
✅ Database connection successful
```

---

## Database Schema

### Tables Created

1. **stocks** - Basic stock information (ticker, exchange, name, sector)
2. **stock_data** - Historical price/volume data
3. **risk_assessments** - Risk analysis results from all detection methods
4. **alerts** - High-risk notifications
5. **ml_predictions** - ML model predictions

### Views Created

1. **latest_stock_risk** - Latest risk assessment for each stock
2. **high_risk_stocks** - Stocks with HIGH or EXTREME risk

### Indexes

All tables have indexes for optimal query performance.

---

## Using the Database

### Option 1: Automatic (Recommended)

The backend will automatically save data when you request stock details with `save_to_db=true`:

```
GET /api/stocks/RELIANCE?exchange=nse&save_to_db=true
```

### Option 2: Use Database for Faster Queries

Query stocks from database instead of calculating in real-time:

```
GET /api/stocks?exchange=nse&use_db=true
```

This is much faster as it uses pre-calculated risk assessments.

---

## Database Features

### Auto-Save

When you analyze a stock with `save_to_db=true`:
- Stock record is created/updated
- Historical data is saved
- Risk assessment is stored
- Alert is created if high risk

### Performance

- Database queries are 10-100x faster than real-time calculations
- Indexes ensure fast lookups
- Views provide easy access to latest data

### Data Persistence

- All risk assessments are stored
- Historical data is preserved
- Alerts are tracked
- ML predictions are saved

---

## Troubleshooting

### Connection Issues

**Error: "Database connection failed"**

1. Check your `.env` file exists and has correct `DATABASE_URL`
2. Verify your Supabase project is active
3. Check your database password is correct
4. Ensure your IP is allowed (Supabase allows all by default)

**Error: "relation does not exist"**

- Run the `schema.sql` file in Supabase SQL Editor
- Check if tables were created (go to Table Editor in Supabase)

### Import Errors

**Error: "No module named 'database'"**

- Make sure you're running from the `backend/` directory
- Check that `database.py` exists in `backend/` directory

**Error: "No module named 'dotenv'"**

```bash
pip install python-dotenv
```

---

## Security Notes

1. **Never commit `.env` file** - It contains your database password
2. **Use Row Level Security (RLS)** in Supabase for production
3. **Keep your database password secure**
4. **Use connection pooling** for production (Supabase provides this)

---

## Next Steps

1. ✅ Run `schema.sql` in Supabase
2. ✅ Configure `.env` file
3. ✅ Test connection
4. ✅ Start using database features

Once connected, the system will:
- Store all risk assessments
- Create alerts automatically
- Provide faster queries
- Maintain historical data

---

## Example Queries

### View Latest Risk Assessments

```sql
SELECT * FROM latest_stock_risk
ORDER BY final_risk_score DESC
LIMIT 10;
```

### View High Risk Stocks

```sql
SELECT * FROM high_risk_stocks;
```

### View Recent Alerts

```sql
SELECT 
    s.ticker,
    s.exchange,
    a.risk_level,
    a.risk_score,
    a.message,
    a.created_at
FROM alerts a
JOIN stocks s ON a.stock_id = s.id
WHERE a.is_read = false
ORDER BY a.created_at DESC;
```

---

**Ready to test!** 🚀

