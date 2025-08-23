"use client";

import { useState, FC, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowUp, Check, Edit3, Globe, KeyRound, Trash2, Type,
  Bot, BarChart3, Feather, Share2, Play, Clock, CheckCircle2, AlertCircle, X
} from 'lucide-react';
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
  // Try to match flow name with predefined icons
  for (const [key, icon] of Object.entries(flowIcons)) {
    if (flowName.toLowerCase().includes(key.toLowerCase().split(' ')[0])) {
      return icon;
    }
  }
  // Default icon
  return <Bot size={20} />;
};

interface SessionLog {
  taskId: string;
  logs: Array<{
    type: 'step' | 'status' | 'completion' | 'error';
    timestamp: string;
    data: any;
  }>;
}

const HomePage: FC = () => {
  const [prompt, setPrompt] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [flows, setFlows] = useState<TestFlow[]>([]);
  const [loading, setLoading] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<Array<{
    type: 'user' | 'assistant';
    content: string;
    flows?: TestFlow[];
    timestamp: Date;
  }>>([]);

  // Live session management
  const [liveSessions, setLiveSessions] = useState<TestFlow[]>([]);
  const [selectedSessionLogs, setSelectedSessionLogs] = useState<string | null>(null);
  const [sessionLogs, setSessionLogs] = useState<Record<string, SessionLog>>({});
  const [activeStreams, setActiveStreams] = useState<Record<string, EventSource>>({});
  const [selectedSessionDetails, setSelectedSessionDetails] = useState<string | null>(null);
  const [sessionDetails, setSessionDetails] = useState<Record<string, any>>({});

  // --- MEMOIZED VALUES ---
  const approvedFlows = useMemo(() => flows.filter(f => f.status === 'approved'), [flows]);
  const selectedFlows = useMemo(() => flows.filter(f => f.approved).map(f => flows.indexOf(f)), [flows]);
  const hasSelection = useMemo(() => selectedFlows.length > 0, [selectedFlows]);
  const showFlows = useMemo(() => flows.length > 0, [flows]);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || loading) return;

    const userMessage = prompt.trim();
    const currentWebsiteUrl = websiteUrl.trim();

    if (!currentWebsiteUrl) return; // Require both prompt and URL

    // Add user message to conversation
    setConversationHistory(prev => [...prev, {
      type: 'user',
      content: `${userMessage}${currentWebsiteUrl ? ` (Website: ${currentWebsiteUrl})` : ''}`,
      timestamp: new Date()
    }]);

    setPrompt("");
    setLoading(true);

    try {
      const response = await generateFlows(userMessage, currentWebsiteUrl) as GenerationResponse;

      if (response.status === "success") {
        const flowsWithDefaults = response.flows.map((flow: TestFlow) => ({
          ...flow,
          approved: false,
          status: 'pending' as const,
          estimatedTime: Math.max(20, Math.min(60, flow.instructions.split('\n').length * 10))
        }));

        setFlows(flowsWithDefaults);

        // Add assistant response to conversation
        setConversationHistory(prev => [...prev, {
          type: 'assistant',
          content: `I've generated ${response.flows.length} test flows for your request. You can review, edit, and approve them below.`,
          flows: flowsWithDefaults,
          timestamp: new Date()
        }]);
      } else {
        // Add error response to conversation
        setConversationHistory(prev => [...prev, {
          type: 'assistant',
          content: `I encountered an error: ${response.message}. Please try again or check your configuration.`,
          timestamp: new Date()
        }]);
      }
    } catch (error) {
      setConversationHistory(prev => [...prev, {
        type: 'assistant',
        content: `I'm sorry, I encountered an error while generating your test flows. Please try again.`,
        timestamp: new Date()
      }]);
    } finally {
      setLoading(false);
    }
  };

  const toggleFlowApproval = (index: number) => {
    const newFlows = [...flows];
    newFlows[index].approved = !newFlows[index].approved;
    newFlows[index].status = newFlows[index].approved ? 'approved' : 'pending';
    setFlows(newFlows);
  };

  const approveAllFlows = () => {
    const newFlows = flows.map(flow => ({
      ...flow,
      approved: true,
      status: 'approved' as const
    }));
    setFlows(newFlows);
  };

  // --- NEW FLOW ACTION HANDLERS ---
  const handleFlowAction = (index: number, newStatus: 'approved' | 'declined') => {
    const newFlows = [...flows];
    if (newStatus === 'approved') {
      newFlows[index].approved = true;
      newFlows[index].status = 'approved';
    } else {
      newFlows[index].approved = false;
      newFlows[index].status = 'pending';
    }
    setFlows(newFlows);
  };

  const handleSelectFlow = (index: number) => {
    toggleFlowApproval(index);
  };

  const handleRunProcess = async () => {
    const approvedFlowsList = flows.filter(flow => flow.approved);
    console.log("Running process for selected flows:", approvedFlowsList);

    // Convert flows to natural language task descriptions
    const flowDescriptions = approvedFlowsList.map(flow => {
      return `${flow.name}: ${flow.description}. Instructions: ${flow.instructions}`;
    });

    try {
      // Set flows to executing state
      const newFlows = flows.map(flow =>
        flow.approved ? { ...flow, status: 'executing' as const } : flow
      );
      setFlows(newFlows);

      // Call parallel flows endpoint
      console.log("Calling parallel flows endpoint with:", flowDescriptions);
      const response = await fetch("http://localhost:8000/api/browser-cloud/parallel-flows", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          flows: flowDescriptions
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log("Parallel flows created successfully:", data);

      // Update flows with task IDs and start streaming
      let taskIndex = 0;
      const successFlows = flows.map(flow => {
        if (flow.approved) {
          const taskData = data.tasks[taskIndex];
          const updatedFlow = {
            ...flow,
            status: 'running' as const,
            taskId: taskData.task_id,
            sessionId: taskData.session_id,
            liveUrl: taskData.live_url
          };

          // Start streaming for this task
          setTimeout(() => startTaskStreaming(taskData.task_id), 1000);
          taskIndex++;

          return updatedFlow;
        }
        return flow;
      });
      setFlows(successFlows);

      // Set live sessions for embedding
      const runningSessions = successFlows.filter(flow => flow.status === 'running');
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

  const getApprovedFlows = () => flows.filter(flow => flow.approved);

  // Fetch detailed session information
  const fetchSessionDetails = async (taskId: string) => {
    try {
      const response = await fetch(`http://localhost:8000/api/browser-cloud/task/${taskId}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const details = await response.json();
      setSessionDetails(prev => ({
        ...prev,
        [taskId]: details
      }));

      return details;
    } catch (error) {
      console.error('Failed to fetch session details:', error);
      return null;
    }
  };

  // Start streaming logs for a task
  const startTaskStreaming = (taskId: string) => {
    if (activeStreams[taskId]) return; // Already streaming

    try {
      const eventSource = new EventSource(`http://localhost:8000/api/browser-cloud/task/${taskId}/stream`);

      // Initialize logs for this task
      setSessionLogs(prev => ({
        ...prev,
        [taskId]: { taskId, logs: [] }
      }));

      eventSource.onmessage = (event) => {
        const logData = JSON.parse(event.data);

        // Add log to session logs
        setSessionLogs(prev => ({
          ...prev,
          [taskId]: {
            ...prev[taskId],
            logs: [...(prev[taskId]?.logs || []), {
              type: logData.type,
              timestamp: logData.timestamp,
              data: logData
            }]
          }
        }));

        // Update live URL in flows when available
        if (logData.type === 'status' && logData.live_url) {
          setFlows(prevFlows =>
            prevFlows.map(flow =>
              flow.taskId === taskId
                ? { ...flow, liveUrl: logData.live_url }
                : flow
            )
          );

          setLiveSessions(prevSessions =>
            prevSessions.map(session =>
              session.taskId === taskId
                ? { ...session, liveUrl: logData.live_url }
                : session
            )
          );
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
        }
      };

      eventSource.onerror = () => {
        eventSource.close();
        setActiveStreams(prev => {
          const newStreams = { ...prev };
          delete newStreams[taskId];
          return newStreams;
        });
      };

      setActiveStreams(prev => ({ ...prev, [taskId]: eventSource }));
    } catch (error) {
      console.error('Failed to start streaming for task:', taskId, error);
    }
  };

  // --- ANIMATION VARIANTS ---
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring' as const, stiffness: 100 } }
  };

  // --- RENDER ---
  return (
    <div className="relative flex flex-col items-center w-full min-h-screen p-4 pt-24 overflow-y-auto font-sans text-gray-800 bg-[#F7F2ED]">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-rose-200/30 rounded-full filter blur-3xl animate-blob"></div>
        <div className="absolute bottom-0 right-0 w-2/3 h-2/3 bg-blue-200/30 rounded-full filter blur-3xl animate-blob animation-delay-4000"></div>
      </div>

      {/* Header */}
      <header className="absolute top-0 left-0 w-full p-8 z-20">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-semibold text-gray-700 tracking-tighter">qaesar</h1>
          <div className="flex gap-4">
            <a
              href="/browser-test"
              className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
            >
              Browser Test
            </a>
            <a
              href="/convex-test"
              className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              All Tests
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex flex-col items-center w-full max-w-2xl space-y-8">
        {/* Input Card */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          className="w-full"
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
              <div className="hidden md:flex items-center p-2 rounded-lg bg-black/5">
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
        <AnimatePresence>
          {showFlows && (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4"
            >
              {flows.map((flow, index) => (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  layout
                  whileHover={{ scale: 1.03, y: -5 }}
                  onClick={() => handleSelectFlow(index)}
                  className={`relative flex flex-col justify-between p-4 transition-colors bg-white/60 border rounded-2xl shadow-lg shadow-black/5 backdrop-blur-2xl cursor-pointer group ${flow.approved ? 'border-blue-500/50' : 'border-white/80'}`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2 text-gray-600">
                      {getFlowIcon(flow.name)}
                      <span className="px-2 py-0.5 text-xs text-gray-500 bg-black/5 rounded-full">
                        {flow.estimatedTime ? `${Math.round(flow.estimatedTime / 60)}m` : '2m'}
                      </span>
                    </div>
                    <h3 className="font-medium text-gray-800">{flow.name}</h3>
                    <p className="mt-1 text-sm text-gray-500">{flow.description}</p>
                  </div>
                  <div className="flex items-center justify-between mt-4">
                    <motion.div className={`flex items-center justify-center w-6 h-6 rounded-full border-2 transition-all ${flow.approved ? 'bg-blue-500 border-blue-500' : 'border-gray-300 bg-black/5'}`}>
                      <AnimatePresence>
                        {flow.approved && (
                          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                            <Check className="w-4 h-4 text-white" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          // You can add edit functionality here
                        }}
                        className="p-2 text-gray-400 transition-colors rounded-full hover:bg-black/10 hover:text-gray-700"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFlowAction(index, 'declined');
                        }}
                        className="p-2 text-gray-400 transition-colors rounded-full hover:bg-red-500/10 hover:text-red-500"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Live Browser Sessions */}
      <AnimatePresence>
        {liveSessions.length > 0 && (
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className="mt-8 space-y-6"
          >
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <Globe className="text-blue-500" />
              Live Browser Sessions ({liveSessions.length})
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {liveSessions.map((session, index) => (
                <motion.div
                  key={session.taskId}
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden cursor-pointer hover:shadow-xl transition-all"
                  onClick={() => {
                    console.log("Session clicked:", session.taskId, session);
                    if (session.taskId) {
                      setSelectedSessionDetails(session.taskId);
                      fetchSessionDetails(session.taskId);
                    }
                  }}
                >
                  {/* Session Header */}
                  <div className="p-4 bg-gray-50 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-800 truncate">{session.name}</h3>
                        <p className="text-sm text-gray-600 truncate">{session.description}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                          <span className="text-xs text-green-600 font-medium">LIVE</span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent session card click
                            console.log("View Logs clicked for session:", session.taskId, session);
                            console.log("Current sessionLogs:", sessionLogs);
                            if (session.taskId) {
                              setSelectedSessionLogs(session.taskId);
                            }
                          }}
                          className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                        >
                          View Logs
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Live Browser Iframe */}
                  <div className="relative">
                    {session.liveUrl ? (
                      <iframe
                        src={session.liveUrl}
                        className="w-full h-96 border-0"
                        title={`Live browser session: ${session.name}`}
                        allow="camera; microphone; geolocation"
                        sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
                      />
                    ) : (
                      <div className="w-full h-96 bg-gray-100 flex items-center justify-center">
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                          <p className="text-gray-600">Loading browser session...</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Session Footer */}
                  <div className="p-3 bg-gray-50 border-t border-gray-200">
                    <div className="flex items-center justify-between text-xs text-gray-600">
                      <span>Task ID: {session.taskId?.slice(0, 8)}...</span>
                      <span>Status: {session.status}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Session Details Modal */}
      <AnimatePresence>
        {selectedSessionDetails && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedSessionDetails(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="p-6 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-gray-800">Session Details</h3>
                  <p className="text-sm text-gray-600">Task ID: {selectedSessionDetails}</p>
                </div>
                <button
                  onClick={() => setSelectedSessionDetails(null)}
                  className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Session Details Content */}
              <div className="flex h-[calc(90vh-120px)]">
                {/* Left Panel - Session Info */}
                <div className="w-1/2 p-6 border-r border-gray-200 overflow-y-auto">
                  <div className="space-y-6">
                    {/* Session Overview */}
                    <div>
                      <h4 className="text-lg font-semibold text-gray-800 mb-3">Session Overview</h4>
                      {sessionDetails[selectedSessionDetails] ? (
                        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">Status:</span>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${sessionDetails[selectedSessionDetails].status === 'running' ? 'bg-yellow-100 text-yellow-800' :
                              sessionDetails[selectedSessionDetails].status === 'completed' ? 'bg-green-100 text-green-800' :
                                sessionDetails[selectedSessionDetails].status === 'failed' ? 'bg-red-100 text-red-800' :
                                  'bg-gray-100 text-gray-800'
                              }`}>
                              {sessionDetails[selectedSessionDetails].status}
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="font-medium">Steps Completed:</span>
                            <span className="text-blue-600 font-medium">
                              {sessionDetails[selectedSessionDetails].steps_count || 0}
                            </span>
                          </div>

                          {sessionDetails[selectedSessionDetails].live_url && (
                            <div>
                              <span className="font-medium">Live URL:</span>
                              <a
                                href={sessionDetails[selectedSessionDetails].live_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block text-blue-600 hover:underline text-sm mt-1 break-all"
                              >
                                {sessionDetails[selectedSessionDetails].live_url}
                              </a>
                            </div>
                          )}

                          {sessionDetails[selectedSessionDetails].started_at && (
                            <div className="flex items-center justify-between">
                              <span className="font-medium">Started:</span>
                              <span className="text-sm text-gray-600">
                                {new Date(sessionDetails[selectedSessionDetails].started_at).toLocaleString()}
                              </span>
                            </div>
                          )}

                          {sessionDetails[selectedSessionDetails].finished_at && (
                            <div className="flex items-center justify-between">
                              <span className="font-medium">Finished:</span>
                              <span className="text-sm text-gray-600">
                                {new Date(sessionDetails[selectedSessionDetails].finished_at).toLocaleString()}
                              </span>
                            </div>
                          )}

                          {sessionDetails[selectedSessionDetails].is_success !== null && (
                            <div className="flex items-center justify-between">
                              <span className="font-medium">Success:</span>
                              <span className={`px-2 py-1 rounded text-xs font-medium ${sessionDetails[selectedSessionDetails].is_success
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                                }`}>
                                {sessionDetails[selectedSessionDetails].is_success ? 'Yes' : 'No'}
                              </span>
                            </div>
                          )}

                          {sessionDetails[selectedSessionDetails].done_output && (
                            <div>
                              <span className="font-medium">Output:</span>
                              <div className="mt-1 p-2 bg-white border rounded text-sm">
                                {sessionDetails[selectedSessionDetails].done_output}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center justify-center py-8">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                          <span className="ml-2 text-gray-600">Loading session details...</span>
                        </div>
                      )}
                    </div>

                    {/* Steps Breakdown */}
                    {sessionDetails[selectedSessionDetails]?.steps && (
                      <div>
                        <h4 className="text-lg font-semibold text-gray-800 mb-3">Execution Steps</h4>
                        <div className="space-y-3 max-h-64 overflow-y-auto">
                          {sessionDetails[selectedSessionDetails].steps.map((step: any, index: number) => (
                            <div key={index} className="bg-gray-50 rounded-lg p-3 border-l-4 border-blue-500">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium text-sm">Step {index + 1}</span>
                                <span className="text-xs text-gray-500">{step.url}</span>
                              </div>
                              {step.next_goal && (
                                <p className="text-sm text-gray-700 mb-2">
                                  <strong>Goal:</strong> {step.next_goal}
                                </p>
                              )}
                              {step.evaluation_previous_goal && (
                                <p className="text-sm text-gray-600">
                                  <strong>Evaluation:</strong> {step.evaluation_previous_goal}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Panel - Live Logs */}
                <div className="w-1/2 p-6 overflow-y-auto">
                  <h4 className="text-lg font-semibold text-gray-800 mb-3">Real-time Logs</h4>
                  {sessionLogs[selectedSessionDetails]?.logs.length > 0 ? (
                    <div className="space-y-3">
                      {sessionLogs[selectedSessionDetails].logs.map((log, index) => (
                        <div
                          key={index}
                          className={`p-3 rounded-lg text-sm ${log.type === 'step' ? 'bg-blue-50 border-blue-200' :
                            log.type === 'status' ? 'bg-yellow-50 border-yellow-200' :
                              log.type === 'completion' ? 'bg-green-50 border-green-200' :
                                'bg-red-50 border-red-200'
                            } border`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <span className="font-medium capitalize text-gray-800">{log.type}</span>
                            <span className="text-xs text-gray-500">
                              {new Date(log.timestamp).toLocaleTimeString()}
                            </span>
                          </div>

                          {log.type === 'step' && log.data.step && (
                            <div className="space-y-1">
                              <p><strong>Goal:</strong> {log.data.step.next_goal}</p>
                              {log.data.step.evaluation_previous_goal && (
                                <p><strong>Evaluation:</strong> {log.data.step.evaluation_previous_goal}</p>
                              )}
                            </div>
                          )}

                          {log.type === 'status' && (
                            <div className="space-y-1">
                              <p><strong>Status:</strong> {log.data.status}</p>
                              <p><strong>Steps:</strong> {log.data.steps_count}</p>
                            </div>
                          )}

                          {log.type === 'completion' && (
                            <div>
                              <p><strong>Final Status:</strong> {log.data.status}</p>
                              {log.data.output && <p><strong>Output:</strong> {log.data.output}</p>}
                            </div>
                          )}

                          {log.type === 'error' && (
                            <p className="text-red-700">{log.data.error}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No logs available yet...</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Session Logs Modal */}
      <AnimatePresence>
        {selectedSessionLogs && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedSessionLogs(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Session Logs</h3>
                  <p className="text-sm text-gray-600">Task ID: {selectedSessionLogs}</p>
                </div>
                <button
                  onClick={() => setSelectedSessionLogs(null)}
                  className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Logs Content */}
              <div className="p-4 max-h-96 overflow-y-auto">
                {sessionLogs[selectedSessionLogs]?.logs.length > 0 ? (
                  <div className="space-y-3">
                    {sessionLogs[selectedSessionLogs].logs.map((log, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-lg text-sm ${log.type === 'step' ? 'bg-blue-50 border-blue-200' :
                          log.type === 'status' ? 'bg-yellow-50 border-yellow-200' :
                            log.type === 'completion' ? 'bg-green-50 border-green-200' :
                              'bg-red-50 border-red-200'
                          } border`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-medium capitalize text-gray-800">{log.type}</span>
                          <span className="text-xs text-gray-500">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </span>
                        </div>

                        {log.type === 'step' && log.data.step && (
                          <div className="space-y-1">
                            <p><strong>Goal:</strong> {log.data.step.next_goal}</p>
                            {log.data.step.evaluation_previous_goal && (
                              <p><strong>Evaluation:</strong> {log.data.step.evaluation_previous_goal}</p>
                            )}
                          </div>
                        )}

                        {log.type === 'status' && (
                          <div className="space-y-1">
                            <p><strong>Status:</strong> {log.data.status}</p>
                            <p><strong>Steps:</strong> {log.data.steps_count}</p>
                          </div>
                        )}

                        {log.type === 'completion' && (
                          <div>
                            <p><strong>Final Status:</strong> {log.data.status}</p>
                            {log.data.output && <p><strong>Output:</strong> {log.data.output}</p>}
                          </div>
                        )}

                        {log.type === 'error' && (
                          <p className="text-red-700">{log.data.error}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No logs available yet...</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* "Run Selected" Button */}
      <AnimatePresence>
        {hasSelection && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 30 }}
            className="fixed bottom-8 z-20"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleRunProcess}
              className="px-8 py-4 font-semibold text-white bg-gray-800 rounded-full shadow-2xl shadow-black/20"
            >
              Run {selectedFlows.length} Selected
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- STYLES & ANIMATIONS --- */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob { animation: blob 10s infinite; }
        .animation-delay-4000 { animation-delay: -4s; }
        body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
      `}</style>
    </div>
  );
};

export default HomePage;