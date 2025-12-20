'use client';

import Link from 'next/link';
import { ExchangeToggle } from './ExchangeToggle';
import { ThemeToggle } from './ThemeToggle';
import { Exchange } from '@/lib/types';
import { useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://sentinelmarket-backend.onrender.com';


interface HeaderProps {
  exchange: Exchange;
  onExchangeChange: (exchange: Exchange) => void;
}

const navItems = [
  { href: '/', label: 'Dashboard' },
  { href: '/alerts', label: 'Alerts' },
  { href: '/analytics', label: 'Analytics' },
  { href: '/social', label: 'Social' },
  { href: '/pipelines', label: 'Pipelines' },
  { href: '/data-quality', label: 'Quality' },
  { href: '/streams', label: 'Streams' },
  { href: '/data-lake', label: 'Data Lake' },
];

interface MarketIndex {
  symbol: string;
  value: number;
  change: number;
  change_percent: number;
  positive: boolean;
  demo?: boolean;
}

// Fallback data in case API fails
const fallbackMarketData: MarketIndex[] = [
  { symbol: 'NIFTY 50', value: 24857.30, change: 205.45, change_percent: 0.82, positive: true },
  { symbol: 'SENSEX', value: 82133.12, change: 620.75, change_percent: 0.76, positive: true },
  { symbol: 'BANK NIFTY', value: 53240.15, change: -128.50, change_percent: -0.24, positive: false },
  { symbol: 'NIFTY IT', value: 44892.50, change: 498.25, change_percent: 1.12, positive: true },
];

export function Header({ exchange, onExchangeChange }: HeaderProps) {
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
  const [marketData, setMarketData] = useState<MarketIndex[]>(fallbackMarketData);
  const [marketStatus, setMarketStatus] = useState<'open' | 'closed'>('open');
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();

  // Fetch market indices data
  const fetchMarketIndices = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/market-indices`);
      if (response.ok) {
        const data = await response.json();
        if (data.indices && data.indices.length > 0) {
          setMarketData(data.indices);
          setMarketStatus(data.market_status || 'open');
        }
      }
    } catch (error) {
      console.error('Failed to fetch market indices:', error);
      // Keep using fallback data
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    setMounted(true);

    // Fetch market data immediately
    fetchMarketIndices();

    // Refresh market data every 60 seconds
    const marketInterval = setInterval(fetchMarketIndices, 60000);

    // Update time every second
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      }));
    };
    updateTime();
    const timeInterval = setInterval(updateTime, 1000);

    return () => {
      clearInterval(marketInterval);
      clearInterval(timeInterval);
    };
  }, [fetchMarketIndices]);

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  // Format number with commas (Indian numbering system)
  const formatValue = (value: number) => {
    return value.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Format percentage change
  const formatChange = (change: number, positive: boolean) => {
    const sign = positive ? '+' : '';
    return `${sign}${change.toFixed(2)}%`;
  };


  return (
    <header className="relative z-50">
      {/* Live Market Ticker Strip */}
      <div className="relative overflow-hidden bg-gradient-to-r from-zinc-950 via-black to-zinc-950 border-b border-zinc-800/30">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(220,38,38,0.03)_50%,transparent_100%)]" />
        <div className="relative flex items-center h-8 max-w-[1800px] mx-auto px-4 lg:px-8">
          {/* Market Status Indicator */}
          <div className="hidden sm:flex items-center gap-2 pr-4 border-r border-zinc-800/50">
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${marketStatus === 'open' ? 'bg-emerald-400' : 'bg-amber-400'} opacity-75`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${marketStatus === 'open' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
            </span>
            <span className={`text-[11px] font-medium uppercase tracking-wider ${marketStatus === 'open' ? 'text-emerald-400' : 'text-amber-400'}`}>
              {marketStatus === 'open' ? 'Market Open' : 'Market Closed'}
            </span>
          </div>

          {/* Scrolling Ticker */}
          <div className="flex-1 overflow-hidden mx-4">
            <div
              className="flex items-center gap-8 animate-marquee whitespace-nowrap"
              style={{ animation: mounted ? 'marquee 30s linear infinite' : 'none' }}
            >
              {[...marketData, ...marketData].map((item, index) => (
                <div key={index} className="flex items-center gap-3">
                  <span className="text-[11px] font-semibold text-zinc-400 tracking-wide">{item.symbol}</span>
                  <span className="text-[11px] font-bold text-white tabular-nums">{formatValue(item.value)}</span>
                  <span className={`text-[11px] font-bold tabular-nums ${item.positive ? 'text-emerald-400' : 'text-red-400'}`}>
                    {formatChange(item.change_percent, item.positive)}
                  </span>
                  <span className="text-zinc-700">│</span>
                </div>
              ))}
            </div>
          </div>

          {/* Live Time */}
          <div className="hidden sm:flex items-center gap-2 pl-4 border-l border-zinc-800/50">
            <span className="text-[11px] font-mono font-bold text-zinc-300 tabular-nums tracking-wider">
              {currentTime}
            </span>
            <span className="text-[10px] font-medium text-zinc-600 uppercase">IST</span>
          </div>
        </div>
      </div>


      {/* Main Header */}
      <div className="relative bg-gradient-to-b from-zinc-900/95 via-zinc-900/90 to-black/95 backdrop-blur-2xl border-b border-zinc-800/50">
        {/* Subtle Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:3rem_3rem] opacity-50" />

        {/* Top Accent Line */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-red-500/40 to-transparent" />

        <div className="relative max-w-[1800px] mx-auto px-4 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">

            {/* Logo Section */}
            <Link
              href="/"
              className="group flex items-center gap-3 transition-all duration-500 hover:opacity-90"
              style={{ animation: mounted ? 'fadeSlideIn 0.6s ease-out' : 'none' }}
            >
              {/* Logo Mark */}
              <div className="relative">
                {/* Glow Effect */}
                <div className="absolute -inset-1 bg-gradient-to-r from-red-600/20 to-orange-600/20 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                {/* Logo Container */}
                <div className="relative h-10 w-10 lg:h-12 lg:w-12 rounded-xl bg-gradient-to-br from-red-600 via-red-700 to-red-900 shadow-lg shadow-red-900/30 flex items-center justify-center overflow-hidden">
                  {/* Inner Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-white/5" />

                  {/* Logo Text - S */}
                  <span className="relative text-xl lg:text-2xl font-black text-white tracking-tighter" style={{ fontFamily: "'Inter', sans-serif" }}>
                    S
                  </span>

                  {/* Shine Effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                </div>
              </div>

              {/* Brand Name */}
              <div className="flex flex-col">
                <div className="flex items-baseline gap-0.5">
                  <span className="text-xl lg:text-2xl font-black tracking-tight bg-gradient-to-r from-white via-white to-zinc-400 bg-clip-text text-transparent" style={{ fontFamily: "'Inter', sans-serif" }}>
                    Sentinel
                  </span>
                  <span className="text-xl lg:text-2xl font-black tracking-tight bg-gradient-to-r from-red-400 via-red-500 to-red-600 bg-clip-text text-transparent" style={{ fontFamily: "'Inter', sans-serif" }}>
                    Market
                  </span>
                </div>
                <span className="text-[9px] lg:text-[10px] font-semibold uppercase tracking-[0.25em] text-zinc-500 mt-0.5">
                  AI-Powered Market Intelligence
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center">
              <div className="flex items-center bg-zinc-900/50 rounded-2xl p-1.5 border border-zinc-800/50">
                {navItems.map((item, index) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`relative px-4 py-2 rounded-xl text-[13px] font-semibold tracking-wide transition-all duration-300 ${isActive(item.href)
                      ? 'text-white bg-gradient-to-r from-red-600/20 to-red-700/10 shadow-sm'
                      : 'text-zinc-400 hover:text-white hover:bg-white/5'
                      }`}
                    style={{ animation: mounted ? `fadeSlideIn 0.5s ease-out ${0.1 + index * 0.05}s backwards` : 'none' }}
                  >
                    {/* Active Indicator Dot */}
                    {isActive(item.href) && (
                      <span className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-red-500 shadow-lg shadow-red-500/50" />
                    )}
                    {item.label}
                  </Link>
                ))}
              </div>

              {/* Separator */}
              <div className="mx-5 h-8 w-px bg-gradient-to-b from-transparent via-zinc-700/50 to-transparent" />

              {/* Exchange Toggle */}
              <div
                className="flex items-center"
                style={{ animation: mounted ? 'fadeSlideIn 0.5s ease-out 0.5s backwards' : 'none' }}
              >
                <ExchangeToggle
                  exchange={exchange}
                  onExchangeChange={onExchangeChange}
                />
              </div>

              {/* Theme Toggle */}
              <div className="ml-2">
                <ThemeToggle />
              </div>
            </nav>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden relative w-10 h-10 flex items-center justify-center rounded-xl bg-zinc-800/50 border border-zinc-700/50 transition-all duration-300 hover:bg-zinc-700/50"
              aria-label="Toggle menu"
            >
              <div className="flex flex-col items-center justify-center w-5 h-4 gap-1">
                <span className={`block w-5 h-0.5 bg-white rounded-full transition-all duration-300 ${mobileMenuOpen ? 'rotate-45 translate-y-1.5' : ''}`} />
                <span className={`block w-5 h-0.5 bg-white rounded-full transition-all duration-300 ${mobileMenuOpen ? 'opacity-0' : ''}`} />
                <span className={`block w-5 h-0.5 bg-white rounded-full transition-all duration-300 ${mobileMenuOpen ? '-rotate-45 -translate-y-1.5' : ''}`} />
              </div>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div className={`lg:hidden absolute top-full left-0 right-0 bg-zinc-900/98 backdrop-blur-xl border-b border-zinc-800/50 transition-all duration-300 ${mobileMenuOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-4'
          }`}>
          <div className="max-w-[1800px] mx-auto px-4 py-4">
            {/* Mobile Exchange Toggle */}
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-zinc-800/50">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Exchange</span>
              <ExchangeToggle
                exchange={exchange}
                onExchangeChange={onExchangeChange}
              />
            </div>

            {/* Mobile Navigation Grid */}
            <div className="grid grid-cols-2 gap-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`relative px-4 py-3.5 rounded-xl text-sm font-semibold tracking-wide text-center transition-all duration-300 ${isActive(item.href)
                    ? 'text-white bg-gradient-to-r from-red-600/20 to-red-700/10 border border-red-500/20'
                    : 'text-zinc-400 bg-zinc-800/30 border border-zinc-800/50 hover:text-white hover:bg-zinc-800/50'
                    }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>

            {/* Mobile Market Status */}
            <div className="mt-4 pt-4 border-t border-zinc-800/50 flex items-center justify-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${marketStatus === 'open' ? 'bg-emerald-400' : 'bg-amber-400'} opacity-75`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${marketStatus === 'open' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
              </span>
              <span className={`text-xs font-medium uppercase tracking-wider ${marketStatus === 'open' ? 'text-emerald-400' : 'text-amber-400'}`}>
                {marketStatus === 'open' ? 'Market Open' : 'Market Closed'}
              </span>
              <span className="text-zinc-600 mx-2">•</span>
              <span className="text-xs font-mono font-bold text-zinc-400 tabular-nums">{currentTime} IST</span>
            </div>
          </div>
        </div>

        {/* Bottom Glow */}
        <div className="absolute -bottom-px left-0 right-0 h-px bg-gradient-to-r from-transparent via-red-500/20 to-transparent" />
      </div>

      {/* Keyframe Animations */}
      <style jsx>{`
        @keyframes fadeSlideIn {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </header>
  );
}