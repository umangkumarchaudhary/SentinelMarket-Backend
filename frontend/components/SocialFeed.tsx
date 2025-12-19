'use client';

interface Mention {
  id: string;
  text: string;
  created_at: string;
  username?: string;
  likes?: number;
  retweets?: number;
  is_pump_signal?: boolean;
  channel?: string; // Telegram channel name
  has_media?: boolean; // Telegram media indicator
  views?: number; // Telegram views
}

interface SocialFeedProps {
  mentions: Mention[];
  platform: 'twitter' | 'telegram';
}

export default function SocialFeed({ mentions, platform }: SocialFeedProps) {
  if (!mentions || mentions.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">
          {platform === 'twitter' ? 'Twitter' : 'Telegram'} Feed
        </h3>
        <p className="text-gray-500 text-sm">No recent mentions</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">
        {platform === 'twitter' ? 'Twitter' : 'Telegram'} Feed
      </h3>
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {mentions.slice(0, 10).map((mention) => (
          <div
            key={mention.id}
            className={`p-4 rounded-lg border ${
              mention.is_pump_signal
                ? 'bg-red-50 border-red-200'
                : 'bg-gray-50 border-gray-200'
            }`}
          >
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-gray-700">
                  {platform === 'telegram' && mention.channel 
                    ? `@${mention.channel}` 
                    : mention.username || 'Anonymous'}
                </span>
                {mention.is_pump_signal && (
                  <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded font-semibold">
                    ⚠️ Pump Signal
                  </span>
                )}
                {platform === 'telegram' && mention.has_media && (
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    📷 Media
                  </span>
                )}
              </div>
              <div className="text-right">
                <span className="text-xs text-gray-500 block">
                  {new Date(mention.created_at).toLocaleDateString()}
                </span>
                {platform === 'telegram' && mention.views !== undefined && (
                  <span className="text-xs text-gray-400">
                    👁️ {mention.views}
                  </span>
                )}
              </div>
            </div>
            <p className="text-sm text-gray-800 mb-2">{mention.text}</p>
            {platform === 'twitter' && (
              <div className="flex gap-4 text-xs text-gray-500">
                {mention.likes !== undefined && (
                  <span>❤️ {mention.likes}</span>
                )}
                {mention.retweets !== undefined && (
                  <span>🔄 {mention.retweets}</span>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

