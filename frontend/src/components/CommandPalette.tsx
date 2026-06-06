import { useState, useRef, useEffect } from 'react';
import { Search, X, Cloud, Key, Eye, EyeOff, Check, Loader2 } from 'lucide-react';
import { useAppStore } from '../lib/store';
import { fetchModels } from '../lib/api';
import {
  CLOUD_PROVIDERS,
  fetchProviderStatus,
  fetchAvailableModels,
  configureProvider,
  testProvider,
  type ProviderModels,
} from '../lib/cloud-config';

type Tab = 'models' | 'providers';

export function CommandPalette() {
  const [query, setQuery] = useState('');
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [tab, setTab] = useState<Tab>('models');
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [providerModels, setProviderModels] = useState<ProviderModels[]>([]);
  const [cloudLoading, setCloudLoading] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const [saveMsg, setSaveMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const models = useAppStore((s) => s.models);
  const selectedModel = useAppStore((s) => s.selectedModel);
  const setSelectedModel = useAppStore((s) => s.setSelectedModel);
  const setModels = useAppStore((s) => s.setModels);
  const setCommandPaletteOpen = useAppStore((s) => s.setCommandPaletteOpen);

  const filtered = query
    ? models.filter((m) => m.id.toLowerCase().includes(query.toLowerCase()))
    : models;

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    setSelectedIdx(0);
  }, [query, tab]);

  // Load cloud provider status when providers tab opens
  useEffect(() => {
    if (tab !== 'providers') return;
    setCloudLoading(true);
    Promise.all([
      fetchProviderStatus(),
      fetchAvailableModels(),
    ]).then(([status, pmodels]) => {
      setProviderModels(pmodels);
    }).catch(() => {}).finally(() => setCloudLoading(false));
  }, [tab]);

  const handleSelect = (modelId: string) => {
    setSelectedModel(modelId);
    setCommandPaletteOpen(false);
  };

  const handleSaveKey = async (providerId: string, value: string) => {
    setSaving(providerId);
    setSaveMsg(null);
    const provider = CLOUD_PROVIDERS.find((p) => p.id === providerId);
    if (!provider) return;

    if (!value) {
      // Clearing key
      const result = await configureProvider(providerId, '', '');
      setApiKeys((prev) => ({ ...prev, [providerId]: '' }));
      setSaveMsg({ type: 'success', text: 'Key removed' });
      setSaving(null);
      // Refresh
      const [status, pmodels] = await Promise.all([fetchProviderStatus(), fetchAvailableModels()]);
      setProviderModels(pmodels);
      return;
    }

    const result = await configureProvider(providerId, value, provider.defaultBaseUrl);
    if (result.success) {
      setApiKeys((prev) => ({ ...prev, [providerId]: value }));
      setSaveMsg({ type: 'success', text: 'Connected!' });
      // Refresh models
      const [status, pmodels] = await Promise.all([fetchProviderStatus(), fetchAvailableModels()]);
      setProviderModels(pmodels);
      // Refresh main model list
      fetchModels().then(setModels).catch(() => {});
    } else {
      setSaveMsg({ type: 'error', text: result.message });
    }
    setSaving(null);
    setTimeout(() => setSaveMsg(null), 3000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setCommandPaletteOpen(false);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIdx((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && tab === 'models' && filtered.length > 0) {
      e.preventDefault();
      handleSelect(filtered[selectedIdx].id);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]"
      onClick={() => setCommandPaletteOpen(false)}
    >
      <div className="fixed inset-0" style={{ background: 'rgba(0,0,0,0.5)' }} />

      <div
        className="relative w-full max-w-lg rounded-xl overflow-hidden"
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          boxShadow: 'var(--shadow-lg)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Tabs */}
        <div className="flex" style={{ borderBottom: '1px solid var(--color-border)' }}>
          {(['models', 'providers'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="flex-1 px-3 py-2.5 text-xs font-medium transition-colors cursor-pointer"
              style={{
                color: tab === t ? 'var(--color-accent)' : 'var(--color-text-tertiary)',
                borderBottom: tab === t ? '2px solid var(--color-accent)' : '2px solid transparent',
                background: 'transparent',
              }}
            >
              {t === 'models' ? `Models (${models.length})` : 'Providers'}
            </button>
          ))}
        </div>

        {/* Search */}
        {tab === 'models' && (
          <div
            className="flex items-center gap-3 px-4 py-3"
            style={{ borderBottom: '1px solid var(--color-border)' }}
          >
            <Search size={18} style={{ color: 'var(--color-text-tertiary)' }} />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search available models..."
              className="flex-1 bg-transparent outline-none text-sm"
              style={{ color: 'var(--color-text)' }}
            />
            <button
              onClick={() => setCommandPaletteOpen(false)}
              className="p-1 rounded cursor-pointer"
              style={{ color: 'var(--color-text-tertiary)' }}
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Save message */}
        {saveMsg && (
          <div
            className="px-4 py-2 text-xs"
            style={{
              color: saveMsg.type === 'success' ? 'var(--color-success)' : 'var(--color-error)',
              background: saveMsg.type === 'success'
                ? 'color-mix(in srgb, var(--color-success) 5%, transparent)'
                : 'color-mix(in srgb, var(--color-error) 5%, transparent)',
            }}
          >
            {saveMsg.text}
          </div>
        )}

        {/* Results */}
        <div className="max-h-[400px] overflow-y-auto py-2">
          {tab === 'models' ? (
            filtered.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
                {models.length === 0
                  ? 'No models available. Add API keys in the Providers tab.'
                  : 'No matching models'}
              </div>
            ) : (
              filtered.map((model, idx) => {
                const isActive = model.id === selectedModel;
                const isSelected = idx === selectedIdx;
                return (
                  <button
                    key={model.id}
                    onClick={() => handleSelect(model.id)}
                    className="flex items-center gap-3 w-full px-4 py-2.5 transition-colors text-left cursor-pointer"
                    style={{ background: isSelected ? 'var(--color-bg-secondary)' : 'transparent' }}
                    onMouseEnter={() => setSelectedIdx(idx)}
                  >
                    <Cloud size={16} style={{ color: isActive ? 'var(--color-accent)' : 'var(--color-text-tertiary)' }} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm truncate" style={{ color: isActive ? 'var(--color-accent)' : 'var(--color-text)', fontWeight: isActive ? 500 : 400 }}>
                        {model.id}
                      </div>
                    </div>
                    {isActive && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'var(--color-accent-subtle)', color: 'var(--color-accent)' }}>
                        Active
                      </span>
                    )}
                  </button>
                );
              })
            )
          ) : (
            /* Providers tab */
            <div className="px-4 py-2">
              <div className="text-[11px] mb-3" style={{ color: 'var(--color-text-tertiary)' }}>
                Add API keys to connect cloud providers. Keys are stored locally.
              </div>

              {cloudLoading ? (
                <div className="text-xs py-4 text-center" style={{ color: 'var(--color-text-tertiary)' }}>
                  <Loader2 size={14} className="animate-spin inline mr-1" />
                  Loading providers...
                </div>
              ) : (
                CLOUD_PROVIDERS.filter((p) => p.id !== 'custom').map((provider) => {
                  const key = apiKeys[provider.id] || '';
                  const hasKey = !!key;
                  const isVisible = showKeys[provider.id];
                  const pm = providerModels.find((p) => p.id === provider.id);
                  const modelCount = pm?.models?.length || 0;

                  return (
                    <div key={provider.id} className="mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-base">{provider.icon}</span>
                        <span className="text-xs font-medium" style={{ color: 'var(--color-text)' }}>{provider.name}</span>
                        {hasKey && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: 'color-mix(in srgb, var(--color-success) 10%, transparent)', color: 'var(--color-success)' }}>
                            {modelCount > 0 ? `${modelCount} models` : 'Connected'}
                          </span>
                        )}
                      </div>

                      {/* API key input */}
                      <div className="flex gap-1.5 mb-2">
                        <div className="flex-1 flex items-center rounded-lg" style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>
                          <Key size={12} className="ml-2.5 shrink-0" style={{ color: 'var(--color-text-tertiary)' }} />
                          <input
                            type={isVisible ? 'text' : 'password'}
                            value={key}
                            onChange={(e) => setApiKeys((prev) => ({ ...prev, [provider.id]: e.target.value }))}
                            onBlur={(e) => {
                              const newVal = e.target.value;
                              if (newVal !== (apiKeys[provider.id] || '')) {
                                handleSaveKey(provider.id, newVal);
                              }
                            }}
                            placeholder={provider.apiKeyPlaceholder}
                            className="flex-1 text-xs px-2 py-1.5 bg-transparent outline-none font-mono"
                            style={{ color: 'var(--color-text)' }}
                          />
                          <button
                            onClick={() => setShowKeys((prev) => ({ ...prev, [provider.id]: !prev[provider.id] }))}
                            className="px-2 cursor-pointer" style={{ color: 'var(--color-text-tertiary)' }}
                          >
                            {isVisible ? <EyeOff size={12} /> : <Eye size={12} />}
                          </button>
                        </div>
                        {hasKey && (
                          <button
                            onClick={() => handleSaveKey(provider.id, '')}
                            className="px-2 py-1 rounded-lg text-[10px] cursor-pointer"
                            style={{ color: 'var(--color-error)', border: '1px solid var(--color-error)' }}
                          >
                            Remove
                          </button>
                        )}
                        {saving === provider.id && (
                          <Loader2 size={14} className="animate-spin self-center" style={{ color: 'var(--color-accent)' }} />
                        )}
                      </div>

                      {/* Available models */}
                      {hasKey && modelCount > 0 && (
                        <div className="ml-6 flex flex-col gap-1">
                          {pm!.models.map((modelId) => {
                            const isActive = modelId === selectedModel;
                            return (
                              <button
                                key={modelId}
                                onClick={() => handleSelect(modelId)}
                                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left cursor-pointer transition-colors"
                                style={{ background: isActive ? 'var(--color-accent-subtle)' : 'transparent' }}
                                onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = 'var(--color-bg-secondary)'; }}
                                onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                              >
                                <Cloud size={12} style={{ color: isActive ? 'var(--color-accent)' : 'var(--color-text-tertiary)' }} />
                                <div className="flex-1 min-w-0">
                                  <div className="text-xs truncate" style={{ color: isActive ? 'var(--color-accent)' : 'var(--color-text)', fontWeight: isActive ? 500 : 400 }}>
                                    {modelId}
                                  </div>
                                </div>
                                {isActive && (
                                  <span className="text-[9px] px-1.5 py-0.5 rounded-full shrink-0" style={{ background: 'var(--color-accent-subtle)', color: 'var(--color-accent)' }}>
                                    Active
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {hasKey && modelCount === 0 && !cloudLoading && (
                        <div className="ml-6 text-[10px]" style={{ color: 'var(--color-text-tertiary)' }}>
                          No models available — verify your API key
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="flex items-center gap-4 px-4 py-2 text-[11px]"
          style={{ borderTop: '1px solid var(--color-border)', color: 'var(--color-text-tertiary)' }}
        >
          {tab === 'models' ? (
            <>
              <span><kbd className="font-mono">↑↓</kbd> Navigate</span>
              <span><kbd className="font-mono">Enter</kbd> Select</span>
              <span><kbd className="font-mono">Esc</kbd> Close</span>
            </>
          ) : (
            <span>API keys stored locally, never sent to Freya servers</span>
          )}
        </div>
      </div>
    </div>
  );
}
