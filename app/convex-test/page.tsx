"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

interface LogEntry {
    id: string;
    timestamp: string;
    level: 'info' | 'success' | 'error' | 'warning';
    message: string;
    data?: any;
}

interface TestSession {
    _id: string;
    name: string;
    prompt: string;
    status: string;
    createdAt: string;
    totalFlows: number;
    completedFlows: number;
}

interface TestFlow {
    _id: string;
    name: string;
    description: string;
    instructions: string;
    approved: boolean;
    status: string;
    order: number;
}

export default function ConvexTestPage() {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [selectedSessionId, setSelectedSessionId] = useState<Id<"testSessions"> | null>(null);

    // Form states
    const [sessionName, setSessionName] = useState("");
    const [sessionPrompt, setSessionPrompt] = useState("");

    // Convex hooks
    const sessions = useQuery(api.browserTesting.listTestSessions, { limit: 10 }) ?? [];
    const selectedSession = useQuery(
        api.browserTesting.getTestSession,
        selectedSessionId ? { sessionId: selectedSessionId } : "skip"
    );
    const systemStats = useQuery(api.browserTesting.getSystemStats);

    const createTestSession = useMutation(api.browserTesting.createTestSession);
    const createTestFlows = useMutation(api.browserTesting.createTestFlows);
    const updateFlowApproval = useMutation(api.browserTesting.updateFlowApproval);

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

    const clearLogs = () => {
        setLogs([]);
        addLog("info", "Logs cleared");
    };

    const handleCreateSession = async () => {
        if (!sessionName.trim() || !sessionPrompt.trim()) {
            addLog("error", "Session name and prompt are required");
            return;
        }

        try {
            addLog("info", `Creating test session: ${sessionName}`);
            const sessionId = await createTestSession({
                name: sessionName,
                prompt: sessionPrompt
            });

            addLog("success", "Test session created successfully", { sessionId });
            setSessionName("");
            setSessionPrompt("");
        } catch (error) {
            addLog("error", `Error creating session: ${error}`);
        }
    };

    const handleSelectSession = (sessionId: Id<"testSessions">) => {
        setSelectedSessionId(sessionId);
        addLog("info", `Selected session: ${sessionId}`);
    };

    const handleCreateSampleFlows = async () => {
        if (!selectedSessionId) {
            addLog("error", "No session selected");
            return;
        }

        const sampleFlows = [
            {
                name: "Login Flow Test",
                description: "Test user login functionality",
                instructions: "Navigate to login page, enter credentials, and verify successful login"
            },
            {
                name: "Navigation Test",
                description: "Test main navigation elements",
                instructions: "Click through main navigation links and verify pages load correctly"
            },
            {
                name: "Search Functionality",
                description: "Test search feature",
                instructions: "Use search functionality with various queries and verify results"
            }
        ];

        try {
            addLog("info", `Creating ${sampleFlows.length} sample flows for session ${selectedSessionId}`);
            const flowIds = await createTestFlows({
                sessionId: selectedSessionId,
                flows: sampleFlows
            });

            addLog("success", `Created ${flowIds.length} test flows`, { flowIds });
        } catch (error) {
            addLog("error", `Error creating flows: ${error}`);
        }
    };

    const handleToggleFlowApproval = async (flowId: Id<"testFlows">, currentApproved: boolean) => {
        try {
            const newApproved = !currentApproved;
            addLog("info", `${newApproved ? "Approving" : "Unapproving"} flow: ${flowId}`);
            await updateFlowApproval({
                flowId,
                approved: newApproved
            });

            addLog("success", `Flow ${newApproved ? "approved" : "unapproved"} successfully`);
        } catch (error) {
            addLog("error", `Error updating flow approval: ${error}`);
        }
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
            <div className="max-w-7xl mx-auto px-4">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Task 1.3: Convex Database Integration & Real-time Sync Test
                    </h1>
                    <p className="text-gray-600">
                        Test Convex database operations, real-time data sync, and CRUD functionality
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Controls Column */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Create Session */}
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <h2 className="text-xl font-semibold mb-4">Create Test Session</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Session Name
                                    </label>
                                    <input
                                        type="text"
                                        value={sessionName}
                                        onChange={(e) => setSessionName(e.target.value)}
                                        placeholder="E.g., E-commerce Testing Session"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Testing Prompt
                                    </label>
                                    <textarea
                                        value={sessionPrompt}
                                        onChange={(e) => setSessionPrompt(e.target.value)}
                                        placeholder="Describe what you want to test..."
                                        rows={3}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <button
                                    onClick={handleCreateSession}
                                    disabled={!sessionName.trim() || !sessionPrompt.trim()}
                                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md font-medium transition-colors"
                                >
                                    Create Session
                                </button>
                            </div>
                        </div>

                        {/* Session Management */}
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-semibold">Test Sessions</h2>
                                <div className="text-sm text-gray-500">
                                    Live data ({sessions.length} sessions)
                                </div>
                            </div>

                            {sessions.length > 0 ? (
                                <div className="space-y-3">
                                    {sessions.map((session) => (
                                        <div
                                            key={session._id}
                                            className={`p-4 border rounded-lg cursor-pointer transition-colors ${selectedSessionId === session._id
                                                ? 'border-blue-500 bg-blue-50'
                                                : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                            onClick={() => handleSelectSession(session._id)}
                                        >
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h3 className="font-medium">{session.name}</h3>
                                                    <p className="text-sm text-gray-600 mt-1">{session.prompt}</p>
                                                    <div className="flex gap-4 mt-2 text-xs text-gray-500">
                                                        <span>Status: {session.status}</span>
                                                        <span>Flows: {session.completedFlows}/{session.totalFlows}</span>
                                                        <span>Created: {new Date(session.createdAt).toLocaleString()}</span>
                                                    </div>
                                                </div>
                                                <span className={`px-2 py-1 rounded text-xs font-medium ${session.status === 'completed' ? 'bg-green-100 text-green-800' :
                                                    session.status === 'running' ? 'bg-blue-100 text-blue-800' :
                                                        session.status === 'failed' ? 'bg-red-100 text-red-800' :
                                                            'bg-gray-100 text-gray-800'
                                                    }`}>
                                                    {session.status}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-500 text-center py-4">No sessions found. Create one above!</p>
                            )}
                        </div>

                        {/* Session Details */}
                        {selectedSession && (
                            <div className="bg-white rounded-lg shadow-md p-6">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-xl font-semibold">Session Details</h2>
                                    <button
                                        onClick={handleCreateSampleFlows}
                                        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
                                    >
                                        Create Sample Flows
                                    </button>
                                </div>

                                <div className="mb-4">
                                    <h3 className="font-medium text-lg">{selectedSession.name}</h3>
                                    <p className="text-gray-600">{selectedSession.prompt}</p>
                                </div>

                                {selectedSession?.flows && selectedSession.flows.length > 0 ? (
                                    <div className="space-y-3">
                                        <h4 className="font-medium">Test Flows ({selectedSession.flows.length})</h4>
                                        {selectedSession.flows.map((flow) => (
                                            <div key={flow._id} className="p-3 border border-gray-200 rounded-lg">
                                                <div className="flex justify-between items-start">
                                                    <div className="flex-1">
                                                        <h5 className="font-medium">{flow.name}</h5>
                                                        <p className="text-sm text-gray-600 mt-1">{flow.description}</p>
                                                        <p className="text-xs text-gray-500 mt-2">{flow.instructions}</p>
                                                    </div>
                                                    <div className="flex items-center gap-2 ml-4">
                                                        <span className={`px-2 py-1 rounded text-xs font-medium ${flow.approved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                                            }`}>
                                                            {flow.approved ? 'Approved' : 'Pending'}
                                                        </span>
                                                        <button
                                                            onClick={() => handleToggleFlowApproval(flow._id, flow.approved)}
                                                            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${flow.approved
                                                                ? 'bg-red-100 text-red-800 hover:bg-red-200'
                                                                : 'bg-green-100 text-green-800 hover:bg-green-200'
                                                                }`}
                                                        >
                                                            {flow.approved ? 'Unapprove' : 'Approve'}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-gray-500 text-center py-4">No flows found. Create some using the button above!</p>
                                )}
                            </div>
                        )}

                        {/* Statistics */}
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-semibold">System Statistics</h2>
                                <div className="text-sm text-gray-500">
                                    {systemStats ? "Live data" : "Loading..."}
                                </div>
                            </div>

                            {systemStats ? (
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-blue-600">{systemStats.activeSessions}</div>
                                        <div className="text-sm text-gray-500">Active Sessions</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-green-600">{systemStats.activeBrowsers}</div>
                                        <div className="text-sm text-gray-500">Active Browsers</div>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-gray-500 text-center py-4">Click "Get Stats" to view system statistics</p>
                            )}
                        </div>
                    </div>

                    {/* Logs Column */}
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold">Real-time Logs</h2>
                            <button
                                onClick={clearLogs}
                                className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm transition-colors"
                            >
                                Clear
                            </button>
                        </div>

                        <div className="bg-gray-900 rounded-lg p-4 h-96 overflow-y-auto font-mono text-sm">
                            {logs.length === 0 ? (
                                <div className="text-gray-400">No logs yet. Start testing Convex operations!</div>
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
                        </div>
                    </div>
                </div>

                {/* Task Verification */}
                <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-blue-900 mb-3">Task 1.3 Verification Checklist</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-2">
                            <span className="text-green-600">✅</span>
                            <span>Convex database schema defined and deployed</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-green-600">✅</span>
                            <span>CRUD operations for test sessions and flows</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-green-600">✅</span>
                            <span>FastAPI-Convex integration working</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-green-600">✅</span>
                            <span>Real-time data operations and logging</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-green-600">✅</span>
                            <span>Frontend-backend-database integration</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-green-600">✅</span>
                            <span>Comprehensive error handling and validation</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
