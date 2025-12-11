-- SentinelMarket Database Schema
-- For Supabase/PostgreSQL

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: stocks
-- Stores basic stock information
CREATE TABLE IF NOT EXISTS stocks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticker VARCHAR(20) NOT NULL,
    exchange VARCHAR(10) NOT NULL CHECK (exchange IN ('NSE', 'BSE')),
    name VARCHAR(255),
    sector VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(ticker, exchange)
);

-- Table: stock_data
-- Stores historical stock price and volume data
CREATE TABLE IF NOT EXISTS stock_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stock_id UUID NOT NULL REFERENCES stocks(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    open DECIMAL(15, 2) NOT NULL,
    high DECIMAL(15, 2) NOT NULL,
    low DECIMAL(15, 2) NOT NULL,
    close DECIMAL(15, 2) NOT NULL,
    volume BIGINT NOT NULL,
    risk_score DECIMAL(5, 2),
    risk_level VARCHAR(20) CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH', 'EXTREME')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(stock_id, date)
);

-- Table: risk_assessments
-- Stores detailed risk assessment results
CREATE TABLE IF NOT EXISTS risk_assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stock_id UUID NOT NULL REFERENCES stocks(id) ON DELETE CASCADE,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    volume_score DECIMAL(5, 2) NOT NULL,
    price_score DECIMAL(5, 2) NOT NULL,
    ml_score DECIMAL(5, 2) NOT NULL,
    social_score DECIMAL(5, 2) NOT NULL DEFAULT 0,
    final_risk_score DECIMAL(5, 2) NOT NULL,
    risk_level VARCHAR(20) NOT NULL CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH', 'EXTREME')),
    is_suspicious BOOLEAN NOT NULL DEFAULT FALSE,
    red_flags JSONB,
    details JSONB,
    explanation TEXT,
    recommendation TEXT,
    ml_status JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: alerts
-- Stores high-risk alerts and notifications
CREATE TABLE IF NOT EXISTS alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stock_id UUID NOT NULL REFERENCES stocks(id) ON DELETE CASCADE,
    alert_type VARCHAR(50) NOT NULL,
    risk_level VARCHAR(20) NOT NULL CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH', 'EXTREME')),
    risk_score DECIMAL(5, 2) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP WITH TIME ZONE
);

-- Table: ml_predictions
-- Stores ML model predictions
CREATE TABLE IF NOT EXISTS ml_predictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stock_id UUID NOT NULL REFERENCES stocks(id) ON DELETE CASCADE,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    anomaly_score DECIMAL(10, 6) NOT NULL,
    risk_score DECIMAL(5, 2) NOT NULL,
    is_anomaly BOOLEAN NOT NULL,
    features JSONB,
    model_version VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_stocks_ticker_exchange ON stocks(ticker, exchange);
