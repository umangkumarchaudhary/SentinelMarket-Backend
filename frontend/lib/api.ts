/**
 * API Client for SentinelMarket Backend
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://sentinelmarket-backend.onrender.com';


export interface Stock {
  ticker: string;
  exchange: string;
  risk_score: number;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
  is_suspicious: boolean;
  price: number;
  price_change_percent: number;
  volume: number;
  last_updated: string;
}

export interface StockDetail extends Stock {
  recommendation: string;
  explanation: string;
  red_flags: string[];
  individual_scores: {
    volume_spike: number;
    price_anomaly: number;
    ml_anomaly: number;
    social_sentiment: number;
  };
  ml_status: {
    enabled: boolean;
    error?: string;
    score: number;
  };
  chart_data: Array<{
    date: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }>;
  risk_history: Array<{
    date: string;
    risk_score: number;
  }>;
  details: Record<string, any>;
}

export interface Alert {
  ticker: string;
  exchange: string;
  risk_score: number;
  risk_level: string;
  price: number;
  price_change_percent: number;
  timestamp: string;
  message: string;
}

export interface Analytics {
  total_stocks: number;
  risk_distribution: {
    low: number;
    medium: number;
    high: number;
    extreme: number;
  };
  average_risk_score: number;
  high_risk_count: number;
  exchange: string;
}

export interface StocksResponse {
  stocks: Stock[];
  total: number;
  exchange: string;
  limit: number;
  offset: number;
}

/**
 * Fetch list of stocks
 */
