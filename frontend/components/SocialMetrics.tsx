'use client';

import { SocialMediaData } from '@/lib/api';

interface SocialMetricsProps {
  data: SocialMediaData;
}

export default function SocialMetrics({ data }: SocialMetricsProps) {
  const { twitter, telegram, combined_hype_score } = data;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Social Media Metrics</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded">
          <div className="text-sm text-gray-600">Twitter Mentions</div>
          <div className="text-2xl font-bold text-blue-600">{twitter.mention_count}</div>
          <div className="text-xs text-gray-500 mt-1">
            {twitter.influencer_count} influencers
          </div>
        </div>
        
        <div className="bg-purple-50 p-4 rounded">
          <div className="text-sm text-gray-600">Telegram Signals</div>
          <div className="text-2xl font-bold text-purple-600">{telegram.pump_signal_count}</div>
          <div className="text-xs text-gray-500 mt-1">
            {telegram.mention_count} total mentions
          </div>
        </div>
        
        <div className="bg-red-50 p-4 rounded">
          <div className="text-sm text-gray-600">Combined Hype Score</div>
          <div className="text-2xl font-bold text-red-600">{combined_hype_score.toFixed(1)}</div>
          <div className="text-xs text-gray-500 mt-1">
            {combined_hype_score > 70 ? '⚠️ High' : combined_hype_score > 40 ? '⚡ Moderate' : '✓ Low'}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h4 className="font-medium mb-2">Twitter Sentiment</h4>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Positive</span>
              <span className="font-medium text-green-600">{twitter.sentiment_distribution.positive}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Negative</span>
              <span className="font-medium text-red-600">{twitter.sentiment_distribution.negative}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Neutral</span>
              <span className="font-medium text-gray-600">{twitter.sentiment_distribution.neutral}</span>
            </div>
          </div>
        </div>

        <div>
          <h4 className="font-medium mb-2">Telegram Coordination</h4>
          {telegram.coordination.is_coordinated ? (
            <div className="bg-red-50 p-3 rounded">
              <div className="text-sm font-medium text-red-800">
                ⚠️ Coordinated Activity Detected
              </div>
              <div className="text-xs text-red-600 mt-1">
                {telegram.coordination.channels_involved} channels involved
              </div>
              <div className="text-xs text-red-600">
                Score: {telegram.coordination.coordination_score}
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-600">No coordination detected</div>
          )}
        </div>
      </div>
    </div>
  );
}

