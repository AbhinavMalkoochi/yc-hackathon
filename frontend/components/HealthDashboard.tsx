"use client";

import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, RefreshCw, Settings, ExternalLink, Clock } from 'lucide-react';

// Types for health data
interface ServiceHealth {
    service: string;
    status: 'healthy' | 'unhealthy' | 'degraded' | 'unknown';
    message: string;
    response_time_ms?: number;
    last_checked: string;
    details?: Record<string, any>;
    error?: string;
}

interface OverallHealth {
    overall_status: 'healthy' | 'unhealthy' | 'degraded' | 'unknown';
    overall_message: string;
    timestamp: string;
    services: Record<string, ServiceHealth>;
    summary: {
        total_services: number;
        healthy: number;
        degraded: number;
        unhealthy: number;
        unknown: number;
    };
}

interface ConfigStatus {
    status: 'configured' | 'incomplete';
    configured_services: number;
    total_services: number;
    timestamp: string;
    environment: {
        openai_configured: boolean;
        browser_use_configured: boolean;
        convex_configured: boolean;
        debug_mode: boolean;
        log_level: string;
        cors_origins: string[];
    };
    warnings: (string | null)[];
}

const API_BASE_URL = process.env.NEXT_PUBLIC_FASTAPI_URL || 'http://localhost:8000';

