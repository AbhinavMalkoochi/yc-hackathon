"use client";

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowUp, Check, Edit3, Globe, KeyRound, Trash2, Type,
    Bot, BarChart3, Feather, Share2, Play, Clock, CheckCircle2, AlertCircle, X, Plus,
    Menu, ChevronRight, Settings, Eye, Activity, Zap, Target, Calendar
} from 'lucide-react';
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { generateFlows, executeParallelFlows, createTaskStreamUrl } from "../lib/api";

interface TestFlow {
    name: string;
    description: string;
    instructions: string;
    approved?: boolean;
    status?: 'pending' | 'approved' | 'executing' | 'completed' | 'failed' | 'running';
    estimatedTime?: number;
    taskId?: string;
    liveUrl?: string;
    sessionId?: string;
}

interface GenerationResponse {
    flows: TestFlow[];
    message: string;
    status: string;
    generation_time?: number;
}

// Flow Icons
const flowIcons = {
    'Navigation Test': <Globe size={20} />,
    'Form Testing': <Edit3 size={20} />,
    'Button Clicking': <Bot size={20} />,
    'Data Extraction': <BarChart3 size={20} />,
    'Content Verification': <Feather size={20} />,
    'User Flow': <Share2 size={20} />,
    'Login Test': <KeyRound size={20} />,
    'Search Test': <Type size={20} />
};

const getFlowIcon = (flowName: string) => {
    for (const [key, icon] of Object.entries(flowIcons)) {
        if (flowName.toLowerCase().includes(key.toLowerCase().split(' ')[0])) {
            return icon;
        }
    }
    return <Bot size={20} />;
};

