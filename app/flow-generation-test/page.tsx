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
    const [editingFlow, setEditingFlow] = useState<number | null>(null);
    const [draggedFlow, setDraggedFlow] = useState<number | null>(null);
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

    // Flow management functions
    const editFlow = (index: number) => {
        setEditingFlow(index);
    };

    const saveFlow = (index: number, updatedFlow: TestFlow) => {
        const newFlows = [...generatedFlows];
        newFlows[index] = updatedFlow;
        setGeneratedFlows(newFlows);
        setEditingFlow(null);
        addLog("success", `Flow ${index + 1} updated successfully`);
    };

    const deleteFlow = (index: number) => {
        const newFlows = generatedFlows.filter((_, i) => i !== index);
        setGeneratedFlows(newFlows);
        addLog("info", `Flow ${index + 1} deleted`);
    };

    const addNewFlow = () => {
        const newFlow: TestFlow = {
            name: "New Test Flow",
            description: "Enter flow description here",
            instructions: "Enter step-by-step instructions here"
        };
        setGeneratedFlows([...generatedFlows, newFlow]);
        setEditingFlow(generatedFlows.length);
        addLog("info", "New flow added");
    };

    const duplicateFlow = (index: number) => {
        const flowToDuplicate = generatedFlows[index];
        const duplicatedFlow: TestFlow = {
            name: `${flowToDuplicate.name} (Copy)`,
            description: flowToDuplicate.description,
            instructions: flowToDuplicate.instructions
        };
        const newFlows = [...generatedFlows];
        newFlows.splice(index + 1, 0, duplicatedFlow);
        setGeneratedFlows(newFlows);
        addLog("info", `Flow ${index + 1} duplicated`);
    };

    const moveFlow = (fromIndex: number, toIndex: number) => {
        const newFlows = [...generatedFlows];
        const [movedFlow] = newFlows.splice(fromIndex, 1);
        newFlows.splice(toIndex, 0, movedFlow);
        setGeneratedFlows(newFlows);
        addLog("info", `Flow moved from position ${fromIndex + 1} to ${toIndex + 1}`);
    };

    const validateFlow = (flow: TestFlow): string[] => {
        const errors: string[] = [];
        if (!flow.name.trim()) errors.push("Name is required");
        if (!flow.description.trim()) errors.push("Description is required");
        if (!flow.instructions.trim()) errors.push("Instructions are required");
        if (flow.name.length < 3) errors.push("Name must be at least 3 characters");
        if (flow.description.length < 10) errors.push("Description must be at least 10 characters");
        if (flow.instructions.length < 20) errors.push("Instructions must be at least 20 characters");
        return errors;
    };

    // Drag and drop handlers
    const handleDragStart = (index: number) => {
        setDraggedFlow(index);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleDrop = (e: React.DragEvent, dropIndex: number) => {
        e.preventDefault();
        if (draggedFlow !== null && draggedFlow !== dropIndex) {
            moveFlow(draggedFlow, dropIndex);
        }
        setDraggedFlow(null);
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

    // Editable Flow Component
    const EditableFlow = ({ flow, index, isEditing, onSave, onCancel }: {
        flow: TestFlow;
        index: number;
        isEditing: boolean;
        onSave: (flow: TestFlow) => void;
        onCancel: () => void;
    }) => {
        const [editedFlow, setEditedFlow] = useState<TestFlow>(flow);
        const [errors, setErrors] = useState<string[]>([]);

        const handleSave = () => {
            const validationErrors = validateFlow(editedFlow);
            setErrors(validationErrors);
            if (validationErrors.length === 0) {
                onSave(editedFlow);
            }
        };

        const handleCancel = () => {
            setEditedFlow(flow);
            setErrors([]);
            onCancel();
        };

        if (!isEditing) {
            const flowErrors = validateFlow(flow);
            return (
                <div
                    className={`border rounded-lg p-4 transition-all duration-200 ${draggedFlow === index ? 'opacity-50' : ''
                        } ${flowErrors.length > 0 ? 'border-yellow-300 bg-yellow-50' : 'border-gray-200'}`}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, index)}
                >
                    <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-lg text-gray-900 flex-1">
                            {index + 1}. {flow.name}
                        </h3>
                        <div className="flex items-center gap-2 ml-4">
                            {flowErrors.length > 0 && (
                                <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-medium">
                                    ⚠️ {flowErrors.length} issue{flowErrors.length > 1 ? 's' : ''}
                                </span>
                            )}
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                                Flow {index + 1}
                            </span>
                            <button
                                onClick={() => editFlow(index)}
                                className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs transition-colors"
                            >
                                Edit
                            </button>
                            <button
                                onClick={() => duplicateFlow(index)}
                                className="bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded text-xs transition-colors"
                            >
                                Copy
                            </button>
                            <button
                                onClick={() => deleteFlow(index)}
                                className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs transition-colors"
                            >
                                Delete
                            </button>
                        </div>
                    </div>

                    {flowErrors.length > 0 && (
                        <div className="mb-3 p-2 bg-yellow-100 border border-yellow-300 rounded text-sm">
                            <strong className="text-yellow-800">Issues:</strong>
                            <ul className="list-disc list-inside text-yellow-700 mt-1">
                                {flowErrors.map((error, idx) => (
                                    <li key={idx}>{error}</li>
                                ))}
                            </ul>
                        </div>
                    )}

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
            );
        }

        return (
            <div className="border border-blue-300 rounded-lg p-4 bg-blue-50">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-lg text-gray-900">
                        Editing Flow {index + 1}
                    </h3>
                    <div className="flex gap-2">
                        <button
                            onClick={handleSave}
                            className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm transition-colors"
                        >
                            Save
                        </button>
                        <button
                            onClick={handleCancel}
                            className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </div>

                {errors.length > 0 && (
                    <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded">
                        <strong className="text-red-800">Please fix these issues:</strong>
                        <ul className="list-disc list-inside text-red-700 mt-1">
                            {errors.map((error, idx) => (
                                <li key={idx}>{error}</li>
                            ))}
                        </ul>
                    </div>
                )}

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Flow Name
                        </label>
                        <input
                            type="text"
                            value={editedFlow.name}
                            onChange={(e) => setEditedFlow({ ...editedFlow, name: e.target.value })}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter flow name..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Description
                        </label>
                        <textarea
                            value={editedFlow.description}
                            onChange={(e) => setEditedFlow({ ...editedFlow, description: e.target.value })}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows={2}
                            placeholder="Enter flow description..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Instructions
                        </label>
                        <textarea
                            value={editedFlow.instructions}
                            onChange={(e) => setEditedFlow({ ...editedFlow, instructions: e.target.value })}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                            rows={6}
                            placeholder="Enter step-by-step instructions..."
                        />
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Task 2.2: Flow Editing & Management Interface
                    </h1>
                    <p className="text-gray-600">
                        Generate, edit, validate, and manage browser test flows with real-time editing capabilities
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
                                    <h2 className="text-xl font-semibold">
                                        Test Flows ({generatedFlows.length})
                                    </h2>
                                    <div className="flex items-center gap-4">
                                        {generationTime && (
                                            <div className="text-sm text-gray-500">
                                                Generated in {generationTime.toFixed(2)}s
                                            </div>
                                        )}
                                        <button
                                            onClick={addNewFlow}
                                            className="bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded text-sm font-medium transition-colors"
                                        >
                                            + Add Flow
                                        </button>
                                    </div>
                                </div>

                                {/* Flow Management Info */}
                                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                    <h3 className="font-medium text-blue-800 mb-1">Flow Management Tips:</h3>
                                    <ul className="text-sm text-blue-700 space-y-1">
                                        <li>• <strong>Edit:</strong> Click "Edit" to modify flow details</li>
                                        <li>• <strong>Reorder:</strong> Drag & drop flows to change execution order</li>
                                        <li>• <strong>Validation:</strong> Yellow flows have validation issues</li>
                                        <li>• <strong>Copy:</strong> Duplicate flows to create variations</li>
                                    </ul>
                                </div>

                                <div className="space-y-4">
                                    {generatedFlows.map((flow, index) => (
                                        <EditableFlow
                                            key={index}
                                            flow={flow}
                                            index={index}
                                            isEditing={editingFlow === index}
                                            onSave={(updatedFlow) => saveFlow(index, updatedFlow)}
                                            onCancel={() => setEditingFlow(null)}
                                        />
                                    ))}
                                </div>

                                {/* Flow Summary */}
                                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                                    <h3 className="font-medium text-gray-800 mb-2">Flow Summary:</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-blue-600">{generatedFlows.length}</div>
                                            <div className="text-gray-600">Total Flows</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-green-600">
                                                {generatedFlows.filter(flow => validateFlow(flow).length === 0).length}
                                            </div>
                                            <div className="text-gray-600">Valid Flows</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-yellow-600">
                                                {generatedFlows.filter(flow => validateFlow(flow).length > 0).length}
                                            </div>
                                            <div className="text-gray-600">Need Attention</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-purple-600">{editingFlow !== null ? 1 : 0}</div>
                                            <div className="text-gray-600">Being Edited</div>
                                        </div>
                                    </div>
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
