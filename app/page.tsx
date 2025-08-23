"use client";

import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { SignInButton, UserButton } from "@clerk/nextjs";
import { motion } from 'framer-motion';
import UnifiedDashboard from './unified-dashboard';

// Authentication Loading Component
function AuthLoadingScreen() {
    return (
        <div className="relative flex flex-col items-center justify-center w-full min-h-screen p-4 font-sans text-gray-800 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <h2 className="text-xl font-semibold text-gray-700">Loading...</h2>
                <p className="text-gray-500 mt-2">Checking authentication status</p>
            </div>
        </div>
    );
}

// Unauthenticated Component
function UnauthenticatedScreen() {
    return (
        <div className="relative flex flex-col items-center justify-center w-full min-h-screen p-4 font-sans text-gray-800 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
                <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-blue-200/20 rounded-full filter blur-3xl animate-blob"></div>
                <div className="absolute bottom-0 right-0 w-2/3 h-2/3 bg-indigo-200/20 rounded-full filter blur-3xl animate-blob animation-delay-4000"></div>
            </div>

            <div className="relative z-10 text-center max-w-md">
                <h1 className="text-4xl font-bold text-gray-800 mb-4">AI Browser Testing Agent</h1>
                <p className="text-lg text-gray-600 mb-8">
                    Intelligent browser automation powered by AI. Generate, edit, and execute browser tests using natural language descriptions.
                </p>

                <div className="bg-white/70 border border-white/80 rounded-2xl shadow-xl shadow-black/5 backdrop-blur-2xl p-8">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Get Started</h2>
                    <p className="text-gray-600 mb-6">Sign in to create and manage your browser testing flows</p>

                    <SignInButton mode="modal">
                        <button className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all font-medium shadow-lg">
                            Sign In to Continue
                        </button>
                    </SignInButton>
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

// Main App Component
export default function Home() {
    return (
        <>
            <AuthLoading>
                <AuthLoadingScreen />
            </AuthLoading>
            <Unauthenticated>
                <UnauthenticatedScreen />
            </Unauthenticated>
            <Authenticated>
                <UnifiedDashboard />
            </Authenticated>
        </>
    );
}