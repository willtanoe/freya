import { useState, useEffect, useRef, useCallback } from 'react';
import { Cloud, ChevronDown, Search, Check, Loader2 } from 'lucide-react';
import { useAppStore } from '../../lib/store';
import {
  fetchProviderStatus,
  fetchAvailableModels,
  getProviderIcon,
  getProviderColor,
  type ProviderConfig,
  type ProviderModels,
} from '../../lib/cloud-config';

// ---------------------------------------------------------------------------
// ModelPicker Component
// ---------------------------------------------------------------------------

export function ModelPickerButton() {
  const selectedModel = useAppStore((s) => s.selectedModel);
  const setSelectedModel = useAppStore((s) => s.setSelectedModel);
  const modelLoading = useAppStore((s) => s.modelLoading);

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [providerStatus, setProviderStatus] = useState<ProviderConfig[]>([]);
  const [providerModels, setProviderModels] = useState<ProviderModels[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [status, models] = await Promise.all([
        fetchProviderStatus(),
        fetchAvailableModels(),
      ]);
      setProviderStatus(status);
      setProviderModels(models);
    } catch (err) {
      console.error('Failed to load model data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    loadData();
  }, [open, loadData]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener('mousedown', handler);
    }
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Filter models based on search
  const filteredProviders = search
    ? providerModels
        .map((p) => ({
          ...p,
          models: p.models.filter((m) =>
            m.toLowerCase().includes(search.toLowerCase())
          ),
        }))
        .filter((p) => p.models.length > 0)
    : providerModels;

  // Get all model IDs for display
  const allModelIds = providerModels.flatMap((p) => p.models);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs transition-colors cursor-pointer"
        style={{
          background: 'transparent',
          border: '1px solid var(--color-border)',
          color: 'var(--color-text-tertiary)',
        }}
        title="Change model"
      >
        <Cloud size={12} />
        <span className="max-w-[120px] truncate">
          {modelLoading ? '...' : selectedModel || 'Pick model'}
        </span>
        <ChevronDown size={10} />
      </button>

      {open && (
        <div
          className="absolute bottom-full right-0 mb-1 w-80 max-h-96 overflow-hidden rounded-lg border shadow-lg z-50 flex flex-col"
          style={{
            background: 'var(--color-surface)',
            borderColor: 'var(--color-border)',
          }}
        >
          {/* Search */}
          <div className="p-2 border-b" style={{ borderColor: 'var(--color-border)' }}>
            <div className="relative">
              <Search
                size={12}
                className="absolute left-2 top-1/2 -translate-y-1/2"
                style={{ color: 'var(--color-text-tertiary)' }}
              />
              <input
                autoFocus
                type="text"
                placeholder="Search models..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-7 pr-2 py-1.5 text-xs rounded border outline-none"
                style={{
                  background: 'var(--color-bg)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text)',
                }}
              />
            </div>
          </div>

          {/* Model list */}
          <div className="overflow-y-auto flex-1">
            {loading ? (
              <div
                className="flex items-center justify-center py-8 gap-2"
                style={{ color: 'var(--color-text-tertiary)' }}
              >
                <Loader2 size={14} className="animate-spin" />
                <span className="text-xs">Loading models...</span>
              </div>
            ) : allModelIds.length === 0 ? (
              <div
                className="px-3 py-6 text-center"
                style={{ color: 'var(--color-text-tertiary)' }}
              >
                <p className="text-xs mb-2">No cloud models configured</p>
                <p className="text-[10px]">
                  Add API keys in Settings → Cloud Providers
                </p>
              </div>
            ) : search ? (
              // Show flat list when searching
              <div className="py-1">
                {filteredProviders.flatMap((p) =>
                  p.models.map((modelId) => (
                    <ModelItem
                      key={modelId}
                      modelId={modelId}
                      providerId={p.id}
                      selected={modelId === selectedModel}
                      onSelect={(id) => {
                        setSelectedModel(id);
                        setOpen(false);
                        setSearch('');
                      }}
                    />
                  )
                )}
                {filteredProviders.length === 0 && (
                  <div
                    className="px-3 py-4 text-center text-xs"
                    style={{ color: 'var(--color-text-tertiary)' }}
                  >
                    No models match &quot;{search}&quot;
                  </div>
                )}
              </div>
            ) : (
              // Show grouped by provider
              <div className="py-1">
                {filteredProviders.map((provider) => (
                  <ProviderSection
                    key={provider.id}
                    provider={provider}
                    selectedModel={selectedModel}
                    onSelectModel={(id) => {
                      setSelectedModel(id);
                      setOpen(false);
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// ProviderSection
// ---------------------------------------------------------------------------

function ProviderSection({
  provider,
  selectedModel,
  onSelectModel,
}: {
  provider: ProviderModels;
  selectedModel: string;
  onSelectModel: (modelId: string) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const icon = getProviderIcon(provider.id);
  const color = getProviderColor(provider.id);

  return (
    <div className="mb-1">
      {/* Provider header */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-3 py-1.5 text-xs transition-colors hover:bg-[var(--color-hover)]"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        <div className="flex items-center gap-2">
          <span>{icon}</span>
          <span className="font-medium">{provider.name}</span>
          <span
            className="px-1.5 py-0.5 rounded text-[10px]"
            style={{ background: 'var(--color-bg-tertiary)' }}
          >
            {provider.models.length}
          </span>
        </div>
        <ChevronDown
          size={10}
          style={{
            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.15s',
          }}
        />
      </button>

      {/* Models */}
      {expanded && (
        <div className="ml-4">
          {provider.models.map((modelId) => (
            <ModelItem
              key={modelId}
              modelId={modelId}
              providerId={provider.id}
              selected={modelId === selectedModel}
              onSelect={onSelectModel}
              indent
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// ModelItem
// ---------------------------------------------------------------------------

function ModelItem({
  modelId,
  providerId,
  selected,
  onSelect,
  indent = false,
}: {
  modelId: string;
  providerId: string;
  selected: boolean;
  onSelect: (modelId: string) => void;
  indent?: boolean;
}) {
  const color = getProviderColor(providerId);

  // Determine model tier from name
  const isThinking = modelId.includes('thinking') || modelId.includes('reasoning');
  const isMini = modelId.includes('mini') || modelId.includes('nano') || modelId.includes('flash') || modelId.includes('haiku');
  const isPro = modelId.includes('pro') || modelId.includes('opus') || modelId.includes('enterprise');

  let tierBadge = '';
  let tierColor = '';
  if (isThinking) {
    tierBadge = 'Think';
    tierColor = '#8b5cf6';
  } else if (isPro) {
    tierBadge = 'Pro';
    tierColor = '#f59e0b';
  } else if (isMini) {
    tierBadge = 'Fast';
    tierColor = '#10b981';
  }

  return (
    <button
      type="button"
      onClick={() => onSelect(modelId)}
      className="w-full text-left px-3 py-1.5 text-xs transition-colors flex items-center gap-2"
      style={{
        color: selected ? color : 'var(--color-text-secondary)',
        background: selected ? 'color-mix(in srgb, var(--color-accent) 8%, transparent)' : 'transparent',
        paddingLeft: indent ? '1rem' : '0.75rem',
      }}
      onMouseEnter={(e) => {
        if (!selected) {
          (e.target as HTMLElement).style.background = 'var(--color-hover)';
        }
      }}
      onMouseLeave={(e) => {
        if (!selected) {
          (e.target as HTMLElement).style.background = 'transparent';
        }
      }}
    >
      {selected && <Check size={10} style={{ color, flexShrink: 0 }} />}
      <span className="truncate flex-1">{modelId}</span>
      {tierBadge && (
        <span
          className="text-[9px] px-1 py-0.5 rounded font-medium"
          style={{ background: tierColor, color: 'white' }}
        >
          {tierBadge}
        </span>
      )}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

export { ModelPickerButton as default };