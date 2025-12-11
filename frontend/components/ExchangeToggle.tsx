'use client';

import { ExchangeToggleProps } from '@/lib/types';

export function ExchangeToggle({
  exchange,
  onExchangeChange,
}: ExchangeToggleProps) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white p-1">
      <button
        onClick={() => onExchangeChange('nse')}
        className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
          exchange === 'nse'
            ? 'bg-red-600 text-white'
            : 'text-black hover:bg-gray-100'
        }`}
      >
        NSE
      </button>
      <button
        onClick={() => onExchangeChange('bse')}
        className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
          exchange === 'bse'
            ? 'bg-red-600 text-white'
            : 'text-black hover:bg-gray-100'
        }`}
      >
        BSE
      </button>
    </div>
  );
}

