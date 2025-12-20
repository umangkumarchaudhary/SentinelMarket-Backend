'use client';

const steps = [
    {
        number: '01',
        title: 'Collect',
        description: 'Real-time market data from NSE & BSE via yfinance API',
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
        ),
        color: 'from-blue-500 to-cyan-500',
    },
    {
        number: '02',
        title: 'Analyze',
        description: 'ML models detect unusual patterns using Isolation Forest',
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
        ),
        color: 'from-violet-500 to-purple-500',
    },
    {
        number: '03',
        title: 'Alert',
        description: 'Instant notifications for suspicious trading activity',
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
        ),
        color: 'from-amber-500 to-orange-500',
    },
    {
        number: '04',
        title: 'Protect',
        description: 'Safeguard retail investors from market manipulation',
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
        ),
        color: 'from-emerald-500 to-green-500',
    },
];

export function HowItWorks() {
    return (
        <div
            className="rounded-2xl p-6 lg:p-8 mb-6"
            style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}
        >
            {/* Header */}
            <div className="text-center mb-8">
                <h3
                    className="text-lg lg:text-xl font-bold mb-2"
                    style={{ color: 'var(--foreground)' }}
                >
                    How SentinelMarket Protects Investors
                </h3>
                <p
                    className="text-sm max-w-xl mx-auto"
                    style={{ color: 'var(--foreground-muted)' }}
                >
                    End-to-end anomaly detection pipeline for market surveillance
                </p>
            </div>

            {/* Steps */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                {steps.map((step, index) => (
                    <div key={step.number} className="relative group">
                        {/* Connector line (hidden on mobile, shown on desktop) */}
                        {index < steps.length - 1 && (
                            <div
                                className="hidden lg:block absolute top-8 left-[60%] w-[80%] h-0.5"
                                style={{ background: 'var(--border)' }}
                            >
                                <div
                                    className={`h-full bg-gradient-to-r ${step.color} opacity-30 group-hover:opacity-60 transition-opacity`}
                                    style={{ width: '50%' }}
                                />
                            </div>
                        )}

                        <div className="relative flex flex-col items-center text-center">
                            {/* Number badge */}
                            <div
                                className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white z-10"
                                style={{ background: 'var(--accent)' }}
                            >
                                {step.number}
                            </div>

                            {/* Icon container */}
                            <div
                                className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center text-white mb-3 shadow-lg transform group-hover:scale-110 transition-transform duration-300`}
                            >
                                {step.icon}
                            </div>

                            {/* Title */}
                            <h4
                                className="font-bold mb-1"
                                style={{ color: 'var(--foreground)' }}
                            >
                                {step.title}
                            </h4>

                            {/* Description */}
                            <p
                                className="text-xs leading-relaxed"
                                style={{ color: 'var(--foreground-muted)' }}
                            >
                                {step.description}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
