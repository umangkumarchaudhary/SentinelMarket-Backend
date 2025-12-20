'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface FeatureCard {
    id: string;
    title: string;
    subtitle: string;
    description: string;
    icon: React.ReactNode;
    color: string;
    bgGradient: string;
    link: string;
    stats: { label: string; value: string }[];
    techStack: string[];
}

const features: FeatureCard[] = [
    {
        id: 'ml',
        title: 'ML Engine',
        subtitle: 'Anomaly Detection',
        description: 'Isolation Forest algorithm trained on historical patterns to detect unusual trading activity and potential market manipulation.',
        icon: (
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
        ),
        color: 'from-violet-500 to-purple-600',
        bgGradient: 'from-violet-500/10 via-purple-500/5 to-transparent',
        link: '/analytics',
        stats: [
            { label: 'Accuracy', value: '94%' },
            { label: 'Features', value: '15+' },
        ],
        techStack: ['Scikit-learn', 'Isolation Forest', 'Python'],
    },
    {
        id: 'etl',
        title: 'Data Pipeline',
        subtitle: 'ETL + Lakehouse',
        description: 'Automated ETL pipelines extracting real-time market data, transforming with quality checks, and loading into a data lakehouse architecture.',
        icon: (
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
            </svg>
        ),
        color: 'from-emerald-500 to-teal-600',
        bgGradient: 'from-emerald-500/10 via-teal-500/5 to-transparent',
        link: '/pipelines',
        stats: [
            { label: 'Pipelines', value: '3' },
            { label: 'Data Points', value: '10K+' },
        ],
        techStack: ['Python', 'Pandas', 'PostgreSQL'],
    },
    {
        id: 'social',
        title: 'Social Analysis',
        subtitle: 'Sentiment AI',
        description: 'Real-time monitoring of Twitter and Telegram for stock mentions, pump signals, and coordinated trading activity detection.',
        icon: (
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
            </svg>
        ),
        color: 'from-sky-500 to-blue-600',
        bgGradient: 'from-sky-500/10 via-blue-500/5 to-transparent',
        link: '/social',
        stats: [
            { label: 'Sources', value: '2+' },
            { label: 'Signals', value: 'Live' },
        ],
        techStack: ['NLP', 'Transformers', 'API'],
    },
    {
        id: 'streaming',
        title: 'Stream Processing',
        subtitle: 'Real-time Events',
        description: 'Event-driven architecture with real-time stream processing for instant alerts on high-risk stocks and market anomalies.',
        icon: (
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
        ),
        color: 'from-amber-500 to-orange-600',
        bgGradient: 'from-amber-500/10 via-orange-500/5 to-transparent',
        link: '/streams',
        stats: [
            { label: 'Latency', value: '<1s' },
            { label: 'Events', value: 'Live' },
        ],
        techStack: ['Event-Driven', 'WebSocket', 'Queue'],
    },
];

