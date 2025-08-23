"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Globe, Clock, CheckCircle2, AlertCircle, Play, ExternalLink, Activity, Calendar, User, Hash } from 'lucide-react';
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { SignInButton, UserButton } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

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

const SessionPage = () => {
    const params = useParams();
    const sessionId = params.sessionId as string;

    return (
        <>
            <AuthLoading>
                <div className="min-h-screen bg-[#F7F2ED] flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-800 mx-auto mb-4"></div>
                        <h2 className="text-xl font-semibold text-gray-700">Loading...</h2>
                        <p className="text-gray-500 mt-2">Checking authentication status</p>
                    </div>
                </div>
            </AuthLoading>
            <Unauthenticated>
                <div className="min-h-screen bg-[#F7F2ED] flex items-center justify-center">
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
                <SessionPageContent sessionId={sessionId} />
            </Authenticated>
        </>
    );
};

const SessionPageContent = ({ sessionId }: { sessionId: string }) => {
    // Convex queries
    const testSession = useQuery(api.browserTesting.getTestSession, { sessionId: sessionId as any });
    const browserSessions = useQuery(api.browserTesting.getAllBrowserSessionsForTestSession, { sessionId: sessionId as any });

    // Get status color
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-gray-100 text-gray-800';
            case 'generating': return 'bg-blue-100 text-blue-800';
            case 'ready': return 'bg-green-100 text-green-800';
            case 'running': return 'bg-yellow-100 text-yellow-800';
            case 'executing': return 'bg-yellow-100 text-yellow-800';
            case 'completed': return 'bg-green-100 text-green-800';
            case 'failed': return 'bg-red-100 text-red-800';
            case 'terminated': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    // Get status icon
    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'completed': return <CheckCircle2 size={20} className="text-green-600" />;
            case 'running':
            case 'executing': return <Clock size={20} className="text-yellow-600 animate-pulse" />;
            case 'failed': return <AlertCircle size={20} className="text-red-600" />;
            case 'terminated': return <AlertCircle size={20} className="text-gray-600" />;
            default: return <Clock size={20} className="text-gray-600" />;
        }
    };

    // Format date
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Calculate duration
    const calculateDuration = (start: string, end?: string) => {
        const startTime = new Date(start).getTime();
        const endTime = end ? new Date(end).getTime() : Date.now();
        const duration = Math.floor((endTime - startTime) / 1000);

        if (duration < 60) return `${duration}s`;
        if (duration < 3600) return `${Math.floor(duration / 60)}m ${duration % 60}s`;
        return `${Math.floor(duration / 3600)}h ${Math.floor((duration % 3600) / 60)}m`;
    };

    if (!testSession) {
        return (
            <div className="min-h-screen bg-[#F7F2ED] flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-800 mx-auto mb-4"></div>
                    <h2 className="text-xl font-semibold text-gray-700">Loading session details...</h2>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F7F2ED]">
            {/* Background Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
                <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-rose-200/30 rounded-full filter blur-3xl animate-blob"></div>
                <div className="absolute bottom-0 right-0 w-2/3 h-2/3 bg-blue-200/30 rounded-full filter blur-3xl animate-blob animation-delay-4000"></div>
            </div>

            {/* Header */}
            <header className="relative z-10 bg-white/60 shadow-sm border-b border-white/80 backdrop-blur-2xl">
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
                                <h1 className="text-lg font-semibold text-gray-900">{testSession.name}</h1>
                                <p className="text-sm text-gray-500">Test Session Details</p>
                            </div>
                        </div>
                        <UserButton afterSignOutUrl="/" />
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {/* Session Overview Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/60 rounded-2xl shadow-xl shadow-black/5 border border-white/80 backdrop-blur-2xl p-6 mb-6"
                >
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <Activity size={24} />
                            Session Overview
                        </h2>
                        <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(testSession.status)}`}>
                            {testSession.status}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="space-y-1">
                            <div className="flex items-center text-gray-500 text-sm">
                                <Hash size={16} className="mr-1" />
                                Session ID
                            </div>
                            <p className="font-mono text-xs text-gray-700">{sessionId}</p>
                        </div>

                        <div className="space-y-1">
                            <div className="flex items-center text-gray-500 text-sm">
                                <User size={16} className="mr-1" />
                                Created By
                            </div>
                            <p className="text-gray-700">{testSession.userEmail}</p>
                        </div>

                        <div className="space-y-1">
                            <div className="flex items-center text-gray-500 text-sm">
                                <Calendar size={16} className="mr-1" />
                                Created At
                            </div>
                            <p className="text-gray-700">{formatDate(testSession.createdAt)}</p>
                        </div>

                        <div className="space-y-1">
                            <div className="flex items-center text-gray-500 text-sm">
                                <Clock size={16} className="mr-1" />
                                Duration
                            </div>
                            <p className="text-gray-700">
                                {testSession.startedAt
                                    ? calculateDuration(testSession.startedAt, testSession.completedAt)
                                    : 'Not started'
                                }
                            </p>
                        </div>
                    </div>

                    <div className="mt-6 pt-6 border-t border-gray-200">
                        <h3 className="text-sm font-medium text-gray-700 mb-2">Prompt</h3>
                        <p className="text-gray-600 bg-gray-50 rounded-lg p-3">{testSession.prompt}</p>
                    </div>

                    {testSession.flows && testSession.flows.length > 0 && (
                        <div className="mt-6 pt-6 border-t border-gray-200">
                            <h3 className="text-sm font-medium text-gray-700 mb-2">Test Flows Summary</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                                <div>
                                    <div className="text-2xl font-bold text-gray-900">{testSession.totalFlows || 0}</div>
                                    <div className="text-sm text-gray-500">Total Flows</div>
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-green-600">
                                        {testSession.flows.filter((f: any) => f.approved).length}
                                    </div>
                                    <div className="text-sm text-gray-500">Approved</div>
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-blue-600">
                                        {browserSessions?.length || 0}
                                    </div>
                                    <div className="text-sm text-gray-500">Browser Sessions</div>
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-green-600">
                                        {browserSessions?.filter(s => s.status === 'completed').length || 0}
                                    </div>
                                    <div className="text-sm text-gray-500">Completed</div>
                                </div>
                            </div>
                        </div>
                    )}
                </motion.div>

                {/* Browser Sessions */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Globe size={24} />
                        Browser Sessions
                    </h2>

                    {browserSessions && browserSessions.length > 0 ? (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {browserSessions.map((session) => (
                                <motion.div
                                    key={session._id}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="bg-white/60 rounded-2xl shadow-lg shadow-black/5 border border-white/80 backdrop-blur-2xl overflow-hidden"
                                >
                                    {/* Session Header */}
                                    <div className="p-4 border-b border-gray-200">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                                    {getStatusIcon(session.status)}
                                                    {session.flowName}
                                                </h3>
                                                <p className="text-sm text-gray-600 mt-1">{session.flowDescription}</p>
                                            </div>
                                            <div className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(session.status)}`}>
                                                {session.status}
                                            </div>
                                        </div>

                                        {/* Session Metadata */}
                                        <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
                                            <span>Started: {formatDate(session.startedAt)}</span>
                                            {session.completedAt && (
                                                <span>Duration: {calculateDuration(session.startedAt, session.completedAt)}</span>
                                            )}
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="mt-3 flex items-center gap-2">
                                            <a
                                                href={`/logs/${session.taskId}?name=${encodeURIComponent(session.flowName || '')}&description=${encodeURIComponent(session.flowDescription || '')}`}
                                                className="inline-flex items-center gap-1 px-3 py-1 bg-gray-800 text-white text-xs rounded hover:bg-gray-700 transition-colors"
                                            >
                                                <Activity size={14} />
                                                View Logs
                                            </a>
                                            {session.liveUrl && (
                                                <a
                                                    href={session.liveUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1 px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                                                >
                                                    <ExternalLink size={14} />
                                                    Open Live View
                                                </a>
                                            )}
                                        </div>
                                    </div>

                                    {/* Live Preview */}
                                    {session.liveUrl && (
                                        <div className="aspect-video bg-gray-100">
                                            <iframe
                                                src={session.liveUrl}
                                                className="w-full h-full border-0"
                                                title={`Live session: ${session.flowName}`}
                                                allow="camera; microphone; geolocation"
                                                sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
                                            />
                                        </div>
                                    )}

                                    {/* Instructions */}
                                    <div className="p-4 bg-gray-50/50">
                                        <h4 className="text-sm font-medium text-gray-700 mb-2">Instructions</h4>
                                        <p className="text-xs text-gray-600 whitespace-pre-wrap">{session.instructions}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white/60 rounded-2xl shadow-lg shadow-black/5 border border-white/80 backdrop-blur-2xl p-12 text-center">
                            <Globe size={48} className="mx-auto text-gray-400 mb-4" />
                            <h3 className="text-lg font-medium text-gray-700 mb-2">No Browser Sessions</h3>
                            <p className="text-gray-500">
                                {testSession.status === 'pending' || testSession.status === 'generating'
                                    ? 'Browser sessions will appear here once flows are generated and executed.'
                                    : 'No browser sessions have been started for this test session yet.'}
                            </p>
                        </div>
                    )}
                </motion.div>
            </main>

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
};

export default SessionPage;