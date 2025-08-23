"use client";

import { useState } from "react";
import { testEndpoint, checkHealth, type TestResponse, type HealthResponse, type ApiError } from "../../lib/api";

interface LogEntry {
    id: string;
    timestamp: string;
    level: 'info' | 'success' | 'error' | 'warning';
    message: string;
    data?: any;
}

export default function TestPage() {
    const [testResponse, setTestResponse] = useState<TestResponse | null>(null);
    const [healthResponse, setHealthResponse] = useState<HealthResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [logs, setLogs] = useState<LogEntry[]>([]);

    const addLog = (level: LogEntry['level'], message: string, data?: any) => {
        const logEntry: LogEntry = {
            id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date().toISOString(),
            level,
            message,
            data
        };
        console.log(`[${logEntry.id}] ${level.toUpperCase()}: ${message}`, data || '');
        setLogs(prev => [logEntry, ...prev]);
    };

    const handleTestEndpoint = async () => {
        setLoading(true);
        addLog('info', 'Starting Task 1.1 test endpoint call');

        try {
            const response = await testEndpoint();
            setTestResponse(response);
            addLog('success', 'Task 1.1 test endpoint call successful', response);
        } catch (error) {
            const apiError = error as ApiError;
            addLog('error', `Task 1.1 test endpoint failed: ${apiError.message}`, {
                status: apiError.status,
                error: apiError.message
            });
            setTestResponse(null);
        } finally {
            setLoading(false);
        }
    };

    const handleHealthCheck = async () => {
        addLog('info', 'Starting health check');

        try {
            const response = await checkHealth();
            setHealthResponse(response);
            addLog('success', 'Health check successful', response);
        } catch (error) {
            const apiError = error as ApiError;
            addLog('error', `Health check failed: ${apiError.message}`, {
                status: apiError.status,
                error: apiError.message
            });
            setHealthResponse(null);
        }
    };

    const clearLogs = () => {
        setLogs([]);
        addLog('info', 'Logs cleared');
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4">
                {/* Header */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Task 1.1: Basic FastAPI-Next.js Integration Test
                    </h1>
                    <p className="text-gray-600">
                        This page tests the basic communication between FastAPI backend and Next.js frontend
                        with comprehensive logging and real-time updates.
                    </p>
                </div>

                {/* Test Controls */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Test Controls</h2>
                    <div className="flex gap-4 flex-wrap">
                        <button
                            onClick={handleTestEndpoint}
                            disabled={loading}
                            className={`px-6 py-2 rounded-md font-medium ${loading
                                    ? 'bg-gray-400 cursor-not-allowed'
                                    : 'bg-blue-600 hover:bg-blue-700'
                                } text-white transition-colors`}
                        >
                            {loading ? 'Testing...' : 'Test Task 1.1 Endpoint'}
                        </button>
                        <button
                            onClick={handleHealthCheck}
                            className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md font-medium transition-colors"
                        >
                            Health Check
                        </button>
                        <button
                            onClick={clearLogs}
                            className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md font-medium transition-colors"
                        >
                            Clear Logs
                        </button>
                    </div>
                </div>

                {/* Response Display */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    {/* Test Endpoint Response */}
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Test Endpoint Response</h3>
                        {testResponse ? (
                            <div className="space-y-3">
                                <div className="bg-green-50 border border-green-200 rounded-md p-3">
                                    <p className="text-green-800 font-medium">{testResponse.message}</p>
                                    <p className="text-green-600 text-sm">Status: {testResponse.status}</p>
                                    <p className="text-green-600 text-sm">Correlation ID: {testResponse.correlation_id}</p>
                                    <p className="text-green-600 text-sm">Timestamp: {new Date(testResponse.timestamp).toLocaleString()}</p>
                                </div>
                                <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
                                    <h4 className="font-medium text-gray-900 mb-2">Test Data:</h4>
                                    <pre className="text-xs text-gray-700 overflow-auto">
                                        {JSON.stringify(testResponse.test_data, null, 2)}
                                    </pre>
                                </div>
                            </div>
                        ) : (
                            <p className="text-gray-500">No response yet. Click "Test Task 1.1 Endpoint" to test.</p>
                        )}
                    </div>

                    {/* Health Check Response */}
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Health Check Response</h3>
                        {healthResponse ? (
                            <div className="bg-green-50 border border-green-200 rounded-md p-3">
                                <p className="text-green-800 font-medium">Service: {healthResponse.service}</p>
                                <p className="text-green-600 text-sm">Status: {healthResponse.status}</p>
                                {healthResponse.version && (
                                    <p className="text-green-600 text-sm">Version: {healthResponse.version}</p>
                                )}
                                {healthResponse.timestamp && (
                                    <p className="text-green-600 text-sm">
                                        Timestamp: {new Date(healthResponse.timestamp).toLocaleString()}
                                    </p>
                                )}
                            </div>
                        ) : (
                            <p className="text-gray-500">No response yet. Click "Health Check" to test.</p>
                        )}
                    </div>
                </div>

                {/* Live Logs */}
                <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Live Logs</h3>
                        <span className="text-sm text-gray-500">{logs.length} entries</span>
                    </div>
                    <div className="bg-black rounded-md p-4 max-h-96 overflow-auto font-mono text-sm">
                        {logs.length === 0 ? (
                            <p className="text-green-400">Waiting for logs...</p>
                        ) : (
                            <div className="space-y-1">
                                {logs.map((log) => (
                                    <div key={log.id} className="flex gap-2">
                                        <span className="text-gray-400">{new Date(log.timestamp).toLocaleTimeString()}</span>
                                        <span className={`font-medium ${log.level === 'success' ? 'text-green-400' :
                                                log.level === 'error' ? 'text-red-400' :
                                                    log.level === 'warning' ? 'text-yellow-400' :
                                                        'text-blue-400'
                                            }`}>
                                            [{log.level.toUpperCase()}]
                                        </span>
                                        <span className="text-white">{log.message}</span>
                                        {log.data && (
                                            <span className="text-gray-300">
                                                {typeof log.data === 'string' ? log.data : JSON.stringify(log.data)}
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Instructions */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-6">
                    <h3 className="text-lg font-semibold text-blue-900 mb-3">Task 1.1 Success Criteria</h3>
                    <ul className="space-y-2 text-blue-800">
                        <li className="flex items-start gap-2">
                            <span className="text-green-600 font-bold">✓</span>
                            <span>FastAPI endpoint responds with test data</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-green-600 font-bold">✓</span>
                            <span>Next.js can successfully call FastAPI endpoint</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-green-600 font-bold">✓</span>
                            <span>Frontend displays API response with timestamps</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-green-600 font-bold">✓</span>
                            <span>Console logs show request/response flow</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-green-600 font-bold">✓</span>
                            <span>Error handling displays meaningful messages</span>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
