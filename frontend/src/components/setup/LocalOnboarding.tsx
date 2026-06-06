import { useState } from 'react';
import {
  Download,
  Server,
  CheckCircle2,
  Terminal,
  ExternalLink,
  ChevronRight,
  Cpu,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// LocalOnboarding — step-by-step tutorial for setting up local AI
// ---------------------------------------------------------------------------

interface Step {
  id: number;
  icon: typeof Download;
  title: string;
  description: string;
  code?: string;
  codeLabel?: string;
  url?: string;
  urlLabel?: string;
  tip?: string;
}

const STEPS: Step[] = [
  {
    id: 1,
    icon: Download,
    title: 'Install Ollama',
    description:
      'Ollama lets you run open-source AI models locally on your machine. Download and install it from the official website.',
    url: 'https://ollama.com',
    urlLabel: 'Download Ollama →',
  },
  {
    id: 2,
    icon: Terminal,
    title: 'Pull a model',
    description:
      'Open your terminal and pull an AI model. We recommend Llama 3.2 (3B) for a good balance of speed and quality on most devices.',
    code: 'ollama pull llama3.2',
    codeLabel: 'Terminal',
    tip: 'Smaller models like llama3.2:1b run fast on any laptop. Larger models like llama3.2:7b need more RAM.',
  },
  {
    id: 3,
    icon: Server,
    title: 'Start Freya server',
    description:
      'Freya runs as a local server. Start it with one command. The server will automatically detect your Ollama installation.',
    code: 'freya serve',
    codeLabel: 'Terminal',
    tip: 'The server runs on http://127.0.0.1:8000 by default.',
  },
  {
    id: 4,
    icon: CheckCircle2,
    title: "You're ready!",
    description:
      "Freya will automatically detect your local models. That's it — no API keys needed, everything runs locally.",
  },
];

export function LocalOnboarding({
  onComplete,
}: {
  onComplete: () => void;
}) {
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [activeStep, setActiveStep] = useState(0);

  const toggleStep = (id: number) => {
    setCompletedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const isDone = completedSteps.size >= 3; // Step 4 is auto-completed once 3 steps are checked

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="mb-6">
        <div
          className="flex items-center gap-2 mb-2 text-xs font-semibold uppercase tracking-wider"
          style={{ color: 'var(--color-accent)' }}
        >
          <Cpu size={14} />
          Local Setup
        </div>
        <h2 className="text-xl font-bold mb-1" style={{ color: 'var(--color-text)' }}>
          Set up local AI with Ollama
        </h2>
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          Follow the steps below to get started with free, private AI on your machine.
        </p>
      </div>

      {/* Steps */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-3">
        {STEPS.map((step) => {
          const isCompleted = completedSteps.has(step.id);
          const isActive = activeStep === step.id - 1;

          return (
            <div
              key={step.id}
              className="rounded-xl p-4 transition-all"
              style={{
                background: isCompleted
                  ? 'color-mix(in srgb, var(--color-success) 8%, var(--color-surface))'
                  : isActive
                    ? 'var(--color-surface)'
                    : 'var(--color-surface)',
                border: isActive
                  ? '1.5px solid var(--color-accent)'
                  : '1.5px solid var(--color-border)',
                opacity: isCompleted && !isActive ? 0.7 : 1,
              }}
            >
              {/* Step header */}
              <div className="flex items-start gap-3">
                <button
                  onClick={() => {
                    toggleStep(step.id);
                    if (!isCompleted) setActiveStep(step.id);
                  }}
                  className="mt-0.5 shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all cursor-pointer"
                  style={{
                    background: isCompleted
                      ? 'var(--color-success)'
                      : 'transparent',
                    borderColor: isCompleted
                      ? 'var(--color-success)'
                      : 'var(--color-border)',
                  }}
                >
                  {isCompleted && (
                    <CheckCircle2 size={12} style={{ color: 'white' }} />
                  )}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <step.icon
                      size={14}
                      style={{
                        color: isCompleted
                          ? 'var(--color-success)'
                          : 'var(--color-text-tertiary)',
                      }}
                    />
                    <span
                      className="text-sm font-semibold"
                      style={{
                        color: isCompleted
                          ? 'var(--color-success)'
                          : 'var(--color-text)',
                      }}
                    >
                      {step.title}
                    </span>
                  </div>
                  <p
                    className="text-sm leading-relaxed"
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    {step.description}
                  </p>

                  {/* Code block */}
                  {step.code && (
                    <div
                      className="mt-3 rounded-lg p-3 font-mono text-xs"
                      style={{
                        background: 'var(--color-bg)',
                        border: '1px solid var(--color-border)',
                      }}
                    >
                      <div
                        className="flex items-center justify-between mb-1"
                      >
                        <span
                          className="text-[10px] font-semibold uppercase tracking-wider"
                          style={{ color: 'var(--color-text-tertiary)' }}
                        >
                          {step.codeLabel}
                        </span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(step.code!);
                          }}
                          className="text-[10px] px-2 py-0.5 rounded transition-colors"
                          style={{
                            color: 'var(--color-text-tertiary)',
                            background: 'var(--color-bg-tertiary)',
                          }}
                        >
                          Copy
                        </button>
                      </div>
                      <code
                        style={{
                          color: 'var(--color-accent)',
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-all',
                        }}
                      >
                        {step.code}
                      </code>
                    </div>
                  )}

                  {/* External link */}
                  {step.url && (
                    <a
                      href={step.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 mt-2 text-xs font-medium transition-colors"
                      style={{ color: 'var(--color-accent)' }}
                    >
                      {step.urlLabel}
                      <ExternalLink size={10} />
                    </a>
                  )}

                  {/* Tip */}
                  {step.tip && (
                    <div
                      className="mt-2 px-3 py-2 rounded-lg text-xs"
                      style={{
                        background: 'var(--color-bg-tertiary)',
                        color: 'var(--color-text-tertiary)',
                        borderLeft: '3px solid var(--color-accent)',
                      }}
                    >
                      💡 {step.tip}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
        {/* Progress hint */}
        <div className="flex items-center gap-2 mb-3">
          <div className="flex gap-1.5">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="w-6 h-1.5 rounded-full transition-all"
                style={{
                  background: completedSteps.has(n)
                    ? 'var(--color-success)'
                    : 'var(--color-bg-tertiary)',
                }}
              />
            ))}
          </div>
          <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
            {completedSteps.size}/3 steps done
          </span>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onComplete}
            className="flex-1 py-3 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all"
            style={{
              background: 'var(--color-accent)',
              color: 'var(--color-on-accent)',
            }}
          >
            Finish Setup
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}