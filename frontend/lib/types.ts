/**
 * TypeScript types for SentinelMarket
 */

export type Exchange = 'nse' | 'bse';
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';

export interface RiskBadgeProps {
  riskLevel: RiskLevel;
  riskScore: number;
  size?: 'sm' | 'md' | 'lg';
}

export interface ExchangeToggleProps {
  exchange: Exchange;
  onExchangeChange: (exchange: Exchange) => void;
}

