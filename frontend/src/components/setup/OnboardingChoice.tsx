import { Cpu, Cloud, Zap, Lock } from 'lucide-react';

// ---------------------------------------------------------------------------
// OnboardingChoice — first screen: choose Local or Cloud
// ---------------------------------------------------------------------------

export type OnboardingChoice = 'local' | 'cloud';

interface OnboardingChoiceProps {
  onSelect: (choice: OnboardingChoice) => void;
  disabled?: boolean;
}

export function OnboardingChoice({ onSelect, disabled }: OnboardingChoiceProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-10">
      {/* Header */}
      <div className="text-center">
        <h1
          className="text-4xl font-bold mb-3"
          style={{ color: 'var(--color-text)' }}
        >
          Welcome to Freya
        </h1>
        <p
          className="text-base max-w-sm mx-auto"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          Choose how you want Freya to run AI models for you.
        </p>
      </div>

      {/* Choice cards */}
      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-lg">
        {/* Local card */}
        <button
          onClick={() => !disabled && onSelect('local')}
          disabled={disabled}
          className="flex-1 flex flex-col items-start gap-4 p-6 rounded-2xl text-left transition-all group relative overflow-hidden"
          style={{
            background: 'var(--color-surface)',
            border: '1.5px solid var(--color-border)',
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.6 : 1,
          }}
          onMouseEnter={(e) => {
            if (!disabled) {
              e.currentTarget.style.borderColor = 'var(--color-accent)';
              e.currentTarget.style.boxShadow = '0 0 0 4px color-mix(in srgb, var(--color-accent) 15%, transparent)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--color-border)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          {/* Glow accent */}
          <div
            className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-10 group-hover:opacity-20 transition-opacity"
            style={{ background: 'var(--color-accent)', filter: 'blur(32px)', transform: 'translate(30%, -30%)' }}
          />

          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ background: 'color-mix(in srgb, var(--color-accent) 15%, transparent)' }}
          >
            <Cpu size={24} style={{ color: 'var(--color-accent)' }} />
          </div>

          <div className="flex flex-col gap-1">
            <div
              className="flex items-center gap-2 text-base font-bold"
              style={{ color: 'var(--color-text)' }}
            >
              Local AI
              <span
                className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                style={{ background: 'color-mix(in srgb, var(--color-success) 15%, transparent)', color: 'var(--color-success)' }}
              >
                FREE
              </span>
            </div>
            <div
              className="text-sm leading-relaxed"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Run AI models on your own machine using Ollama. No internet required, full privacy.
            </div>
          </div>

          <div className="flex flex-col gap-1.5 w-full">
            {[
              { icon: Lock, text: '100% private — data never leaves your device' },
              { icon: Zap, text: 'Works offline — no internet needed' },
              { icon: Cpu, text: 'Uses your GPU for fast inference' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-2">
                <Icon size={12} style={{ color: 'var(--color-text-tertiary)', flexShrink: 0 }} />
                <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                  {text}
                </span>
              </div>
            ))}
          </div>
        </button>

        {/* Cloud card */}
        <button
          onClick={() => !disabled && onSelect('cloud')}
          disabled={disabled}
          className="flex-1 flex flex-col items-start gap-4 p-6 rounded-2xl text-left transition-all group relative overflow-hidden"
          style={{
            background: 'var(--color-surface)',
            border: '1.5px solid var(--color-border)',
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.6 : 1,
          }}
          onMouseEnter={(e) => {
            if (!disabled) {
              e.currentTarget.style.borderColor = 'var(--color-accent)';
              e.currentTarget.style.boxShadow = '0 0 0 4px color-mix(in srgb, var(--color-accent) 15%, transparent)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--color-border)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          {/* Glow accent */}
          <div
            className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-10 group-hover:opacity-20 transition-opacity"
            style={{ background: 'var(--color-accent-purple, var(--color-accent)', filter: 'blur(32px)', transform: 'translate(30%, -30%)' }}
          />

          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ background: 'color-mix(in srgb, var(--color-accent) 15%, transparent)' }}
          >
            <Cloud size={24} style={{ color: 'var(--color-accent)' }} />
          </div>

          <div className="flex flex-col gap-1">
            <div
              className="flex items-center gap-2 text-base font-bold"
              style={{ color: 'var(--color-text)' }}
            >
              Cloud AI
            </div>
            <div
              className="text-sm leading-relaxed"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Use powerful cloud models from OpenAI, Anthropic, Google and more.
            </div>
          </div>

          <div className="flex flex-col gap-1.5 w-full">
            {[
              { icon: Zap, text: 'Access to the most powerful AI models' },
              { icon: Cloud, text: 'Works on any device with internet' },
              { icon: Lock, text: 'Your API key — only you have access' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-2">
                <Icon size={12} style={{ color: 'var(--color-text-tertiary)', flexShrink: 0 }} />
                <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                  {text}
                </span>
              </div>
            ))}
          </div>
        </button>
      </div>

      {/* Note */}
      <p className="text-xs text-center" style={{ color: 'var(--color-text-tertiary)' }}>
        You can change this anytime in{' '}
        <span
          className="font-medium"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          Settings
        </span>
      </p>
    </div>
  );
}