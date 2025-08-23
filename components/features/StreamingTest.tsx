import React, { useState, useEffect, useRef } from 'react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

interface StreamMessage {
    type: string;
    message: string;
    timestamp: string;
    [key: string]: any;
}

export const StreamingTest: React.FC = () => {
    const [isConnected, setIsConnected] = useState(false);
    const [messages, setMessages] = useState<StreamMessage[]>([]);
    const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
    const eventSourceRef = useRef<EventSource | null>(null);

    const connectToStream = () => {
        if (eventSourceRef.current) {
            eventSourceRef.current.close();
        }

        setConnectionStatus('connecting');
        setMessages([]);

        try {
            const eventSource = new EventSource('/api/stream');
            eventSourceRef.current = eventSource;

            eventSource.onopen = () => {
                setIsConnected(true);
                setConnectionStatus('connected');
                console.log('Streaming connection established');
            };

            eventSource.onmessage = (event) => {
                try {
                    const data: StreamMessage = JSON.parse(event.data);
                    setMessages(prev => [...prev, data]);
                } catch (error) {
                    console.error('Failed to parse stream message:', error);
                }
            };

            eventSource.onerror = (error) => {
                console.error('Streaming error:', error);
                setConnectionStatus('disconnected');
                setIsConnected(false);
                eventSource.close();
            };

        } catch (error) {
            console.error('Failed to create EventSource:', error);
            setConnectionStatus('disconnected');
        }
    };

    const disconnectFromStream = () => {
        if (eventSourceRef.current) {
            eventSourceRef.current.close();
            eventSourceRef.current = null;
        }
        setIsConnected(false);
        setConnectionStatus('disconnected');
    };

    const clearMessages = () => {
        setMessages([]);
    };

    useEffect(() => {
        return () => {
            if (eventSourceRef.current) {
                eventSourceRef.current.close();
            }
        };
    }, []);

    const getStatusColor = () => {
        switch (connectionStatus) {
            case 'connected': return 'text-green-600';
            case 'connecting': return 'text-yellow-600';
            case 'disconnected': return 'text-red-600';
            default: return 'text-gray-600';
        }
    };

    const getStatusText = () => {
        switch (connectionStatus) {
            case 'connected': return 'Connected';
            case 'connecting': return 'Connecting...';
            case 'disconnected': return 'Disconnected';
            default: return 'Unknown';
        }
    };

    return (
        <div className="space-y-6">
            <Card title="Real-time Streaming Test" subtitle="Test Server-Sent Events communication with FastAPI backend">
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className={`font-medium ${getStatusColor()}`}>
                                Status: {getStatusText()}
                            </div>
                            <div className={`w-3 h-3 rounded-full ${connectionStatus === 'connected' ? 'bg-green-500' :
                                    connectionStatus === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'
                                }`} />
                        </div>

                        <div className="flex space-x-2">
                            {!isConnected ? (
                                <Button onClick={connectToStream} disabled={connectionStatus === 'connecting'}>
                                    Connect to Stream
                                </Button>
                            ) : (
                                <Button variant="danger" onClick={disconnectFromStream}>
                                    Disconnect
                                </Button>
                            )}
                            <Button variant="secondary" onClick={clearMessages}>
                                Clear Messages
                            </Button>
                        </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-medium text-gray-900 mb-2">Connection Information</h4>
                        <div className="text-sm text-gray-600 space-y-1">
                            <div>Endpoint: <code className="bg-gray-200 px-1 rounded">/api/stream</code></div>
                            <div>Protocol: Server-Sent Events (SSE)</div>
                            <div>Auto-reconnection: Enabled</div>
                            <div>Messages received: {messages.length}</div>
                        </div>
                    </div>
                </div>
            </Card>

            {messages.length > 0 && (
                <Card title="Streaming Messages" subtitle={`${messages.length} messages received`}>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                        {messages.map((message, index) => (
                            <div key={index} className="border border-gray-200 rounded-lg p-3 bg-white">
                                <div className="flex items-start justify-between mb-2">
                                    <span className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                                        {message.type}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                        {new Date(message.timestamp).toLocaleTimeString()}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-800 mb-2">{message.message}</p>
                                {message.counter && (
                                    <div className="text-xs text-gray-600">
                                        Counter: {message.counter}
                                    </div>
                                )}
                                {message.data && (
                                    <div className="text-xs text-gray-600">
                                        Data: {JSON.stringify(message.data)}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </Card>
            )}
        </div>
    );
};
