/**
 * Cloud Configuration Module
 *
 * Manages cloud provider configuration state and API calls.
 * This is the single source of truth for cloud provider status.
 */

import { getBase, authHeaders } from './api';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CloudProvider {
  id: string;
  name: string;
  icon: string;
  color: string;
  defaultBaseUrl: string;
  apiKeyPlaceholder: string;
  docsUrl?: string;
  docsLabel?: string;
}

export interface ProviderConfig {
  id: string;
  name: string;
  configured: boolean;
  modelCount: number;
}

export interface ProviderModels {
  id: string;
  name: string;
  models: string[];
}

export interface TestResult {
  success: boolean;
  providerId: string;
  models: string[];
  error?: string;
}

// ---------------------------------------------------------------------------
// Provider Definitions
// ---------------------------------------------------------------------------

export const CLOUD_PROVIDERS: CloudProvider[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    icon: '🤖',
    color: '#10a37f',
    defaultBaseUrl: 'https://api.openai.com/v1',
    apiKeyPlaceholder: 'sk-...',
    docsUrl: 'https://platform.openai.com/api-keys',
    docsLabel: 'Get API key →',
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    icon: '🧠',
    color: '#d4a574',
    defaultBaseUrl: 'https://api.anthropic.com/v1',
    apiKeyPlaceholder: 'sk-ant-...',
    docsUrl: 'https://console.anthropic.com/settings/keys',
    docsLabel: 'Get API key →',
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    icon: '🔵',
    color: '#5a9bcf',
    defaultBaseUrl: 'https://api.deepseek.com/v1',
    apiKeyPlaceholder: 'sk-...',
    docsUrl: 'https://platform.deepseek.com/api_keys',
    docsLabel: 'Get API key →',
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    icon: '🌐',
    color: '#33c3f0',
    defaultBaseUrl: 'https://openrouter.ai/api/v1',
    apiKeyPlaceholder: 'sk-or-...',
    docsUrl: 'https://openrouter.ai/keys',
    docsLabel: 'Get API key →',
  },
  {
    id: 'groq',
    name: 'Groq',
    icon: '⚡',
    color: '#7c3aed',
    defaultBaseUrl: 'https://api.groq.com/openai/v1',
    apiKeyPlaceholder: 'gsk_...',
    docsUrl: 'https://console.groq.com/keys',
    docsLabel: 'Get API key →',
  },
  {
    id: 'google',
    name: 'Google Gemini',
    icon: '🔴',
    color: '#ea4335',
    defaultBaseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    apiKeyPlaceholder: 'AI...',
    docsUrl: 'https://aistudio.google.com/app/apikey',
    docsLabel: 'Get API key →',
  },
  {
    id: 'custom',
    name: 'Custom Provider',
    icon: '🔧',
    color: '#64748b',
    defaultBaseUrl: '',
    apiKeyPlaceholder: 'sk-...',
  },
];

// ---------------------------------------------------------------------------
// API Functions
// ---------------------------------------------------------------------------

/**
 * Fetch status of all cloud providers from backend.
 * Returns configured status and model count.
 */
export async function fetchProviderStatus(): Promise<ProviderConfig[]> {
  try {
    const base = getBase();
    const response = await fetch(`${base}/v1/providers/status`, {
      headers: authHeaders({ 'Content-Type': 'application/json' }),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch provider status: ${response.status}`);
    }

    const data = await response.json();
    return data.providers.map((p: any) => ({
      id: p.id,
      name: p.name,
      configured: p.configured,
      modelCount: p.model_count,
    }));
  } catch (error) {
    console.error('Failed to fetch provider status:', error);
    return CLOUD_PROVIDERS.map((p) => ({
      id: p.id,
      name: p.name,
      configured: false,
      modelCount: 0,
    }));
  }
}

/**
 * Fetch available models from backend.
 * Only returns models for configured providers.
 */
export async function fetchAvailableModels(): Promise<ProviderModels[]> {
  try {
    const base = getBase();
    const response = await fetch(`${base}/v1/models/available`, {
      headers: authHeaders({ 'Content-Type': 'application/json' }),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch available models: ${response.status}`);
    }

    const data = await response.json();
    return data.providers.map((p: any) => ({
      id: p.id,
      name: CLOUD_PROVIDERS.find((cp) => cp.id === p.id)?.name || p.id,
      models: p.models,
    }));
  } catch (error) {
    console.error('Failed to fetch available models:', error);
    return [];
  }
}

/**
 * Configure a cloud provider with API key.
 * Saves to backend and triggers engine reload.
 */
export async function configureProvider(
  providerId: string,
  apiKey: string,
  baseUrl?: string
): Promise<{ success: boolean; message: string }> {
  try {
    const base = getBase();
    const response = await fetch(`${base}/v1/providers/configure`, {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        provider_id: providerId,
        api_key: apiKey,
        base_url: baseUrl || '',
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Configuration failed');
    }

    return await response.json();
  } catch (error: any) {
    console.error('Failed to configure provider:', error);
    return {
      success: false,
      message: error.message || 'Failed to configure provider',
    };
  }
}

/**
 * Test connection to a provider with the given credentials.
 * Returns available models if successful.
 */
export async function testProvider(
  providerId: string,
  apiKey: string,
  baseUrl?: string
): Promise<TestResult> {
  try {
    const base = getBase();
    const response = await fetch(`${base}/v1/providers/test`, {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        provider_id: providerId,
        api_key: apiKey,
        base_url: baseUrl || '',
      }),
    });

    const data = await response.json();
    return {
      success: data.success,
      providerId: data.provider_id,
      models: data.models || [],
      error: data.error,
    };
  } catch (error: any) {
    console.error('Failed to test provider:', error);
    return {
      success: false,
      providerId,
      models: [],
      error: error.message || 'Connection test failed',
    };
  }
}

/**
 * Get provider metadata by ID.
 */
export function getProviderMeta(providerId: string): CloudProvider | undefined {
  return CLOUD_PROVIDERS.find((p) => p.id === providerId);
}

/**
 * Get provider icon by ID.
 */
export function getProviderIcon(providerId: string): string {
  const provider = getProviderMeta(providerId);
  return provider?.icon || '❓';
}

/**
 * Get provider color by ID.
 */
export function getProviderColor(providerId: string): string {
  const provider = getProviderMeta(providerId);
  return provider?.color || '#64748b';
}