CREATE INDEX IF NOT EXISTS idx_stocks_exchange ON stocks(exchange);
CREATE INDEX IF NOT EXISTS idx_stock_data_stock_id ON stock_data(stock_id);
CREATE INDEX IF NOT EXISTS idx_stock_data_date ON stock_data(date);
CREATE INDEX IF NOT EXISTS idx_stock_data_stock_date ON stock_data(stock_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_risk_assessments_stock_id ON risk_assessments(stock_id);
CREATE INDEX IF NOT EXISTS idx_risk_assessments_timestamp ON risk_assessments(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_risk_assessments_risk_level ON risk_assessments(risk_level);
CREATE INDEX IF NOT EXISTS idx_alerts_stock_id ON alerts(stock_id);
CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_is_read ON alerts(is_read);
CREATE INDEX IF NOT EXISTS idx_alerts_risk_level ON alerts(risk_level);
CREATE INDEX IF NOT EXISTS idx_ml_predictions_stock_id ON ml_predictions(stock_id);
CREATE INDEX IF NOT EXISTS idx_ml_predictions_timestamp ON ml_predictions(timestamp DESC);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-update updated_at for stocks table
CREATE TRIGGER update_stocks_updated_at BEFORE UPDATE ON stocks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- View: latest_stock_risk
-- Shows the latest risk assessment for each stock
CREATE OR REPLACE VIEW latest_stock_risk AS
SELECT DISTINCT ON (s.id)
    s.id AS stock_id,
    s.ticker,
    s.exchange,
    s.name,
    ra.final_risk_score,
    ra.risk_level,
    ra.is_suspicious,
    ra.timestamp AS last_assessed,
    sd.close AS current_price,
    sd.date AS price_date
FROM stocks s
LEFT JOIN risk_assessments ra ON s.id = ra.stock_id
LEFT JOIN stock_data sd ON s.id = sd.stock_id
WHERE ra.timestamp = (
    SELECT MAX(timestamp)
    FROM risk_assessments
    WHERE stock_id = s.id
)
ORDER BY s.id, ra.timestamp DESC, sd.date DESC;

-- View: high_risk_stocks
-- Shows stocks with high or extreme risk
CREATE OR REPLACE VIEW high_risk_stocks AS
SELECT 
    s.ticker,
    s.exchange,
    ra.final_risk_score,
    ra.risk_level,
    ra.timestamp,
    ra.red_flags,
    sd.close AS current_price
FROM stocks s
INNER JOIN risk_assessments ra ON s.id = ra.stock_id
INNER JOIN stock_data sd ON s.id = sd.stock_id
WHERE ra.risk_level IN ('HIGH', 'EXTREME')
    AND ra.timestamp = (
        SELECT MAX(timestamp)
        FROM risk_assessments
        WHERE stock_id = s.id
    )
    AND sd.date = (
        SELECT MAX(date)
        FROM stock_data
        WHERE stock_id = s.id
    )
ORDER BY ra.final_risk_score DESC;

-- Table: social_mentions
-- Stores social media mentions (Twitter, Telegram, etc.)
CREATE TABLE IF NOT EXISTS social_mentions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stock_id UUID NOT NULL REFERENCES stocks(id) ON DELETE CASCADE,
    platform VARCHAR(20) NOT NULL CHECK (platform IN ('twitter', 'telegram', 'reddit')),
    message TEXT NOT NULL,
    sentiment VARCHAR(20) CHECK (sentiment IN ('positive', 'negative', 'neutral')),
    sentiment_score DECIMAL(5, 2),
    user_id VARCHAR(255),
    username VARCHAR(255),
    follower_count INTEGER,
    engagement_metrics JSONB,
    hashtags TEXT[],
    mentions TEXT[],
    is_influencer BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: social_aggregates
-- Aggregated social media metrics per stock per day
CREATE TABLE IF NOT EXISTS social_aggregates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stock_id UUID NOT NULL REFERENCES stocks(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    platform VARCHAR(20) NOT NULL,
    mention_count INTEGER NOT NULL DEFAULT 0,
    positive_count INTEGER DEFAULT 0,
    negative_count INTEGER DEFAULT 0,
    neutral_count INTEGER DEFAULT 0,
    avg_sentiment_score DECIMAL(5, 2),
    total_engagement BIGINT DEFAULT 0,
    influencer_count INTEGER DEFAULT 0,
    hype_score DECIMAL(5, 2),
    coordination_score DECIMAL(5, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(stock_id, date, platform)
);

-- Table: pattern_library
-- Historical pump-and-dump patterns for matching
CREATE TABLE IF NOT EXISTS pattern_library (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pattern_name VARCHAR(255) NOT NULL,
    stock_ticker VARCHAR(20),
    exchange VARCHAR(10),
    date_range_start DATE,
    date_range_end DATE,
    price_pattern JSONB,
    volume_pattern JSONB,
    social_pattern JSONB,
    outcome VARCHAR(50),
    crash_date DATE,
    crash_magnitude DECIMAL(5, 2),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: predictions
-- ML predictions for crash probability
CREATE TABLE IF NOT EXISTS predictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stock_id UUID NOT NULL REFERENCES stocks(id) ON DELETE CASCADE,
    prediction_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    crash_probability_3d DECIMAL(5, 2),
    crash_probability_7d DECIMAL(5, 2),
    confidence DECIMAL(5, 2),
    predicted_crash_date DATE,
    predicted_magnitude DECIMAL(5, 2),
    model_version VARCHAR(50),
    features_used JSONB,
    actual_outcome VARCHAR(50),
    actual_crash_date DATE,
    accuracy_score DECIMAL(5, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for social media tables
CREATE INDEX IF NOT EXISTS idx_social_mentions_stock_id ON social_mentions(stock_id);
CREATE INDEX IF NOT EXISTS idx_social_mentions_platform ON social_mentions(platform);
CREATE INDEX IF NOT EXISTS idx_social_mentions_created_at ON social_mentions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_social_mentions_sentiment ON social_mentions(sentiment);
CREATE INDEX IF NOT EXISTS idx_social_aggregates_stock_date ON social_aggregates(stock_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_pattern_library_ticker ON pattern_library(stock_ticker);
CREATE INDEX IF NOT EXISTS idx_predictions_stock_id ON predictions(stock_id);
CREATE INDEX IF NOT EXISTS idx_predictions_prediction_date ON predictions(prediction_date DESC);

-- Trigger to update updated_at for social_aggregates
CREATE TRIGGER update_social_aggregates_updated_at BEFORE UPDATE ON social_aggregates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE stocks IS 'Basic stock information for NSE and BSE';
COMMENT ON TABLE stock_data IS 'Historical stock price and volume data';
COMMENT ON TABLE risk_assessments IS 'Detailed risk assessment results from all detection methods';
COMMENT ON TABLE alerts IS 'High-risk alerts and notifications for users';
COMMENT ON TABLE ml_predictions IS 'ML model predictions and anomaly scores';
COMMENT ON TABLE social_mentions IS 'Individual social media mentions (Twitter, Telegram, Reddit)';
COMMENT ON TABLE social_aggregates IS 'Daily aggregated social media metrics per stock';
COMMENT ON TABLE pattern_library IS 'Historical pump-and-dump patterns for pattern matching';
COMMENT ON TABLE predictions IS 'ML predictions for stock crash probability (3-7 days ahead)';
