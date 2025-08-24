"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, RefreshCw, Play, Pause, Globe, Activity, FileText, Network, Terminal } from 'lucide-react';
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { SignInButton, UserButton } from "@clerk/nextjs";

interface SessionLog {
  taskId: string;
  logs: Array<{
    type: 'step' | 'status' | 'completion' | 'error';
    timestamp: string;
    data: Record<string, unknown>;
  }>;
}

interface NetworkLog {
  timestamp: string;
  method: string;
  url: string;
  status: number;
  responseTime: number;
  requestSize: number;
  responseSize: number;
  headers: Record<string, string>;
}

interface SessionDetails {
  status?: string;
  steps_count?: number;
  live_url?: string;
  started_at?: string;
  finished_at?: string;
  done_output?: string;
  steps?: Array<{
    url?: string;
    next_goal?: string;
    evaluation_previous_goal?: string;
    network_requests?: Array<{
      method?: string;
      url?: string;
      status?: number;
      response_time?: number;
      request_size?: number;
      response_size?: number;
      headers?: Record<string, string>;
    }>;
  }>;
}

interface NetworkRequest {
  method?: string;
  url?: string;
  status?: number;
  response_time?: number;
  request_size?: number;
  response_size?: number;
  headers?: Record<string, string>;
}

interface Step {
  url?: string;
  next_goal?: string;
  evaluation_previous_goal?: string;
  network_requests?: NetworkRequest[];
}