// Mobile Carousel Component
function MobileCarousel({ features }: { features: FeatureCard[] }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);

    // Auto-rotate every 3 seconds
    useEffect(() => {
        if (isPaused) return;

        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % features.length);
        }, 3000);

        return () => clearInterval(interval);
    }, [features.length, isPaused]);

    const goToSlide = useCallback((index: number) => {
        setCurrentIndex(index);
        setIsPaused(true);
        // Resume auto-play after 5 seconds of inactivity
        setTimeout(() => setIsPaused(false), 5000);
    }, []);

    const feature = features[currentIndex];

    return (
        <div
            className="relative"
            onTouchStart={() => setIsPaused(true)}
            onTouchEnd={() => setTimeout(() => setIsPaused(false), 5000)}
        >
            {/* Card Container with animation */}
            <div className="relative overflow-hidden">
                <div
                    className="transition-all duration-500 ease-out"
                    style={{
                        transform: `translateX(-${currentIndex * 100}%)`,
                        display: 'flex',
                        width: `${features.length * 100}%`
                    }}
                >
                    {features.map((f, idx) => (
                        <div
                            key={f.id}
                            className="w-full flex-shrink-0 px-2"
                            style={{ width: `${100 / features.length}%` }}
                        >
                            <Link href={f.link} className="block">
                                <div
                                    className="relative rounded-2xl p-5 min-h-[220px]"
                                    style={{
                                        background: 'var(--card-bg)',
                                        border: '1px solid var(--card-border)',
                                        backdropFilter: 'blur(12px)'
                                    }}
                                >
                                    {/* Gradient overlay */}
                                    <div className={`absolute inset-0 rounded-2xl opacity-50 bg-gradient-to-br ${f.bgGradient}`} />

                                    <div className="relative">
                                        {/* Icon */}
                                        <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${f.color} text-white mb-4 shadow-lg`}>
                                            {f.icon}
                                        </div>

                                        {/* Title */}
                                        <h3 className="font-bold text-lg mb-1" style={{ color: 'var(--foreground)' }}>
                                            {f.title}
                                        </h3>
                                        <p className="text-xs font-medium uppercase tracking-wider mb-3" style={{ color: 'var(--foreground-muted)' }}>
                                            {f.subtitle}
                                        </p>

                                        {/* Stats */}
                                        <div className="flex gap-6">
                                            {f.stats.map((stat) => (
                                                <div key={stat.label}>
                                                    <p className="text-xl font-bold tabular-nums" style={{ color: 'var(--foreground)' }}>
                                                        {stat.value}
                                                    </p>
                                                    <p className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--foreground-muted)' }}>
                                                        {stat.label}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Tap to explore hint */}
                                        <p className="text-[10px] mt-3 flex items-center gap-1" style={{ color: 'var(--foreground-muted)' }}>
                                            <span>Tap to explore</span>
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </p>
                                    </div>
                                </div>
                            </Link>
                        </div>
                    ))}
                </div>
            </div>

            {/* Dots Navigation */}
            <div className="flex justify-center items-center gap-2 mt-4">
                {features.map((_, idx) => (
                    <button
                        key={idx}
                        onClick={() => goToSlide(idx)}
                        className={`transition-all duration-300 rounded-full ${idx === currentIndex
                                ? 'w-6 h-2 bg-red-500'
                                : 'w-2 h-2 bg-gray-600 hover:bg-gray-500'
                            }`}
                        aria-label={`Go to slide ${idx + 1}`}
                    />
                ))}
            </div>

            {/* Progress bar */}
            <div className="mt-3 mx-auto max-w-[200px] h-1 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                <div
                    className="h-full bg-gradient-to-r from-red-500 to-red-600 transition-all duration-300"
                    style={{
                        width: `${((currentIndex + 1) / features.length) * 100}%`,
                    }}
                />
            </div>
        </div>
    );
}

// Desktop Card Component
function DesktopCard({ feature, isExpanded, onClick }: { feature: FeatureCard; isExpanded: boolean; onClick: () => void }) {
    return (
        <div
            className={`group relative rounded-2xl p-5 transition-all duration-500 cursor-pointer ${isExpanded ? 'sm:col-span-2 lg:col-span-2' : ''}`}
            style={{
                background: 'var(--card-bg)',
                border: '1px solid var(--card-border)',
                backdropFilter: 'blur(12px)'
            }}
            onClick={onClick}
        >
            {/* Gradient overlay on hover */}
            <div className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br ${feature.bgGradient}`} />

            <div className="relative">
                {/* Icon */}
                <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${feature.color} text-white mb-4 shadow-lg`}>
                    {feature.icon}
                </div>

                {/* Title */}
                <h3 className="font-bold text-lg mb-1" style={{ color: 'var(--foreground)' }}>
                    {feature.title}
                </h3>
                <p className="text-xs font-medium uppercase tracking-wider mb-3" style={{ color: 'var(--foreground-muted)' }}>
                    {feature.subtitle}
                </p>

                {/* Stats */}
                <div className="flex gap-4 mb-3">
                    {feature.stats.map((stat) => (
                        <div key={stat.label}>
                            <p className="text-lg font-bold tabular-nums" style={{ color: 'var(--foreground)' }}>
                                {stat.value}
                            </p>
                            <p className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--foreground-muted)' }}>
                                {stat.label}
                            </p>
                        </div>
                    ))}
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                    <div className="animate-fade-in mt-4 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
                        <p className="text-sm mb-4" style={{ color: 'var(--foreground-secondary)' }}>
                            {feature.description}
                        </p>

                        {/* Tech Stack */}
                        <div className="flex flex-wrap gap-2 mb-4">
                            {feature.techStack.map((tech) => (
                                <span
                                    key={tech}
                                    className="px-2 py-1 rounded-md text-xs font-medium"
                                    style={{ background: 'var(--background-tertiary)', color: 'var(--foreground-secondary)' }}
                                >
                                    {tech}
                                </span>
                            ))}
                        </div>

                        <Link
                            href={feature.link}
                            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-gradient-to-r ${feature.color} transition-transform hover:scale-105`}
                            onClick={(e) => e.stopPropagation()}
                        >
                            Explore
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </Link>
                    </div>
                )}

                {/* Click hint */}
                {!isExpanded && (
                    <p
                        className="text-[10px] mt-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ color: 'var(--foreground-muted)' }}
                    >
                        Click to expand →
                    </p>
                )}
            </div>
        </div>
    );
}

