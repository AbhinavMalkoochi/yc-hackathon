"use client";

import { useState } from "react";
import { generateFlows } from "../../lib/api";

interface LogEntry {
    id: string;
    timestamp: string;
    level: 'info' | 'success' | 'error' | 'warning';
    message: string;
    data?: any;
}

interface TestFlow {
    name: string;
    description: string;
    instructions: string;
}

interface GenerationResponse {
    flows: TestFlow[];
    message: string;
    status: string;
    timestamp: string;
    generation_time?: number;
}

export default function FlowGenerationTestPage() {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [loading, setLoading] = useState(false);
    const [generatedFlows, setGeneratedFlows] = useState<TestFlow[]>([]);
    const [generationTime, setGenerationTime] = useState<number | null>(null);

    // Form states
    const [prompt, setPrompt] = useState("");
    const [websiteUrl, setWebsiteUrl] = useState("");
    const [numFlows, setNumFlows] = useState(5);

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

    const clearFlows = () => {
        setGeneratedFlows([]);
        setGenerationTime(null);
        addLog("info", "Generated flows cleared");
    };

    const handleGenerateFlows = async () => {
        if (!prompt.trim()) {
            addLog("error", "Please enter a prompt for flow generation");
            return;
        }

        setLoading(true);
        setGeneratedFlows([]);
        setGenerationTime(null);

        try {
            addLog("info", `Generating flows with prompt: "${prompt.substring(0, 50)}${prompt.length > 50 ? '...' : ''}"`);

            const startTime = Date.now();
            const response = await generateFlows(
                prompt,
                websiteUrl || undefined,
                numFlows
            ) as GenerationResponse;

            const clientTime = (Date.now() - startTime) / 1000;

            if (response.status === "success") {
                setGeneratedFlows(response.flows);
                setGenerationTime(response.generation_time || clientTime);
                addLog("success", `Successfully generated ${response.flows.length} flows in ${response.generation_time || clientTime}s`, response);
            } else {
                // Enhanced error messaging for common issues
                let errorMessage = response.message;
                if (errorMessage.includes("quota") || errorMessage.includes("429")) {
                    errorMessage = "Gemini API quota exceeded. Please check your billing and usage limits.";
                } else if (errorMessage.includes("not available") || errorMessage.includes("GEMINI_API_KEY")) {
                    errorMessage = "Gemini API key not configured. Please set GEMINI_API_KEY environment variable.";
                }
                addLog("error", `Flow generation failed: ${errorMessage}`, response);
            }
        } catch (error) {
            addLog("error", `Error generating flows: ${error}`, error);
        } finally {
            setLoading(false);
        }
    };

    const handlePromptPresets = (preset: string) => {
        const presets = {
            "ecommerce": "Test an e-commerce website including user registration, product browsing, cart functionality, checkout process, and user account management",
            "login": "Test user authentication flows including login, logout, password reset, and account security features",
            "form": "Test complex web forms including validation, error handling, multi-step forms, and file uploads",
            "navigation": "Test website navigation, menu functionality, search features, and responsive design across different devices",
            "api": "Test API integrations, data loading, error states, loading states, and real-time updates"
        };
        setPrompt(presets[preset as keyof typeof presets] || preset);
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
                        Task 2.1: LLM Integration for Flow Generation Test
                    </h1>
                    <p className="text-gray-600">
                        Test LLM-powered generation of browser testing flows from natural language prompts
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Controls Column */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Flow Generation Form */}
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <h2 className="text-xl font-semibold mb-4">Generate Test Flows</h2>

                            {/* Prompt Presets */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Quick Presets
                                </label>
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                                    {["ecommerce", "login", "form", "navigation", "api"].map((preset) => (
                                        <button
                                            key={preset}
                                            onClick={() => handlePromptPresets(preset)}
                                            className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-2 rounded text-sm font-medium transition-colors capitalize"
                                        >
                                            {preset}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Testing Prompt *
                                    </label>
                                    <textarea
                                        value={prompt}
                                        onChange={(e) => setPrompt(e.target.value)}
                                        placeholder="Describe what you want to test... (e.g., 'Test a social media platform including user registration, posting content, and social interactions')"
                                        rows={4}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Website URL (Optional)
                                        </label>
                                        <input
                                            type="url"
                                            value={websiteUrl}
                                            onChange={(e) => setWebsiteUrl(e.target.value)}
                                            placeholder="https://example.com"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Number of Flows
                                        </label>
                                        <select
                                            value={numFlows}
                                            onChange={(e) => setNumFlows(parseInt(e.target.value))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value={3}>3 flows</option>
                                            <option value={5}>5 flows</option>
                                            <option value={7}>7 flows</option>
                                            <option value={10}>10 flows</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={handleGenerateFlows}
                                        disabled={loading || !prompt.trim()}
                                        className={`px-6 py-3 rounded-md font-medium transition-colors ${loading || !prompt.trim()
                                            ? 'bg-gray-400 cursor-not-allowed'
                                            : 'bg-blue-600 hover:bg-blue-700'
                                            } text-white`}
                                    >
                                        {loading ? 'Generating...' : 'Generate Flows'}
                                    </button>

                                    <button
                                        onClick={clearFlows}
                                        disabled={generatedFlows.length === 0}
                                        className="bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white px-4 py-3 rounded-md font-medium transition-colors"
                                    >
                                        Clear Flows
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Generated Flows Display */}
                        {generatedFlows.length > 0 && (
                            <div className="bg-white rounded-lg shadow-md p-6">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-xl font-semibold">Generated Test Flows</h2>
                                    <div className="text-sm text-gray-500">
                                        {generatedFlows.length} flows generated in {generationTime?.toFixed(2)}s
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {generatedFlows.map((flow, index) => (
                                        <div key={index} className="border border-gray-200 rounded-lg p-4">
                                            <div className="flex items-start justify-between mb-2">
                                                <h3 className="font-semibold text-lg text-gray-900">
                                                    {index + 1}. {flow.name}
                                                </h3>
                                                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                                                    Flow {index + 1}
                                                </span>
                                            </div>

                                            <p className="text-gray-600 mb-3">
                                                <strong>Description:</strong> {flow.description}
                                            </p>

                                            <div className="bg-gray-50 rounded p-3">
                                                <strong className="text-gray-700">Instructions:</strong>
                                                <div className="mt-1 text-gray-800 whitespace-pre-wrap font-mono text-sm">
                                                    {flow.instructions}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Logs Column */}
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold">Live Logs</h2>
                            <button
                                onClick={clearLogs}
                                className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm transition-colors"
                            >
                                Clear
                            </button>
                        </div>

                        <div className="bg-gray-900 rounded-lg p-4 h-96 overflow-y-auto font-mono text-sm">
                            {logs.length === 0 ? (
                                <div className="text-gray-400">No logs yet. Start testing LLM flow generation!</div>
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
                                                <pre className="whitespace-pre-wrap">
                                                    {JSON.stringify(log.data, null, 2)}
                                                </pre>
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
                    <h3 className="text-lg font-semibold text-blue-900 mb-3">Task 2.1 Verification Checklist</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-2">
                            <span className="text-green-600">✅</span>
                            <span>LLM service integration (OpenAI)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-green-600">✅</span>
                            <span>FastAPI flow generation endpoint</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-green-600">✅</span>
                            <span>Prompt engineering for test flows</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-green-600">✅</span>
                            <span>Frontend form for prompt input</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-green-600">✅</span>
                            <span>Generated flows display with loading states</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-green-600">✅</span>
                            <span>Error handling for LLM API failures</span>
                        </div>
                    </div>

                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                        <p className="text-yellow-800 text-sm">
                            <strong>Note:</strong> To test this feature, you need to set the <code>OPENAI_API_KEY</code> environment variable.
                            Without it, the LLM service will return an error message.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
