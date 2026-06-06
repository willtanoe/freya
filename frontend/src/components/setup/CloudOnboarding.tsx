import { useState } from 'react';
import {
  Cloud,
  Key,
  Globe,
  CheckCircle2,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { useAppStore } from '../../lib/store';

// ---------------------------------------------------------------------------
// Cloud provider definitions
// ---------------------------------------------------------------------------

interface CloudProvider {
  id: string;
  name: string;
  modelExample: string;
  baseUrl: string;
  keyPlaceholder: string;
  docsUrl?: string;
  docsLabel?: string;
}

const PROVIDERS: CloudProvider[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    modelExample: 'gpt-4o, gpt-4o-mini, gpt-3.5-turbo',
    baseUrl: 'https://api.openai.com/v1',
    keyPlaceholder: 'sk-...',
    docsUrl: 'https://platform.openai.com/api-keys',
    docsLabel: 'Get API key →',
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    modelExample: 'claude-3-5-sonnet, claude-3-haiku',
    baseUrl: 'https://api.anthropic.com/v1',
    keyPlaceholder: 'sk-ant-...',
    docsUrl: 'https://console.anthropic.com/settings/keys',
    docsLabel: 'Get API key →',
  },
  {
    id: 'google',
    name: 'Google (Gemini)',
    modelExample: 'gemini-2.0-flash, gemini-1.5-pro',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    keyPlaceholder: 'AI...',
    docsUrl: 'https://aistudio.google.com/app/apikey',
    docsLabel: 'Get API key →',
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    modelExample: 'anthropic/claude-3.5-sonnet, openai/gpt-4o',
    baseUrl: 'https://openrouter.ai/api/v1',
    keyPlaceholder: 'sk-or-...',
    docsUrl: 'https://openrouter.ai/keys',
    docsLabel: 'Get API key →',
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    modelExample: 'deepseek-chat, deepseek-coder',
    baseUrl: 'https://api.deepseek.com/v1',
    keyPlaceholder: 'sk-...',
  },
  {
    id: 'groq',
    name: 'Groq',
    modelExample: 'llama-3.3-70b, mixtral-8x7b',
    baseUrl: 'https://api.groq.com/openai/v1',
    keyPlaceholder: 'gsk_...',
    docsUrl: 'https://console.groq.com/keys',
    docsLabel: 'Get API key →',
  },
  {
    id: 'custom',
    name: 'Custom Provider',
    modelExample: 'Any OpenAI-compatible model',
    baseUrl: '',
    keyPlaceholder: 'sk-...',
  },
];

// ---------------------------------------------------------------------------
// CloudOnboarding — provider selection + API key + custom base URL
// ---------------------------------------------------------------------------

