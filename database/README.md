# Database Setup for SentinelMarket

## Supabase Setup Instructions

### Step 1: Get Your Supabase Credentials

1. Go to your Supabase project dashboard
2. Navigate to **Settings** > **Database**
3. Find the **Connection string** section
4. Copy the connection string (URI format)

### Step 2: Run the SQL Schema

1. In Supabase dashboard, go to **SQL Editor**
2. Click **New Query**
3. Copy and paste the contents of `schema.sql`
4. Click **Run** to execute

This will create:
- All required tables (stocks, stock_data, risk_assessments, alerts, ml_predictions)
- Indexes for performance
- Views for easy queries
- Triggers for auto-updating timestamps

### Step 3: Configure Backend

1. Copy `.env.example` to `.env`:
   ```bash
   cp backend/.env.example backend/.env
   ```

2. Edit `backend/.env` and add your Supabase connection string:
   ```
   DATABASE_URL=postgresql://postgres:your_password@your_project_ref.supabase.co:5432/postgres
   ```

3. Replace:
   - `your_password` with your Supabase database password
   - `your_project_ref` with your Supabase project reference

### Step 4: Test Connection

Run the backend and check the console:
```bash
cd backend
python main.py
```

You should see:
```
✅ Database connection successful
```

## Database Schema Overview

### Tables

1. **stocks** - Basic stock information
2. **stock_data** - Historical price/volume data
3. **risk_assessments** - Risk analysis results
4. **alerts** - High-risk notifications
5. **ml_predictions** - ML model predictions

### Views

1. **latest_stock_risk** - Latest risk for each stock
2. **high_risk_stocks** - Stocks with high/extreme risk

## Security Notes

- Never commit `.env` file to git
- Use Supabase Row Level Security (RLS) for production
- Keep your database password secure
- Use connection pooling for production

## Troubleshooting

### Connection Issues
- Check your connection string format
- Verify your Supabase project is active
- Check firewall settings
- Ensure database password is correct

### Table Creation Issues
- Make sure you have proper permissions
- Check if tables already exist
- Review SQL error messages in Supabase

