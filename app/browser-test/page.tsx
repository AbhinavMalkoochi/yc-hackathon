"use client";

import { useState } from "react";

interface BrowserTaskResult {
    task_id: string;
    session_id: string;
    live_url?: string;
    status: string;
}

interface TaskStatusResult {
    task_id: string;
    session_id: string;
    status: string;
    is_success?: boolean;
    live_url?: string;
    started_at?: string;
    finished_at?: string;
    steps_count: number;
    done_output?: string;
    steps: Array<{
        number: number;
        goal: string;
        evaluation: string;
        url: string;
        screenshot_url?: string;
        actions: string[];
    }>;
}

export default function BrowserTestPage() {
    const [task, setTask] = useState("Navigate to google.com and search for 'AI automation'");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<BrowserTaskResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [taskStatus, setTaskStatus] = useState<TaskStatusResult | null>(null);
    const [statusLoading, setStatusLoading] = useState(false);

    const createTask = async () => {
        setLoading(true);
        setError(null);
        setResult(null);
        setTaskStatus(null);

        try {
            const response = await fetch("http://localhost:8000/api/browser-cloud/create-task", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    task,
                    start_url: "https://google.com"
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || `HTTP ${response.status}`);
            }

            const data = await response.json();
            setResult(data);

            // If we have a task ID, fetch its status
            if (data.task_id) {
                fetchTaskStatus(data.task_id);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unknown error occurred");
        } finally {
            setLoading(false);
        }
    };

    const fetchTaskStatus = async (taskId?: string) => {
        const idToUse = taskId || result?.task_id;
        if (!idToUse) return;

        setStatusLoading(true);
        try {
            const response = await fetch(`http://localhost:8000/api/browser-cloud/task/${idToUse}`);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || `HTTP ${response.status}`);
            }

            const statusData = await response.json();
            setTaskStatus(statusData);
        } catch (err) {
            console.error("Failed to fetch task status:", err);
        } finally {
            setStatusLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h1 className="text-2xl font-bold text-gray-900 mb-6">
                        Browser Use Cloud Test - Task 3.1
                    </h1>

                    <div className="space-y-6">
                        {/* Task Input */}
                        <div>
                            <label htmlFor="task" className="block text-sm font-medium text-gray-700 mb-2">
                                Browser Task Description
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

                        {/* Create Task Button */}
                        <div>
                            <button
                                onClick={createTask}
                                disabled={loading || !task.trim()}
                                className={`px-4 py-2 rounded-md font-medium ${loading || !task.trim()
                                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                        : "bg-blue-600 text-white hover:bg-blue-700"
                                    }`}
                            >
                                {loading ? "Creating Browser Task..." : "Create Browser Task"}
                            </button>
                        </div>

                        {/* Error Display */}
                        {error && (
                            <div className="bg-red-50 border border-red-200 rounded-md p-4">
                                <div className="flex">
                                    <div className="flex-shrink-0">
                                        <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="ml-3">
                                        <h3 className="text-sm font-medium text-red-800">Error</h3>
                                        <div className="mt-2 text-sm text-red-700">
                                            <p>{error}</p>
                                            {error.includes("BROWSER_USE_API_KEY") && (
                                                <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                                                    <p className="text-yellow-800 text-xs">
                                                        <strong>Setup Required:</strong>
                                                        <br />1. Get API key from <a href="https://cloud.browser-use.com/billing" target="_blank" rel="noopener noreferrer" className="underline">Browser Use Cloud</a>
                                                        <br />2. Add BROWSER_USE_API_KEY=bu_your_key to backend/.env
                                                        <br />3. Restart the FastAPI server
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Task Result */}
                        {result && (
                            <div className="bg-green-50 border border-green-200 rounded-md p-4">
                                <h3 className="text-lg font-medium text-green-800 mb-3">Task Created Successfully!</h3>
                                <div className="space-y-2 text-sm">
                                    <p><strong>Task ID:</strong> {result.task_id}</p>
                                    <p><strong>Session ID:</strong> {result.session_id}</p>
                                    <p><strong>Status:</strong> <span className="bg-green-100 px-2 py-1 rounded">{result.status}</span></p>
                                    {result.live_url && (
                                        <div>
                                            <strong>Live Browser URL:</strong>
                                            <br />
                                            <a
                                                href={result.live_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-600 hover:text-blue-800 underline break-all"
                                            >
                                                {result.live_url}
                                            </a>
                                        </div>
                                    )}
                                </div>

                                {/* Fetch Status Button */}
                                <div className="mt-4">
                                    <button
                                        onClick={() => fetchTaskStatus()}
                                        disabled={statusLoading}
                                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200 disabled:opacity-50"
                                    >
                                        {statusLoading ? "Loading..." : "Refresh Status"}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Task Status Details */}
                        {taskStatus && (
                            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                                <h3 className="text-lg font-medium text-blue-800 mb-3">Task Status Details</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p><strong>Status:</strong> <span className="bg-blue-100 px-2 py-1 rounded">{taskStatus.status}</span></p>
                                        <p><strong>Success:</strong> {taskStatus.is_success !== undefined ? (taskStatus.is_success ? "✅ Yes" : "❌ No") : "Pending"}</p>
                                        <p><strong>Steps Completed:</strong> {taskStatus.steps_count}</p>
                                    </div>
                                    <div>
                                        {taskStatus.started_at && <p><strong>Started:</strong> {new Date(taskStatus.started_at).toLocaleString()}</p>}
                                        {taskStatus.finished_at && <p><strong>Finished:</strong> {new Date(taskStatus.finished_at).toLocaleString()}</p>}
                                    </div>
                                </div>

                                {/* Live Browser Viewing */}
                                {taskStatus.live_url && (
                                    <div className="mt-4">
                                        <h4 className="font-medium text-blue-800 mb-2">Live Browser Session</h4>
                                        <iframe
                                            src={taskStatus.live_url}
                                            className="w-full h-96 border border-gray-300 rounded"
                                            title="Live Browser Session"
                                        />
                                    </div>
                                )}

                                {/* Task Output */}
                                {taskStatus.done_output && (
                                    <div className="mt-4">
                                        <h4 className="font-medium text-blue-800 mb-2">Task Output</h4>
                                        <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto">
                                            {taskStatus.done_output}
                                        </pre>
                                    </div>
                                )}

                                {/* Execution Steps */}
                                {taskStatus.steps && taskStatus.steps.length > 0 && (
                                    <div className="mt-4">
                                        <h4 className="font-medium text-blue-800 mb-2">Execution Steps ({taskStatus.steps.length})</h4>
                                        <div className="space-y-2 max-h-64 overflow-y-auto">
                                            {taskStatus.steps.map((step, index) => (
                                                <div key={index} className="bg-white p-2 rounded border text-xs">
                                                    <p><strong>Step {step.number}:</strong> {step.goal}</p>
                                                    <p><strong>URL:</strong> {step.url}</p>
                                                    {step.evaluation && <p><strong>Evaluation:</strong> {step.evaluation}</p>}
                                                    {step.actions && step.actions.length > 0 && (
                                                        <p><strong>Actions:</strong> {step.actions.join(", ")}</p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Instructions */}
                        <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
                            <h3 className="text-lg font-medium text-gray-800 mb-2">Test Instructions</h3>
                            <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
                                <li>Make sure FastAPI backend is running (<code>cd backend && python main.py</code>)</li>
                                <li>Ensure you have BROWSER_USE_API_KEY configured in backend/.env</li>
                                <li>Enter a natural language task description</li>
                                <li>Click "Create Browser Task" to start the automation</li>
                                <li>If successful, you'll see the live browser URL and can monitor progress</li>
                                <li>Use "Refresh Status" to get updated execution details</li>
                            </ol>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}