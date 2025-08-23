"use client";

import { useState } from "react";

interface BrowserTaskResult {
    task_id: string;
    session_id: string;
    live_url?: string;
    status: string;
}

interface ParallelFlowsResult {
    batch_id: string;
    tasks: BrowserTaskResult[];
    total_tasks: number;
}

interface StreamEvent {
    type: 'step' | 'status' | 'completion' | 'error';
    task_id: string;
    timestamp: string;
    step?: any;
    status?: string;
    live_url?: string;
    steps_count?: number;
    output?: string;
    error?: string;
}

export default function BrowserTestPage() {
    // Single task state
    const [task, setTask] = useState("Navigate to google.com and search for 'AI automation'");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<BrowserTaskResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Parallel flows state - inspired by project_summary.md
    const [parallelFlows, setParallelFlows] = useState([
        "Search Google for weather in Tokyo",
        "Check Reddit front page title",
        "Look up Bitcoin price on Coinbase",
        "Find NASA image of the day"
    ]);
    const [parallelResult, setParallelResult] = useState<ParallelFlowsResult | null>(null);
    const [parallelLoading, setParallelLoading] = useState(false);

    // Streaming state
    const [streamingTaskId, setStreamingTaskId] = useState<string>("");
    const [streamEvents, setStreamEvents] = useState<StreamEvent[]>([]);
    const [isStreaming, setIsStreaming] = useState(false);

    // Single task creation
    const createTask = async () => {
        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const response = await fetch("http://localhost:8000/api/browser-cloud/create-task", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    task: task
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || `HTTP ${response.status}`);
            }

            const data: BrowserTaskResult = await response.json();
            setResult(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unknown error occurred");
        } finally {
            setLoading(false);
        }
    };

    // Parallel flows function - inspired by project_summary.md
    const createParallelFlows = async () => {
        setParallelLoading(true);
        setError(null);
        setParallelResult(null);

        try {
            const response = await fetch("http://localhost:8000/api/browser-cloud/parallel-flows", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    flows: parallelFlows
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || `HTTP ${response.status}`);
            }

            const data: ParallelFlowsResult = await response.json();
            setParallelResult(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to create parallel flows");
        } finally {
            setParallelLoading(false);
        }
    };

    // Streaming function for real-time task monitoring
    const startStreaming = async (taskId: string) => {
        if (!taskId) return;

        setStreamingTaskId(taskId);
        setStreamEvents([]);
        setIsStreaming(true);

        try {
            const eventSource = new EventSource(`http://localhost:8000/api/browser-cloud/task/${taskId}/stream`);

            eventSource.onmessage = (event) => {
                const streamEvent: StreamEvent = JSON.parse(event.data);
                setStreamEvents(prev => [...prev, streamEvent]);

                if (streamEvent.type === 'completion' || streamEvent.type === 'error') {
                    eventSource.close();
                    setIsStreaming(false);
                }
            };

            eventSource.onerror = () => {
                eventSource.close();
                setIsStreaming(false);
                setError("Streaming connection failed");
            };

        } catch (err) {
            setIsStreaming(false);
            setError(err instanceof Error ? err.message : "Failed to start streaming");
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="space-y-8">

                    {/* Header */}
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">
                            Browser Use Cloud Test
                        </h1>
                        <p className="text-gray-600">
                            Test single tasks, parallel flows, and real-time streaming
                        </p>
                    </div>

                    {/* Error Display */}
                    {error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                            <strong>Error:</strong> {error}
                        </div>
                    )}

                    {/* Single Task Section */}
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">
                            Single Browser Task
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label htmlFor="task" className="block text-sm font-medium text-gray-700 mb-2">
                                    Task Description
                                </label>
                                <textarea
                                    id="task"
                                    rows={3}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={task}
                                    onChange={(e) => setTask(e.target.value)}
                                    placeholder="Enter a natural language task for the browser agent..."
                                />
                            </div>

                            <button
                                onClick={createTask}
                                disabled={loading}
                                className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-6 py-2 rounded-md font-medium"
                            >
                                {loading ? "Creating Task..." : "Create Single Task"}
                            </button>

                            {result && (
                                <div className="bg-green-50 border border-green-200 rounded-md p-4">
                                    <h3 className="font-medium text-green-900 mb-2">Task Created Successfully!</h3>
                                    <div className="text-sm text-green-700 space-y-1">
                                        <p><strong>Task ID:</strong> {result.task_id}</p>
                                        <p><strong>Status:</strong> {result.status}</p>
                                        <div className="mt-3 space-x-2">
                                            <button
                                                onClick={() => startStreaming(result.task_id)}
                                                disabled={isStreaming}
                                                className="bg-purple-500 hover:bg-purple-600 disabled:bg-purple-300 text-white px-4 py-1 rounded text-sm"
                                            >
                                                {isStreaming ? "Streaming..." : "Stream Logs"}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Parallel Flows Section */}
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">
                            Parallel Browser Flows
                        </h2>
                        <p className="text-gray-600 mb-4">
                            Inspired by project_summary.md example - run multiple tasks simultaneously
                        </p>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Flows to Execute in Parallel
                                </label>
                                {parallelFlows.map((flow, index) => (
                                    <div key={index} className="flex items-center space-x-2 mb-2">
                                        <input
                                            type="text"
                                            value={flow}
                                            onChange={(e) => {
                                                const updated = [...parallelFlows];
                                                updated[index] = e.target.value;
                                                setParallelFlows(updated);
                                            }}
                                            className="flex-1 border border-gray-300 rounded-md px-3 py-1 text-sm"
                                        />
                                        <button
                                            onClick={() => setParallelFlows(flows => flows.filter((_, i) => i !== index))}
                                            className="text-red-500 hover:text-red-700 text-sm px-2"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                ))}
                                <button
                                    onClick={() => setParallelFlows([...parallelFlows, ""])}
                                    className="text-blue-500 hover:text-blue-700 text-sm"
                                >
                                    + Add Flow
                                </button>
                            </div>

                            <button
                                onClick={createParallelFlows}
                                disabled={parallelLoading}
                                className="bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white px-6 py-2 rounded-md font-medium"
                            >
                                {parallelLoading ? "Creating Parallel Flows..." : "Create Parallel Flows"}
                            </button>

                            {parallelResult && (
                                <div className="bg-green-50 border border-green-200 rounded-md p-4">
                                    <h3 className="font-medium text-green-900 mb-2">
                                        {parallelResult.total_tasks} Parallel Tasks Created!
                                    </h3>
                                    <p className="text-sm text-green-700 mb-3">
                                        <strong>Batch ID:</strong> {parallelResult.batch_id}
                                    </p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {parallelResult.tasks.map((task, index) => (
                                            <div key={index} className="bg-white border border-green-200 rounded p-3">
                                                <p className="text-sm font-medium text-gray-900">Task {index + 1}</p>
                                                <p className="text-xs text-gray-600 truncate">ID: {task.task_id}</p>
                                                <p className="text-xs text-green-600">Status: {task.status}</p>
                                                <button
                                                    onClick={() => startStreaming(task.task_id)}
                                                    disabled={isStreaming}
                                                    className="mt-2 bg-purple-500 hover:bg-purple-600 disabled:bg-purple-300 text-white px-3 py-1 rounded text-xs"
                                                >
                                                    Stream
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Streaming Section */}
                    {streamingTaskId && (
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">
                                Real-Time Task Streaming
                            </h2>
                            <p className="text-gray-600 mb-4">
                                <strong>Streaming Task:</strong> {streamingTaskId}
                            </p>

                            <div className="max-h-96 overflow-y-auto bg-gray-50 border rounded-md p-4">
                                {streamEvents.length === 0 ? (
                                    <p className="text-gray-500 italic">Waiting for events...</p>
                                ) : (
                                    <div className="space-y-2">
                                        {streamEvents.map((event, index) => (
                                            <div key={index} className={`p-3 rounded-md text-sm ${event.type === 'step' ? 'bg-blue-50 border-blue-200' :
                                                    event.type === 'status' ? 'bg-yellow-50 border-yellow-200' :
                                                        event.type === 'completion' ? 'bg-green-50 border-green-200' :
                                                            'bg-red-50 border-red-200'
                                                } border`}>
                                                <div className="flex justify-between items-start">
                                                    <span className="font-medium capitalize">{event.type}</span>
                                                    <span className="text-xs text-gray-500">
                                                        {new Date(event.timestamp).toLocaleTimeString()}
                                                    </span>
                                                </div>

                                                {event.type === 'status' && (
                                                    <div className="mt-1 space-y-1">
                                                        <p>Status: {event.status}</p>
                                                        <p>Steps: {event.steps_count}</p>
                                                        {event.live_url && (
                                                            <p>
                                                                <a
                                                                    href={event.live_url}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="text-blue-600 hover:underline"
                                                                >
                                                                    View Live Browser
                                                                </a>
                                                            </p>
                                                        )}
                                                    </div>
                                                )}

                                                {event.type === 'step' && event.step && (
                                                    <div className="mt-1">
                                                        <p><strong>Goal:</strong> {event.step.next_goal}</p>
                                                        {event.step.evaluation_previous_goal && (
                                                            <p><strong>Evaluation:</strong> {event.step.evaluation_previous_goal}</p>
                                                        )}
                                                    </div>
                                                )}

                                                {event.type === 'completion' && (
                                                    <div className="mt-1">
                                                        <p><strong>Final Status:</strong> {event.status}</p>
                                                        {event.output && <p><strong>Output:</strong> {event.output}</p>}
                                                    </div>
                                                )}

                                                {event.type === 'error' && (
                                                    <p className="mt-1 text-red-700">{event.error}</p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}