'use client';

import { useState } from 'react';
import { Header } from '@/components/Header';
import { Exchange } from '@/lib/types';

export default function AboutPage() {
    const [exchange, setExchange] = useState<Exchange>('nse');
    const [activeSection, setActiveSection] = useState<string>('overview');

    const sections = [
        { id: 'overview', label: 'Overview', icon: '🎯' },
        { id: 'stack', label: 'Tech Stack', icon: '🛠️' },
        { id: 'data-eng', label: 'Data Engineering', icon: '📊' },
        { id: 'social', label: 'Social Intelligence', icon: '📡' },
        { id: 'risk', label: 'Risk Detection', icon: '🚨' },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
            <Header exchange={exchange} onExchangeChange={setExchange} />

            <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
                {/* Hero Section */}
                <div className="text-center mb-12">
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-red-400 via-orange-400 to-amber-400 bg-clip-text text-transparent mb-4">
                        Architecture & Methodology
                    </h1>
                    <p className="text-lg text-slate-400 max-w-2xl mx-auto">
                        A deep dive into how SentinelMarket detects market manipulation risk using real-time data engineering, social intelligence, and machine learning.
                    </p>
                </div>

                {/* Section Navigation */}
                <div className="flex flex-wrap justify-center gap-2 mb-10">
                    {sections.map((section) => (
                        <button
                            key={section.id}
                            onClick={() => setActiveSection(section.id)}
                            className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${activeSection === section.id
                                    ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-lg shadow-red-500/25'
                                    : 'bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-700/50 border border-slate-700/50'
                                }`}
                        >
                            <span className="mr-1.5">{section.icon}</span>
                            {section.label}
                        </button>
                    ))}
                </div>

                {/* Content Sections */}
                <div className="space-y-8">
                    {/* Overview */}
                    {activeSection === 'overview' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <div className="rounded-2xl bg-gradient-to-br from-slate-800/60 to-slate-900/60 border border-slate-700/50 p-8">
                                <h2 className="text-2xl font-bold text-white mb-4">What is SentinelMarket?</h2>
                                <p className="text-slate-300 leading-relaxed mb-6">
                                    SentinelMarket is an <span className="text-red-400 font-semibold">AI-powered market surveillance platform</span> that monitors NSE/BSE stocks for potential pump-and-dump schemes and coordinated manipulation. It combines real-time price data, social media signals, and machine learning to provide early warning alerts.
                                </p>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="p-4 rounded-xl bg-slate-700/30 border border-slate-600/30">
                                        <div className="text-3xl mb-2">📈</div>
                                        <h3 className="font-semibold text-white mb-1">Real-Time Data</h3>
                                        <p className="text-sm text-slate-400">Live market data via Yahoo Finance API with 5-minute refresh cycles</p>
                                    </div>
                                    <div className="p-4 rounded-xl bg-slate-700/30 border border-slate-600/30">
                                        <div className="text-3xl mb-2">💬</div>
                                        <h3 className="font-semibold text-white mb-1">Social Monitoring</h3>
                                        <p className="text-sm text-slate-400">Telegram pump channels monitored in real-time via Telethon</p>
                                    </div>
                                    <div className="p-4 rounded-xl bg-slate-700/30 border border-slate-600/30">
                                        <div className="text-3xl mb-2">🤖</div>
                                        <h3 className="font-semibold text-white mb-1">ML Detection</h3>
                                        <p className="text-sm text-slate-400">FinBERT NLP for sentiment + anomaly detection algorithms</p>
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-2xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 p-6">
                                <h3 className="text-lg font-semibold text-white mb-3">Who Benefits?</h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                    <div className="p-3 rounded-lg bg-slate-800/50">
                                        <div className="font-medium text-white">Risk Managers</div>
                                        <div className="text-slate-500">Early warning alerts</div>
                                    </div>
                                    <div className="p-3 rounded-lg bg-slate-800/50">
                                        <div className="font-medium text-white">Traders</div>
                                        <div className="text-slate-500">Avoid manipulated stocks</div>
                                    </div>
                                    <div className="p-3 rounded-lg bg-slate-800/50">
                                        <div className="font-medium text-white">Compliance</div>
                                        <div className="text-slate-500">Audit trails & logs</div>
                                    </div>
                                    <div className="p-3 rounded-lg bg-slate-800/50">
                                        <div className="font-medium text-white">Analysts</div>
                                        <div className="text-slate-500">Social-price correlation</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tech Stack */}
                    {activeSection === 'stack' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <div className="rounded-2xl bg-gradient-to-br from-slate-800/60 to-slate-900/60 border border-slate-700/50 p-8">
                                <h2 className="text-2xl font-bold text-white mb-6">Technology Stack</h2>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Backend */}
                                    <div className="p-5 rounded-xl bg-cyan-500/10 border border-cyan-500/30">
                                        <h3 className="text-lg font-semibold text-cyan-400 mb-4">Backend</h3>
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-3">
                                                <span className="px-2 py-1 rounded bg-cyan-500/20 text-cyan-400 text-xs font-medium">Python 3.11</span>
                                                <span className="text-sm text-slate-400">Core language</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="px-2 py-1 rounded bg-cyan-500/20 text-cyan-400 text-xs font-medium">FastAPI</span>
                                                <span className="text-sm text-slate-400">REST API framework</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="px-2 py-1 rounded bg-cyan-500/20 text-cyan-400 text-xs font-medium">APScheduler</span>
                                                <span className="text-sm text-slate-400">Pipeline scheduling</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="px-2 py-1 rounded bg-cyan-500/20 text-cyan-400 text-xs font-medium">Pandas</span>
                                                <span className="text-sm text-slate-400">Data processing</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="px-2 py-1 rounded bg-cyan-500/20 text-cyan-400 text-xs font-medium">SQLite</span>
                                                <span className="text-sm text-slate-400">Data warehouse</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Frontend */}
                                    <div className="p-5 rounded-xl bg-purple-500/10 border border-purple-500/30">
                                        <h3 className="text-lg font-semibold text-purple-400 mb-4">Frontend</h3>
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-3">
                                                <span className="px-2 py-1 rounded bg-purple-500/20 text-purple-400 text-xs font-medium">Next.js 14</span>
                                                <span className="text-sm text-slate-400">React framework</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="px-2 py-1 rounded bg-purple-500/20 text-purple-400 text-xs font-medium">TypeScript</span>
                                                <span className="text-sm text-slate-400">Type safety</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="px-2 py-1 rounded bg-purple-500/20 text-purple-400 text-xs font-medium">Tailwind CSS</span>
                                                <span className="text-sm text-slate-400">Styling</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Data Sources */}
                                    <div className="p-5 rounded-xl bg-green-500/10 border border-green-500/30">
                                        <h3 className="text-lg font-semibold text-green-400 mb-4">Data Sources</h3>
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-3">
                                                <span className="px-2 py-1 rounded bg-green-500/20 text-green-400 text-xs font-medium">yfinance</span>
                                                <span className="text-sm text-slate-400">Stock price data</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="px-2 py-1 rounded bg-green-500/20 text-green-400 text-xs font-medium">Telethon</span>
                                                <span className="text-sm text-slate-400">Telegram API</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="px-2 py-1 rounded bg-amber-500/20 text-amber-400 text-xs font-medium">Tweepy</span>
                                                <span className="text-sm text-slate-400">Twitter API (Demo)</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* ML/AI */}
                                    <div className="p-5 rounded-xl bg-red-500/10 border border-red-500/30">
                                        <h3 className="text-lg font-semibold text-red-400 mb-4">ML/AI</h3>
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-3">
                                                <span className="px-2 py-1 rounded bg-red-500/20 text-red-400 text-xs font-medium">FinBERT</span>
                                                <span className="text-sm text-slate-400">Financial sentiment</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="px-2 py-1 rounded bg-red-500/20 text-red-400 text-xs font-medium">PyTorch</span>
                                                <span className="text-sm text-slate-400">Model inference</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="px-2 py-1 rounded bg-red-500/20 text-red-400 text-xs font-medium">Transformers</span>
                                                <span className="text-sm text-slate-400">Hugging Face</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Data Engineering */}
                    {activeSection === 'data-eng' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            {/* ETL Architecture */}
                            <div className="rounded-2xl bg-gradient-to-br from-slate-800/60 to-slate-900/60 border border-slate-700/50 p-8">
                                <h2 className="text-2xl font-bold text-white mb-6">ETL Pipeline Architecture</h2>

                                <div className="p-6 rounded-xl bg-slate-700/30 border border-slate-600/30 mb-6">
                                    <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-center">
                                        <div className="flex-1 p-4 rounded-lg bg-cyan-500/20 border border-cyan-500/40">
                                            <div className="text-cyan-400 font-bold text-lg">EXTRACT</div>
                                            <div className="text-sm text-slate-400 mt-1">Yahoo Finance API</div>
                                            <div className="text-sm text-slate-400">Telegram/Twitter</div>
                                        </div>
                                        <div className="text-cyan-400 text-2xl hidden md:block">→</div>
                                        <div className="flex-1 p-4 rounded-lg bg-blue-500/20 border border-blue-500/40">
                                            <div className="text-blue-400 font-bold text-lg">TRANSFORM</div>
                                            <div className="text-sm text-slate-400 mt-1">Pandas Processing</div>
                                            <div className="text-sm text-slate-400">Data Validation</div>
                                        </div>
                                        <div className="text-blue-400 text-2xl hidden md:block">→</div>
                                        <div className="flex-1 p-4 rounded-lg bg-purple-500/20 border border-purple-500/40">
                                            <div className="text-purple-400 font-bold text-lg">LOAD</div>
                                            <div className="text-sm text-slate-400 mt-1">SQLite Warehouse</div>
                                            <div className="text-sm text-slate-400">Data Lake</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/30">
                                        <h3 className="font-semibold text-white mb-2">📈 Stock Data Pipeline</h3>
                                        <ul className="text-sm text-slate-400 space-y-1">
                                            <li>• Runs every <span className="text-cyan-400">5 minutes</span></li>
                                            <li>• Extracts OHLCV data from Yahoo Finance</li>
                                            <li>• Validates price/volume ranges</li>
                                            <li>• Stores raw + processed data</li>
                                        </ul>
                                    </div>
                                    <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/30">
                                        <h3 className="font-semibold text-white mb-2">💬 Social Media Pipeline</h3>
                                        <ul className="text-sm text-slate-400 space-y-1">
                                            <li>• Runs every <span className="text-purple-400">10 minutes</span></li>
                                            <li>• Monitors Telegram pump channels</li>
                                            <li>• FinBERT sentiment analysis</li>
                                            <li>• Detects coordination patterns</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            {/* Data Quality */}
                            <div className="rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 p-8">
                                <h2 className="text-2xl font-bold text-white mb-6">Data Quality Measurement</h2>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="p-4 rounded-xl bg-slate-800/50">
                                        <h3 className="font-semibold text-emerald-400 mb-2">📋 Completeness</h3>
                                        <p className="text-sm text-slate-400 mb-2">% of required fields that are non-null</p>
                                        <code className="text-xs text-emerald-400 bg-slate-900/50 px-2 py-1 rounded">= (filled_fields / total_required) × 100</code>
                                    </div>
                                    <div className="p-4 rounded-xl bg-slate-800/50">
                                        <h3 className="font-semibold text-teal-400 mb-2">✅ Validity Ratio</h3>
                                        <p className="text-sm text-slate-400 mb-2">% of records passing all validation rules</p>
                                        <code className="text-xs text-teal-400 bg-slate-900/50 px-2 py-1 rounded">= (valid_records / total_records) × 100</code>
                                    </div>
                                </div>

                                <div className="mt-6 p-4 rounded-xl bg-slate-800/30 border border-slate-700/30">
                                    <h4 className="text-sm font-semibold text-slate-300 mb-2">Validation Rules Applied:</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-400">
                                        <div>
                                            <div className="font-medium text-cyan-400 mb-1">Stock Data:</div>
                                            <div>• Price &gt; 0 and &lt; 1,000,000</div>
                                            <div>• Volume &gt;= 0</div>
                                            <div>• Valid ISO timestamp</div>
                                        </div>
                                        <div>
                                            <div className="font-medium text-purple-400 mb-1">Social Data:</div>
                                            <div>• Text length: 5-10,000 chars</div>
                                            <div>• Platform in [twitter, telegram]</div>
                                            <div>• Valid ticker symbol</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Event Streaming */}
                            <div className="rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 p-8">
                                <h2 className="text-2xl font-bold text-white mb-6">Event Streaming Architecture</h2>

                                <div className="p-6 rounded-xl bg-slate-700/30 border border-slate-600/30 mb-6">
                                    <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-center">
                                        <div className="flex-1 p-3 rounded-lg bg-cyan-500/20 border border-cyan-500/40">
                                            <div className="text-cyan-400 font-bold">PRODUCER</div>
                                            <div className="text-xs text-slate-400 mt-1">Pipeline Runs</div>
                                        </div>
                                        <div className="text-amber-400 text-xl hidden md:block">→</div>
                                        <div className="flex-1 p-3 rounded-lg bg-amber-500/20 border border-amber-500/40">
                                            <div className="text-amber-400 font-bold">TOPICS</div>
                                            <div className="text-xs text-slate-400 mt-1">Event Channels</div>
                                        </div>
                                        <div className="text-orange-400 text-xl hidden md:block">→</div>
                                        <div className="flex-1 p-3 rounded-lg bg-orange-500/20 border border-orange-500/40">
                                            <div className="text-orange-400 font-bold">SUBSCRIBERS</div>
                                            <div className="text-xs text-slate-400 mt-1">Dashboard/Alerts</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                    <div className="p-3 rounded-lg bg-slate-800/50">
                                        <div className="font-medium text-white">Pattern</div>
                                        <div className="text-slate-500">Publish/Subscribe</div>
                                    </div>
                                    <div className="p-3 rounded-lg bg-slate-800/50">
                                        <div className="font-medium text-white">Buffer</div>
                                        <div className="text-slate-500">In-memory ring (1000 events)</div>
                                    </div>
                                    <div className="p-3 rounded-lg bg-slate-800/50">
                                        <div className="font-medium text-white">Polling</div>
                                        <div className="text-slate-500">HTTP long-polling (5s)</div>
                                    </div>
                                </div>
                            </div>

                            {/* Data Lake */}
                            <div className="rounded-2xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-500/20 p-8">
                                <h2 className="text-2xl font-bold text-white mb-6">Data Lake Storage</h2>

                                <div className="p-4 rounded-xl bg-slate-800/50 font-mono text-sm mb-6">
                                    <div className="text-blue-400">data_lake/</div>
                                    <div className="pl-4 text-indigo-400">├── yahoo_finance/</div>
                                    <div className="pl-8 text-violet-400">│   └── 2024/12/20/timestamp.json.gz</div>
                                    <div className="pl-4 text-indigo-400">├── telegram/</div>
                                    <div className="pl-8 text-violet-400">│   └── 2024/12/20/timestamp.json.gz</div>
                                    <div className="pl-4 text-indigo-400">└── twitter/</div>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                    <div className="p-3 rounded-lg bg-slate-800/50 text-center">
                                        <div className="text-green-400">✓</div>
                                        <div className="text-slate-400">Gzip Compressed</div>
                                    </div>
                                    <div className="p-3 rounded-lg bg-slate-800/50 text-center">
                                        <div className="text-green-400">✓</div>
                                        <div className="text-slate-400">Date Partitioned</div>
                                    </div>
                                    <div className="p-3 rounded-lg bg-slate-800/50 text-center">
                                        <div className="text-green-400">✓</div>
                                        <div className="text-slate-400">Immutable</div>
                                    </div>
                                    <div className="p-3 rounded-lg bg-slate-800/50 text-center">
                                        <div className="text-green-400">✓</div>
                                        <div className="text-slate-400">Audit Trail</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Social Intelligence */}
                    {activeSection === 'social' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <div className="rounded-2xl bg-gradient-to-br from-slate-800/60 to-slate-900/60 border border-slate-700/50 p-8">
                                <h2 className="text-2xl font-bold text-white mb-6">Social Intelligence Sources</h2>

                                <div className="space-y-4">
                                    {/* Telegram - LIVE */}
                                    <div className="p-5 rounded-xl bg-green-500/10 border border-green-500/30">
                                        <div className="flex items-center gap-3 mb-3">
                                            <span className="text-2xl">💬</span>
                                            <span className="font-semibold text-white text-lg">Telegram</span>
                                            <span className="px-2 py-0.5 rounded-full bg-green-500/30 text-green-400 text-xs font-semibold animate-pulse">LIVE</span>
                                        </div>
                                        <p className="text-slate-400 mb-3">Real-time monitoring via Telethon API. Connected to pump channels:</p>
                                        <div className="space-y-1 text-sm font-mono text-slate-500">
                                            <div>• Stock_Gainerss_o</div>
                                            <div>• hindustan_om_unique_traders</div>
                                        </div>
                                        <p className="text-xs text-green-400 mt-3">✅ Fetching live data from Telegram account</p>
                                    </div>

                                    {/* Twitter - Demo */}
                                    <div className="p-5 rounded-xl bg-blue-500/10 border border-blue-500/30">
                                        <div className="flex items-center gap-3 mb-3">
                                            <span className="text-2xl">🐦</span>
                                            <span className="font-semibold text-white text-lg">Twitter / X</span>
                                            <span className="px-2 py-0.5 rounded-full bg-amber-500/30 text-amber-400 text-xs font-semibold">DEMO</span>
                                        </div>
                                        <p className="text-slate-400 mb-3">Sentiment analysis via Tweepy + FinBERT NLP model. Tracks:</p>
                                        <ul className="text-sm text-slate-500 space-y-1">
                                            <li>• Stock mentions & cashtags ($RELIANCE)</li>
                                            <li>• Engagement metrics (likes, retweets)</li>
                                            <li>• Influencer activity detection</li>
                                        </ul>
                                        <p className="text-xs text-amber-400 mt-3">⚙️ Connect Twitter API for live data</p>
                                    </div>

                                    {/* News - Coming Soon */}
                                    <div className="p-5 rounded-xl bg-slate-500/10 border border-slate-600/30 opacity-60">
                                        <div className="flex items-center gap-3 mb-3">
                                            <span className="text-2xl">📰</span>
                                            <span className="font-semibold text-white text-lg">News Channels</span>
                                            <span className="px-2 py-0.5 rounded-full bg-slate-500/30 text-slate-400 text-xs font-semibold">COMING SOON</span>
                                        </div>
                                        <p className="text-slate-400">Financial news from Economic Times, MoneyControl, Reuters.</p>
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-2xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 p-8">
                                <h2 className="text-2xl font-bold text-white mb-6">Hype Score Calculation</h2>

                                <div className="p-4 rounded-xl bg-slate-800/50 font-mono text-sm text-purple-400 mb-6">
                                    Hype Score = (Twitter × 30%) + (Telegram × 40%) + (Sentiment × 30%)
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="p-4 rounded-xl bg-slate-800/30">
                                        <div className="w-4 h-4 rounded-full bg-blue-400 mb-2"></div>
                                        <h4 className="font-medium text-white">Twitter (30%)</h4>
                                        <p className="text-xs text-slate-500">Mentions, engagement, influencer reach</p>
                                    </div>
                                    <div className="p-4 rounded-xl bg-slate-800/30">
                                        <div className="w-4 h-4 rounded-full bg-green-400 mb-2"></div>
                                        <h4 className="font-medium text-white">Telegram (40%)</h4>
                                        <p className="text-xs text-slate-500">Pump signals, channel mentions, coordination</p>
                                    </div>
                                    <div className="p-4 rounded-xl bg-slate-800/30">
                                        <div className="w-4 h-4 rounded-full bg-purple-400 mb-2"></div>
                                        <h4 className="font-medium text-white">Sentiment (30%)</h4>
                                        <p className="text-xs text-slate-500">NLP bullish/bearish classification</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Risk Detection */}
                    {activeSection === 'risk' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <div className="rounded-2xl bg-gradient-to-br from-slate-800/60 to-slate-900/60 border border-slate-700/50 p-8">
                                <h2 className="text-2xl font-bold text-white mb-6">Risk Detection Methodology</h2>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                    <div className="p-5 rounded-xl bg-slate-700/30">
                                        <h3 className="text-lg font-semibold text-white mb-3">📊 Data Source</h3>
                                        <p className="text-slate-400 text-sm">
                                            Historical price & volume data fetched via <span className="text-blue-400">Yahoo Finance API</span> for NSE/BSE stocks.
                                        </p>
                                    </div>
                                    <div className="p-5 rounded-xl bg-slate-700/30">
                                        <h3 className="text-lg font-semibold text-white mb-3">🧮 Risk Scoring</h3>
                                        <p className="text-slate-400 text-sm">
                                            Combined score from: <span className="text-orange-400">Volume Spikes</span>, <span className="text-yellow-400">Price Anomalies</span>, <span className="text-purple-400">ML Detection</span>, <span className="text-sky-400">Social Signals</span>
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="p-5 rounded-xl bg-red-500/10 border border-red-500/30">
                                        <h3 className="text-lg font-semibold text-white mb-3">📈 Volume Analysis</h3>
                                        <p className="text-slate-400 text-sm">
                                            Detects unusual volume spikes using z-scores against 20-day rolling average. Spikes &gt;200% trigger alerts.
                                        </p>
                                    </div>
                                    <div className="p-5 rounded-xl bg-orange-500/10 border border-orange-500/30">
                                        <h3 className="text-lg font-semibold text-white mb-3">🚨 Alert Threshold</h3>
                                        <p className="text-slate-400 text-sm">
                                            Stocks with <span className="text-red-400 font-semibold">risk score ≥ 60</span> are flagged.
                                        </p>
                                        <div className="mt-2 text-xs text-slate-500">
                                            <div>• 60-80 = HIGH risk</div>
                                            <div>• 80+ = EXTREME risk</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-2xl bg-gradient-to-br from-red-500/10 to-orange-500/10 border border-red-500/20 p-8">
                                <h2 className="text-2xl font-bold text-white mb-4">Risk Levels</h2>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30 text-center">
                                        <div className="text-2xl font-bold text-green-400">LOW</div>
                                        <div className="text-sm text-slate-400">0-40</div>
                                    </div>
                                    <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-center">
                                        <div className="text-2xl font-bold text-yellow-400">MEDIUM</div>
                                        <div className="text-sm text-slate-400">40-60</div>
                                    </div>
                                    <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/30 text-center">
                                        <div className="text-2xl font-bold text-orange-400">HIGH</div>
                                        <div className="text-sm text-slate-400">60-80</div>
                                    </div>
                                    <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-center">
                                        <div className="text-2xl font-bold text-red-400">EXTREME</div>
                                        <div className="text-sm text-slate-400">80+</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="mt-12 text-center text-sm text-slate-500">
                    <p>Built with ❤️ for detecting market manipulation</p>
                    <p className="mt-1">SentinelMarket © 2024</p>
                </div>
            </main>
        </div>
    );
}
