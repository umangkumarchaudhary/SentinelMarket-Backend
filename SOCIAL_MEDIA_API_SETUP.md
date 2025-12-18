# Social Media API Setup Guide

## 🐦 Twitter API Setup

### Option 1: Twitter API v2 (Free Tier) - **RECOMMENDED**

**What you get:**
- **Free tier**: 10,000 tweets/month (read-only)
- **Academic Research**: Unlimited access (if you qualify)
- **Real-time search** for recent tweets
- **Sentiment analysis** ready

**Steps to Get Free Access:**

1. **Create Twitter Developer Account**
   - Go to: https://developer.twitter.com/
   - Sign in with your Twitter account
   - Apply for "Essential" access (free, instant approval)

2. **Create a Project & App**
   - Create a new Project
   - Create an App within the project
   - Note down your credentials

3. **Get API Keys**
   You'll get:
   - **API Key** (Consumer Key)
   - **API Secret** (Consumer Secret)
   - **Bearer Token** (for v2 API - easiest to use)

4. **Add to Environment Variables**
   ```env
   # backend/.env
   TWITTER_BEARER_TOKEN=your_bearer_token_here
   ```

**Rate Limits (Free Tier):**
- 300 requests per 15 minutes
- 10,000 tweets/month
- Perfect for demo/portfolio projects!

---

### Option 2: Twitter API v1.1 (Legacy - Still Works)

**What you need:**
- API Key
- API Secret
- Access Token
- Access Token Secret

**Add to .env:**
```env
TWITTER_API_KEY=your_api_key
TWITTER_API_SECRET=your_api_secret
TWITTER_ACCESS_TOKEN=your_access_token
TWITTER_ACCESS_TOKEN_SECRET=your_access_token_secret
```

**Rate Limits:**
- 180 requests per 15 minutes
- More restrictive than v2

---

## 📱 Telegram API Setup

### Option 1: Telegram API (Free) - **RECOMMENDED**

**What you get:**
- **100% FREE** - No limits!
- Access to public channels
- Real-time message monitoring
- No rate limits (within reason)

**Steps to Get Access:**

1. **Get API Credentials from Telegram**
   - Go to: https://my.telegram.org/
   - Sign in with your phone number
   - Go to "API development tools"
   - Create an application
   - You'll get:
     - **api_id** (a number)
     - **api_hash** (a long string)

2. **Phone Number**
   - You'll need your phone number for authentication
   - Telegram will send a code to verify

3. **Add to Environment Variables**
   ```env
   # backend/.env
   TELEGRAM_API_ID=your_api_id_number
   TELEGRAM_API_HASH=your_api_hash_string
   TELEGRAM_PHONE=your_phone_number_with_country_code
   # Example: +919876543210
   ```

**How It Works:**
- First run: You'll get a code via Telegram, enter it
- Session file created: `sentinel_market_session.session`
- Subsequent runs: Uses saved session (no code needed)

**Monitoring Channels:**
- Add channel usernames to monitor in `telegram_monitor.py`
- Example: `'indianstockmarket', 'stockmarketindia'`

---

## 🚀 Quick Setup Guide

### Step 1: Get Twitter API (5 minutes)

1. Visit: https://developer.twitter.com/en/portal/dashboard
2. Sign in → Create Project → Create App
3. Copy **Bearer Token**
4. Add to `backend/.env`:
   ```env
   TWITTER_BEARER_TOKEN=AAAAAAAAAAAAAAAAAAAAA...
   ```

### Step 2: Get Telegram API (5 minutes)

1. Visit: https://my.telegram.org/
2. Sign in with phone number
3. Go to "API development tools"
4. Create application
5. Copy **api_id** and **api_hash**
6. Add to `backend/.env`:
   ```env
   TELEGRAM_API_ID=12345678
   TELEGRAM_API_HASH=abcdef1234567890abcdef1234567890
   TELEGRAM_PHONE=+919876543210
   ```

### Step 3: Restart Backend

```bash
cd backend
python main.py
```

