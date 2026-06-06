import { useState, useEffect, useRef, useCallback } from 'react';
import { Cloud, ChevronDown, Search, Check, Loader2, ExternalLink } from 'lucide-react';
import { useAppStore } from '../../lib/store';
import {
  fetchProviderStatus,
  fetchAvailableModels,
  getProviderIcon,
  type ProviderModels,
} from '../../lib/cloud-config';

// Provider color map for visual distinction
const PROVIDER_COLORS: Record<string, string> = {
  openai: '#10a37f',
  anthropic: '#d4a574',
  deepseek: '#5a9bcf',
  openrouter: '#33c3f0',
  groq: '#7c3aed',
  google: '#ea4335',
  custom: '#64748b',
};

export function ModelPickerButton() {
  const selectedModel = useAppStore((s) => s.selectedModel);
  const setSelectedModel = useAppStore((s) => s.setSelectedModel);
  const modelLoading = useAppStore((s) => s.modelLoading);

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [providerModels, setProviderModels] = useState<ProviderModels[]>([]);
  const ref = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const models = await fetchAvailableModels();
      setProviderModels(models);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    loadData();
  }, [open, loadData]);

  // Focus search on open
  useEffect(() => {
    if (open && searchRef.current) {
      setTimeout(() => searchRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const allModels = providerModels.flatMap((p) =>
    p.models.map((m) => ({ id: m, provider: p.id, providerName: p.name }))
  );

  const filtered = search
    ? allModels.filter((m) => m.id.toLowerCase().includes(search.toLowerCase()))
    : allModels;

  // Group filtered results by provider
  const grouped = new Map<string, typeof filtered>();
  for (const m of filtered) {
    const group = grouped.get(m.provider) || [];
    group.push(m);
    grouped.set(m.provider, group);
  }

  return (
    <div ref={ref} className="relative">
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs transition-all cursor-pointer"
        style={{
          background: open ? 'var(--color-accent-subtle)' : 'transparent',
          border: `1px solid ${open ? 'var(--color-accent)' : 'var(--color-border)'}`,
          color: open ? 'var(--color-accent)' : 'var(--color-text-tertiary)',
        }}
        title="Change model"
      >
        <Cloud size={12} />
        <span className="max-w-[120px] truncate font-medium">
          {modelLoading ? '...' : selectedModel || 'Select model'}
        </span>
        <ChevronDown
          size={10}
          style={{ transform: open ? 'rotate(180deg)' : undefined, transition: 'transform 0.15s' }}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute bottom-full right-0 mb-2 w-72 max-h-[420px] overflow-hidden rounded-xl border shadow-xl z-50 flex flex-col"
          style={{
            background: 'var(--color-surface)',
            borderColor: 'var(--color-border)',
          }}
        >
          {/* Search bar */}
          <div className="p-2 border-b shrink-0" style={{ borderColor: 'var(--color-border)' }}>
            <div className="relative">
              <Search
                size={13}
                className="absolute left-2.5 top-1/2 -translate-y-1/2"
                style={{ color: 'var(--color-text-tertiary)' }}
              />
              <input
                ref={searchRef}
                type="text"
                placeholder="Search models..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border outline-none transition-colors"
                style={{
                  background: 'var(--color-bg)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text)',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--color-accent)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'var(--color-border)';
                }}
              />
            </div>
          </div>

          {/* Model list */}
          <div className="overflow-y-auto flex-1 py-1">
            {loading ? (
              <div className="flex items-center justify-center py-10 gap-2" style={{ color: 'var(--color-text-tertiary)' }}>
                <Loader2 size={14} className="animate-spin" />
                <span className="text-xs">Loading models...</span>
              </div>
            ) : allModels.length === 0 ? (
              <div className="px-4 py-10 text-center" style={{ color: 'var(--color-text-tertiary)' }}>
                <Cloud size={28} className="mx-auto mb-2 opacity-30" />
                <p className="text-xs font-medium mb-1">No models available</p>
                <p className="text-[11px] leading-relaxed">
                  Press <kbd className="px-1 py-0.5 text-[10px] rounded bg-[var(--color-bg-tertiary)] font-mono">⌘K</kbd> → Providers to add API keys
                </p>
              </div>
            ) : (
              [...grouped.entries()].map(([providerId, models]) => (
                <div key={providerId} className="mb-1">
                  {/* Provider header */}
                  <div
                    className="flex items-center gap-2 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider"
                    style={{ color: PROVIDER_COLORS[providerId] || 'var(--color-text-tertiary)' }}
                  >
                    <span>{getProviderIcon(providerId)}</span>
                    <span>{models[0]?.providerName || providerId}</span>
                    <span className="ml-auto opacity-60">{models.length}</span>
                  </div>

                  {/* Model items */}
                  {models.map((m) => {
                    const isActive = m.id === selectedModel;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          setSelectedModel(m.id);
                          setOpen(false);
                          setSearch('');
                        }}
                        className="w-full text-left px-3 py-1.5 text-xs transition-colors flex items-center gap-2 group"
                        style={{
                          color: isActive ? PROVIDER_COLORS[providerId] || 'var(--color-accent)' : 'var(--color-text-secondary)',
                          background: isActive ? 'color-mix(in srgb, var(--color-accent) 8%, transparent)' : 'transparent',
                          paddingLeft: '1.5rem',
                        }}
                        onMouseEnter={(e) => {
                          if (!isActive) e.currentTarget.style.background = 'var(--color-bg-secondary)';
                        }}
                        onMouseLeave={(e) => {
                          if (!isActive) e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        <div
                          className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{
                            background: isActive ? (PROVIDER_COLORS[providerId] || 'var(--color-accent)') : 'transparent',
                            border: isActive ? 'none' : '1px solid var(--color-border)',
                          }}
                        />
                        <span className="truncate flex-1">{m.id}</span>
                        {isActive && (
                          <Check size={11} style={{ color: PROVIDER_COLORS[providerId] || 'var(--color-accent)' }} />
                        )}
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </div>

          {/* Footer hint */}
          <div
            className="px-3 py-2 text-[10px] shrink-0 border-t"
            style={{
              borderColor: 'var(--color-border)',
              color: 'var(--color-text-tertiary)',
              background: 'var(--color-bg-secondary)',
            }}
          >
            Models fetched dynamically from configured providers
          </div>
        </div>
      )}
    </div>
  );
}

export { ModelPickerButton as default };
