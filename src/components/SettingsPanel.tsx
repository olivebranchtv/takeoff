/**
 * Settings Panel
 * Configure API keys and application settings
 */

import { useState, useEffect } from 'react';
import { getOpenAIApiKey, setOpenAIApiKey } from '@/utils/openaiAnalysis';

interface SettingsPanelProps {
  onClose: () => void;
}

export function SettingsPanel({ onClose }: SettingsPanelProps) {
  const [apiKey, setApiKeyState] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const key = getOpenAIApiKey();
    if (key) {
      setApiKeyState(key);
    }
  }, []);

  const handleSave = () => {
    if (apiKey.trim()) {
      setOpenAIApiKey(apiKey.trim());
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
      }, 2000);
    }
  };

  const handleClear = () => {
    setOpenAIApiKey('');
    setApiKeyState('');
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
    }, 2000);
  };

  const maskedKey = apiKey ? apiKey.substring(0, 7) + '•'.repeat(Math.max(0, apiKey.length - 11)) + apiKey.substring(apiKey.length - 4) : '';

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.5)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px'
    }} onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff',
          borderRadius: '12px',
          width: '90%',
          maxWidth: '600px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '20px 24px',
          borderBottom: '2px solid #e0e0e0',
          background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
          color: '#fff'
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 700 }}>
              ⚙️ Settings
            </h2>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', opacity: 0.9 }}>
              Configure API keys and preferences
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              background: 'rgba(255,255,255,0.2)',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '20px'
            }}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px' }}>
          <div style={{ marginBottom: '32px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px', color: '#1e3a8a' }}>
              🤖 OpenAI API Key
            </h3>

            <div style={{
              padding: '16px',
              background: '#eff6ff',
              border: '1px solid #bfdbfe',
              borderRadius: '8px',
              marginBottom: '16px',
              fontSize: '13px',
              color: '#1e40af'
            }}>
              <strong>What is this for?</strong>
              <p style={{ margin: '8px 0 0 0' }}>
                Your OpenAI API key enables the AI Document Analysis feature, which automatically extracts
                lighting schedules, panel schedules, assumptions, and scope from your drawings.
              </p>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: 600,
                marginBottom: '8px',
                color: '#374151'
              }}>
                API Key
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKeyState(e.target.value)}
                  placeholder="sk-proj-..."
                  style={{
                    width: '100%',
                    padding: '12px',
                    paddingRight: '100px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontFamily: 'monospace',
                    boxSizing: 'border-box'
                  }}
                />
                <button
                  onClick={() => setShowKey(!showKey)}
                  style={{
                    position: 'absolute',
                    right: '8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    padding: '6px 12px',
                    background: '#f3f4f6',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 500
                  }}
                >
                  {showKey ? '🙈 Hide' : '👁️ Show'}
                </button>
              </div>
              {apiKey && !showKey && (
                <div style={{
                  marginTop: '8px',
                  fontSize: '12px',
                  color: '#6b7280',
                  fontFamily: 'monospace'
                }}>
                  Current: {maskedKey}
                </div>
              )}
            </div>

            <div style={{
              padding: '12px',
              background: '#fef3c7',
              border: '1px solid #fde047',
              borderRadius: '6px',
              marginBottom: '16px',
              fontSize: '12px',
              color: '#92400e'
            }}>
              <strong>🔒 Privacy & Security:</strong>
              <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
                <li>Your API key is stored locally in your browser only</li>
                <li>It is never sent to our servers</li>
                <li>API calls go directly from your browser to OpenAI</li>
                <li>You can clear it anytime</li>
              </ul>
            </div>

            <div style={{
              padding: '12px',
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '6px',
              marginBottom: '16px',
              fontSize: '12px',
              color: '#166534'
            }}>
              <strong>💡 How to get your API key:</strong>
              <ol style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
                <li>Go to <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', textDecoration: 'underline' }}>platform.openai.com/api-keys</a></li>
                <li>Sign up or log in to your OpenAI account</li>
                <li>Click "Create new secret key"</li>
                <li>Copy the key (starts with "sk-")</li>
                <li>Paste it above and click Save</li>
              </ol>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={handleSave}
                disabled={!apiKey.trim()}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: apiKey.trim() ? '#2563eb' : '#9ca3af',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: apiKey.trim() ? 'pointer' : 'not-allowed'
                }}
              >
                {saved ? '✓ Saved!' : '💾 Save API Key'}
              </button>
              {apiKey && (
                <button
                  onClick={handleClear}
                  style={{
                    padding: '12px 20px',
                    background: '#ef4444',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  🗑️ Clear
                </button>
              )}
            </div>
          </div>

          <div style={{
            padding: '16px',
            background: '#f9fafb',
            borderRadius: '8px',
            fontSize: '13px',
            color: '#6b7280'
          }}>
            <strong style={{ color: '#374151' }}>💰 Pricing Information:</strong>
            <p style={{ margin: '8px 0 0 0' }}>
              OpenAI GPT-4 Vision costs approximately $0.01 per page analyzed.
              A typical 10-page drawing set costs about $0.10 to analyze.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