**First Telegram Run:**
- You'll see: "Please enter the code you received:"
- Check Telegram app for code
- Enter code
- Session saved for future use

---

## 📊 What Data You'll Get

### Twitter Data:
- Tweet count per stock (last 24 hours)
- Sentiment analysis (positive/negative/neutral)
- Engagement metrics (likes, retweets, replies)
- Influencer detection (accounts with >10k followers)
- Hype score (0-100)

### Telegram Data:
- Message count per stock
- Pump signal detection (keywords: "buy now", "going to moon")
- Coordination detection (same stock in multiple channels)
- Channel activity tracking

---

## 💰 Cost Summary

| Service | Cost | Limits |
|---------|------|--------|
| **Twitter API v2** | **FREE** | 10,000 tweets/month |
| **Telegram API** | **FREE** | Unlimited (public channels) |
| **Total** | **$0** | Perfect for portfolio! |

---

## 🔒 Security Best Practices

1. **Never commit `.env` file**
   - Already in `.gitignore` ✅
   - Keep credentials secret

2. **Use Environment Variables**
   - Don't hardcode API keys
   - Use `.env` file (not tracked by git)

3. **Rotate Keys if Exposed**
   - If keys leak, regenerate immediately
   - Twitter: Regenerate in developer portal
   - Telegram: Create new app

---

## 🐛 Troubleshooting

### Twitter API Issues:

**Error: "Invalid or expired token"**
- Solution: Regenerate Bearer Token in Twitter Developer Portal

**Error: "Rate limit exceeded"**
- Solution: Wait 15 minutes or upgrade to paid tier
- Free tier: 300 requests/15 min

**Error: "Forbidden"**
- Solution: Check if your app has read permissions
- Enable "Read" access in app settings

### Telegram API Issues:

**Error: "Phone number invalid"**
- Solution: Use format: `+919876543210` (with country code, no spaces)

**Error: "Session expired"**
- Solution: Delete `sentinel_market_session.session` file and re-authenticate

**Error: "Channel not found"**
- Solution: Make sure channel is public and username is correct
- Channel must be public (not private groups)

---

## 📝 Example .env File

Create `backend/.env`:

```env
# Database
DATABASE_URL=postgresql://user:password@host:port/database

# Twitter API (v2 - Recommended)
TWITTER_BEARER_TOKEN=AAAAAAAAAAAAAAAAAAAAA...

# OR Twitter API (v1.1 - Legacy)
# TWITTER_API_KEY=your_api_key
# TWITTER_API_SECRET=your_api_secret
# TWITTER_ACCESS_TOKEN=your_access_token
# TWITTER_ACCESS_TOKEN_SECRET=your_access_token_secret

# Telegram API
TELEGRAM_API_ID=12345678
TELEGRAM_API_HASH=abcdef1234567890abcdef1234567890
TELEGRAM_PHONE=+919876543210
```

---

## 🎯 Next Steps

1. ✅ Get Twitter Bearer Token (free)
2. ✅ Get Telegram API credentials (free)
3. ✅ Add to `.env` file
4. ✅ Restart backend
5. ✅ Test on Social page - should show real data!

---

## 📚 Additional Resources

- **Twitter API Docs**: https://developer.twitter.com/en/docs
- **Telethon Docs**: https://docs.telethon.dev/
- **Twitter Developer Portal**: https://developer.twitter.com/en/portal/dashboard
- **Telegram API**: https://core.telegram.org/api

---

## ⚠️ Important Notes

1. **Twitter Free Tier**: Perfect for portfolio/demo projects
   - 10,000 tweets/month is plenty for testing
   - If you need more, consider Academic Research access

2. **Telegram**: 100% free, no limits
   - Only monitors public channels
   - Private groups require admin access

3. **Rate Limiting**: Both APIs have rate limits
   - Our code includes `wait_on_rate_limit=True` to handle this automatically
   - No manual intervention needed

4. **Data Privacy**: 
   - Only public data is accessed
   - No private messages or DMs
   - Complies with platform ToS

---

**Ready to get real-time data? Follow the steps above and you'll have live social media monitoring in minutes!** 🚀

