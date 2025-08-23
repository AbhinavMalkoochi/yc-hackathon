"use client";

import { useState } from "react";
import { generateFlows } from "../lib/api";

interface TestFlow {
  name: string;
  description: string;
  instructions: string;
  approved?: boolean;
  status?: 'pending' | 'approved' | 'executing' | 'completed' | 'failed';
  estimatedTime?: number;
}

interface GenerationResponse {
  flows: TestFlow[];
  message: string;
  status: string;
  generation_time?: number;
}

export default function Home() {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || loading) return;

    const userMessage = prompt.trim();
    const currentWebsiteUrl = websiteUrl.trim();

    // Add user message to conversation
    setConversationHistory(prev => [...prev, {
      type: 'user',
      content: `${userMessage}${currentWebsiteUrl ? ` (Website: ${currentWebsiteUrl})` : ''}`,
      timestamp: new Date()
    }]);

    setPrompt("");
    setLoading(true);

    try {
      const response = await generateFlows(userMessage, currentWebsiteUrl || undefined, 5) as GenerationResponse;

      if (response.status === "success") {
        const flowsWithDefaults = response.flows.map((flow) => ({
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

  const getApprovedFlows = () => flows.filter(flow => flow.approved);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">AI</span>
            </div>
            <h1 className="text-lg font-semibold text-gray-900">
              Browser Test Agent
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-500">
              {flows.length > 0 && `${getApprovedFlows().length}/${flows.length} approved`}
            </div>
            <a
              href="/flow-generation-test"
              className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
              title="Advanced Testing Interface"
            >
              ⚙️ Advanced
            </a>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden flex flex-col">
        {/* Conversation Area */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          <div className="max-w-4xl mx-auto space-y-6">

            {/* Welcome Message */}
            {conversationHistory.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-white font-bold text-xl">🤖</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  AI Browser Testing Agent
                </h2>
                <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
                  Describe what you want to test on a website, and I'll generate automated browser test flows for you.
                  You can then review, edit, and execute them.
                </p>

                {/* Example Prompts */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                  <button
                    onClick={() => setPrompt("Test the login functionality on my e-commerce website")}
                    className="p-4 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors text-left"
                  >
                    <div className="font-medium text-gray-900 mb-1">Login Testing</div>
                    <div className="text-sm text-gray-600">Test authentication flows</div>
                  </button>
                  <button
                    onClick={() => setPrompt("Test the checkout process including adding items to cart and payment")}
                    className="p-4 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors text-left"
                  >
                    <div className="font-medium text-gray-900 mb-1">Checkout Testing</div>
                    <div className="text-sm text-gray-600">Test purchase workflows</div>
                  </button>
                </div>
              </div>
            )}

            {/* Conversation Messages */}
            {conversationHistory.map((message, index) => (
              <div key={index} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-3xl ${message.type === 'user' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200'} rounded-2xl px-4 py-3`}>
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${message.type === 'user'
                        ? 'bg-blue-500'
                        : 'bg-gradient-to-br from-purple-500 to-blue-600'
                      }`}>
                      <span className="text-white text-sm font-medium">
                        {message.type === 'user' ? '👤' : '🤖'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`${message.type === 'user' ? 'text-white' : 'text-gray-900'}`}>
                        {message.content}
                      </p>
                      <div className={`text-xs mt-1 ${message.type === 'user' ? 'text-blue-100' : 'text-gray-500'}`}>
                        {message.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                  </div>

                  {/* Generated Flows Display */}
                  {message.flows && message.flows.length > 0 && (
                    <div className="mt-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-gray-900">Generated Test Flows</h3>
                        <button
                          onClick={approveAllFlows}
                          className="text-sm bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-md transition-colors"
                        >
                          Approve All
                        </button>
                      </div>
                      <div className="space-y-2">
                        {message.flows.map((flow, flowIndex) => (
                          <div key={flowIndex} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                            <div className="flex items-start gap-3">
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={flows[flowIndex]?.approved || false}
                                  onChange={() => toggleFlowApproval(flowIndex)}
                                  className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500"
                                />
                                <span className={`text-sm font-medium ${flows[flowIndex]?.approved ? 'text-green-700' : 'text-gray-600'}`}>
                                  {flows[flowIndex]?.approved ? 'Approved' : 'Pending'}
                                </span>
                              </label>
                              <div className="flex-1">
                                <h4 className="font-medium text-gray-900 text-sm">{flow.name}</h4>
                                <p className="text-gray-600 text-xs mt-1">{flow.description}</p>
                                {flow.estimatedTime && (
                                  <span className="inline-block bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded mt-2">
                                    ~{flow.estimatedTime}s
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Quick Actions */}
                      {getApprovedFlows().length > 0 && (
                        <div className="flex items-center gap-3 pt-3 border-t border-gray-200">
                          <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
                            🚀 Start Testing ({getApprovedFlows().length} flows)
                          </button>
                          <span className="text-xs text-gray-500">
                            Est. time: {getApprovedFlows().reduce((total, flow) => total + (flow.estimatedTime || 30), 0)}s
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Loading Message */}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
                      <span className="text-white text-sm">🤖</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                      <span className="text-gray-600 text-sm">Generating test flows...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Input Area - Fixed at Bottom */}
        <div className="border-t border-gray-200 bg-white px-4 py-4">
          <div className="max-w-4xl mx-auto">
            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Website URL Input */}
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                  Website URL:
                </label>
                <input
                  type="url"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder="https://example.com (optional)"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Main Prompt Input */}
              <div className="flex items-end gap-3">
                <div className="flex-1 relative">
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmit(e);
                      }
                    }}
                    placeholder="Describe what you want to test on your website..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    rows={1}
                    style={{ maxHeight: '120px' }}
                    onInput={(e) => {
                      const target = e.target as HTMLTextAreaElement;
                      target.style.height = 'auto';
                      target.style.height = Math.min(target.scrollHeight, 120) + 'px';
                    }}
                  />
                  <div className="absolute bottom-2 right-2 text-xs text-gray-400">
                    Press Enter to send, Shift+Enter for new line
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={!prompt.trim() || loading}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white p-3 rounded-xl transition-colors"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}