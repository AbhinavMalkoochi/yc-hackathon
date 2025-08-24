"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Eye, EyeOff, Key, Globe, X } from 'lucide-react';
import { addCredentials, listCredentials, removeCredentials } from '../../lib/api';

interface Credential {
  key: string;
  value: string;
}

interface StoredCredentials {
  domain: string;
  credentials: Record<string, string>;
}

export default function CredentialsManager() {
  const [isOpen, setIsOpen] = useState(false);
  const [credentials, setCredentials] = useState<StoredCredentials[]>([]);
  const [newDomain, setNewDomain] = useState('');
  const [newCredentials, setNewCredentials] = useState<Credential[]>([
    { key: 'username', value: '' },
    { key: 'password', value: '' }
  ]);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Load existing credentials
  useEffect(() => {
    loadCredentials();
  }, []);

  const loadCredentials = async () => {
    try {
      const response = await listCredentials();
      if (response.status === 'success') {
        // For now, we'll show the domains that have credentials
        // In a real implementation, you'd want to store and retrieve the actual values
        const fullCredentials: StoredCredentials[] = [];
        for (const domain of response.domains) {
          // Since we can't retrieve the actual values from the backend (for security),
          // we'll show a message explaining how the system works
          fullCredentials.push({
            domain: domain.replace('*.', ''),
            credentials: {
              note: 'Credentials stored securely. Use x_username, x_password in your prompts.',
              example: 'The AI will see: x_username, x_password (not the actual values)'
            }
          });
        }
        setCredentials(fullCredentials);
      }
    } catch (error) {
      console.error('Failed to load credentials:', error);
    }
  };

  const handleAddCredential = () => {
    setNewCredentials([...newCredentials, { key: '', value: '' }]);
  };

  const handleRemoveCredential = (index: number) => {
    if (newCredentials.length > 1) {
      setNewCredentials(newCredentials.filter((_, i) => i !== index));
    }
  };

  const handleCredentialChange = (index: number, field: 'key' | 'value', value: string) => {
    const updated = [...newCredentials];
    updated[index][field] = value;
    setNewCredentials(updated);
  };

  const handleSubmit = async () => {
    if (!newDomain.trim()) {
      setMessage({ text: 'Please enter a domain', type: 'error' });
      return;
    }

    if (newCredentials.some(c => !c.key.trim() || !c.value.trim())) {
      setMessage({ text: 'Please fill in all credential fields', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      const credentialsObj: Record<string, string> = {};
      newCredentials.forEach(c => {
        if (c.key.trim() && c.value.trim()) {
          credentialsObj[c.key.trim()] = c.value.trim();
        }
      });

      const response = await addCredentials(newDomain.trim(), credentialsObj);

      if (response.status === 'success') {
        setMessage({ text: 'Credentials added successfully!', type: 'success' });
        setNewDomain('');
        setNewCredentials([{ key: 'username', value: '' }, { key: 'password', value: '' }]);
        loadCredentials();

        // Clear message after 3 seconds
        setTimeout(() => setMessage(null), 3000);
      }
    } catch (error) {
      setMessage({ text: 'Failed to add credentials', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveStoredCredentials = async (domain: string) => {
    try {
      await removeCredentials(domain);
      setMessage({ text: 'Credentials removed successfully!', type: 'success' });
      loadCredentials();

      // Clear message after 3 seconds
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ text: 'Failed to remove credentials', type: 'error' });
    }
  };

  const togglePasswordVisibility = (domain: string) => {
    setShowPasswords(prev => ({
      ...prev,
      [domain]: !prev[domain]
    }));
  };

  return (
    <>
      {/* Credentials Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className="p-4 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors"
        title="Manage Credentials"
      >
        <Key size={24} />
      </motion.button>

      {/* Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Key size={24} />
                    <h2 className="text-xl font-bold">Credentials Manager</h2>
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
                <p className="text-blue-100 mt-2">
                  Store credentials for websites to enable automated login testing
                </p>
              </div>

              {/* Content */}
              <div className="p-6 max-h-[60vh] overflow-y-auto">
                {/* Message */}
                {message && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-3 rounded-lg mb-4 ${message.type === 'success'
                        ? 'bg-green-100 text-green-800 border border-green-200'
                        : 'bg-red-100 text-red-800 border border-red-200'
                      }`}
                  >
                    {message.text}
                  </motion.div>
                )}

                {/* Add New Credentials */}
                <div className="bg-gray-50 rounded-xl p-4 mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Plus size={20} />
                    Add New Credentials
                  </h3>

                  {/* How it works explanation */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                    <h4 className="font-medium text-blue-800 mb-2">How the Credentials System Works:</h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• Store your login credentials securely</li>
                      <li>• Use <code className="bg-blue-100 px-1 rounded">x_username</code> and <code className="bg-blue-100 px-1 rounded">x_password</code> in your prompts</li>
                      <li>• The AI sees only the placeholder names, never your actual passwords</li>
                      <li>• When you run tests, the system automatically substitutes real values</li>
                    </ul>

                    <div className="mt-3 p-2 bg-blue-100 rounded border border-blue-300">
                      <p className="text-xs font-medium text-blue-800 mb-1">Example Usage:</p>
                      <p className="text-xs text-blue-700">Instead of: "Login with john@example.com and password123"</p>
                      <p className="text-xs text-blue-700">Use: "Login with x_username and x_password"</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* Domain Input */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Website Domain
                      </label>
                      <div className="relative">
                        <Globe size={16} className="absolute left-3 top-3 text-gray-400" />
                        <input
                          type="text"
                          value={newDomain}
                          onChange={(e) => setNewDomain(e.target.value)}
                          placeholder="example.com"
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    {/* Credentials */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Credentials
                      </label>
                      <div className="space-y-2">
                        {newCredentials.map((cred, index) => (
                          <div key={index} className="flex gap-2">
                            <input
                              type="text"
                              value={cred.key}
                              onChange={(e) => handleCredentialChange(index, 'key', e.target.value)}
                              placeholder="Key (e.g., username, email)"
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <input
                              type="password"
                              value={cred.value}
                              onChange={(e) => handleCredentialChange(index, 'value', e.target.value)}
                              placeholder="Value"
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            {newCredentials.length > 1 && (
                              <button
                                onClick={() => handleRemoveCredential(index)}
                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        ))}
                        <button
                          onClick={handleAddCredential}
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
                        >
                          <Plus size={14} />
                          Add Another Field
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={handleSubmit}
                      disabled={loading}
                      className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {loading ? 'Adding...' : 'Add Credentials'}
                    </button>
                  </div>
                </div>

                {/* Existing Credentials */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    Stored Credentials ({credentials.length})
                  </h3>

                  {credentials.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Key size={48} className="mx-auto mb-3 text-gray-300" />
                      <p>No credentials stored yet</p>
                      <p className="text-sm">Add credentials above to get started</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {credentials.map((cred, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <Globe size={16} className="text-blue-600" />
                              <span className="font-medium text-gray-800">{cred.domain}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => togglePasswordVisibility(cred.domain)}
                                className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
                              >
                                {showPasswords[cred.domain] ? <EyeOff size={16} /> : <Eye size={16} />}
                              </button>
                              <button
                                onClick={() => handleRemoveStoredCredentials(cred.domain)}
                                className="p-1 text-red-500 hover:text-red-700 transition-colors"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            {Object.entries(cred.credentials).map(([key, value]) => (
                              <div key={key} className="text-sm">
                                <span className="text-gray-600 font-medium">{key}:</span>
                                <span className="ml-2 text-gray-800">
                                  {showPasswords[cred.domain] ? value : '••••••••'}
                                </span>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
