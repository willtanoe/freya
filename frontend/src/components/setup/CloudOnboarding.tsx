import { useState, useEffect } from 'react';
import {
  Cloud,
  Key,
  Globe,
  CheckCircle2,
  Loader2,
  XCircle,
  ArrowLeft,
  ExternalLink,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { useAppStore } from '../../lib/store';
import {
  CLOUD_PROVIDERS,
  fetchProviderStatus,
  configureProvider,
  testProvider,
  type ProviderConfig,
  type TestResult,
} from '../../lib/cloud-config';

// ---------------------------------------------------------------------------
// CloudOnboarding — Provider configuration with status indicators
// ---------------------------------------------------------------------------

export function CloudOnboarding({
  onComplete,
}: {
  onComplete: () => void;
}) {
  const updateSettings = useAppStore((s) => s.updateSettings);
  const [providerStatus, setProviderStatus] = useState<ProviderConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);

  // Fetch provider status on mount
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const status = await fetchProviderStatus();
      setProviderStatus(status);
      setLoading(false);
    };
    load();
  }, []);

  const handleProviderClick = (providerId: string) => {
    setSelectedProvider(providerId);
  };

  const handleBack = () => {
    setSelectedProvider(null);
  };

  const handleFinish = () => {
    updateSettings({ inferenceMode: 'cloud' });
    onComplete();
  };

  const configuredCount = providerStatus.filter((p) => p.configured).length;

  if (selectedProvider) {
    return (
      <ConfigureProviderView
        providerId={selectedProvider}
        onBack={handleBack}
        onConfigured={() => {
          // Refresh status
          fetchProviderStatus().then(setProviderStatus);
          setSelectedProvider(null);
        }}
      />
    );
  }

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
          Connect cloud providers
        </h2>
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          Configure your API keys. Only providers with keys will show models.
        </p>
      </div>

      {/* Provider grid */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div
            className="flex items-center justify-center py-12 gap-2"
            style={{ color: 'var(--color-text-tertiary)' }}
          >
            <Loader2 size={16} className="animate-spin" />
            <span className="text-sm">Loading providers...</span>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {CLOUD_PROVIDERS.filter((p) => p.id !== 'custom').map((provider) => {
              const status = providerStatus.find((s) => s.id === provider.id);
              const isConfigured = status?.configured || false;
              const modelCount = status?.modelCount || 0;

              return (
                <button
                  key={provider.id}
                  onClick={() => handleProviderClick(provider.id)}
                  className="flex flex-col items-start gap-3 p-4 rounded-xl text-left transition-all"
                  style={{
                    background: isConfigured
                      ? 'color-mix(in srgb, var(--color-success) 8%, var(--color-surface))'
                      : 'var(--color-surface)',
                    border: isConfigured
                      ? '1.5px solid var(--color-success)'
                      : '1.5px solid var(--color-border)',
                    cursor: 'pointer',
                  }}
                >
                  {/* Icon & Status */}
                  <div className="flex items-center justify-between w-full">
                    <span className="text-2xl">{provider.icon}</span>
                    {isConfigured ? (
                      <CheckCircle2 size={18} style={{ color: 'var(--color-success)' }} />
                    ) : (
                      <div
                        className="w-5 h-5 rounded-full border-2"
                        style={{ borderColor: 'var(--color-text-tertiary)' }}
                      />
                    )}
                  </div>

                  {/* Name & Status */}
                  <div className="w-full">
                    <div
                      className="text-sm font-semibold"
                      style={{ color: 'var(--color-text)' }}
                    >
                      {provider.name}
                    </div>
                    <div
                      className="text-xs mt-0.5"
                      style={{
                        color: isConfigured
                          ? 'var(--color-success)'
                          : 'var(--color-text-tertiary)',
                      }}
                    >
                      {isConfigured
                        ? `${modelCount} models available`
                        : 'Not configured'}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
        <button
          onClick={handleFinish}
          className="w-full py-3 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all"
          style={{
            background: 'var(--color-accent)',
            color: 'var(--color-on-accent)',
          }}
        >
          <CheckCircle2 size={16} />
          Finish Setup
          {configuredCount > 0 && (
            <span
              className="text-xs px-1.5 py-0.5 rounded"
              style={{ background: 'rgba(255,255,255,0.2)' }}
            >
              {configuredCount} configured
            </span>
          )}
        </button>

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

// ---------------------------------------------------------------------------
// ConfigureProviderView
// ---------------------------------------------------------------------------

function ConfigureProviderView({
  providerId,
  onBack,
  onConfigured,
}: {
  providerId: string;
  onBack: () => void;
  onConfigured: () => void;
}) {
  const provider = CLOUD_PROVIDERS.find((p) => p.id === providerId);
  if (!provider) return null;

  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState(provider.defaultBaseUrl || '');
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [error, setError] = useState('');

  const handleTest = async () => {
    if (!apiKey.trim()) {
      setError('API key is required');
      return;
    }

    setTesting(true);
    setError('');
    setTestResult(null);

    const result = await testProvider(providerId, apiKey.trim(), baseUrl.trim() || undefined);
    setTestResult(result);
    setTesting(false);
  };

  const handleSave = async () => {
    if (!apiKey.trim()) {
      setError('API key is required');
      return;
    }

    setSaving(true);
    setError('');

    const result = await configureProvider(
      providerId,
      apiKey.trim(),
      baseUrl.trim() || undefined
    );

    if (result.success) {
      onConfigured();
    } else {
      setError(result.message);
      setSaving(false);
    }
  };

  const canSave = apiKey.trim().length > 0 && testResult?.success;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs mb-3 transition-colors"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          <ArrowLeft size={12} />
          Back to providers
        </button>

        <div className="flex items-center gap-3">
          <span className="text-3xl">{provider.icon}</span>
          <div>
            <h2 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>
              Configure {provider.name}
            </h2>
            <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
              Enter your API key to enable {provider.name} models
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-5">
        {/* API Key */}
        <div>
          <label
            className="flex items-center gap-1.5 block text-xs font-semibold uppercase tracking-wider mb-2"
            style={{ color: 'var(--color-text-tertiary)' }}
          >
            <Key size={11} />
            API Key
            <span style={{ color: 'var(--color-error)' }}>*</span>
          </label>
          <div className="relative">
            <input
              type="password"
              value={apiKey}
              onChange={(e) => {
                setApiKey(e.target.value);
                setError('');
                setTestResult(null);
              }}
              placeholder={provider.apiKeyPlaceholder}
              autoComplete="off"
              className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
              style={{
                background: 'var(--color-surface)',
                border: '1.5px solid var(--color-border)',
                color: 'var(--color-text)',
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

          {provider.docsUrl && (
            <a
              href={provider.docsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 mt-2 text-xs font-medium transition-colors"
              style={{ color: 'var(--color-accent)' }}
            >
              {provider.docsLabel}
              <ExternalLink size={10} />
            </a>
          )}
        </div>

        {/* Base URL (optional for most, required for custom) */}
        {(providerId === 'custom' || baseUrl) && (
          <div>
            <label
              className="flex items-center gap-1.5 block text-xs font-semibold uppercase tracking-wider mb-2"
              style={{ color: 'var(--color-text-tertiary)' }}
            >
              <Globe size={11} />
              Base URL
              {providerId === 'custom' && <span style={{ color: 'var(--color-error)' }}>*</span>}
            </label>
            <input
              type="text"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder={provider.defaultBaseUrl || 'https://api.example.com/v1'}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
              style={{
                background: 'var(--color-surface)',
                border: '1.5px solid var(--color-border)',
                color: 'var(--color-text)',
              }}
            />
            {providerId === 'custom' && (
              <p className="text-xs mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
                The full OpenAI-compatible endpoint URL
              </p>
            )}
          </div>
        )}

        {/* Test Button */}
        <button
          onClick={handleTest}
          disabled={!apiKey.trim() || testing}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
          style={{
            background: 'var(--color-bg-tertiary)',
            color: 'var(--color-text)',
            cursor: apiKey.trim() && !testing ? 'pointer' : 'not-allowed',
            opacity: testing ? 0.7 : 1,
          }}
        >
          {testing ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              Testing connection...
            </>
          ) : (
            <>
              <RefreshCw size={14} />
              Test Connection
            </>
          )}
        </button>

        {/* Test Result */}
        {testResult && (
          <div
            className="flex items-start gap-2 px-4 py-3 rounded-xl text-sm"
            style={{
              background: testResult.success
                ? 'color-mix(in srgb, var(--color-success) 10%, transparent)'
                : 'color-mix(in srgb, var(--color-error) 10%, transparent)',
              border: `1px solid color-mix(in srgb, ${
                testResult.success ? 'var(--color-success)' : 'var(--color-error)'
              } 20%, transparent)`,
              color: testResult.success ? 'var(--color-success)' : 'var(--color-error)',
            }}
          >
            {testResult.success ? (
              <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
            ) : (
              <XCircle size={16} className="shrink-0 mt-0.5" />
            )}
            <div>
              {testResult.success ? (
                <div>
                  <span className="font-medium">Connection successful!</span>
                  <span className="ml-2 text-xs opacity-80">
                    ({testResult.models.length} models available)
                  </span>
                </div>
              ) : (
                <div>
                  <span className="font-medium">Connection failed</span>
                  {testResult.error && (
                    <p className="text-xs mt-1 opacity-80">{testResult.error}</p>
                  )}
                </div>
              )}
            </div>
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

        {/* Privacy note */}
        <div
          className="px-4 py-3 rounded-xl text-xs"
          style={{
            background: 'var(--color-bg-tertiary)',
            color: 'var(--color-text-tertiary)',
          }}
        >
          🔒 Your API key is stored locally and encrypted. It's only used to
          communicate directly with {provider.name}.
        </div>
      </div>

      {/* Footer */}
      <div className="pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
        <button
          onClick={handleSave}
          disabled={!canSave || saving}
          className="w-full py-3 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all"
          style={{
            background: canSave && !saving ? 'var(--color-success)' : 'var(--color-bg-tertiary)',
            color: canSave && !saving ? 'white' : 'var(--color-text-tertiary)',
            cursor: canSave && !saving ? 'pointer' : 'not-allowed',
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
              Save & Continue
            </>
          )}
        </button>
      </div>
    </div>
  );
}