export default function UnifiedDashboard() {
    const [prompt, setPrompt] = useState("");
    const [websiteUrl, setWebsiteUrl] = useState("");
    const [flows, setFlows] = useState<TestFlow[]>([]);
    const [loading, setLoading] = useState(false);
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [activeTab, setActiveTab] = useState<'overview' | 'flows' | 'sessions' | 'logs'>('overview');

    // Live session management
    const [liveSessions, setLiveSessions] = useState<TestFlow[]>([]);
    const [activeStreams, setActiveStreams] = useState<Record<string, EventSource>>({});

    // Flow editing state
    const [editingFlow, setEditingFlow] = useState<number | null>(null);
    const [editingFlowData, setEditingFlowData] = useState<TestFlow | null>(null);

    // Convex queries and mutations
    const userSessions = useQuery(api.browserTesting.listTestSessions, { limit: 20 });
    const currentSession = useQuery(
        api.browserTesting.getTestSession,
        currentSessionId ? { sessionId: currentSessionId as any } : "skip"
    );
    const activeBrowserSessions = useQuery(
        api.browserTesting.getActiveBrowserSessions,
        currentSessionId ? { sessionId: currentSessionId as any } : {}
    );

    const createSession = useMutation(api.browserTesting.createTestSession);
    const createFlows = useMutation(api.browserTesting.createTestFlows);
    const updateSessionStatus = useMutation(api.browserTesting.updateTestSessionStatus);
    const updateFlowApproval = useMutation(api.browserTesting.updateFlowApproval);
    const createBrowserSession = useMutation(api.browserTesting.createBrowserSession);
    const updateBrowserSessionStatus = useMutation(api.browserTesting.updateBrowserSessionStatus);
    const closeBrowserSession = useMutation(api.browserTesting.closeBrowserSession);

    // Load flows from current session
    useEffect(() => {
        if (currentSession?.flows) {
            const sessionFlows = currentSession.flows.map((flow: any) => ({
                name: flow.name,
                description: flow.description,
                instructions: flow.instructions,
                approved: flow.approved,
                status: flow.status,
                estimatedTime: Math.max(20, Math.min(60, flow.instructions.split('\n').length * 10))
            }));
            setFlows(sessionFlows);
        }
    }, [currentSession]);

    // Load browser sessions for current session
    useEffect(() => {
        console.log("activeBrowserSessions changed:", activeBrowserSessions);
        console.log("currentSessionId:", currentSessionId);
        
        if (activeBrowserSessions && activeBrowserSessions.length > 0) {
            const sessionBrowserSessions = activeBrowserSessions.map(session => ({
                name: session.flowName || 'Browser Session',
                description: session.flowDescription || 'Active browser session',
                instructions: session.instructions || '',
                approved: true,
                status: session.status === 'executing' ? 'running' as const : session.status as any,
                taskId: session.taskId,
                sessionId: session.browserSessionId,
                liveUrl: session.liveUrl,
                estimatedTime: session.metadata?.estimatedTime || 30
            }));

            console.log("Setting live sessions:", sessionBrowserSessions);
            setLiveSessions(sessionBrowserSessions);

            // Auto-restart streaming for active sessions
            sessionBrowserSessions.forEach(session => {
                if (session.taskId && (session.status === 'running' || session.status === 'executing')) {
                    console.log("Auto-restarting streaming for task:", session.taskId);
                    startTaskStreaming(session.taskId!);
                }
            });
        } else {
            console.log("No browser sessions found, clearing live sessions");
            setLiveSessions([]);
        }
    }, [activeBrowserSessions, currentSessionId]);

    // Debug effect for liveSessions state
    useEffect(() => {
        console.log("liveSessions state changed:", liveSessions);
    }, [liveSessions]);

    // Memoized values
    const approvedFlows = useMemo(() => flows.filter(f => f.status === 'approved' || f.approved), [flows]);
    const selectedFlows = useMemo(() => flows.filter(f => f.approved).map(f => flows.indexOf(f)), [flows]);
    const hasSelection = useMemo(() => selectedFlows.length > 0, [selectedFlows]);
    const showFlows = useMemo(() => flows.length > 0, [flows]);

    // Status helpers
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-gray-100 text-gray-800';
            case 'generating': return 'bg-blue-100 text-blue-800';
            case 'ready': return 'bg-green-100 text-green-800';
            case 'running': return 'bg-yellow-100 text-yellow-800';
            case 'completed': return 'bg-green-100 text-green-800';
            case 'failed': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'completed': return <CheckCircle2 size={16} className="text-green-600" />;
            case 'running': return <Clock size={16} className="text-yellow-600" />;
            case 'failed': return <AlertCircle size={16} className="text-red-600" />;
            default: return <Clock size={16} className="text-gray-600" />;
        }
    };

    // Form submission handler
    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!prompt.trim() || loading) return;

        const userMessage = prompt.trim();
        const currentWebsiteUrl = websiteUrl.trim();

        if (!currentWebsiteUrl) return;

        setLoading(true);

        try {
            const sessionId = await createSession({
                name: `Test: ${userMessage.slice(0, 50)}...`,
                prompt: `${userMessage} (Website: ${currentWebsiteUrl})`
            });

            setCurrentSessionId(sessionId);

            await updateSessionStatus({
                sessionId,
                status: "generating"
            });

            const response = await generateFlows(userMessage, currentWebsiteUrl) as GenerationResponse;

            if (response.status === "success") {
                await createFlows({
                    sessionId,
                    flows: response.flows.map(flow => ({
                        name: flow.name,
                        description: flow.description,
                        instructions: flow.instructions
                    }))
                });

                await updateSessionStatus({
                    sessionId,
                    status: "ready"
                });

                const flowsWithDefaults = response.flows.map((flow: TestFlow) => ({
                    ...flow,
                    approved: false,
                    status: 'pending' as const,
                    estimatedTime: Math.max(20, Math.min(60, flow.instructions.split('\n').length * 10))
                }));
                setFlows(flowsWithDefaults);

            } else {
                await updateSessionStatus({
                    sessionId,
                    status: "failed",
                    metadata: { errorMessage: response.message }
                });
                alert(`Error: ${response.message}`);
            }
        } catch (error) {
            console.error("Failed to generate flows:", error);
            if (currentSessionId) {
                await updateSessionStatus({
                    sessionId: currentSessionId as any,
                    status: "failed",
                    metadata: { errorMessage: "Failed to generate flows" }
                });
            }
            alert("Failed to generate flows. Please try again.");
        } finally {
            setLoading(false);
            setPrompt("");
            setWebsiteUrl("");
        }
    };

    // Session management
    const handleSessionClick = (sessionId: string) => {
        console.log("Switching to session:", sessionId);
        
        // Store current live sessions before switching
        const currentLiveSessions = [...liveSessions];
        console.log("Storing current live sessions:", currentLiveSessions);
        
        Object.values(activeStreams).forEach(stream => {
            stream.close();
        });
        setActiveStreams({});
        
        // Don't clear live sessions immediately - let the new session data load
        // setLiveSessions([]);
        setFlows([]);
        setCurrentSessionId(sessionId);
        
        // Restore live sessions if they belong to the new session
        setTimeout(() => {
            if (currentLiveSessions.length > 0) {
                console.log("Restoring live sessions:", currentLiveSessions);
                setLiveSessions(currentLiveSessions);
            }
        }, 100);
    };

    // Flow management
    const toggleFlowApproval = async (index: number) => {
        if (!currentSession?.flows?.[index]) return;

        const flow = currentSession.flows[index];
        const newApproved = !flow.approved;

        try {
            await updateFlowApproval({
                flowId: flow._id,
                approved: newApproved
            });

            const newFlows = [...flows];
            newFlows[index].approved = newApproved;
            newFlows[index].status = newApproved ? 'approved' : 'pending';
            setFlows(newFlows);
        } catch (error) {
            console.error("Failed to update flow approval:", error);
        }
    };

    const handleSelectFlow = (index: number) => {
        toggleFlowApproval(index);
    };

    // Execute flows
    const handleRunProcess = async () => {
        const approvedFlowsList = flows.filter(flow => flow.approved);
        
        try {
            const newFlows = flows.map(flow =>
                flow.approved ? { ...flow, status: 'executing' as const } : flow
            );
            setFlows(newFlows);

            const flowDescriptions = approvedFlowsList.map(flow => {
                return `${flow.name}: ${flow.description}. Instructions: ${flow.instructions}`;
            });

            const response = await executeParallelFlows(flowDescriptions) as any;

            if (response.tasks && response.tasks.length > 0) {
                const approvedFlowIndices = flows.map((flow, index) => flow.approved ? index : -1).filter(index => index !== -1);

                const successFlows = await Promise.all(flows.map(async (flow, flowIndex) => {
                    if (flow.approved) {
                        const taskIndex = approvedFlowIndices.indexOf(flowIndex);
                        if (taskIndex >= response.tasks.length || taskIndex < 0) {
                            return flow;
                        }

                        const taskData = response.tasks[taskIndex];
                        const updatedFlow = {
                            ...flow,
                            status: 'running' as const,
                            taskId: taskData.task_id,
                            sessionId: taskData.session_id,
                            liveUrl: taskData.live_url
                        };

                        try {
                            const browserSessionArgs: any = {
                                taskId: taskData.task_id,
                                browserSessionId: taskData.session_id,
                                flowName: flow.name,
                                flowDescription: flow.description,
                                instructions: flow.instructions,
                                estimatedTime: flow.estimatedTime,
                                sessionId: currentSessionId ? (currentSessionId as any) : undefined
                            };

                            if (taskData.live_url && typeof taskData.live_url === 'string') {
                                browserSessionArgs.liveUrl = taskData.live_url;
                            }

                            const browserSessionId = await createBrowserSession(browserSessionArgs);
                            console.log("Created browser session:", browserSessionId);
                            startTaskStreaming(taskData.task_id);
                        } catch (error) {
                            console.error("Failed to save browser session to Convex:", error);
                        }

                        return updatedFlow;
                    }
                    return flow;
                }));
                setFlows(successFlows);

                const runningSessions = successFlows.filter(flow => flow.status === 'running' && flow.taskId);
                console.log("Setting running sessions:", runningSessions);
                setLiveSessions(runningSessions);

                alert(`Successfully started ${response.total_tasks} browser sessions!`);
            }
        } catch (error) {
            console.error("Failed to execute flows:", error);
            alert(`Failed to execute flows: ${error instanceof Error ? error.message : 'Unknown error'}`);

            const resetFlows = flows.map(flow =>
                flow.approved ? { ...flow, status: 'approved' as const } : flow
            );
            setFlows(resetFlows);
        }
    };

    // Streaming management
    const startTaskStreaming = (taskId: string) => {
        if (activeStreams[taskId]) return;

        try {
            const eventSource = new EventSource(createTaskStreamUrl(taskId));

            eventSource.onmessage = (event) => {
                const logData = JSON.parse(event.data);

                if (logData.type === 'status' && logData.live_url) {
                    console.log("Received live URL for task:", taskId, logData.live_url);
                    
                    setFlows(prevFlows =>
                        prevFlows.map(flow =>
                            flow.taskId === taskId
                                ? { ...flow, liveUrl: logData.live_url }
                                : flow
                        )
                    );

                    setLiveSessions(prevSessions => {
                        const updatedSessions = prevSessions.map(session =>
                            session.taskId === taskId
                                ? { ...session, liveUrl: logData.live_url }
                                : session
                        );
                        console.log("Updated live sessions with URL:", updatedSessions);
                        return updatedSessions;
                    });

                    const updateArgs: any = {
                        taskId,
                        status: 'running'
                    };

                    if (logData.live_url && typeof logData.live_url === 'string') {
                        updateArgs.liveUrl = logData.live_url;
                    }

                    updateBrowserSessionStatus(updateArgs).catch(error => {
                        console.error("Failed to update browser session in Convex:", error);
                    });
                }

                if (logData.type === 'completion' || logData.type === 'error') {
                    console.log("Task completed/failed:", taskId, logData.type);
                    eventSource.close();
                    setActiveStreams(prev => {
                        const newStreams = { ...prev };
                        delete newStreams[taskId];
                        return newStreams;
                    });

                    const finalStatus = logData.type === 'completion' ? 'completed' : 'failed';
                    
                    setFlows(prevFlows =>
                        prevFlows.map(flow =>
                            flow.taskId === taskId
                                ? { ...flow, status: finalStatus }
                                : flow
                        )
                    );

                    // Don't remove from live sessions, just update status
                    setLiveSessions(prevSessions => {
                        const updatedSessions = prevSessions.map(session =>
                            session.taskId === taskId
                                ? { ...session, status: finalStatus as TestFlow['status'] }
                                : session
                        );
                        console.log("Updated live sessions with final status:", updatedSessions);
                        return updatedSessions;
                    });

                    closeBrowserSession({
                        taskId,
                        status: finalStatus,
                        errorMessage: logData.type === 'error' ? logData.message : undefined
                    }).catch(error => {
                        console.error("Failed to close browser session in Convex:", error);
                    });
                }
            };

            eventSource.onerror = () => {
                console.log("Stream error for task:", taskId);
                eventSource.close();
                setActiveStreams(prev => {
                    const newStreams = { ...prev };
                    delete newStreams[taskId];
                    return newStreams;
                });

                // Don't remove from live sessions on streaming error, just update status
                setLiveSessions(prevSessions => {
                    const updatedSessions = prevSessions.map(session =>
                        session.taskId === taskId
                            ? { ...session, status: 'failed' as TestFlow['status'] }
                            : session
                    );
                    console.log("Updated live sessions on streaming error:", updatedSessions);
                    return updatedSessions;
                });

                closeBrowserSession({
                    taskId,
                    status: 'failed',
                    errorMessage: 'Streaming connection failed'
                }).catch(error => {
                    console.error("Failed to update browser session on streaming error:", error);
                });
            };

            setActiveStreams(prev => ({ ...prev, [taskId]: eventSource }));
            console.log("Started streaming for task:", taskId);
        } catch (error) {
            console.error('Failed to start streaming for task:', taskId, error);
        }
    };

    // Flow editing functions
    const startEditingFlow = (index: number) => {
        setEditingFlow(index);
        setEditingFlowData({ ...flows[index] });
    };

    const saveEditedFlow = (index: number) => {
        if (editingFlowData) {
            const newFlows = [...flows];
            newFlows[index] = editingFlowData;
            setFlows(newFlows);
            setEditingFlow(null);
            setEditingFlowData(null);
        }
    };

    const cancelEditingFlow = () => {
        setEditingFlow(null);
        setEditingFlowData(null);
    };

    const deleteFlow = (index: number) => {
        const newFlows = flows.filter((_, i) => i !== index);
        setFlows(newFlows);
        setEditingFlow(null);
        setEditingFlowData(null);
    };

    const addNewFlow = () => {
        const newFlow: TestFlow = {
            name: "New Test Flow",
            description: "Description for the new test flow",
            instructions: "Step-by-step instructions for the new flow",
            approved: false,
            status: 'pending',
            estimatedTime: 30
        };
        setFlows([...flows, newFlow]);
        setEditingFlow(flows.length);
        setEditingFlowData(newFlow);
    };

    return (
        <div className="flex h-screen bg-gray-50 font-sans text-gray-800">
            {/* Background Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
                <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-blue-100/30 rounded-full filter blur-3xl animate-blob"></div>
                <div className="absolute bottom-0 right-0 w-2/3 h-2/3 bg-indigo-100/30 rounded-full filter blur-3xl animate-blob animation-delay-4000"></div>
            </div>

            {/* Sidebar */}
            <div className={`relative z-10 bg-white/70 border-r border-white/80 backdrop-blur-2xl transition-all duration-300 ${sidebarOpen ? 'w-80' : 'w-16'}`}>
                <div className="p-4 border-b border-white/80">
                    <div className="flex items-center justify-between">
                        <div className={`flex items-center gap-3 ${sidebarOpen ? '' : 'justify-center'}`}>
                            <button
                                onClick={() => setSidebarOpen(!sidebarOpen)}
                                className="p-2 hover:bg-black/10 rounded-lg transition-colors"
                            >
                                <Menu size={20} />
                            </button>
                            {sidebarOpen && (
                                <div>
                                    <h1 className="text-lg font-semibold text-gray-700">qaesar</h1>
                                    <p className="text-xs text-gray-500">AI Browser Testing</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {sidebarOpen && (
                    <div className="p-4">
                        <h2 className="text-sm font-medium text-gray-700 mb-3">Test Sessions</h2>

                        {userSessions === undefined ? (
                            <div className="space-y-2">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="animate-pulse">
                                        <div className="h-16 bg-gray-200 rounded-lg"></div>
                                    </div>
                                ))}
                            </div>
                        ) : userSessions.length === 0 ? (
                            <div className="text-center py-8">
                                <p className="text-sm text-gray-500">No sessions yet</p>
                                <p className="text-xs text-gray-400 mt-1">Create your first test session</p>
                            </div>
                        ) : (
                            <div className="space-y-2 max-h-96 overflow-y-auto">
                                {userSessions.map((session) => (
                                    <motion.div
                                        key={session._id}
                                        whileHover={{ scale: 1.02 }}
                                        onClick={() => handleSessionClick(session._id)}
                                        className={`p-3 rounded-lg cursor-pointer transition-all border ${currentSessionId === session._id
                                            ? 'bg-blue-50 border-blue-200'
                                            : 'bg-white/40 border-white/60 hover:bg-white/60'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between mb-1">
                                            <h3 className="font-medium text-sm text-gray-800 truncate">{session.name}</h3>
                                            {getStatusIcon(session.status)}
                                        </div>
                                        <p className="text-xs text-gray-600 truncate">{session.prompt}</p>
                                        <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                                            <span>{new Date(session.createdAt).toLocaleDateString()}</span>
                                            <span className={`px-2 py-1 rounded ${getStatusColor(session.status)}`}>
                                                {session.status}
                                            </span>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col relative z-10">
                {/* Header */}
                <header className="p-6 border-b border-white/80 bg-white/60 backdrop-blur-2xl">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">
                                {currentSession ? currentSession.name : 'AI Browser Testing Agent'}
                            </h1>
                            <p className="text-gray-600">
                                {currentSession ? currentSession.prompt : 'Generate, edit, and execute browser tests using natural language'}
                            </p>
                        </div>
                    </div>
                </header>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-6">
                    {/* Input Card */}
                    <motion.div
                        initial={{ y: -20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.5, ease: 'easeInOut' }}
                        className="mb-8"
                    >
                        <div className="relative w-full p-2 bg-white/70 border border-white/80 rounded-2xl shadow-xl shadow-black/5 backdrop-blur-2xl">
                            <form onSubmit={handleFormSubmit} className="flex items-center w-full gap-2">
                                <div className="flex items-center flex-grow p-2 rounded-lg bg-black/5">
                                    <Type className="w-5 h-5 mx-2 text-black/40" />
                                    <input
                                        type="text"
                                        value={prompt}
                                        onChange={(e) => setPrompt(e.target.value)}
                                        placeholder="What should we automate?"
                                        className="w-full h-10 text-sm bg-transparent focus:outline-none placeholder:text-black/40"
                                    />
                                </div>
                                <div className="flex items-center p-2 rounded-lg bg-black/5">
                                    <Globe className="w-5 h-5 mx-2 text-black/40" />
                                    <input
                                        type="text"
                                        value={websiteUrl}
                                        onChange={(e) => setWebsiteUrl(e.target.value)}
                                        placeholder="Website URL"
                                        className="w-40 h-10 text-sm bg-transparent focus:outline-none placeholder:text-black/40"
                                    />
                                </div>
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    type="submit"
                                    className="flex items-center justify-center flex-shrink-0 w-12 h-12 bg-blue-600 rounded-full disabled:opacity-40 disabled:cursor-not-allowed shadow-lg"
                                    disabled={!prompt || !websiteUrl || loading}
                                >
                                    {loading ? (
                                        <motion.div
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                            className="w-6 h-6 border-2 border-white border-t-transparent rounded-full"
                                        />
                                    ) : (
                                        <ArrowUp className="w-6 h-6 text-white" />
                                    )}
                                </motion.button>
                            </form>
                        </div>
                    </motion.div>

                    {/* Unified Dashboard Content */}
                    <div className="space-y-6">
                        {/* Overview Section */}
                        {currentSession && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white/70 border border-white/80 rounded-2xl shadow-xl shadow-black/5 backdrop-blur-2xl p-6"
                            >
                                <div className="flex items-center gap-3 mb-4">
                                    <Activity className="w-6 h-6 text-blue-600" />
                                    <h2 className="text-xl font-bold text-gray-800">Session Overview</h2>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="bg-white/80 rounded-xl p-4 border border-gray-200">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Target className="w-5 h-5 text-blue-600" />
                                            <span className="text-sm font-medium text-gray-700">Total Flows</span>
                                        </div>
                                        <p className="text-2xl font-bold text-gray-900">{flows.length}</p>
                                    </div>
                                    
                                    <div className="bg-white/80 rounded-xl p-4 border border-gray-200">
                                        <div className="flex items-center gap-2 mb-2">
                                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                                            <span className="text-sm font-medium text-gray-700">Approved</span>
                                        </div>
                                        <p className="text-2xl font-bold text-gray-900">{approvedFlows.length}</p>
                                    </div>
                                    
                                    <div className="bg-white/80 rounded-xl p-4 border border-gray-200">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Clock className="w-5 h-5 text-yellow-600" />
                                            <span className="text-sm font-medium text-gray-700">Status</span>
                                        </div>
                                        <p className="text-lg font-semibold text-gray-900 capitalize">{currentSession.status}</p>
                                    </div>
                                </div>

                                <div className="mt-4 p-4 bg-gray-50/50 rounded-lg">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Calendar className="w-4 h-4 text-gray-600" />
                                        <span className="text-sm font-medium text-gray-700">Created</span>
                                    </div>
                                    <p className="text-sm text-gray-600">{new Date(currentSession.createdAt).toLocaleString()}</p>
                                </div>
                            </motion.div>
                        )}

                        {/* Flows Section */}
                        {showFlows && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white/70 border border-white/80 rounded-2xl shadow-xl shadow-black/5 backdrop-blur-2xl p-6"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <Zap className="w-6 h-6 text-indigo-600" />
                                        <h2 className="text-xl font-bold text-gray-800">Test Flows</h2>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={addNewFlow}
                                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-lg"
                                        >
                                            <Plus size={16} />
                                            Add Flow
                                        </motion.button>
                                        {hasSelection && (
                                            <motion.button
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={handleRunProcess}
                                                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all flex items-center gap-2 shadow-lg"
                                            >
                                                <Play size={16} />
                                                Run Selected ({selectedFlows.length})
                                            </motion.button>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {flows.map((flow, index) => (
                                        <div
                                            key={index}
                                            className={`relative flex flex-col justify-between p-4 transition-all bg-white/80 border rounded-xl shadow-lg shadow-black/5 backdrop-blur-2xl cursor-pointer group hover:shadow-xl hover:scale-105 ${flow.approved ? 'border-blue-500/50 ring-2 ring-blue-200/50' : 'border-white/80'}`}
                                        >
                                            {editingFlow === index ? (
                                                // Edit Mode
                                                <div className="space-y-3">
                                                    <input
                                                        type="text"
                                                        value={editingFlowData?.name || ''}
                                                        onChange={(e) => setEditingFlowData(prev => prev ? { ...prev, name: e.target.value } : null)}
                                                        className="w-full p-2 text-sm font-medium bg-white/90 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                        placeholder="Flow name"
                                                    />
                                                    <textarea
                                                        value={editingFlowData?.description || ''}
                                                        onChange={(e) => setEditingFlowData(prev => prev ? { ...prev, description: e.target.value } : null)}
                                                        className="w-full p-2 text-sm bg-white/90 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                                        rows={2}
                                                        placeholder="Flow description"
                                                    />
                                                    <textarea
                                                        value={editingFlowData?.instructions || ''}
                                                        onChange={(e) => setEditingFlowData(prev => prev ? { ...prev, instructions: e.target.value } : null)}
                                                        className="w-full p-2 text-sm bg-white/90 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                                        rows={3}
                                                        placeholder="Step-by-step instructions"
                                                    />
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={cancelEditingFlow}
                                                            className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                                                        >
                                                            Cancel
                                                        </button>
                                                        <button
                                                            onClick={() => saveEditedFlow(index)}
                                                            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                                                        >
                                                            Save
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                // View Mode
                                                <div onClick={() => handleSelectFlow(index)}>
                                                    <div className="flex items-center justify-between mb-2 text-gray-600">
                                                        {getFlowIcon(flow.name)}
                                                        <span className="px-2 py-0.5 text-xs text-gray-500 bg-black/5 rounded-full">
                                                            {flow.estimatedTime ? `${Math.round(flow.estimatedTime / 60)}m` : '2m'}
                                                        </span>
                                                    </div>
                                                    <h3 className="font-medium text-gray-800">{flow.name}</h3>
                                                    <p className="mt-1 text-sm text-gray-500">{flow.description}</p>
                                                    <div className="flex items-center justify-between mt-4">
                                                        <div className={`flex items-center justify-center w-6 h-6 rounded-full border-2 transition-all flex-shrink-0 ${flow.approved ? 'bg-blue-500 border-blue-500' : 'border-gray-300 bg-black/5'}`}>
                                                            {flow.approved && (
                                                                <Check className="w-4 h-4 text-white" />
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    startEditingFlow(index);
                                                                }}
                                                                className="p-2 text-gray-400 transition-colors rounded-full hover:bg-black/10 hover:text-gray-700"
                                                                title="Edit Flow"
                                                            >
                                                                <Edit3 size={16} />
                                                            </button>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    deleteFlow(index);
                                                                }}
                                                                className="p-2 text-gray-400 transition-colors rounded-full hover:bg-black/10 hover:text-red-600"
                                                                title="Delete Flow"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {/* Live Browser Sessions */}
                        {liveSessions.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white/70 border border-white/80 rounded-2xl shadow-xl shadow-black/5 backdrop-blur-2xl p-6"
                            >
                                <div className="flex items-center gap-3 mb-4">
                                    <Eye className="w-6 h-6 text-green-600" />
                                    <h2 className="text-xl font-bold text-gray-800">Live Browser Sessions</h2>
                                    <span className="text-sm text-gray-500">({liveSessions.length} active)</span>
                                </div>
                                
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {liveSessions.map((session, index) => (
                                        <div key={index} className="bg-white/80 border border-white/80 rounded-xl shadow-lg shadow-black/5 backdrop-blur-2xl p-4 hover:shadow-xl transition-all">
                                            <div className="flex items-center justify-between mb-3">
                                                <h3 className="font-medium text-gray-800">{session.name}</h3>
                                                <div className="flex items-center gap-2">
                                                    <div className={`px-2 py-1 rounded text-xs ${getStatusColor(session.status || 'running')}`}>
                                                        {session.status || 'running'}
                                                    </div>
                                                    {session.taskId && (
                                                        <a
                                                            href={`/logs/${session.taskId}?name=${encodeURIComponent(session.name)}&description=${encodeURIComponent(session.description || '')}`}
                                                            className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
                                                        >
                                                            View Details
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                            
                                            {session.liveUrl && (
                                                <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all">
                                                    <iframe
                                                        src={session.liveUrl}
                                                        className="w-full h-full border-0"
                                                        title={`Live session: ${session.name}`}
                                                    />
                                                </div>
                                            )}
                                            
                                            <div className="mt-3 p-3 bg-gray-50/50 rounded-lg">
                                                <p className="text-sm text-gray-600">{session.description}</p>
                                                {session.taskId && (
                                                    <p className="text-xs text-gray-500 mt-1">Task ID: {session.taskId}</p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {/* Debug Section - Only show in development */}
                        {process.env.NODE_ENV === 'development' && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-gray-100/70 border border-gray-200 rounded-2xl p-4"
                            >
                                <h3 className="text-sm font-medium text-gray-700 mb-2">Debug Info</h3>
                                <div className="text-xs text-gray-600 space-y-1">
                                    <p>Current Session ID: {currentSessionId || 'None'}</p>
                                    <p>Live Sessions Count: {liveSessions.length}</p>
                                    <p>Active Streams Count: {Object.keys(activeStreams).length}</p>
                                    <p>Flows Count: {flows.length}</p>
                                    <p>Approved Flows: {approvedFlows.length}</p>
                                </div>
                            </motion.div>
                        )}
                    </div>
                </div>
            </div>

            <style jsx global>{`
                @keyframes blob {
                    0% { transform: translate(0px, 0px) scale(1); }
                    33% { transform: translate(30px, -50px) scale(1.1); }
                    66% { transform: translate(-20px, 20px) scale(0.9); }
                    100% { transform: translate(0px, 0px) scale(1); }
                }
                .animate-blob { animation: blob 10s infinite; }
                .animation-delay-4000 { animation-delay: -4s; }
            `}</style>
        </div>
    );
}
