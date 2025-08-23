"use client";

import { useState, useEffect } from 'react';
import { Database, RefreshCw, Plus, TrendingUp, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import DataTable, { Column } from './DataTable';

// Types for admin data
interface TestRun {
    _id: string;
    _creationTime: number;
    name: string;
    description?: string;
    status: 'generating' | 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
    prompt: string;
    totalFlows: number;
    completedFlows: number;
    failedFlows: number;
    startedAt?: number;
    completedAt?: number;
    metadata?: {
        priority?: 'low' | 'normal' | 'high';
        tags?: string[];
        environment?: string;
    };
}

interface Flow {
    _id: string;
    _creationTime: number;
    testRunId: string;
    name: string;
    description: string;
    instructions: string;
    status: 'pending' | 'approved' | 'running' | 'completed' | 'failed' | 'cancelled';
    order: number;
    estimatedDurationMinutes?: number;
    actualDurationMs?: number;
    startedAt?: number;
    completedAt?: number;
    metadata?: {
        difficulty?: 'easy' | 'medium' | 'hard';
        category?: string;
        targetUrl?: string;
    };
}

interface AdminStats {
    testRuns: {
        total: number;
        byStatus: Record<string, number>;
        recent: Array<{
            _id: string;
            name: string;
            status: string;
            _creationTime: number;
            totalFlows: number;
            completedFlows: number;
        }>;
    };
    timestamp: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_FASTAPI_URL || 'http://localhost:8000';

export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState<'overview' | 'test-runs' | 'flows'>('overview');
    const [testRuns, setTestRuns] = useState<TestRun[]>([]);
    const [flows, setFlows] = useState<Flow[]>([]);
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>('');
    const [selectedTestRun, setSelectedTestRun] = useState<string | null>(null);

    // Fetch admin statistics
    const fetchStats = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/stats`);
            if (response.ok) {
                const data = await response.json();
                setStats(data);
            }
        } catch (err) {
            console.error('Failed to fetch stats:', err);
        }
    };

    // Fetch test runs
    const fetchTestRuns = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_BASE_URL}/api/admin/test-runs?limit=50`);
            if (response.ok) {
                const data = await response.json();
                setTestRuns(data);
            } else {
                setError('Failed to fetch test runs');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setLoading(false);
        }
    };

    // Fetch flows for a specific test run
    const fetchFlows = async (testRunId: string) => {
        try {
            setLoading(true);
            const response = await fetch(`${API_BASE_URL}/api/admin/flows/${testRunId}`);
            if (response.ok) {
                const data = await response.json();
                setFlows(data);
            } else {
                setError('Failed to fetch flows');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setLoading(false);
        }
    };

    // Create sample data
    const createSampleData = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_BASE_URL}/api/admin/sample-data`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ testRuns: 3, flowsPerRun: 2 }),
            });

            if (response.ok) {
                await fetchTestRuns();
                await fetchStats();
                setError('');
            } else {
                setError('Failed to create sample data');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setLoading(false);
        }
    };

    // Delete test run
    const deleteTestRun = async (testRun: TestRun) => {
        if (!confirm(`Are you sure you want to delete "${testRun.name}"? This will also delete all related flows and data.`)) {
            return;
        }

        try {
            setLoading(true);
            const response = await fetch(`${API_BASE_URL}/api/admin/test-runs/${testRun._id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                await fetchTestRuns();
                await fetchStats();
                setError('');
            } else {
                setError('Failed to delete test run');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setLoading(false);
        }
    };

    // Initial load
    useEffect(() => {
        fetchStats();
        if (activeTab === 'test-runs') {
            fetchTestRuns();
        }
    }, [activeTab]);

    // Test runs table columns
    const testRunColumns: Column<TestRun>[] = [
        {
            key: 'name',
            label: 'Name',
            sortable: true,
            width: '25%',
            render: (value, item) => (
                <div>
                    <div className="font-medium">{value}</div>
                    {item.description && (
                        <div className="text-xs text-gray-500 mt-1">{item.description}</div>
                    )}
                </div>
            ),
        },
        {
            key: 'status',
            label: 'Status',
            sortable: true,
            width: '12%',
            render: (value) => {
                const statusColors = {
                    generating: 'bg-blue-100 text-blue-800',
                    pending: 'bg-yellow-100 text-yellow-800',
                    running: 'bg-purple-100 text-purple-800',
                    completed: 'bg-green-100 text-green-800',
                    failed: 'bg-red-100 text-red-800',
                    cancelled: 'bg-gray-100 text-gray-800',
                };
                return (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[value as keyof typeof statusColors]}`}>
                        {value}
                    </span>
                );
            },
        },
        {
            key: 'totalFlows',
            label: 'Flows',
            sortable: true,
            width: '10%',
            render: (value, item) => (
                <div className="text-center">
                    <div className="font-medium">{value}</div>
                    <div className="text-xs text-gray-500">
                        {item.completedFlows}✓ {item.failedFlows}✗
                    </div>
                </div>
            ),
        },
        {
            key: '_creationTime',
            label: 'Created',
            sortable: true,
            width: '15%',
            render: (value) => new Date(value).toLocaleDateString(),
        },
        {
            key: 'metadata',
            label: 'Priority',
            width: '10%',
            render: (value) => {
                const priority = value?.priority || 'normal';
                const priorityColors = {
                    low: 'text-gray-600',
                    normal: 'text-blue-600',
                    high: 'text-red-600',
                };
                return (
                    <span className={`font-medium ${priorityColors[priority as keyof typeof priorityColors]}`}>
                        {priority}
                    </span>
                );
            },
        },
        {
            key: 'prompt',
            label: 'Prompt',
            width: '28%',
            render: (value) => (
                <div className="text-sm text-gray-600 truncate" title={value}>
                    {value.length > 100 ? `${value.substring(0, 100)}...` : value}
                </div>
            ),
        },
    ];

    // Flows table columns
    const flowColumns: Column<Flow>[] = [
        {
            key: 'order',
            label: '#',
            sortable: true,
            width: '5%',
        },
        {
            key: 'name',
            label: 'Name',
            sortable: true,
            width: '25%',
            render: (value, item) => (
                <div>
                    <div className="font-medium">{value}</div>
                    <div className="text-xs text-gray-500 mt-1">{item.description}</div>
                </div>
            ),
        },
        {
            key: 'status',
            label: 'Status',
            sortable: true,
            width: '12%',
            render: (value) => {
                const statusColors = {
                    pending: 'bg-yellow-100 text-yellow-800',
                    approved: 'bg-blue-100 text-blue-800',
                    running: 'bg-purple-100 text-purple-800',
                    completed: 'bg-green-100 text-green-800',
                    failed: 'bg-red-100 text-red-800',
                    cancelled: 'bg-gray-100 text-gray-800',
                };
                return (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[value as keyof typeof statusColors]}`}>
                        {value}
                    </span>
                );
            },
        },
        {
            key: 'estimatedDurationMinutes',
            label: 'Est. Duration',
            sortable: true,
            width: '12%',
            render: (value) => value ? `${value}m` : '-',
        },
        {
            key: 'actualDurationMs',
            label: 'Actual Duration',
            sortable: true,
            width: '12%',
            render: (value) => value ? `${Math.round(value / 1000)}s` : '-',
        },
        {
            key: 'instructions',
            label: 'Instructions',
            width: '34%',
            render: (value) => (
                <div className="text-sm text-gray-600 truncate" title={value}>
                    {value.length > 150 ? `${value.substring(0, 150)}...` : value}
                </div>
            ),
        },
    ];

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <Database className="w-6 h-6 text-blue-500" />
                    <h2 className="text-xl font-bold">Admin Dashboard</h2>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={createSampleData}
                        disabled={loading}
                        className="bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white px-4 py-2 rounded-md flex items-center gap-2 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Create Sample Data
                    </button>

                    <button
                        onClick={() => {
                            fetchStats();
                            if (activeTab === 'test-runs') fetchTestRuns();
                            if (activeTab === 'flows' && selectedTestRun) fetchFlows(selectedTestRun);
                        }}
                        disabled={loading}
                        className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-4 py-2 rounded-md flex items-center gap-2 transition-colors"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                </div>
            </div>

            {error && (
                <div className="bg-red-100 dark:bg-red-900 border border-red-400 text-red-700 dark:text-red-300 px-4 py-3 rounded mb-4">
                    <strong>Error:</strong> {error}
                </div>
            )}

            {/* Tab Navigation */}
            <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
                <nav className="-mb-px flex space-x-8">
                    {[
                        { id: 'overview', label: 'Overview', icon: TrendingUp },
                        { id: 'test-runs', label: 'Test Runs', icon: Clock },
                        { id: 'flows', label: 'Flows', icon: CheckCircle },
                    ].map(({ id, label, icon: Icon }) => (
                        <button
                            key={id}
                            onClick={() => setActiveTab(id as any)}
                            className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === id
                                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200'
                                }`}
                        >
                            <Icon className="w-4 h-4" />
                            {label}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Tab Content */}
            {activeTab === 'overview' && (
                <div className="space-y-6">
                    {stats && (
                        <>
                            {/* Stats Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-blue-600 dark:text-blue-400 text-sm font-medium">Total Test Runs</p>
                                            <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{stats.testRuns.total}</p>
                                        </div>
                                        <Clock className="w-8 h-8 text-blue-500" />
                                    </div>
                                </div>

                                <div className="bg-green-50 dark:bg-green-900 p-4 rounded-lg">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-green-600 dark:text-green-400 text-sm font-medium">Completed</p>
                                            <p className="text-2xl font-bold text-green-900 dark:text-green-100">{stats.testRuns.byStatus.completed || 0}</p>
                                        </div>
                                        <CheckCircle className="w-8 h-8 text-green-500" />
                                    </div>
                                </div>

                                <div className="bg-yellow-50 dark:bg-yellow-900 p-4 rounded-lg">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-yellow-600 dark:text-yellow-400 text-sm font-medium">Running</p>
                                            <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">{stats.testRuns.byStatus.running || 0}</p>
                                        </div>
                                        <RefreshCw className="w-8 h-8 text-yellow-500" />
                                    </div>
                                </div>

                                <div className="bg-red-50 dark:bg-red-900 p-4 rounded-lg">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-red-600 dark:text-red-400 text-sm font-medium">Failed</p>
                                            <p className="text-2xl font-bold text-red-900 dark:text-red-100">{stats.testRuns.byStatus.failed || 0}</p>
                                        </div>
                                        <XCircle className="w-8 h-8 text-red-500" />
                                    </div>
                                </div>
                            </div>

                            {/* Recent Test Runs */}
                            <div>
                                <h3 className="text-lg font-semibold mb-4">Recent Test Runs</h3>
                                <div className="space-y-2">
                                    {stats.testRuns.recent.slice(0, 5).map((testRun) => (
                                        <div key={testRun._id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                                            <div>
                                                <div className="font-medium">{testRun.name}</div>
                                                <div className="text-sm text-gray-500">
                                                    {new Date(testRun._creationTime).toLocaleDateString()} •
                                                    {testRun.totalFlows} flows •
                                                    {testRun.completedFlows} completed
                                                </div>
                                            </div>
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${testRun.status === 'completed' ? 'bg-green-100 text-green-800' :
                                                    testRun.status === 'failed' ? 'bg-red-100 text-red-800' :
                                                        testRun.status === 'running' ? 'bg-purple-100 text-purple-800' :
                                                            'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                {testRun.status}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}

            {activeTab === 'test-runs' && (
                <DataTable
                    data={testRuns}
                    columns={testRunColumns}
                    loading={loading}
                    error={error}
                    onView={(testRun) => {
                        setSelectedTestRun(testRun._id);
                        setActiveTab('flows');
                        fetchFlows(testRun._id);
                    }}
                    onDelete={deleteTestRun}
                    emptyMessage="No test runs found. Create some sample data to get started."
                />
            )}

            {activeTab === 'flows' && (
                <div>
                    {selectedTestRun && (
                        <div className="mb-4">
                            <button
                                onClick={() => {
                                    setActiveTab('test-runs');
                                    setSelectedTestRun(null);
                                }}
                                className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
                            >
                                ← Back to Test Runs
                            </button>
                        </div>
                    )}

                    <DataTable
                        data={flows}
                        columns={flowColumns}
                        loading={loading}
                        error={error}
                        title={selectedTestRun ? `Flows for Test Run` : 'All Flows'}
                        emptyMessage={selectedTestRun ? "No flows found for this test run." : "No flows found. Select a test run to view its flows."}
                    />
                </div>
            )}
        </div>
    );
}
