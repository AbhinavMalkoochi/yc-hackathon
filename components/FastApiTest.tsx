"use client";

import { useState } from 'react';
import { getMessage, checkHealth, type MessageResponse, type HealthResponse } from '../lib/api';

export default function FastApiTest() {
    const [message, setMessage] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>('');
    const [health, setHealth] = useState<HealthResponse | null>(null);

    const handleGetMessage = async () => {
        setLoading(true);
        setError('');
        setMessage('');

        try {
            const response: MessageResponse = await getMessage();
            setMessage(response.message);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleHealthCheck = async () => {
        setLoading(true);
        setError('');

        try {
            const response: HealthResponse = await checkHealth();
            setHealth(response);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-slate-100 dark:bg-slate-900 p-6 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-700">
            <h2 className="text-xl font-bold mb-4">FastAPI Connection Test</h2>

            <div className="flex flex-col gap-4">
                <div className="flex gap-2">
                    <button
                        onClick={handleGetMessage}
                        disabled={loading}
                        className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-4 py-2 rounded-md transition-colors"
                    >
                        {loading ? 'Loading...' : 'Get Message'}
                    </button>

                    <button
                        onClick={handleHealthCheck}
                        disabled={loading}
                        className="bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white px-4 py-2 rounded-md transition-colors"
                    >
                        {loading ? 'Loading...' : 'Health Check'}
                    </button>
                </div>

                {error && (
                    <div className="bg-red-100 dark:bg-red-900 border border-red-400 text-red-700 dark:text-red-300 px-4 py-3 rounded">
                        <strong>Error:</strong> {error}
                    </div>
                )}

                {message && (
                    <div className="bg-green-100 dark:bg-green-900 border border-green-400 text-green-700 dark:text-green-300 px-4 py-3 rounded">
                        <strong>Message:</strong> {message}
                    </div>
                )}

                {health && (
                    <div className="bg-blue-100 dark:bg-blue-900 border border-blue-400 text-blue-700 dark:text-blue-300 px-4 py-3 rounded">
                        <strong>Health:</strong> {health.status} - {health.service}
                    </div>
                )}

                <div className="text-sm text-slate-600 dark:text-slate-400">
                    <p>This component tests the connection to the FastAPI backend running on port 8000.</p>
                    <p>Make sure the FastAPI server is running: <code className="bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded">python backend/main.py</code></p>
                </div>
            </div>
        </div>
    );
}

