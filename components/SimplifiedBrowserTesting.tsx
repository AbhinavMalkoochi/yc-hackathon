"use client";

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowUp, Check, Edit3, Globe, KeyRound, Trash2, Type,
    Bot, BarChart3, Feather, Share2, Play, Clock, CheckCircle2, AlertCircle, X, Plus,
    Menu, ChevronRight, Settings, Eye, FileText, Activity, Calendar, User, Hash,
    ExternalLink, Maximize2, Minimize2, RefreshCw, AlertTriangle
} from 'lucide-react';
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { generateFlows } from "../lib/api";

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

interface BrowserSession {
    _id: string;
    taskId: string;
    browserSessionId: string;
    flowName: string;
    flowDescription: string;
    instructions: string;
    status: 'executing' | 'running' | 'completed' | 'failed' | 'terminated';
    liveUrl?: string;
    currentUrl?: string;
    currentAction?: string;
    progress?: number;
    startedAt: string;
    completedAt?: string;
    metadata?: {
        estimatedTime?: number;
    };
}

// --- FLOW ICONS ---
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

export default function SimplifiedBrowserTesting() {
    const [prompt, setPrompt] = useState("");
    const [websiteUrl, setWebsiteUrl] = useState("");
    const [flows, setFlows] = useState<TestFlow[]>([]);
    const [loading, setLoading] = useState(false);
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [selectedSession, setSelectedSession] = useState<string | null>(null);
    const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set());

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

    // Browser session mutations
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
        if (activeBrowserSessions && activeBrowserSessions.length > 0) {
            console.log("Loading browser sessions for current session:", activeBrowserSessions);

            // Convert Convex browser sessions to TestFlow format for local state
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

            // Set browser sessions to live sessions
            setLiveSessions(sessionBrowserSessions);

            // Auto-restart streaming for active sessions
            sessionBrowserSessions.forEach(session => {
                if (session.taskId && (session.status === 'running' || session.status === 'executing')) {
                    console.log("Auto-restarting streaming for task:", session.taskId);
                    startTaskStreaming(session.taskId!);
                }
            });
        } else {
            // Clear live sessions if no browser sessions for current session
            setLiveSessions([]);
        }
    }, [activeBrowserSessions, currentSessionId]);

    // --- MEMOIZED VALUES ---
    const approvedFlows = useMemo(() => flows.filter(f => f.status === 'approved' || f.approved), [flows]);
    const selectedFlows = useMemo(() => flows.filter(f => f.approved).map(f => flows.indexOf(f)), [flows]);
    const hasSelection = useMemo(() => selectedFlows.length > 0, [selectedFlows]);
    const showFlows = useMemo(() => flows.length > 0, [flows]);

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!prompt.trim() || loading) return;

        const userMessage = prompt.trim();
        const currentWebsiteUrl = websiteUrl.trim();

        if (!currentWebsiteUrl) return;

        setLoading(true);

        try {
            // Create a new session in Convex
            const sessionId = await createSession({
                name: `Test: ${userMessage.slice(0, 50)}...`,
                prompt: `${userMessage} (Website: ${currentWebsiteUrl})`
            });

            setCurrentSessionId(sessionId);

            // Update session status to generating
            await updateSessionStatus({
                sessionId,
                status: "generating"
            });

            // Generate flows using the API
            const response = await generateFlows(userMessage, currentWebsiteUrl) as GenerationResponse;

            if (response.status === "success") {
                // Save flows to Convex
                await createFlows({
                    sessionId,
                    flows: response.flows.map(flow => ({
                        name: flow.name,
                        description: flow.description,
                        instructions: flow.instructions
                    }))
                });

                // Update session status to ready
                await updateSessionStatus({
                    sessionId,
                    status: "ready"
                });

                // Set flows in local state
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

    const handleSessionClick = (sessionId: string) => {
        console.log("Switching to session:", sessionId);

        // Stop all active streams before switching
        Object.values(activeStreams).forEach(stream => {
            stream.close();
        });
        setActiveStreams({});

        // Clear current state
        setLiveSessions([]);
        setFlows([]);

        // Set new session
        setCurrentSessionId(sessionId);
        setSelectedSession(sessionId);
    };

    const toggleFlowApproval = async (index: number) => {
        if (!currentSession?.flows?.[index]) return;

        const flow = currentSession.flows[index];
        const newApproved = !flow.approved;

        try {
            await updateFlowApproval({
                flowId: flow._id,
                approved: newApproved
            });

            // Update local state
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

    // Test function to debug backend
    const testBackendRequest = async () => {
        const testPayload = {
            flows: ["Test flow: Test description. Instructions: Test instructions"]
        };

        console.log("Testing backend with payload:", testPayload);

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_FASTAPI_URL}/api/test-request`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(testPayload),
            });

            if (response.ok) {
                const data = await response.json();
                console.log("Test request successful:", data);
            } else {
                const errorData = await response.json();
                console.error("Test request failed:", errorData);
            }
        } catch (error) {
            console.error("Test request error:", error);
        }
    };

    const handleRunProcess = async () => {
        const approvedFlowsList = flows.filter(flow => flow.approved);
        console.log("Running process for selected flows:", approvedFlowsList);
        console.log("Total approved flows:", approvedFlowsList.length);

        // Validate flows have required fields
        const validFlows = approvedFlowsList.filter(flow => {
            if (!flow.name || !flow.description || !flow.instructions) {
                console.warn(`Flow missing required fields:`, flow);
                return false;
            }
            return true;
        });

        if (validFlows.length === 0) {
            alert("No valid flows to run. Please ensure all flows have name, description, and instructions.");
            return;
        }

        if (validFlows.length !== approvedFlowsList.length) {
            console.warn(`Some flows were invalid: ${approvedFlowsList.length - validFlows.length} flows skipped`);
        }

        // Convert flows to natural language task descriptions
        const flowDescriptions = validFlows.map(flow => {
            const description = `${flow.name}: ${flow.description}. Instructions: ${flow.instructions}`;
            console.log(`Flow ${flow.name} description:`, description);
            return description;
        }).filter(desc => desc && desc.trim().length > 0); // Filter out empty descriptions

        if (flowDescriptions.length === 0) {
            alert("No valid flow descriptions to send. Please check your flows.");
            return;
        }

        console.log("Flow descriptions to send:", flowDescriptions);

        try {
            // Set flows to executing state
            const newFlows = flows.map(flow =>
                flow.approved ? { ...flow, status: 'executing' as const } : flow
            );
            setFlows(newFlows);

            // Call parallel flows endpoint
            console.log("Calling parallel flows endpoint with:", flowDescriptions.length, "flows");
            console.log("Flow descriptions:", flowDescriptions);

            const requestPayload = {
                flows: flowDescriptions
            };
            console.log("Request payload:", requestPayload);

            const response = await fetch(`${process.env.NEXT_PUBLIC_FASTAPI_URL}/api/browser-cloud/parallel-flows`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(requestPayload),
            });

            if (!response.ok) {
                let errorMessage = `HTTP ${response.status}`;
                try {
                    const errorData = await response.json();
                    console.error("Error response data:", errorData);

                    // Handle different error response structures
                    if (errorData.detail) {
                        errorMessage = errorData.detail;
                    } else if (errorData.message) {
                        errorMessage = errorData.message;
                    } else if (errorData.error) {
                        errorMessage = errorData.error;
                    } else if (typeof errorData === 'string') {
                        errorMessage = errorData;
                    } else {
                        errorMessage = JSON.stringify(errorData);
                    }
                } catch (parseError) {
                    console.error("Failed to parse error response:", parseError);
                    errorMessage = `HTTP ${response.status} - Failed to parse error response`;
                }

                throw new Error(errorMessage);
            }

            const data = await response.json();
            console.log("Parallel flows response:", data);
            console.log("Number of tasks created:", data.tasks?.length || 0);
            console.log("Expected tasks:", validFlows.length);

            // Verify we got the right number of tasks
            if (data.tasks && data.tasks.length !== validFlows.length) {
                console.error(`Task count mismatch! Expected ${validFlows.length}, got ${data.tasks.length}`);
            }

            // Update flows with task IDs and save to Convex FIRST, then start streaming
            // Create a mapping of approved flows to their corresponding task data
            const approvedFlowIndices = flows.map((flow, index) => flow.approved ? index : -1).filter(index => index !== -1);
            console.log("Approved flow indices:", approvedFlowIndices);

            const successFlows = await Promise.all(flows.map(async (flow, flowIndex) => {
                if (flow.approved) {
                    // Find the task index for this approved flow
                    const taskIndex = approvedFlowIndices.indexOf(flowIndex);

                    // Make sure we have a corresponding task for this flow
                    if (taskIndex >= data.tasks.length || taskIndex < 0) {
                        console.error(`No task data for approved flow at index ${flowIndex}. Task index: ${taskIndex}, Available tasks: ${data.tasks.length}`);
                        return flow;
                    }

                    const taskData = data.tasks[taskIndex];
                    console.log(`Processing approved flow ${flowIndex} with task ${taskIndex}:`, flow.name, "->", taskData.task_id);

                    const updatedFlow = {
                        ...flow,
                        status: 'running' as const,
                        taskId: taskData.task_id,
                        sessionId: taskData.session_id,
                        liveUrl: taskData.live_url
                    };

                    // Save browser session to Convex FIRST - this is critical to prevent race condition
                    try {
                        // Build the mutation arguments, only including liveUrl if it's a valid string
                        const browserSessionArgs: any = {
                            taskId: taskData.task_id,
                            browserSessionId: taskData.session_id,
                            flowName: flow.name,
                            flowDescription: flow.description,
                            instructions: flow.instructions,
                            estimatedTime: flow.estimatedTime,
                            sessionId: currentSessionId ? (currentSessionId as any) : undefined // Associate with current test session
                        };

                        // Only include liveUrl if it's a non-null string
                        if (taskData.live_url && typeof taskData.live_url === 'string') {
                            browserSessionArgs.liveUrl = taskData.live_url;
                        }

                        const browserSessionId = await createBrowserSession(browserSessionArgs);
                        console.log("Successfully saved browser session to Convex:", taskData.task_id, "with ID:", browserSessionId);

                        // Start streaming immediately after the browser session is saved to Convex
                        startTaskStreaming(taskData.task_id);
                    } catch (error) {
                        console.error("Failed to save browser session to Convex:", error);
                        // Don't start streaming if we failed to save the session
                        console.warn("Skipping streaming for task", taskData.task_id, "due to database save failure");
                    }

                    return updatedFlow;
                }
                return flow;
            }));
            setFlows(successFlows);

            // Set live sessions for embedding - include all running flows
            const runningSessions = successFlows.filter(flow => flow.status === 'running' && flow.taskId);
            console.log("Setting live sessions:", runningSessions.length, "sessions");
            setLiveSessions(runningSessions);

            alert(`Successfully started ${data.total_tasks} browser sessions! They will appear below.`);

        } catch (error) {
            console.error("Failed to execute flows:", error);
            alert(`Failed to execute flows: ${error instanceof Error ? error.message : 'Unknown error'}`);

            // Reset flows to approved state on error
            const resetFlows = flows.map(flow =>
                flow.approved ? { ...flow, status: 'approved' as const } : flow
            );
            setFlows(resetFlows);
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

    // Start streaming logs for a task
    const startTaskStreaming = (taskId: string) => {
        if (activeStreams[taskId]) return; // Already streaming

        try {
            const eventSource = new EventSource(`${process.env.NEXT_PUBLIC_FASTAPI_URL}/api/browser-cloud/task/${taskId}/stream`);

            eventSource.onmessage = (event) => {
                const logData = JSON.parse(event.data);

                // Update live URL in flows when available
                if (logData.type === 'status' && logData.live_url) {
                    setFlows(prevFlows =>
                        prevFlows.map(flow =>
                            flow.taskId === taskId
                                ? { ...flow, liveUrl: logData.live_url }
                                : flow
                        )
                    );

                    // Update live sessions without clearing them
                    setLiveSessions(prevSessions => {
                        const updatedSessions = prevSessions.map(session =>
                            session.taskId === taskId
                                ? { ...session, liveUrl: logData.live_url }
                                : session
                        );
                        console.log("Updated live sessions with URL:", updatedSessions.length, "sessions");
                        return updatedSessions;
                    });

                    // Update Convex database with live URL
                    const updateArgs: any = {
                        taskId,
                        status: 'running'
                    };

                    // Only include liveUrl if it's a non-null string
                    if (logData.live_url && typeof logData.live_url === 'string') {
                        updateArgs.liveUrl = logData.live_url;
                    }

                    updateBrowserSessionStatus(updateArgs).then(result => {
                        if (result === null) {
                            console.warn(`Browser session not found for taskId: ${taskId}, skipping database update`);
                        }
                    }).catch(error => {
                        console.error("Failed to update browser session in Convex:", error);
                        // Continue streaming even if database update fails
                    });
                }

                // Handle completion
                if (logData.type === 'completion' || logData.type === 'error') {
                    eventSource.close();
                    setActiveStreams(prev => {
                        const newStreams = { ...prev };
                        delete newStreams[taskId];
                        return newStreams;
                    });

                    // Update status
                    const finalStatus = logData.type === 'completion' ? 'completed' : 'failed';
                    setFlows(prevFlows =>
                        prevFlows.map(flow =>
                            flow.taskId === taskId
                                ? { ...flow, status: finalStatus }
                                : flow
                        )
                    );

                    // Update live sessions status without removing them
                    setLiveSessions(prevSessions => {
                        const updatedSessions = prevSessions.map(session =>
                            session.taskId === taskId
                                ? { ...session, status: finalStatus as TestFlow['status'] }
                                : session
                        );
                        console.log("Updated live sessions with final status:", updatedSessions.length, "sessions");
                        return updatedSessions;
                    });

                    // Update Convex database with final status
                    closeBrowserSession({
                        taskId,
                        status: finalStatus,
                        errorMessage: logData.type === 'error' ? logData.message : undefined
                    }).then(result => {
                        if (result === null) {
                            console.warn(`Browser session not found for taskId: ${taskId}, skipping final status update`);
                        }
                    }).catch(error => {
                        console.error("Failed to close browser session in Convex:", error);
                        // Continue even if database update fails
                    });
                }
            };

            eventSource.onerror = () => {
                eventSource.close();
                setActiveStreams(prev => {
                    const newStreams = { ...prev };
                    delete newStreams[taskId];
                    return newStreams;
                });

                // Update Convex database on streaming error
                closeBrowserSession({
                    taskId,
                    status: 'failed',
                    errorMessage: 'Streaming connection failed'
                }).then(result => {
                    if (result === null) {
                        console.warn(`Browser session not found for taskId: ${taskId}, skipping error status update`);
                    }
                }).catch(error => {
                    console.error("Failed to update browser session on streaming error:", error);
                    // Continue even if database update fails
                });
            };

            setActiveStreams(prev => ({ ...prev, [taskId]: eventSource }));
        } catch (error) {
            console.error('Failed to start streaming for task:', taskId, error);
        }
    };

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

    const toggleSessionExpansion = (sessionId: string) => {
        const newExpanded = new Set(expandedSessions);
        if (newExpanded.has(sessionId)) {
            newExpanded.delete(sessionId);
        } else {
            newExpanded.add(sessionId);
        }
        setExpandedSessions(newExpanded);
    };

    return (
        <div className="flex h-screen bg-[#F7F2ED] font-sans text-gray-800">
            {/* Background Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
                <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-rose-200/30 rounded-full filter blur-3xl animate-blob"></div>
                <div className="absolute bottom-0 right-0 w-2/3 h-2/3 bg-blue-200/30 rounded-full filter blur-3xl animate-blob animation-delay-4000"></div>
            </div>

            {/* Sidebar */}
            <div className={`relative z-10 bg-white/60 border-r border-white/80 backdrop-blur-2xl transition-all duration-300 ${sidebarOpen ? 'w-80' : 'w-16'}`}>
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
                <header className="p-6 border-b border-white/80 bg-white/40 backdrop-blur-2xl">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">
                                {currentSession ? currentSession.name : 'AI Browser Testing Agent'}
                            </h1>
                            <p className="text-gray-600">
                                {currentSession ? currentSession.prompt : 'Generate, edit, and execute browser tests using natural language'}
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={testBackendRequest}
                                className="px-4 py-2 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors"
                                title="Test Backend Connection"
                            >
                                Test Backend
                            </button>
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
                        <div className="relative w-full p-2 bg-white/60 border border-white/80 rounded-2xl shadow-xl shadow-black/5 backdrop-blur-2xl">
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
                                    className="flex items-center justify-center flex-shrink-0 w-12 h-12 bg-gray-800 rounded-full disabled:opacity-40 disabled:cursor-not-allowed"
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

                    {/* Flows Grid */}
                    {showFlows && (
                        <div className="mb-8">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-bold text-gray-800">Test Flows</h2>
                                <div className="flex items-center gap-3">
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={addNewFlow}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                                    >
                                        <Plus size={16} />
                                        Add Flow
                                    </motion.button>
                                    {hasSelection && (
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={handleRunProcess}
                                            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                                        >
                                            <Play size={16} />
                                            Run Selected ({selectedFlows.length})
                                        </motion.button>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                                {flows.map((flow, index) => (
                                    <div
                                        key={index}
                                        className={`relative flex flex-col justify-between p-4 transition-colors bg-white/60 border rounded-2xl shadow-lg shadow-black/5 backdrop-blur-2xl cursor-pointer group ${flow.approved ? 'border-blue-500/50' : 'border-white/80'}`}
                                    >
                                        {editingFlow === index ? (
                                            // Edit Mode
                                            <div className="space-y-3">
                                                <input
                                                    type="text"
                                                    value={editingFlowData?.name || ''}
                                                    onChange={(e) => setEditingFlowData(prev => prev ? { ...prev, name: e.target.value } : null)}
                                                    className="w-full p-2 text-sm font-medium bg-white/80 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    placeholder="Flow name"
                                                />
                                                <textarea
                                                    value={editingFlowData?.description || ''}
                                                    onChange={(e) => setEditingFlowData(prev => prev ? { ...prev, description: e.target.value } : null)}
                                                    className="w-full p-2 text-sm bg-white/80 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                                    rows={2}
                                                    placeholder="Flow description"
                                                />
                                                <textarea
                                                    value={editingFlowData?.instructions || ''}
                                                    onChange={(e) => setEditingFlowData(prev => prev ? { ...prev, instructions: e.target.value } : null)}
                                                    className="w-full p-2 text-sm bg-white/80 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
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
                        </div>
                    )}

                    {/* Unified Browser Sessions View */}
                    {liveSessions.length > 0 && (
                        <div className="mb-8">
                            <h2 className="text-xl font-bold text-gray-800 mb-4">Browser Sessions</h2>
                            <div className="space-y-4">
                                {liveSessions.map((session, index) => (
                                    <div key={index} className="bg-white/60 border border-white/80 rounded-2xl shadow-lg shadow-black/5 backdrop-blur-2xl overflow-hidden">
                                        {/* Session Header */}
                                        <div
                                            className="p-4 cursor-pointer hover:bg-white/20 transition-colors"
                                            onClick={() => toggleSessionExpansion(session.taskId || `session-${index}`)}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full">
                                                        {getFlowIcon(session.name)}
                                                    </div>
                                                    <div>
                                                        <h3 className="font-medium text-gray-800">{session.name}</h3>
                                                        <p className="text-sm text-gray-600">{session.description}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(session.status || 'running')}`}>
                                                        {session.status || 'running'}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {session.liveUrl && (
                                                            <a
                                                                href={session.liveUrl}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                                title="View Live Browser"
                                                            >
                                                                <ExternalLink size={16} />
                                                            </a>
                                                        )}
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                toggleSessionExpansion(session.taskId || `session-${index}`);
                                                            }}
                                                            className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                                                            title={expandedSessions.has(session.taskId || `session-${index}`) ? "Collapse" : "Expand"}
                                                        >
                                                            {expandedSessions.has(session.taskId || `session-${index}`) ? (
                                                                <Minimize2 size={16} />
                                                            ) : (
                                                                <Maximize2 size={16} />
                                                            )}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Expanded Session Content */}
                                        <AnimatePresence>
                                            {expandedSessions.has(session.taskId || `session-${index}`) && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: "auto", opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    transition={{ duration: 0.3, ease: "easeInOut" }}
                                                    className="border-t border-white/40"
                                                >
                                                    <div className="p-4">
                                                        {/* Live Browser View */}
                                                        {session.liveUrl && (
                                                            <div className="mb-4">
                                                                <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                                                    <Eye size={16} />
                                                                    Live Browser View
                                                                </h4>
                                                                <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                                                                    <iframe
                                                                        src={session.liveUrl}
                                                                        className="w-full h-full border-0"
                                                                        title={`Live session: ${session.name}`}
                                                                    />
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Session Details */}
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                                            <div>
                                                                <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                                                    <FileText size={16} />
                                                                    Flow Instructions
                                                                </h4>
                                                                <div className="bg-gray-50 rounded-lg p-3">
                                                                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                                                        {session.instructions}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                                                    <Activity size={16} />
                                                                    Session Info
                                                                </h4>
                                                                <div className="space-y-2">
                                                                    <div className="flex justify-between text-sm">
                                                                        <span className="text-gray-600">Status:</span>
                                                                        <span className={`px-2 py-1 rounded text-xs ${getStatusColor(session.status || 'running')}`}>
                                                                            {session.status || 'running'}
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex justify-between text-sm">
                                                                        <span className="text-gray-600">Task ID:</span>
                                                                        <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                                                                            {session.taskId || 'N/A'}
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex justify-between text-sm">
                                                                        <span className="text-gray-600">Estimated Time:</span>
                                                                        <span className="text-gray-800">
                                                                            {session.estimatedTime ? `${Math.round(session.estimatedTime / 60)}m` : '2m'}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Action Buttons */}
                                                        <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
                                                            <button
                                                                onClick={() => {
                                                                    if (session.taskId) {
                                                                        window.open(`/logs/${session.taskId}?name=${encodeURIComponent(session.name)}&description=${encodeURIComponent(session.description || '')}`, '_blank');
                                                                    }
                                                                }}
                                                                className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                                                            >
                                                                <FileText size={16} />
                                                                View Detailed Logs
                                                            </button>
                                                            {session.liveUrl && (
                                                                <a
                                                                    href={session.liveUrl}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                                                                >
                                                                    <ExternalLink size={16} />
                                                                    Open Live Browser
                                                                </a>
                                                            )}
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
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
