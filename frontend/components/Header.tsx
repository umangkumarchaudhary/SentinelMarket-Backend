'use client';

import Link from 'next/link';
import { ExchangeToggle } from './ExchangeToggle';
import { Exchange } from '@/lib/types';

interface HeaderProps {
  exchange: Exchange;
  onExchangeChange: (exchange: Exchange) => void;
}

export function Header({ exchange, onExchangeChange }: HeaderProps) {
  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold text-black">
              SentinelMarket
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex items-center gap-6">
            <Link
              href="/"
              className="text-sm font-medium text-black hover:text-red-600"
            >
              Dashboard
            </Link>
            <Link
              href="/alerts"
              className="text-sm font-medium text-black hover:text-red-600"
            >
              Alerts
            </Link>
            <Link
              href="/analytics"
              className="text-sm font-medium text-black hover:text-red-600"
            >
              Analytics
            </Link>
            <Link
              href="/social"
              className="text-sm font-medium text-black hover:text-red-600"
            >
              Social
            </Link>

            {/* Exchange Toggle */}
            <ExchangeToggle
              exchange={exchange}
              onExchangeChange={onExchangeChange}
            />
          </nav>
        </div>
      </div>
    </header>
  );
}

