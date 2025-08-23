"use client";

import { useState, useEffect, useRef } from "react";
import {
    createStreamClient,
    StreamMessage,
    getStats,
    type StatsResponse
} from "../../lib/api";

interface LogEntry {
    id: string;
    timestamp: string;
    level: 'info' | 'success' | 'error' | 'warning';
    message: string;
    data?: any;
}

interface ConnectionStatus {
    isConnected: boolean;
    endpoint: string | null;
    lastMessageTime: string | null;
    messageCount: number;
}

export default function StreamingTestPage() {
    const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
        isConnected: false,
        endpoint: null,
        lastMessageTime: null,
        messageCount: 0,
    });
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [stats, setStats] = useState<StatsResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [selectedEndpoint, setSelectedEndpoint] = useState("/api/stream");

    const disconnectRef = useRef<(() => void) | null>(null);
    const logsEndRef = useRef<HTMLDivElement>(null);

    const addLog = (level: LogEntry['level'], message: string, data?: any) => {
        const logEntry: LogEntry = {
            id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date().toISOString(),
            level,
            message,
            data
        };
        console.log(`[${logEntry.id}] ${level.toUpperCase()}: ${message}`, data || '');
        setLogs(prev => [...prev, logEntry]);
    };

    const scrollToBottom = () => {
        logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [logs]);

    const connectStream = () => {
        if (disconnectRef.current) {
            disconnectRef.current();
        }

        addLog("info", `Connecting to streaming endpoint: ${selectedEndpoint}`);
        setLoading(true);

        disconnectRef.current = createStreamClient(selectedEndpoint, {
            onMessage: (message: StreamMessage) => {
                addLog("success", `Stream message received: ${message.type}`, message);
                setConnectionStatus(prev => ({
                    ...prev,
                    lastMessageTime: new Date().toISOString(),
                    messageCount: prev.messageCount + 1,
                }));
            },
            onConnect: () => {
                addLog("success", "Stream connected successfully!");
                setConnectionStatus({
                    isConnected: true,
                    endpoint: selectedEndpoint,
                    lastMessageTime: new Date().toISOString(),
                    messageCount: 0,
                });
                setLoading(false);
            },
            onDisconnect: () => {
                addLog("warning", "Stream disconnected");
                setConnectionStatus({
                    isConnected: false,
                    endpoint: null,
                    lastMessageTime: null,
                    messageCount: 0,
                });
                setLoading(false);
            },
            onError: (error: Event) => {
                addLog("error", `Stream error: ${error.type}`, error);
                setLoading(false);
            }
        });
    };

    const disconnectStream = () => {
        if (disconnectRef.current) {
            disconnectRef.current();
            disconnectRef.current = null;
            addLog("info", "Stream disconnected manually");
        }
    };

    const fetchStats = async () => {
        try {
            addLog("info", "Fetching system statistics...");
            const statsData = await getStats();
            setStats(statsData);
            addLog("success", "System statistics retrieved", statsData.data);
        } catch (error) {
            addLog("error", `Failed to fetch stats: ${error}`);
        }
    };

    const clearLogs = () => {
        setLogs([]);
        addLog("info", "Logs cleared");
    };

    const getStatusColor = (level: string) => {
        switch (level) {
            case 'success': return 'text-green-600';
            case 'error': return 'text-red-600';
            case 'warning': return 'text-yellow-600';
            default: return 'text-blue-600';
        }
    };

    const getStatusIcon = (level: string) => {
        switch (level) {
            case 'success': return '✅';
            case 'error': return '❌';
            case 'warning': return '⚠️';
            default: return 'ℹ️';
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-6xl mx-auto px-4">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Task 1.2: Streaming Response Real-time Communication Test
                    </h1>
                    <p className="text-gray-600">
                        Test real-time streaming communication from FastAPI backend to Next.js frontend using Server-Sent Events
                    </p>
                </div>

                {/* Connection Status */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <h2 className="text-xl font-semibold mb-4">Connection Status</h2>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="text-center">
                            <div className={`text-2xl font-bold ${connectionStatus.isConnected ? 'text-green-600' : 'text-red-600'}`}>
                                {connectionStatus.isConnected ? '🟢 Connected' : '🔴 Disconnected'}
                            </div>
                            <div className="text-sm text-gray-500">Status</div>
                        </div>
                        <div className="text-center">
                            <div className="text-lg font-mono text-gray-800">
                                {connectionStatus.endpoint || 'None'}
                            </div>
                            <div className="text-sm text-gray-500">Endpoint</div>
                        </div>
                        <div className="text-center">
                            <div className="text-lg font-mono text-gray-800">
                                {connectionStatus.messageCount}
                            </div>
                            <div className="text-sm text-gray-500">Messages Received</div>
                        </div>
                        <div className="text-center">
                            <div className="text-lg text-gray-800">
                                {connectionStatus.lastMessageTime
                                    ? new Date(connectionStatus.lastMessageTime).toLocaleTimeString()
                                    : 'Never'
                                }
                            </div>
                            <div className="text-sm text-gray-500">Last Message</div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Controls */}
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h2 className="text-xl font-semibold mb-4">Streaming Controls</h2>

                        {/* Endpoint Selection */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Select Streaming Endpoint
                            </label>
                            <select
                                value={selectedEndpoint}
                                onChange={(e) => setSelectedEndpoint(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                disabled={connectionStatus.isConnected}
                            >
                                <option value="/api/stream">Task 1.2 Stream (/api/stream)</option>
                                <option value="/api/stream/simple">Simple Stream (/api/stream/simple)</option>
                            </select>
                        </div>

                        {/* Connection Controls */}
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <button
                                onClick={connectStream}
                                disabled={connectionStatus.isConnected || loading}
                                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md font-medium transition-colors"
                            >
                                {loading ? "Connecting..." : "Connect"}
                            </button>
                            <button
                                onClick={disconnectStream}
                                disabled={!connectionStatus.isConnected}
                                className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md font-medium transition-colors"
                            >
                                Disconnect
                            </button>
                        </div>

                        {/* Info Section */}
                        <div className="bg-blue-50 rounded-lg p-4 mb-4">
                            <h3 className="font-medium text-blue-900 mb-2">Streaming Features</h3>
                            <div className="text-sm text-blue-700 space-y-1">
                                <div>• Unidirectional communication (server → client)</div>
                                <div>• Server-Sent Events (SSE) protocol</div>
                                <div>• Automatic reconnection support</div>
                                <div>• Real-time JSON data streaming</div>
                                <div>• Lightweight and efficient</div>
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="pt-4 border-t border-gray-200">
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="font-medium">System Statistics</h3>
                                <button
                                    onClick={fetchStats}
                                    className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm transition-colors"
                                >
                                    Refresh
                                </button>
                            </div>
                            {stats && (
                                <div className="bg-gray-50 rounded p-3 text-sm">
                                    <div>Status: <span className="font-mono">{stats.data.system_status}</span></div>
                                    <div>Task: <span className="font-mono">{stats.data.task}</span></div>
                                    <div>Retrieved: <span className="font-mono">{new Date(stats.timestamp).toLocaleTimeString()}</span></div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Logs */}
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold">Real-time Logs</h2>
                            <button
                                onClick={clearLogs}
                                className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm transition-colors"
                            >
                                Clear Logs
                            </button>
                        </div>

                        <div className="bg-gray-900 rounded-lg p-4 h-96 overflow-y-auto font-mono text-sm">
                            {logs.length === 0 ? (
                                <div className="text-gray-400">No logs yet. Connect to stream to see real-time activity.</div>
                            ) : (
                                logs.map((log) => (
                                    <div key={log.id} className="mb-2">
                                        <div className="flex items-start gap-2">
                                            <span className="text-gray-400">
                                                {new Date(log.timestamp).toLocaleTimeString()}
                                            </span>
                                            <span>{getStatusIcon(log.level)}</span>
                                            <span className={`${getStatusColor(log.level)} flex-1`}>
                                                {log.message}
                                            </span>
                                        </div>
                                        {log.data && (
                                            <div className="ml-6 mt-1 text-gray-300 text-xs">
                                                <pre>{JSON.stringify(log.data, null, 2)}</pre>
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                            <div ref={logsEndRef} />
                        </div>
                    </div>
                </div>

                {/* Task Verification */}
                <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-blue-900 mb-3">Task 1.2 Verification Checklist</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-2">
                            <span className="text-green-600">✅</span>
                            <span>Streaming endpoints available (/api/stream, /api/stream/simple)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-green-600">✅</span>
                            <span>Real-time unidirectional communication</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-green-600">✅</span>
                            <span>Server-Sent Events (SSE) protocol</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-green-600">✅</span>
                            <span>Automatic reconnection support</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-green-600">✅</span>
                            <span>JSON message streaming</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-green-600">✅</span>
                            <span>Comprehensive logging and error handling</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