export default function HealthDashboard() {
    const [overallHealth, setOverallHealth] = useState<OverallHealth | null>(null);
    const [configStatus, setConfigStatus] = useState<ConfigStatus | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>('');
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

    // Auto-refresh functionality
    useEffect(() => {
        if (autoRefresh) {
            const interval = setInterval(() => {
                fetchHealthData();
            }, 30000); // Refresh every 30 seconds

            return () => clearInterval(interval);
        }
    }, [autoRefresh]);

    // Initial load
    useEffect(() => {
        fetchHealthData();
        fetchConfigStatus();
    }, []);

    const fetchHealthData = async () => {
        try {
            setLoading(true);
            setError('');

            const response = await fetch(`${API_BASE_URL}/api/health/all`);

            if (!response.ok) {
                // Even if the status is not 200, try to parse the response for partial data
                const data = await response.json();
                setOverallHealth(data);
                setLastRefresh(new Date());
                return;
            }

            const data = await response.json();
            setOverallHealth(data);
            setLastRefresh(new Date());
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch health data');
        } finally {
            setLoading(false);
        }
    };

    const fetchConfigStatus = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/config/status`);
            if (response.ok) {
                const data = await response.json();
                setConfigStatus(data);
            }
        } catch (err) {
            console.error('Failed to fetch config status:', err);
        }
    };

    const testIndividualService = async (service: string) => {
        try {
            setLoading(true);
            const response = await fetch(`${API_BASE_URL}/api/health/${service}`);
            const data = await response.json();

            // Update the specific service in overall health
            if (overallHealth) {
                setOverallHealth(prev => ({
                    ...prev!,
                    services: {
                        ...prev!.services,
                        [service]: data
                    }
                }));
            }
        } catch (err) {
            setError(`Failed to test ${service}: ${err instanceof Error ? err.message : 'Unknown error'}`);
        } finally {
            setLoading(false);
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'healthy':
                return <CheckCircle className="w-5 h-5 text-green-500" />;
            case 'degraded':
                return <AlertCircle className="w-5 h-5 text-yellow-500" />;
            case 'unhealthy':
                return <XCircle className="w-5 h-5 text-red-500" />;
            default:
                return <AlertCircle className="w-5 h-5 text-gray-500" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'healthy':
                return 'bg-green-100 dark:bg-green-900 border-green-400';
            case 'degraded':
                return 'bg-yellow-100 dark:bg-yellow-900 border-yellow-400';
            case 'unhealthy':
                return 'bg-red-100 dark:bg-red-900 border-red-400';
            default:
                return 'bg-gray-100 dark:bg-gray-900 border-gray-400';
        }
    };

    const formatResponseTime = (ms?: number) => {
        if (!ms) return 'N/A';
        if (ms < 1000) return `${Math.round(ms)}ms`;
        return `${(ms / 1000).toFixed(1)}s`;
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <Settings className="w-6 h-6 text-blue-500" />
                    <h2 className="text-xl font-bold">System Health Dashboard</h2>
                </div>

                <div className="flex items-center gap-2">
                    <label className="flex items-center gap-2 text-sm">
                        <input
                            type="checkbox"
                            checked={autoRefresh}
                            onChange={(e) => setAutoRefresh(e.target.checked)}
                            className="rounded"
                        />
                        Auto-refresh
                    </label>

                    <button
                        onClick={fetchHealthData}
                        disabled={loading}
                        className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-3 py-1 rounded-md flex items-center gap-2 transition-colors"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                </div>
            </div>

            {lastRefresh && (
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
                    <Clock className="w-4 h-4" />
                    Last updated: {lastRefresh.toLocaleTimeString()}
                </div>
            )}

            {error && (
                <div className="bg-red-100 dark:bg-red-900 border border-red-400 text-red-700 dark:text-red-300 px-4 py-3 rounded mb-4">
                    <strong>Error:</strong> {error}
                </div>
            )}

            {/* Overall Status */}
            {overallHealth && (
                <div className={`p-4 rounded-lg border-2 mb-6 ${getStatusColor(overallHealth.overall_status)}`}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            {getStatusIcon(overallHealth.overall_status)}
                            <div>
                                <h3 className="font-semibold text-lg">
                                    Overall Status: {overallHealth.overall_status.toUpperCase()}
                                </h3>
                                <p className="text-sm opacity-80">{overallHealth.overall_message}</p>
                            </div>
                        </div>

                        <div className="text-right">
                            <div className="text-sm opacity-80">
                                {overallHealth.summary.healthy}/{overallHealth.summary.total_services} services healthy
                            </div>
                            <div className="text-xs opacity-60">
                                {overallHealth.summary.degraded > 0 && `${overallHealth.summary.degraded} degraded, `}
                                {overallHealth.summary.unhealthy > 0 && `${overallHealth.summary.unhealthy} unhealthy`}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Configuration Status */}
            {configStatus && (
                <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <Settings className="w-5 h-5" />
                        Configuration Status
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                {configStatus.environment.openai_configured ? (
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                ) : (
                                    <XCircle className="w-4 h-4 text-red-500" />
                                )}
                                <span className="font-medium">OpenAI API</span>
                            </div>

                            <div className="flex items-center gap-2 mb-2">
                                {configStatus.environment.browser_use_configured ? (
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                ) : (
                                    <XCircle className="w-4 h-4 text-red-500" />
                                )}
                                <span className="font-medium">Browser Use Cloud</span>
                            </div>

                            <div className="flex items-center gap-2 mb-2">
                                {configStatus.environment.convex_configured ? (
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                ) : (
                                    <XCircle className="w-4 h-4 text-red-500" />
                                )}
                                <span className="font-medium">Convex Database</span>
                            </div>
                        </div>

                        <div className="text-sm">
                            <div className="mb-1">
                                <strong>Debug Mode:</strong> {configStatus.environment.debug_mode ? 'On' : 'Off'}
                            </div>
                            <div className="mb-1">
                                <strong>Log Level:</strong> {configStatus.environment.log_level}
                            </div>
                            <div>
                                <strong>CORS Origins:</strong> {configStatus.environment.cors_origins.join(', ')}
                            </div>
                        </div>
                    </div>

                    {configStatus.warnings.filter(Boolean).length > 0 && (
                        <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900 rounded border border-yellow-300">
                            <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-1">Warnings:</h4>
                            <ul className="text-sm text-yellow-700 dark:text-yellow-300 list-disc list-inside">
                                {configStatus.warnings.filter(Boolean).map((warning, index) => (
                                    <li key={index}>{warning}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}

            {/* Individual Services */}
            {overallHealth && (
                <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Service Details</h3>

                    {Object.entries(overallHealth.services).map(([serviceName, health]) => (
                        <div key={serviceName} className={`p-4 rounded-lg border ${getStatusColor(health.status)}`}>
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        {getStatusIcon(health.status)}
                                        <h4 className="font-semibold capitalize">
                                            {serviceName.replace('-', ' ')}
                                        </h4>
                                        {health.response_time_ms && (
                                            <span className="text-sm bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
                                                {formatResponseTime(health.response_time_ms)}
                                            </span>
                                        )}
                                    </div>

                                    <p className="text-sm mb-2">{health.message}</p>

                                    {health.error && (
                                        <div className="text-sm bg-red-50 dark:bg-red-900 p-2 rounded border border-red-200 dark:border-red-700">
                                            <strong>Error:</strong> {health.error}
                                        </div>
                                    )}

                                    {health.details && Object.keys(health.details).length > 0 && (
                                        <details className="mt-2">
                                            <summary className="text-sm font-medium cursor-pointer hover:text-blue-600">
                                                View Details
                                            </summary>
                                            <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded mt-1 overflow-auto">
                                                {JSON.stringify(health.details, null, 2)}
                                            </pre>
                                        </details>
                                    )}
                                </div>

                                <div className="flex flex-col items-end gap-2">
                                    <button
                                        onClick={() => testIndividualService(serviceName)}
                                        disabled={loading}
                                        className="bg-gray-500 hover:bg-gray-600 disabled:bg-gray-300 text-white px-3 py-1 rounded text-sm transition-colors"
                                    >
                                        Test
                                    </button>

                                    <div className="text-xs text-gray-600 dark:text-gray-400 text-right">
                                        {new Date(health.last_checked).toLocaleTimeString()}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* API Documentation Links */}
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900 rounded-lg border border-blue-200 dark:border-blue-700">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <ExternalLink className="w-5 h-5" />
                    API Documentation
                </h3>
                <div className="flex flex-wrap gap-3">
                    <a
                        href={`${API_BASE_URL}/docs`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
                    >
                        FastAPI Swagger UI
                    </a>
                    <a
                        href={`${API_BASE_URL}/redoc`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
                    >
                        ReDoc Documentation
                    </a>
                    <a
                        href={`${API_BASE_URL}/api/health/all`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
                    >
                        Raw Health Data
                    </a>
                </div>
            </div>

            {/* Instructions */}
            <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                <p>
                    <strong>Instructions:</strong> This dashboard monitors the health of all external services.
                    Configure your API keys in the <code className="bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded">env.example</code> file
                    and copy it to <code className="bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded">.env</code> to enable all services.
                </p>
            </div>
        </div>
    );
}
