"use client";

import { useState, FC, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowUp, Check, Edit3, Globe, KeyRound, Trash2, Type,
  Bot, BarChart3, Feather, Share2, Play, Clock, CheckCircle2, AlertCircle
} from 'lucide-react';
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

// --- FLOW ICONS ---
const flowIcons = {
  'Navigation Test': <Globe size={20} />,
  'Form Testing': <Edit3 size={20} />,
  'Button Clicking': <Bot size={20} />,
  'Data Extraction': <BarChart3 size={20} />,
  'Content Verification': <Feather size={20} />,
  'User Flow': <Share2 size={20} />,
  'Login Test': <KeyRound size={20} />,
  'Search Test': <Type size={20} />
};

const getFlowIcon = (flowName: string) => {
  // Try to match flow name with predefined icons
  for (const [key, icon] of Object.entries(flowIcons)) {
    if (flowName.toLowerCase().includes(key.toLowerCase().split(' ')[0])) {
      return icon;
    }
  }
  // Default icon
  return <Bot size={20} />;
};

const HomePage: FC = () => {
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

  // --- MEMOIZED VALUES ---
  const approvedFlows = useMemo(() => flows.filter(f => f.status === 'approved'), [flows]);
  const selectedFlows = useMemo(() => flows.filter(f => f.approved).map(f => flows.indexOf(f)), [flows]);
  const hasSelection = useMemo(() => selectedFlows.length > 0, [selectedFlows]);
  const showFlows = useMemo(() => flows.length > 0, [flows]);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || loading) return;

    const userMessage = prompt.trim();
    const currentWebsiteUrl = websiteUrl.trim();

    if (!currentWebsiteUrl) return; // Require both prompt and URL

    // Add user message to conversation
    setConversationHistory(prev => [...prev, {
      type: 'user',
      content: `${userMessage}${currentWebsiteUrl ? ` (Website: ${currentWebsiteUrl})` : ''}`,
      timestamp: new Date()
    }]);

    setPrompt("");
    setLoading(true);

    try {
      const response = await generateFlows(userMessage, currentWebsiteUrl) as GenerationResponse;

      if (response.status === "success") {
        const flowsWithDefaults = response.flows.map((flow: TestFlow) => ({
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

  // --- NEW FLOW ACTION HANDLERS ---
  const handleFlowAction = (index: number, newStatus: 'approved' | 'declined') => {
    const newFlows = [...flows];
    if (newStatus === 'approved') {
      newFlows[index].approved = true;
      newFlows[index].status = 'approved';
    } else {
      newFlows[index].approved = false;
      newFlows[index].status = 'pending';
    }
    setFlows(newFlows);
  };

  const handleSelectFlow = (index: number) => {
    toggleFlowApproval(index);
  };

  const handleRunProcess = () => {
    const approvedFlowsList = flows.filter(flow => flow.approved);
    console.log("Running process for selected flows:", approvedFlowsList);
    alert(`Running ${approvedFlowsList.length} flows!`);

    // Here you would call your existing execution logic
    // For now, just simulate the process
    const newFlows = flows.map(flow =>
      flow.approved ? { ...flow, status: 'executing' as const } : flow
    );
    setFlows(newFlows);
  };

  const getApprovedFlows = () => flows.filter(flow => flow.approved);

  // --- ANIMATION VARIANTS ---
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring' as const, stiffness: 100 } }
  };

  // --- RENDER ---
  return (
    <div className="relative flex flex-col items-center w-full min-h-screen p-4 pt-24 overflow-y-auto font-sans text-gray-800 bg-[#F7F2ED]">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-rose-200/30 rounded-full filter blur-3xl animate-blob"></div>
        <div className="absolute bottom-0 right-0 w-2/3 h-2/3 bg-blue-200/30 rounded-full filter blur-3xl animate-blob animation-delay-4000"></div>
      </div>

      {/* Header */}
      <header className="absolute top-0 left-0 w-full p-8 z-20">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-semibold text-gray-700 tracking-tighter">qaesar</h1>
          <div className="flex gap-4">
            <a
              href="/browser-test"
              className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
            >
              Browser Test
            </a>
            <a
              href="/convex-test"
              className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              All Tests
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex flex-col items-center w-full max-w-2xl space-y-8">
        {/* Input Card */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          className="w-full"
        >
          <div className="relative w-full p-2 bg-white/60 border border-white/80 rounded-2xl shadow-xl shadow-black/5 backdrop-blur-2xl">
            <form onSubmit={handleFormSubmit} className="flex items-center w-full gap-2">
              <div className="flex items-center flex-grow p-2 rounded-lg bg-black/5">
                <Type className="w-5 h-5 mx-2 text-black/40" />
                <input
                  type="text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="What should we automate?"
                  className="w-full h-10 text-sm bg-transparent focus:outline-none placeholder:text-black/40"
                />
              </div>
              <div className="hidden md:flex items-center p-2 rounded-lg bg-black/5">
                <Globe className="w-5 h-5 mx-2 text-black/40" />
                <input
                  type="text"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder="Website URL"
                  className="w-40 h-10 text-sm bg-transparent focus:outline-none placeholder:text-black/40"
                />
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="submit"
                className="flex items-center justify-center flex-shrink-0 w-12 h-12 bg-gray-800 rounded-full disabled:opacity-40 disabled:cursor-not-allowed"
                disabled={!prompt || !websiteUrl || loading}
              >
                {loading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-6 h-6 border-2 border-white border-t-transparent rounded-full"
                  />
                ) : (
                  <ArrowUp className="w-6 h-6 text-white" />
                )}
              </motion.button>
            </form>
          </div>
        </motion.div>

        {/* Flows Grid */}
        <AnimatePresence>
          {showFlows && (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4"
            >
              {flows.map((flow, index) => (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  layout
                  whileHover={{ scale: 1.03, y: -5 }}
                  onClick={() => handleSelectFlow(index)}
                  className={`relative flex flex-col justify-between p-4 transition-colors bg-white/60 border rounded-2xl shadow-lg shadow-black/5 backdrop-blur-2xl cursor-pointer group ${flow.approved ? 'border-blue-500/50' : 'border-white/80'}`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2 text-gray-600">
                      {getFlowIcon(flow.name)}
                      <span className="px-2 py-0.5 text-xs text-gray-500 bg-black/5 rounded-full">
                        {flow.estimatedTime ? `${Math.round(flow.estimatedTime / 60)}m` : '2m'}
                      </span>
                    </div>
                    <h3 className="font-medium text-gray-800">{flow.name}</h3>
                    <p className="mt-1 text-sm text-gray-500">{flow.description}</p>
                  </div>
                  <div className="flex items-center justify-between mt-4">
                    <motion.div className={`flex items-center justify-center w-6 h-6 rounded-full border-2 transition-all ${flow.approved ? 'bg-blue-500 border-blue-500' : 'border-gray-300 bg-black/5'}`}>
                      <AnimatePresence>
                        {flow.approved && (
                          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                            <Check className="w-4 h-4 text-white" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          // You can add edit functionality here
                        }}
                        className="p-2 text-gray-400 transition-colors rounded-full hover:bg-black/10 hover:text-gray-700"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFlowAction(index, 'declined');
                        }}
                        className="p-2 text-gray-400 transition-colors rounded-full hover:bg-red-500/10 hover:text-red-500"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* "Run Selected" Button */}
      <AnimatePresence>
        {hasSelection && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 30 }}
            className="fixed bottom-8 z-20"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleRunProcess}
              className="px-8 py-4 font-semibold text-white bg-gray-800 rounded-full shadow-2xl shadow-black/20"
            >
              Run {selectedFlows.length} Selected
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- STYLES & ANIMATIONS --- */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob { animation: blob 10s infinite; }
        .animation-delay-4000 { animation-delay: -4s; }
        body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
      `}</style>
    </div>
  );
};

export default HomePage;