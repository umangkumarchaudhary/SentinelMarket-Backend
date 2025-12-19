'use client';

import { useEffect, useState } from 'react';
import { getPipelineStreamEvents, type PipelineStreamEvent } from '@/lib/api_data_engineering';

export default function StreamsPage() {
  const [events, setEvents] = useState<PipelineStreamEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadEvents = async () => {
    setError(null);
    try {
      const data = await getPipelineStreamEvents(50);
      setEvents(data.events || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load stream events');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
    const interval = setInterval(loadEvents, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Real-time Pipeline Stream</h1>
          <p className="mt-2 text-gray-600">
            In-memory stream of recent pipeline runs. Updated every 5 seconds.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Pipeline Runs</h2>
            {isLoading && <span className="text-xs text-gray-500">Loading…</span>}
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">Time</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">Pipeline</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">Status</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">Records Loaded</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">Duration (s)</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {events.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                      No pipeline events yet. Run a pipeline from the{' '}
                      <a href="/pipelines" className="underline font-semibold">
                        Pipelines
                      </a>{' '}
                      page.
                    </td>
                  </tr>
                ) : (
                  events.map((event, idx) => (
                    <tr key={`${event.timestamp}-${idx}`}>
                      <td className="px-4 py-2 whitespace-nowrap text-gray-700">
                        {new Date(event.timestamp).toLocaleString()}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap font-medium text-gray-900">
                        {event.payload.pipeline}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            event.payload.success
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {event.payload.success ? 'SUCCESS' : 'FAILED'}
                        </span>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-gray-700">
                        {event.payload.records_loaded.toLocaleString()}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-gray-700">
                        {event.payload.duration_seconds.toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}


