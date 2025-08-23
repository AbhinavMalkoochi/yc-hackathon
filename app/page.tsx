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
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 flex flex-col relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* Header */}
      <header className="relative z-10 backdrop-blur-sm bg-white/10 border-b border-white/20 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">🤖</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">
                Browser Test Agent
              </h1>
              <p className="text-white/70 text-sm">AI-powered testing automation</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {flows.length > 0 && (
              <div className="bg-white/10 backdrop-blur-sm rounded-full px-3 py-1 border border-white/20">
                <span className="text-white/90 text-sm font-medium">
                  {getApprovedFlows().length}/{flows.length} approved
                </span>
              </div>
            )}
            <a
              href="/flow-generation-test"
              className="text-white/60 hover:text-white transition-colors text-sm flex items-center gap-1 hover:bg-white/10 px-3 py-2 rounded-lg"
              title="Advanced Testing Interface"
            >
              <span>⚙️</span>
              <span>Advanced</span>
            </a>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden flex flex-col relative z-10">
        {/* Conversation Area */}
        <div className="flex-1 overflow-y-auto px-6 py-8">
          <div className="max-w-4xl mx-auto space-y-8">

            {/* Welcome Message */}
            {conversationHistory.length === 0 && (
              <div className="text-center py-16 animate-fade-in">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl animate-float">
                  <span className="text-white font-bold text-2xl">🚀</span>
                </div>
                <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-200 to-purple-200 bg-clip-text text-transparent">
                  Test something Amazing
                </h2>
                <p className="text-white/80 mb-12 max-w-2xl mx-auto text-lg leading-relaxed">
                  Describe what you want to test on your website, and I'll generate intelligent browser automation flows.
                  Review, customize, and execute them with a single click.
                </p>

                {/* Example Prompts */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
                  <button
                    onClick={() => setPrompt("Test the login functionality on my e-commerce website")}
                    className="group p-6 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl hover:bg-white/20 transition-all duration-300 text-left hover:scale-105 hover:shadow-xl"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-lg flex items-center justify-center">
                        <span className="text-white text-sm">🔐</span>
                      </div>
                      <div className="font-semibold text-white group-hover:text-blue-200 transition-colors">Login Testing</div>
                    </div>
                    <div className="text-sm text-white/70 group-hover:text-white/90 transition-colors">Test authentication flows and user access controls</div>
                  </button>
                  <button
                    onClick={() => setPrompt("Test the checkout process including adding items to cart and payment")}
                    className="group p-6 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl hover:bg-white/20 transition-all duration-300 text-left hover:scale-105 hover:shadow-xl"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-pink-500 rounded-lg flex items-center justify-center">
                        <span className="text-white text-sm">🛒</span>
                      </div>
                      <div className="font-semibold text-white group-hover:text-blue-200 transition-colors">Checkout Testing</div>
                    </div>
                    <div className="text-sm text-white/70 group-hover:text-white/90 transition-colors">Test purchase workflows and payment processing</div>
                  </button>
                </div>
              </div>
            )}

            {/* Conversation Messages */}
            {conversationHistory.map((message, index) => (
              <div key={index} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`} style={{ animationDelay: `${index * 100}ms` }}>
                <div className={`max-w-3xl ${message.type === 'user'
                  ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-xl'
                  : 'bg-white/10 backdrop-blur-sm border border-white/20 text-white shadow-xl'
                  } rounded-3xl px-6 py-4 hover:scale-[1.02] transition-all duration-200`}>
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg ${message.type === 'user'
                      ? 'bg-white/20 backdrop-blur-sm'
                      : 'bg-gradient-to-br from-emerald-400 to-cyan-500'
                      }`}>
                      <span className="text-white text-lg font-medium">
                        {message.type === 'user' ? '👤' : '🤖'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-base leading-relaxed ${message.type === 'user' ? 'text-white' : 'text-white/90'}`}>
                        {message.content}
                      </p>
                      <div className={`text-xs mt-2 ${message.type === 'user' ? 'text-white/70' : 'text-white/60'}`}>
                        {message.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                  </div>

                  {/* Generated Flows Display */}
                  {message.flows && message.flows.length > 0 && (
                    <div className="mt-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-white text-lg">Generated Test Flows</h3>
                        <button
                          onClick={approveAllFlows}
                          className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
                        >
                          ✨ Approve All
                        </button>
                      </div>
                      <div className="space-y-3">
                        {message.flows.map((flow, flowIndex) => (
                          <div key={flowIndex} className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20 hover:bg-white/15 transition-all duration-200 hover:scale-[1.02]">
                            <div className="flex items-start gap-4">
                              <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={flows[flowIndex]?.approved || false}
                                  onChange={() => toggleFlowApproval(flowIndex)}
                                  className="w-5 h-5 text-emerald-500 bg-white/10 border-white/30 rounded-lg focus:ring-emerald-500 focus:ring-2"
                                />
                                <span className={`text-sm font-medium transition-colors ${flows[flowIndex]?.approved ? 'text-emerald-300' : 'text-white/70'}`}>
                                  {flows[flowIndex]?.approved ? '✅ Approved' : '⏳ Pending'}
                                </span>
                              </label>
                              <div className="flex-1">
                                <h4 className="font-semibold text-white text-base mb-1">{flow.name}</h4>
                                <p className="text-white/80 text-sm mb-2 leading-relaxed">{flow.description}</p>
                                {flow.estimatedTime && (
                                  <span className="inline-block bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-200 text-xs px-3 py-1 rounded-full border border-purple-400/30">
                                    ⏱️ ~{flow.estimatedTime}s
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Quick Actions */}
                      {getApprovedFlows().length > 0 && (
                        <div className="flex items-center gap-4 pt-4 border-t border-white/20">
                          <button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 py-3 rounded-2xl text-sm font-semibold transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 flex items-center gap-2">
                            <span>🚀</span>
                            <span>Start Testing ({getApprovedFlows().length} flows)</span>
                          </button>
                          <div className="bg-white/10 backdrop-blur-sm rounded-xl px-3 py-2 border border-white/20">
                            <span className="text-xs text-white/80 font-medium">
                              ⏱️ Est. time: {getApprovedFlows().reduce((total, flow) => total + (flow.estimatedTime || 30), 0)}s
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Loading Message */}
            {loading && (
              <div className="flex justify-start animate-slide-up">
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-3xl px-6 py-4 shadow-xl">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center shadow-lg">
                      <span className="text-white text-lg">🤖</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex space-x-1">
                        <div className="w-3 h-3 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-3 h-3 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-3 h-3 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                      <span className="text-white/90 text-base font-medium">Generating test flows...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Input Area - Fixed at Bottom */}
        <div className="relative z-10 backdrop-blur-sm bg-white/10 border-t border-white/20 px-6 py-6">
          <div className="max-w-4xl mx-auto">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Website URL Input */}
              <div className="flex items-center gap-4">
                <label className="text-sm font-semibold text-white/90 whitespace-nowrap flex items-center gap-2">
                  <span>🌐</span>
                  <span>Website URL:</span>
                </label>
                <input
                  type="url"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder="https://example.com (optional)"
                  className="flex-1 px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/30 rounded-2xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all duration-200"
                />
              </div>

              {/* Main Prompt Input */}
              <div className="flex items-end gap-4">
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
                    className="w-full px-6 py-4 bg-white/10 backdrop-blur-sm border border-white/30 rounded-3xl resize-none focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-white placeholder-white/60 transition-all duration-200"
                    rows={1}
                    style={{ maxHeight: '120px' }}
                    onInput={(e) => {
                      const target = e.target as HTMLTextAreaElement;
                      target.style.height = 'auto';
                      target.style.height = Math.min(target.scrollHeight, 120) + 'px';
                    }}
                  />
                  <div className="absolute bottom-3 right-4 text-xs text-white/50">
                    Press Enter to send, Shift+Enter for new line
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={!prompt.trim() || loading}
                  className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white p-4 rounded-2xl transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 disabled:hover:scale-100"
                >
                  {loading ? (
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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