export function CloudOnboarding({
  onComplete,
}: {
  onComplete: () => void;
}) {
  const updateSettings = useAppStore((s) => s.updateSettings);

  const [providerId, setProviderId] = useState('openai');
  const [apiKey, setApiKey] = useState('');
  const [customBaseUrl, setCustomBaseUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const selectedProvider = PROVIDERS.find((p) => p.id === providerId)!;
  const isCustom = providerId === 'custom';
  const canFinish =
    apiKey.trim().length > 0 &&
    (!isCustom || customBaseUrl.trim().length > 0);

  const handleFinish = async () => {
    if (!canFinish || saving) return;
    setSaving(true);
    setError('');

    try {
      if (isCustom) {
        // Save custom provider key and base URL
        localStorage.setItem('freya-custom-base-url', customBaseUrl.trim());
        localStorage.setItem('freya-custom-key', apiKey.trim());
        await fetch('/v1/cloud/keys', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            keys: {
              CUSTOM_API_KEY: apiKey.trim(),
              OPENAI_BASE_URL: customBaseUrl.trim(),
            },
          }),
        }).catch(() => {});
      } else {
        // Save provider-specific key
        const envKeyMap: Record<string, string> = {
          openai: 'OPENAI_API_KEY',
          anthropic: 'ANTHROPIC_API_KEY',
          google: 'GEMINI_API_KEY',
          openrouter: 'OPENROUTER_API_KEY',
          deepseek: 'DEEPSEEK_API_KEY',
          groq: 'GROQ_API_KEY',
        };
        const envKey = envKeyMap[providerId];
        const storageKey = `freya-${providerId}-key`;
        localStorage.setItem(storageKey, apiKey.trim());

        await fetch('/v1/cloud/keys', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ keys: { [envKey]: apiKey.trim() } }),
        }).catch(() => {});
      }

      // Update store with inference mode
      updateSettings({ inferenceMode: 'cloud' });
      onComplete();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || 'Failed to save configuration.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="mb-6">
        <div
          className="flex items-center gap-2 mb-2 text-xs font-semibold uppercase tracking-wider"
          style={{ color: 'var(--color-accent)' }}
        >
          <Cloud size={14} />
          Cloud Setup
        </div>
        <h2 className="text-xl font-bold mb-1" style={{ color: 'var(--color-text)' }}>
          Connect to a cloud provider
        </h2>
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          Choose your preferred AI provider and enter your API key to get started.
        </p>
      </div>

      <div className="flex-1 flex flex-col gap-5 overflow-y-auto">
        {/* Provider selection */}
        <div>
          <label
            className="block text-xs font-semibold uppercase tracking-wider mb-2"
            style={{ color: 'var(--color-text-tertiary)' }}
          >
            Provider
          </label>
          <div className="grid grid-cols-2 gap-2">
            {PROVIDERS.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  setProviderId(p.id);
                  setError('');
                }}
                className="flex flex-col items-start gap-1 p-3 rounded-xl text-left transition-all"
                style={{
                  background:
                    providerId === p.id
                      ? 'color-mix(in srgb, var(--color-accent) 10%, var(--color-surface))'
                      : 'var(--color-surface)',
                  border:
                    providerId === p.id
                      ? '1.5px solid var(--color-accent)'
                      : '1.5px solid var(--color-border)',
                  cursor: 'pointer',
                }}
              >
                <span
                  className="text-sm font-semibold"
                  style={{ color: 'var(--color-text)' }}
                >
                  {p.name}
                </span>
                <span
                  className="text-[10px] leading-tight"
                  style={{ color: 'var(--color-text-tertiary)' }}
                >
                  {p.modelExample}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* API Key */}
        <div>
          <label
            className="flex items-center gap-1.5 block text-xs font-semibold uppercase tracking-wider mb-2"
            style={{ color: 'var(--color-text-tertiary)' }}
          >
            <Key size={11} />
            API Key
          </label>
          <div className="relative">
            <input
              type="password"
              value={apiKey}
              onChange={(e) => {
                setApiKey(e.target.value);
                setError('');
              }}
              placeholder={selectedProvider.keyPlaceholder}
              autoComplete="off"
              className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
              style={{
                background: 'var(--color-surface)',
                border: '1.5px solid var(--color-border)',
                color: 'var(--color-text)',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-accent)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-border)';
              }}
            />
            {apiKey && (
              <button
                onClick={() => setApiKey('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs px-2 py-0.5 rounded"
                style={{
                  color: 'var(--color-text-tertiary)',
                  background: 'var(--color-bg-tertiary)',
                }}
              >
                Clear
              </button>
            )}
          </div>

          {selectedProvider.docsUrl && (
            <a
              href={selectedProvider.docsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 mt-2 text-xs font-medium transition-colors"
              style={{ color: 'var(--color-accent)' }}
            >
              {selectedProvider.docsLabel}
            </a>
          )}
        </div>

        {/* Custom base URL */}
        {isCustom && (
          <div>
            <label
              className="flex items-center gap-1.5 block text-xs font-semibold uppercase tracking-wider mb-2"
              style={{ color: 'var(--color-text-tertiary)' }}
            >
              <Globe size={11} />
              Base URL
            </label>
            <input
              type="text"
              value={customBaseUrl}
              onChange={(e) => {
                setCustomBaseUrl(e.target.value);
                setError('');
              }}
              placeholder="https://api.openai.com/v1"
              className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
              style={{
                background: 'var(--color-surface)',
                border: '1.5px solid var(--color-border)',
                color: 'var(--color-text)',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-accent)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-border)';
              }}
            />
            <p className="text-xs mt-1.5" style={{ color: 'var(--color-text-tertiary)' }}>
              The full OpenAI-compatible endpoint URL (must end with /v1).
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div
            className="flex items-start gap-2 px-4 py-3 rounded-xl text-sm"
            style={{
              background: 'color-mix(in srgb, var(--color-error) 10%, transparent)',
              border: '1px solid color-mix(in srgb, var(--color-error) 20%, transparent)',
              color: 'var(--color-error)',
            }}
          >
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Info note */}
        <div
          className="px-4 py-3 rounded-xl text-xs"
          style={{
            background: 'var(--color-bg-tertiary)',
            color: 'var(--color-text-tertiary)',
          }}
        >
          🔒 Your API key is stored locally in your browser and never sent to our servers. It's only used to communicate directly with your chosen provider.
        </div>
      </div>

      {/* Footer */}
      <div className="pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
        <button
          onClick={handleFinish}
          disabled={!canFinish || saving}
          className="w-full py-3 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all"
          style={{
            background: canFinish && !saving ? 'var(--color-accent)' : 'var(--color-bg-tertiary)',
            color: canFinish && !saving ? 'var(--color-on-accent)' : 'var(--color-text-tertiary)',
            cursor: canFinish && !saving ? 'pointer' : 'not-allowed',
            opacity: saving ? 0.7 : 1,
          }}
        >
          {saving ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <CheckCircle2 size={16} />
              Finish Setup
            </>
          )}
        </button>

        {/* Skip option */}
        <button
          onClick={() => {
            updateSettings({ inferenceMode: 'cloud' });
            onComplete();
          }}
          className="w-full mt-2 py-2 text-xs transition-colors"
          style={{ color: 'var(--color-text-tertiary)', cursor: 'pointer' }}
        >
          Skip for now — configure later in Settings
        </button>
      </div>
    </div>
  );
}