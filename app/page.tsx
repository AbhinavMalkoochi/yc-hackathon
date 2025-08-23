"use client";

import React from 'react';
import Link from 'next/link';
import { Header } from '../components/layout/Header';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

const tasks = [
  {
    id: '1.1',
    title: 'Basic FastAPI-Next.js Integration Test',
    description: 'Test basic API connectivity and request/response handling',
    status: 'completed',
    href: '/test',
    color: 'bg-green-100 text-green-800',
  },
  {
    id: '1.2',
    title: 'Streaming Response Implementation',
    description: 'Real-time data streaming using Server-Sent Events',
    status: 'completed',
    href: '/streaming-test',
    color: 'bg-green-100 text-green-800',
  },
  {
    id: '1.3',
    title: 'Convex Database Integration',
    description: 'Real-time database operations with Convex',
    status: 'completed',
    href: '/convex-test',
    color: 'bg-green-100 text-green-800',
  },
  {
    id: '2.1',
    title: 'LLM Flow Generation',
    description: 'AI-powered test flow generation using Gemini',
    status: 'completed',
    href: '/flow-generation-test',
    color: 'bg-green-100 text-green-800',
  },
  {
    id: '2.2',
    title: 'Flow Editing & Management Interface',
    description: 'Enhanced flow editing with drag-and-drop',
    status: 'in-progress',
    href: '#',
    color: 'bg-yellow-100 text-yellow-800',
  },
  {
    id: '2.3',
    title: 'Flow Approval & Execution Preparation',
    description: 'Flow approval workflow with batch operations',
    status: 'pending',
    href: '#',
    color: 'bg-gray-100 text-gray-800',
  },
  {
    id: '3.1',
    title: 'Browser Use Library Setup',
    description: 'Browser Use library integration and testing',
    status: 'in-progress',
    href: '#',
    color: 'bg-yellow-100 text-yellow-800',
  },
  {
    id: '3.2',
    title: 'Browser Agent Integration',
    description: 'Browser agent integration for flow execution',
    status: 'pending',
    href: '#',
    color: 'bg-gray-100 text-gray-800',
  },
  {
    id: '3.3',
    title: 'Parallel Browser Session Management',
    description: 'Parallel session management with real-time updates',
    status: 'pending',
    href: '#',
    color: 'bg-gray-100 text-gray-800',
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            AI Browser Testing Agent
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            An intelligent testing platform that combines AI-powered test generation with
            automated browser execution for comprehensive web application testing.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          <Card title="Project Overview" subtitle="Current development status and architecture">
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Architecture</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Next.js frontend with Convex real-time database</li>
                  <li>• FastAPI backend for external service integration</li>
                  <li>• AI-powered test flow generation using Gemini</li>
                  <li>• Browser automation with Browser Use library</li>
                </ul>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-medium text-green-900 mb-2">Current Status</h4>
                <p className="text-sm text-green-800">
                  Phase 1 (Core Infrastructure) and Phase 2.1 (LLM Integration) completed.
                  Currently working on enhanced flow management and browser integration.
                </p>
              </div>
            </div>
          </Card>

          <Card title="Quick Actions" subtitle="Common testing and development tasks">
            <div className="space-y-3">
              <Link href="/test">
                <Button className="w-full justify-start" variant="primary">
                  Test API Endpoints
                </Button>
              </Link>
              <Link href="/streaming-test">
                <Button className="w-full justify-start" variant="secondary">
                  Test Real-time Streaming
                </Button>
              </Link>
              <Link href="/convex-test">
                <Button className="w-full justify-start" variant="secondary">
                  Test Database Operations
                </Button>
              </Link>
              <Link href="/flow-generation-test">
                <Button className="w-full justify-start" variant="secondary">
                  Generate Test Flows
                </Button>
              </Link>
            </div>
          </Card>
        </div>

        <Card title="Development Tasks" subtitle="Progress tracking for all development phases">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tasks.map((task) => (
              <div key={task.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${task.color}`}>
                    {task.status}
                  </span>
                  <span className="text-sm font-medium text-gray-900">{task.id}</span>
                </div>
                <h4 className="font-medium text-gray-900 mb-2">{task.title}</h4>
                <p className="text-sm text-gray-600 mb-3">{task.description}</p>
                {task.href !== '#' ? (
                  <Link href={task.href}>
                    <Button size="sm" className="w-full">
                      Open Test
                    </Button>
                  </Link>
                ) : (
                  <Button size="sm" className="w-full" disabled>
                    Coming Soon
                  </Button>
                )}
              </div>
            ))}
          </div>
        </Card>
      </main>
    </div>
  );
}