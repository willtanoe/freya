import { useEffect, useState, useCallback, useRef } from 'react';
import { Routes, Route } from 'react-router';
import { Layout } from './components/Layout';
import { ChatPage } from './pages/ChatPage';
import { DashboardPage } from './pages/DashboardPage';
import { SettingsPage } from './pages/SettingsPage';
import { GetStartedPage } from './pages/GetStartedPage';
import { AgentsPage } from './pages/AgentsPage';
import { DataSourcesPage } from './pages/DataSourcesPage';
import { LogsPage } from './pages/LogsPage';
import { CommandPalette } from './components/CommandPalette';
import { Toaster } from './components/ui/sonner';
import { useAppStore } from './lib/store';
import { fetchModels, fetchServerInfo, isTauri } from './lib/api';
import { UpdateChecker } from './components/Desktop/UpdateChecker';
import { track, hashId } from './lib/analytics';
import { OnboardingFlow } from './components/setup/OnboardingFlow';

export default function App() {
  const [setupDone, setSetupDone] = useState(
    !!localStorage.getItem('freya-setup-completed'),
  );

  const handleOnboardingComplete = useCallback(() => {
    localStorage.setItem('freya-setup-completed', '1');
    track('setup_completed', { mode: 'cloud' });
    setSetupDone(true);
  }, []);

  const prevModelRef = useRef<string>('');
  const setModels = useAppStore((s) => s.setModels);
  const setModelsLoading = useAppStore((s) => s.setModelsLoading);
  const setSelectedModel = useAppStore((s) => s.setSelectedModel);
  const selectedModel = useAppStore((s) => s.selectedModel);
  const setServerInfo = useAppStore((s) => s.setServerInfo);
  const commandPaletteOpen = useAppStore((s) => s.commandPaletteOpen);
  const setCommandPaletteOpen = useAppStore((s) => s.setCommandPaletteOpen);
  const settings = useAppStore((s) => s.settings);

  // Apply theme
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark', 'light');
    if (settings.theme === 'dark') root.classList.add('dark');
    else if (settings.theme === 'light') root.classList.add('light');
  }, [settings.theme]);

  // Sync overlay conversations (Tauri only)
  const importOverlay = useAppStore((s) => s.importOverlayConversation);
  useEffect(() => {
    if (!isTauri()) return;
    importOverlay();
    const interval = setInterval(importOverlay, 5000);
    return () => clearInterval(interval);
  }, [importOverlay]);

  // Fetch models on mount
  useEffect(() => {
    if (!setupDone) return;
    fetchModels()
      .then((m) => {
        setModels(m);
        if (!selectedModel && m.length > 0) setSelectedModel(m[0].id);
      })
      .catch(() => setModels([]))
      .finally(() => setModelsLoading(false));
  }, [setupDone]);

  // Fetch server info
  useEffect(() => {
    if (!setupDone) return;
    fetchServerInfo().then(setServerInfo).catch(() => {});
  }, [setupDone]);

  // Model changed tracking
  useEffect(() => {
    const prev = prevModelRef.current;
    const curr = selectedModel || '';
    prevModelRef.current = curr;
    if (!prev || !curr || prev === curr) return;
    void (async () => {
      const [fromHash, toHash] = await Promise.all([hashId(prev), hashId(curr)]);
      track('model_changed', { from_model_hash: fromHash, to_model_hash: toHash });
    })();
  }, [selectedModel]);

  // App opened event
  useEffect(() => {
    const t = setTimeout(() => track('app_opened', {}), 500);
    return () => clearTimeout(t);
  }, []);

  const toggleSystemPanel = useAppStore((s) => s.toggleSystemPanel);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(!commandPaletteOpen);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'i') {
        e.preventDefault();
        toggleSystemPanel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [commandPaletteOpen, setCommandPaletteOpen, toggleSystemPanel]);

  if (!setupDone) {
    return <OnboardingFlow onComplete={handleOnboardingComplete} />;
  }

  return (
    <>
      <UpdateChecker />
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<ChatPage />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="get-started" element={<GetStartedPage />} />
          <Route path="data-sources" element={<DataSourcesPage />} />
          <Route path="agents" element={<AgentsPage />} />
          <Route path="logs" element={<LogsPage />} />
        </Route>
      </Routes>
      <Toaster position="bottom-right" />
      {commandPaletteOpen && <CommandPalette />}
    </>
  );
}