export function TechShowcase() {
    const [expandedCard, setExpandedCard] = useState<string | null>(null);
    const [isMobile, setIsMobile] = useState(false);

    // Detect mobile on mount and resize
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 640);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    return (
        <div className="relative overflow-hidden rounded-3xl mb-8">
            {/* Background */}
            <div
                className="absolute inset-0"
                style={{
                    background: 'linear-gradient(135deg, var(--background-secondary) 0%, var(--background) 100%)',
                    border: '1px solid var(--border)'
                }}
            />

            {/* Decorative grid */}
            <div
                className="absolute inset-0 opacity-30"
                style={{
                    backgroundImage: 'radial-gradient(circle at 1px 1px, var(--border-subtle) 1px, transparent 0)',
                    backgroundSize: '24px 24px'
                }}
            />

            <div className="relative p-6 lg:p-8">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider mb-4"
                        style={{ background: 'var(--accent)', color: 'white' }}
                    >
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                        </span>
                        Production-Ready Platform
                    </div>

                    <h2
                        className="text-2xl lg:text-3xl font-bold tracking-tight mb-2"
                        style={{ color: 'var(--foreground)' }}
                    >
                        Full-Stack Data Engineering & ML
                    </h2>
                    <p
                        className="max-w-2xl mx-auto text-sm lg:text-base"
                        style={{ color: 'var(--foreground-muted)' }}
                    >
                        An end-to-end platform for stock market anomaly detection, featuring real-time data pipelines,
                        machine learning, and social media sentiment analysis.
                    </p>
                </div>

                {/* Mobile: Carousel | Desktop: Grid */}
                {isMobile ? (
                    <MobileCarousel features={features} />
                ) : (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {features.map((feature) => (
                            <DesktopCard
                                key={feature.id}
                                feature={feature}
                                isExpanded={expandedCard === feature.id}
                                onClick={() => setExpandedCard(expandedCard === feature.id ? null : feature.id)}
                            />
                        ))}
                    </div>
                )}

                {/* Bottom CTA */}
                <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                    <a
                        href="https://github.com/umangkumarchaudhary"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:scale-105"
                        style={{ background: 'var(--background-tertiary)', color: 'var(--foreground)', border: '1px solid var(--border)' }}
                    >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                        </svg>
                        View on GitHub
                    </a>

                    <span className="text-xs" style={{ color: 'var(--foreground-muted)' }}>
                        Built by <span className="font-semibold" style={{ color: 'var(--foreground)' }}>Umang Kumar Chaudhary</span>
                    </span>
                </div>
            </div>
        </div>
    );
}

