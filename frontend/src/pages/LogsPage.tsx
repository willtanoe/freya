import { useRef, useEffect, useState } from 'react';
import { Copy, Trash2, MessageSquare, RefreshCw } from 'lucide-react';
import { useAppStore } from '../lib/store';
import { fetchSessions, type SessionInfo } from '../lib/api';

const LEVEL_COLORS: Record<string, string> = {
  info: 'var(--color-text)',
  warn: 'var(--color-warning)',
  error: 'var(--color-error)',
};

function formatTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function formatDate(ts: number): string {
  const d = new Date(ts * 1000);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function SessionsView() {
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchSessions(20);
      setSessions(data);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <div
      className="flex-1 overflow-y-auto rounded-xl p-4"
      style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
          {sessions.length} sessions
        </span>
        <button
          onClick={load}
          className="flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors cursor-pointer"
          style={{ color: 'var(--color-text-secondary)' }}
          disabled={loading}
        >
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {loading && sessions.length === 0 ? (
        <div className="text-center py-12" style={{ color: 'var(--color-text-tertiary)' }}>
          Loading sessions...
        </div>
      ) : error ? (
        <div className="text-center py-12" style={{ color: 'var(--color-error)' }}>
          {error}
        </div>
      ) : sessions.length === 0 ? (
        <div className="text-center py-12" style={{ color: 'var(--color-text-tertiary)' }}>
          <MessageSquare size={32} className="mx-auto mb-2 opacity-40" />
          No sessions yet. Start a conversation to see it here.
        </div>
      ) : (
        <div className="space-y-2">
          {sessions.map((s, i) => (
            <div
              key={s.session_id || s.id || i}
              className="rounded-lg p-3 text-sm"
              style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium truncate" style={{ color: 'var(--color-text)' }}>
                  {s.model || 'Chat session'}
                </span>
                {s.started_at && (
                  <span className="text-xs shrink-0" style={{ color: 'var(--color-text-tertiary)' }}>
                    {formatDate(s.started_at)}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 mt-1.5 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                {s.message_count != null && <span>{s.message_count} messages</span>}
                {s.total_tokens != null && <span>{s.total_tokens} tokens</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function LogsPage() {
  const logEntries = useAppStore((s) => s.logEntries);
  const clearLogs = useAppStore((s) => s.clearLogs);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [tab, setTab] = useState<'logs' | 'sessions'>('logs');

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logEntries.length]);

  const handleCopy = async () => {
    const text = logEntries
      .map((e) => `${formatTime(e.timestamp)} [${e.level}] [${e.category}] ${e.message}`)
      .join('\n');
    await navigator.clipboard.writeText(text);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden px-6 py-10">
      <div className="max-w-4xl mx-auto w-full flex flex-col flex-1 overflow-hidden">
        <header className="mb-6 shrink-0">
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
              Logs
            </h1>
            {tab === 'logs' && (
              <div className="flex items-center gap-2">
                <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                  {logEntries.length} entries
                </span>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                  style={{ background: 'var(--color-bg-secondary)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}
                >
                  <Copy size={12} /> Copy All
                </button>
                <button
                  onClick={clearLogs}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                  style={{ background: 'var(--color-bg-secondary)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}
                >
                  <Trash2 size={12} /> Clear
                </button>
              </div>
            )}
          </div>
          <p className="text-sm mt-2 max-w-2xl" style={{ color: 'var(--color-text-secondary)' }}>
            Recent activity — chat events, model switches, tool calls, and system messages from this session.
          </p>

          {/* Tabs */}
          <div className="flex gap-1 mt-4">
            <button
              onClick={() => setTab('logs')}
              className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer"
              style={{
                background: tab === 'logs' ? 'var(--color-bg-secondary)' : 'transparent',
                color: tab === 'logs' ? 'var(--color-text)' : 'var(--color-text-secondary)',
                border: tab === 'logs' ? '1px solid var(--color-border)' : '1px solid transparent',
              }}
            >
              Live Logs
            </button>
            <button
              onClick={() => setTab('sessions')}
              className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer"
              style={{
                background: tab === 'sessions' ? 'var(--color-bg-secondary)' : 'transparent',
                color: tab === 'sessions' ? 'var(--color-text)' : 'var(--color-text-secondary)',
                border: tab === 'sessions' ? '1px solid var(--color-border)' : '1px solid transparent',
              }}
            >
              Sessions
            </button>
          </div>
        </header>

        {tab === 'logs' ? (
          <div
            className="flex-1 overflow-y-auto rounded-xl p-4 font-mono text-xs leading-relaxed"
            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
          >
            {logEntries.length === 0 ? (
              <div className="text-center py-12" style={{ color: 'var(--color-text-tertiary)' }}>
                No log entries yet. Logs appear as you chat, switch models, and interact with the app.
              </div>
            ) : (
              logEntries.map((entry, i) => (
                <div key={i} className="py-0.5">
                  <span style={{ color: 'var(--color-text-tertiary)' }}>{formatTime(entry.timestamp)}</span>
                  {' '}
                  <span style={{ color: LEVEL_COLORS[entry.level] || 'var(--color-text)' }}>
                    [{entry.category}]
                  </span>
                  {' '}
                  <span style={{ color: LEVEL_COLORS[entry.level] || 'var(--color-text)' }}>
                    {entry.message}
                  </span>
                </div>
              ))
            )}
            <div ref={bottomRef} />
          </div>
        ) : (
          <SessionsView />
        )}
      </div>
    </div>
  );
}