const LogsPage = () => {
  const params = useParams();
  const searchParams = useSearchParams();
  const taskId = params.taskId as string;

  // State management
  const [sessionDetails, setSessionDetails] = useState<SessionDetails | null>(null);
  const [sessionLogs, setSessionLogs] = useState<SessionLog | null>(null);
  const [networkLogs, setNetworkLogs] = useState<NetworkLog[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'logs' | 'network' | 'steps'>('overview');
  const [isStreaming, setIsStreaming] = useState(false);
  const [eventSource, setEventSource] = useState<EventSource | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const logsEndRef = useRef<HTMLDivElement>(null);
  const networkEndRef = useRef<HTMLDivElement>(null);

  // Fetch session details
  const fetchSessionDetails = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/browser-cloud/task/${taskId}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const details = await response.json();
      setSessionDetails(details);

      // Extract network logs from steps if available
      if (details.steps) {
        const extractedNetworkLogs: NetworkLog[] = [];
        details.steps.forEach((step: Step) => {
          if (step.network_requests) {
            step.network_requests.forEach((req: NetworkRequest) => {
              extractedNetworkLogs.push({
                timestamp: new Date().toISOString(),
                method: req.method || 'GET',
                url: req.url || step.url || 'unknown',
                status: req.status || 200,
                responseTime: req.response_time || 0,
                requestSize: req.request_size || 0,
                responseSize: req.response_size || 0,
                headers: req.headers || {}
              });
            });
          }
        });
        setNetworkLogs(extractedNetworkLogs);
      }
    } catch (error) {
      console.error('Failed to fetch session details:', error);
    }
  };

  // Start streaming logs
  const startStreaming = useCallback(() => {
    if (eventSource) return;

    try {
      const es = new EventSource(`http://localhost:8000/api/browser-cloud/task/${taskId}/stream`);
      setEventSource(es);
      setIsStreaming(true);

      // Initialize logs
      setSessionLogs({ taskId, logs: [] });

      es.onmessage = (event) => {
        const logData = JSON.parse(event.data);

        setSessionLogs(prev => ({
          ...prev!,
          logs: [...(prev?.logs || []), {
            type: logData.type,
            timestamp: logData.timestamp,
            data: logData
          }]
        }));

        // Auto-scroll to bottom
        setTimeout(() => {
          logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      };

      es.onerror = () => {
        es.close();
        setEventSource(null);
        setIsStreaming(false);
      };
    } catch (error) {
      console.error('Failed to start streaming:', error);
    }
  }, [eventSource, taskId]);

  // Stop streaming
  const stopStreaming = () => {
    if (eventSource) {
      eventSource.close();
      setEventSource(null);
      setIsStreaming(false);
    }
  };

  // Toggle auto-refresh
  const toggleAutoRefresh = () => {
    setAutoRefresh(!autoRefresh);
    if (!autoRefresh) {
      fetchSessionDetails();
    }
  };

  // Fetch details on mount and start streaming
  useEffect(() => {
    fetchSessionDetails();
    startStreaming();

    // Auto-refresh session details
    const interval = setInterval(() => {
      if (autoRefresh) {
        fetchSessionDetails();
      }
    }, 5000);

    return () => {
      clearInterval(interval);
      stopStreaming();
    };
  }, [taskId, autoRefresh, startStreaming]);

  // Auto-scroll network logs
  useEffect(() => {
    setTimeout(() => {
      networkEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }, [networkLogs]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getLogTypeColor = (type: string) => {
    switch (type) {
      case 'step': return 'bg-blue-50 border-blue-200';
      case 'status': return 'bg-yellow-50 border-yellow-200';
      case 'completion': return 'bg-green-50 border-green-200';
      case 'error': return 'bg-red-50 border-red-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  const getMethodColor = (method: string) => {
    switch (method.toUpperCase()) {
      case 'GET': return 'bg-green-100 text-green-800';
      case 'POST': return 'bg-blue-100 text-blue-800';
      case 'PUT': return 'bg-yellow-100 text-yellow-800';
      case 'DELETE': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColorClass = (status: number) => {
    if (status >= 200 && status < 300) return 'text-green-600';
    if (status >= 400 && status < 500) return 'text-yellow-600';
    if (status >= 500) return 'text-red-600';
    return 'text-gray-600';
  };

  // Helper function to safely extract string values from log data
  const getLogValue = (data: Record<string, unknown>, key: string): string => {
    const value = data[key];
    return value != null ? String(value) : '';
  };

  const getStepValue = (step: Record<string, unknown>, key: string): string => {
    const value = step[key];
    return value != null ? String(value) : '';
  };

  return (
    <>
      <AuthLoading>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-800 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-700">Loading...</h2>
            <p className="text-gray-500 mt-2">Checking authentication status</p>
          </div>
        </div>
      </AuthLoading>
      <Unauthenticated>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center max-w-md">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Authentication Required</h1>
            <p className="text-gray-600 mb-6">You need to sign in to view session details</p>
            <SignInButton mode="modal">
              <button className="px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium">
                Sign In to Continue
              </button>
            </SignInButton>
          </div>
        </div>
      </Unauthenticated>
      <Authenticated>
        <LogsPageContent />
      </Authenticated>
    </>
  );
};

const LogsPageContent = () => {
  const params = useParams();
  const searchParams = useSearchParams();
  const taskId = params.taskId as string;

  // Session info from URL params
  const sessionName = searchParams.get('name') || 'Unknown Session';
  const sessionDescription = searchParams.get('description') || 'No description available';

  // State management
  const [sessionDetails, setSessionDetails] = useState<SessionDetails | null>(null);
  const [sessionLogs, setSessionLogs] = useState<SessionLog | null>(null);
  const [networkLogs, setNetworkLogs] = useState<NetworkLog[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'logs' | 'network' | 'steps'>('overview');
  const [isStreaming, setIsStreaming] = useState(false);
  const [eventSource, setEventSource] = useState<EventSource | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const logsEndRef = useRef<HTMLDivElement>(null);
  const networkEndRef = useRef<HTMLDivElement>(null);

  // Fetch session details
  const fetchSessionDetails = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/browser-cloud/task/${taskId}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const details = await response.json();
      setSessionDetails(details);

      // Extract network logs from steps if available
      if (details.steps) {
        const extractedNetworkLogs: NetworkLog[] = [];
        details.steps.forEach((step: Step) => {
          if (step.network_requests) {
            step.network_requests.forEach((req: NetworkRequest) => {
              extractedNetworkLogs.push({
                timestamp: new Date().toISOString(),
                method: req.method || 'GET',
                url: req.url || step.url || 'unknown',
                status: req.status || 200,
                responseTime: req.response_time || 0,
                requestSize: req.request_size || 0,
                responseSize: req.response_size || 0,
                headers: req.headers || {}
              });
            });
          }
        });
        setNetworkLogs(extractedNetworkLogs);
      }
    } catch (error) {
      console.error('Failed to fetch session details:', error);
    }
  };

  // Start streaming logs
  const startStreaming = useCallback(() => {
    if (eventSource) return;

    try {
      const es = new EventSource(`http://localhost:8000/api/browser-cloud/task/${taskId}/stream`);
      setEventSource(es);
      setIsStreaming(true);

      // Initialize logs
      setSessionLogs({ taskId, logs: [] });

      es.onmessage = (event) => {
        const logData = JSON.parse(event.data);

        setSessionLogs(prev => ({
          ...prev!,
          logs: [...(prev?.logs || []), {
            type: logData.type,
            timestamp: logData.timestamp,
            data: logData
          }]
        }));

        // Auto-scroll to bottom
        setTimeout(() => {
          logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      };

      es.onerror = () => {
        es.close();
        setEventSource(null);
        setIsStreaming(false);
      };
    } catch (error) {
      console.error('Failed to start streaming:', error);
    }
  }, [eventSource, taskId]);

  // Stop streaming
  const stopStreaming = () => {
    if (eventSource) {
      eventSource.close();
      setEventSource(null);
      setIsStreaming(false);
    }
  };

  // Toggle auto-refresh
  const toggleAutoRefresh = () => {
    setAutoRefresh(!autoRefresh);
    if (!autoRefresh) {
      fetchSessionDetails();
    }
  };

  // Fetch details on mount and start streaming
  useEffect(() => {
    fetchSessionDetails();
    startStreaming();

    // Auto-refresh session details
    const interval = setInterval(() => {
      if (autoRefresh) {
        fetchSessionDetails();
      }
    }, 5000);

    return () => {
      clearInterval(interval);
      stopStreaming();
    };
  }, [taskId, autoRefresh, startStreaming]);

  // Auto-scroll network logs
  useEffect(() => {
    setTimeout(() => {
      networkEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }, [networkLogs]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getLogTypeColor = (type: string) => {
    switch (type) {
      case 'step': return 'bg-blue-50 border-blue-200';
      case 'status': return 'bg-yellow-50 border-yellow-200';
      case 'completion': return 'bg-green-50 border-green-200';
      case 'error': return 'bg-red-50 border-red-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  const getMethodColor = (method: string) => {
    switch (method.toUpperCase()) {
      case 'GET': return 'bg-green-100 text-green-800';
      case 'POST': return 'bg-blue-100 text-blue-800';
      case 'PUT': return 'bg-yellow-100 text-yellow-800';
      case 'DELETE': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColorClass = (status: number) => {
    if (status >= 200 && status < 300) return 'text-green-600';
    if (status >= 400 && status < 500) return 'text-yellow-600';
    if (status >= 500) return 'text-red-600';
    return 'text-gray-600';
  };

  // Helper function to safely extract string values from log data
  const getLogValue = (data: Record<string, unknown>, key: string): string => {
    const value = data[key];
    return value != null ? String(value) : '';
  };

  const getStepValue = (step: Record<string, unknown>, key: string): string => {
    const value = step[key];
    return value != null ? String(value) : '';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => window.history.back()}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">{sessionName}</h1>
                <p className="text-sm text-gray-500">{sessionDescription}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={toggleAutoRefresh}
                className={`px-3 py-1 text-xs rounded-full transition-colors ${autoRefresh
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-700'
                  }`}
              >
                <RefreshCw size={14} className={`inline mr-1 ${autoRefresh ? 'animate-spin' : ''}`} />
                Auto-refresh {autoRefresh ? 'ON' : 'OFF'}
              </button>

              {isStreaming ? (
                <button
                  onClick={stopStreaming}
                  className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded-full hover:bg-red-200 transition-colors"
                >
                  <Pause size={14} className="inline mr-1" />
                  Stop
                </button>
              ) : (
                <button
                  onClick={startStreaming}
                  className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded-full hover:bg-green-200 transition-colors"
                >
                  <Play size={14} className="inline mr-1" />
                  Start
                </button>
              )}

              <UserButton afterSignOutUrl="/" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Session Overview Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {sessionDetails?.status || 'Unknown'}
              </div>
              <div className="text-sm text-gray-500">Status</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {sessionDetails?.steps_count || 0}
              </div>
              <div className="text-sm text-gray-500">Steps Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {networkLogs.length}
              </div>
              <div className="text-sm text-gray-500">Network Requests</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {sessionLogs?.logs.length || 0}
              </div>
              <div className="text-sm text-gray-500">Log Entries</div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'overview', label: 'Overview', icon: Globe },
                { id: 'logs', label: 'Console Logs', icon: Terminal },
                { id: 'network', label: 'Network Logs', icon: Network },
                { id: 'steps', label: 'Execution Steps', icon: FileText }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as 'overview' | 'logs' | 'network' | 'steps')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors ${activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                  >
                    <Icon size={16} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            <AnimatePresence mode="wait">
              {activeTab === 'overview' && (
                <motion.div
                  key="overview"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  {/* Live Preview */}
                  {sessionDetails?.live_url && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                        <Globe size={20} className="mr-2" />
                        Live Browser Preview
                      </h3>
                      <div className="border border-gray-200 rounded-lg overflow-hidden">
                        <iframe
                          src={sessionDetails.live_url}
                          className="w-full h-96 border-0"
                          title="Live browser session"
                          allow="camera; microphone; geolocation"
                          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
                        />
                      </div>
                    </div>
                  )}

                  {/* Session Details */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                      <Activity size={20} className="mr-2" />
                      Session Details
                    </h3>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3 text-black">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Task ID:</span>
                        <span className="font-mono text-sm">{taskId}</span>
                      </div>
                      <div className="flex items-center justify-between text-black">
                        <span className="font-medium">Status:</span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(sessionDetails?.status || '')}`}>
                          {sessionDetails?.status || 'Unknown'}
                        </span>
                      </div>
                      {sessionDetails?.started_at && (
                        <div className="flex items-center justify-between">
                          <span className="font-medium">Started:</span>
                          <span className="text-sm text-gray-600">
                            {new Date(sessionDetails.started_at).toLocaleString()}
                          </span>
                        </div>
                      )}
                      {sessionDetails?.finished_at && (
                        <div className="flex items-center justify-between">
                          <span className="font-medium">Finished:</span>
                          <span className="text-sm text-gray-600">
                            {new Date(sessionDetails.finished_at).toLocaleString()}
                          </span>
                        </div>
                      )}
                      {sessionDetails?.done_output && (
                        <div>
                          <span className="font-medium">Output:</span>
                          <div className="mt-1 p-2 bg-white border rounded text-sm">
                            {sessionDetails.done_output}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'logs' && (
                <motion.div
                  key="logs"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Console Logs</h3>
                    <div className="text-sm text-gray-500">
                      {sessionLogs?.logs.length || 0} entries
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                    {sessionLogs?.logs.length ? (
                      <div className="space-y-3">
                        {sessionLogs.logs.map((log, index) => (
                          <div
                            key={index}
                            className={`p-3 rounded-lg text-sm ${getLogTypeColor(log.type)} border`}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <span className="font-medium capitalize text-black">{log.type}</span>
                              <span className="text-xs text-black">
                                {new Date(log.timestamp).toLocaleTimeString()}
                              </span>
                            </div>

                            {log.type === 'step' && log.data.step && (
                              <div className="space-y-1 text-black">
                                <p><strong>Goal:</strong> {getStepValue(log.data.step as Record<string, unknown>, 'next_goal')}</p>
                                {(log.data.step as Record<string, unknown>).evaluation_previous_goal && (
                                  <p><strong>Evaluation:</strong> {getStepValue(log.data.step as Record<string, unknown>, 'evaluation_previous_goal')}</p>
                                )}
                              </div>
                            )}

                            {log.type === 'status' && (
                              <div className="space-y-1 text-black">
                                <p><strong>Status:</strong> {getLogValue(log.data, 'status')}</p>
                                <p><strong>Steps:</strong> {getLogValue(log.data, 'steps_count')}</p>
                              </div>
                            )}

                            {log.type === 'completion' && (
                              <div className="text-black">
                                <p><strong>Final Status:</strong> {getLogValue(log.data, 'status')}</p>
                                {log.data.output && <p><strong>Output:</strong> {getLogValue(log.data, 'output')}</p>}
                              </div>
                            )}

                            {log.type === 'error' && (
                              <p className="text-red-700">{getLogValue(log.data, 'error')}</p>
                            )}
                          </div>
                        ))}
                        <div ref={logsEndRef} />
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-gray-500">No logs available yet...</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {activeTab === 'network' && (
                <motion.div
                  key="network"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Network Logs</h3>
                    <div className="text-sm text-gray-500">
                      {networkLogs.length} requests
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                    {networkLogs.length ? (
                      <div className="space-y-3">
                        {networkLogs.map((log, index) => (
                          <div key={index} className="bg-white rounded-lg p-3 border border-gray-200">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <span className={`px-2 py-1 rounded text-xs font-medium ${getMethodColor(log.method)}`}>
                                  {log.method}
                                </span>
                                <span className={`font-medium ${getStatusColorClass(log.status)}`}>
                                  {log.status}
                                </span>
                              </div>
                              <span className="text-xs text-gray-500">
                                {new Date(log.timestamp).toLocaleTimeString()}
                              </span>
                            </div>

                            <div className="space-y-1 text-sm">
                              <p><strong>URL:</strong> <span className="font-mono break-all">{log.url}</span></p>
                              <div className="flex space-x-4 text-xs text-gray-600">
                                <span>Response: {log.responseTime}ms</span>
                                <span>Request: {log.requestSize}B</span>
                                <span>Response: {log.responseSize}B</span>
                              </div>
                            </div>
                          </div>
                        ))}
                        <div ref={networkEndRef} />
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-gray-500">No network logs available yet...</p>
                        <p className="text-xs text-gray-400 mt-2">
                          Network logs will appear here as the browser session progresses
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {activeTab === 'steps' && (
                <motion.div
                  key="steps"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Execution Steps</h3>
                    <div className="text-sm text-gray-500">
                      {sessionDetails?.steps?.length || 0} steps
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                    {sessionDetails?.steps?.length ? (
                      <div className="space-y-3">
                        {sessionDetails.steps.map((step: Step, index: number) => (
                          <div key={index} className="bg-white rounded-lg p-3 border-l-4 border-blue-500">
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
                            {step.network_requests && step.network_requests.length > 0 && (
                              <div className="mt-2 pt-2 border-t border-gray-200">
                                <p className="text-xs font-medium text-gray-600 mb-1">Network Requests:</p>
                                <div className="space-y-1">
                                  {step.network_requests.map((req: NetworkRequest, reqIndex: number) => (
                                    <div key={reqIndex} className="text-xs bg-gray-50 p-2 rounded">
                                      <span className={`inline-block px-1 py-0.5 rounded text-xs font-medium mr-2 ${getMethodColor(req.method || 'GET')}`}>
                                        {req.method || 'GET'}
                                      </span>
                                      <span className="font-mono">{req.url || 'unknown'}</span>
                                      {req.status && (
                                        <span className={`ml-2 ${getStatusColorClass(req.status)}`}>
                                          {req.status}
                                        </span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-gray-500">No execution steps available yet...</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
};

export default LogsPage;
