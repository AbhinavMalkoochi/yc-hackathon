import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';

interface TestFlow {
    name: string;
    description: string;
    instructions: string;
}

interface FlowGenerationProps {
    onGenerateFlows: (prompt: string, websiteUrl?: string, numFlows?: number) => Promise<TestFlow[]>;
    isLoading?: boolean;
}

export const FlowGeneration: React.FC<FlowGenerationProps> = ({
    onGenerateFlows,
    isLoading = false,
}) => {
    const [prompt, setPrompt] = useState('');
    const [websiteUrl, setWebsiteUrl] = useState('');
    const [numFlows, setNumFlows] = useState(5);
    const [generatedFlows, setGeneratedFlows] = useState<TestFlow[]>([]);
    const [error, setError] = useState<string | null>(null);

    const presetPrompts = [
        {
            name: 'E-commerce Testing',
            prompt: 'Test an e-commerce website with user registration, product browsing, cart management, and checkout process',
        },
        {
            name: 'Login & Authentication',
            prompt: 'Test user authentication flows including login, registration, password reset, and session management',
        },
        {
            name: 'Form Validation',
            prompt: 'Test form submissions with various input types, validation rules, and error handling',
        },
        {
            name: 'Navigation & Search',
            prompt: 'Test website navigation, search functionality, and content discovery features',
        },
    ];

    const handlePresetPrompt = (presetPrompt: string) => {
        setPrompt(presetPrompt);
        setError(null);
    };

    const handleGenerate = async () => {
        if (!prompt.trim()) {
            setError('Please enter a prompt for flow generation');
            return;
        }

        try {
            setError(null);
            const flows = await onGenerateFlows(prompt, websiteUrl, numFlows);
            setGeneratedFlows(flows);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to generate flows');
        }
    };

    return (
        <div className="space-y-6">
            <Card title="AI-Powered Test Flow Generation" subtitle="Generate comprehensive test scenarios using natural language">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Preset Prompts
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            {presetPrompts.map((preset) => (
                                <Button
                                    key={preset.name}
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => handlePresetPrompt(preset.prompt)}
                                    className="text-left justify-start"
                                >
                                    {preset.name}
                                </Button>
                            ))}
                        </div>
                    </div>

                    <Input
                        label="Test Description"
                        placeholder="Describe what you want to test in natural language..."
                        value={prompt}
                        onChange={setPrompt}
                        required
                        error={error}
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Website URL (Optional)"
                            placeholder="https://example.com"
                            value={websiteUrl}
                            onChange={setWebsiteUrl}
                            type="url"
                        />
                        <Input
                            label="Number of Flows"
                            placeholder="5"
                            value={numFlows.toString()}
                            onChange={(value) => setNumFlows(parseInt(value) || 5)}
                            type="number"
                        />
                    </div>

                    <Button
                        onClick={handleGenerate}
                        disabled={isLoading || !prompt.trim()}
                        className="w-full"
                    >
                        {isLoading ? 'Generating Flows...' : 'Generate Test Flows'}
                    </Button>
                </div>
            </Card>

            {generatedFlows.length > 0 && (
                <Card title="Generated Test Flows" subtitle={`${generatedFlows.length} flows generated successfully`}>
                    <div className="space-y-4">
                        {generatedFlows.map((flow, index) => (
                            <div key={index} className="border border-gray-200 rounded-lg p-4">
                                <h4 className="font-semibold text-gray-900 mb-2">{flow.name}</h4>
                                <p className="text-sm text-gray-600 mb-3">{flow.description}</p>
                                <div className="bg-gray-50 p-3 rounded">
                                    <p className="text-sm text-gray-800">{flow.instructions}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            )}
        </div>
    );
};