export async function getStocks(
  exchange?: 'nse' | 'bse',
  riskLevel?: 'low' | 'medium' | 'high' | 'extreme',
  limit: number = 100,
  offset: number = 0
): Promise<StocksResponse> {
  const params = new URLSearchParams();
  if (exchange) params.append('exchange', exchange);
  if (riskLevel) params.append('risk_level', riskLevel);
  params.append('limit', limit.toString());
  params.append('offset', offset.toString());

  const response = await fetch(`${API_BASE_URL}/api/stocks?${params}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch stocks: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Fetch detailed analysis for a single stock
 */
export async function getStockDetail(
  ticker: string,
  exchange: 'nse' | 'bse' = 'nse',
  period: string = '3mo'
): Promise<StockDetail> {
  const params = new URLSearchParams();
  params.append('exchange', exchange);
  params.append('period', period);

  const response = await fetch(`${API_BASE_URL}/api/stocks/${ticker}?${params}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch stock detail: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Fetch historical data for charts
 */
export async function getStockHistory(
  ticker: string,
  exchange: 'nse' | 'bse' = 'nse',
  period: string = '3mo'
): Promise<{
  ticker: string;
  exchange: string;
  period: string;
  data: Array<{
    date: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }>;
  count: number;
}> {
  const params = new URLSearchParams();
  params.append('exchange', exchange);
  params.append('period', period);

  const response = await fetch(`${API_BASE_URL}/api/stocks/${ticker}/history?${params}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch stock history: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Fetch alerts
 */
export async function getAlerts(
  exchange?: 'nse' | 'bse',
  riskLevel?: string,
  limit: number = 50
): Promise<{ alerts: Alert[]; total: number; exchange: string }> {
  const params = new URLSearchParams();
  if (exchange) params.append('exchange', exchange);
  if (riskLevel) params.append('risk_level', riskLevel);
  params.append('limit', limit.toString());

  const response = await fetch(`${API_BASE_URL}/api/alerts?${params}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch alerts: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Fetch analytics
 */
export async function getAnalytics(
  exchange?: 'nse' | 'bse'
): Promise<Analytics> {
  const params = new URLSearchParams();
  if (exchange) params.append('exchange', exchange);

  const response = await fetch(`${API_BASE_URL}/api/analytics?${params}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch analytics: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Health check
 */
export async function healthCheck(): Promise<{
  status: string;
  timestamp: string;
  ml_enabled: boolean;
}> {
  const response = await fetch(`${API_BASE_URL}/api/health`);
  if (!response.ok) {
    throw new Error(`Health check failed: ${response.statusText}`);
  }
  return response.json();
}

// ============================================================================
// PHASE 5: ADVANCED FEATURES
// ============================================================================

// Phase 5A: Social Media
export interface SocialMediaData {
  ticker: string;
  twitter: {
    mention_count: number;
    sentiment_distribution: { positive: number; negative: number; neutral: number };
    avg_sentiment_score: number;
    total_engagement: number;
    influencer_count: number;
    hype_score: number;
    recent_mentions: Array<{
      id: string;
      text: string;
      created_at: string;
      username?: string;
      follower_count: number;
      likes: number;
      retweets: number;
    }>;
  };
  telegram: {
    mention_count: number;
    pump_signal_count: number;
    coordination: {
      is_coordinated: boolean;
      coordination_score: number;
      channels_involved: number;
    };
    channels: string[];
    recent_mentions: Array<{
      id: string;
      text: string;
      created_at: string;
      channel: string;
      is_pump_signal: boolean;
    }>;
  };
  combined_hype_score: number;
  last_updated: string;
}

export async function getStockSocial(
  ticker: string,
  exchange: 'nse' | 'bse' = 'nse',
  hours: number = 24
): Promise<SocialMediaData> {
  const params = new URLSearchParams();
  params.append('exchange', exchange);
  params.append('hours', hours.toString());

  const response = await fetch(`${API_BASE_URL}/api/stocks/${ticker}/social?${params}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch social data: ${response.statusText}`);
  }
  return response.json();
}

export interface TrendingStock {
  ticker: string;
  hype_score: number;
  twitter_mentions: number;
  telegram_signals: number;
}

export async function getTrendingStocks(
  exchange: 'nse' | 'bse' = 'nse',
  limit: number = 10
): Promise<{ trending: TrendingStock[]; exchange: string; last_updated: string; note?: string }> {
  const params = new URLSearchParams();
  params.append('exchange', exchange);
  params.append('limit', limit.toString());

  const response = await fetch(`${API_BASE_URL}/api/social/trending?${params}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch trending stocks: ${response.statusText}`);
  }
  return response.json();
}

// Phase 5B: Advanced Visualizations
export interface HeatmapItem {
  ticker: string;
  risk_score: number;
  risk_level: string;
  price: number;
}

export interface HeatmapResponse {
  heatmap: HeatmapItem[];
  exchange: string;
  last_updated: string;
}

export async function getHeatmapData(
  exchange: 'nse' | 'bse' = 'nse',
  limit: number = 50
): Promise<HeatmapResponse> {
  const params = new URLSearchParams();
  params.append('exchange', exchange);
  params.append('limit', limit.toString());

  const response = await fetch(`${API_BASE_URL}/api/visuals/heatmap?${params}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch heatmap: ${response.statusText}`);
  }
  return response.json();
}

export interface CorrelationMatrix {
  [ticker: string]: { [ticker: string]: number };
}

export async function getCorrelationMatrix(
  exchange: 'nse' | 'bse' = 'nse',
  tickers?: string[],
  limit: number = 20
): Promise<{ correlation: CorrelationMatrix; tickers: string[]; last_updated: string }> {
  const params = new URLSearchParams();
  params.append('exchange', exchange);
  if (tickers) params.append('tickers', tickers.join(','));
  params.append('limit', limit.toString());

  const response = await fetch(`${API_BASE_URL}/api/visuals/correlation?${params}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch correlation matrix: ${response.statusText}`);
  }
  return response.json();
}

// Phase 5C: ML Explainability
export interface Contribution {
  feature: string;
  contribution: number;
  impact: 'high' | 'medium' | 'low';
}

export interface ExplanationData {
  ticker: string;
  risk_score: number;
  risk_level: string;
  explanation: string;
  red_flags: string[];
  feature_importance: Record<string, number>;
  top_contributions: Contribution[];
  detector_scores: {
    volume: number;
    price: number;
    ml: number;
    social: number;
  };
  ml_status: {
    enabled: boolean;
    error?: string;
    score?: number;
  };
  last_updated: string;
}

export async function getStockExplanation(
  ticker: string,
  exchange: 'nse' | 'bse' = 'nse',
  period: string = '3mo'
): Promise<ExplanationData> {
  const params = new URLSearchParams();
  params.append('exchange', exchange);
  params.append('period', period);

  const response = await fetch(`${API_BASE_URL}/api/stocks/${ticker}/explain?${params}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch explanation: ${response.statusText}`);
  }
  return response.json();
}

// Phase 5D: Pattern Matching
export interface PatternMatch {
  stock: string;
  date: string;
  similarity: number;
  outcome: string;
  pattern_type: string;
}

export interface PatternMatchResponse {
  ticker: string;
  current_pattern: {
    type: string;
    price_change_30d: number;
    volume_spike: number;
    risk_score: number;
  };
  historical_matches: PatternMatch[];
  best_match: PatternMatch | null;
  similarity_score: number;
  warning: string | null;
  last_updated: string;
}

export async function getPatternMatches(
  ticker: string,
  exchange: 'nse' | 'bse' = 'nse',
  period: string = '3mo'
): Promise<PatternMatchResponse> {
  const params = new URLSearchParams();
  params.append('exchange', exchange);
  params.append('period', period);

  const response = await fetch(`${API_BASE_URL}/api/patterns/match?${params}&ticker=${ticker}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch pattern matches: ${response.statusText}`);
  }
  return response.json();
}

// Phase 5E: Predictive Alerts
export interface PredictionData {
  ticker: string;
  crash_probability: number;
  confidence: number;
  alert_level: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';
  prediction_window: string;
  risk_score: number;
  recommendation: string;
  factors: {
    current_risk: number;
    volatility: number;
    volume_anomaly: boolean;
  };
  last_updated: string;
}

export async function getCrashPrediction(
  ticker: string,
  exchange: 'nse' | 'bse' = 'nse',
  days_ahead: number = 7
): Promise<PredictionData> {
  const params = new URLSearchParams();
  params.append('exchange', exchange);
  params.append('days_ahead', days_ahead.toString());

  const response = await fetch(`${API_BASE_URL}/api/stocks/${ticker}/predict?${params}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch prediction: ${response.statusText}`);
  }
  return response.json();
}

export interface PredictiveAlert {
  ticker: string;
  exchange: string;
  crash_probability: number;
  risk_score: number;
  alert_level: string;
  predicted_window: string;
  current_price: number;
}

export async function getPredictiveAlerts(
  exchange: 'nse' | 'bse' = 'nse',
  limit: number = 20,
  min_probability: number = 50
): Promise<{ alerts: PredictiveAlert[]; total: number; exchange: string; last_updated: string }> {
  const params = new URLSearchParams();
  params.append('exchange', exchange);
  params.append('limit', limit.toString());
  params.append('min_probability', min_probability.toString());

  const response = await fetch(`${API_BASE_URL}/api/alerts/predictive?${params}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch predictive alerts: ${response.statusText}`);
  }
  return response.json();
}

