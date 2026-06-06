import { useState } from 'react';
import { ArrowLeft, Cpu } from 'lucide-react';
import { OnboardingChoice, type OnboardingChoice as OnboardingChoiceType } from './OnboardingChoice';
import { LocalOnboarding } from './LocalOnboarding';
import { CloudOnboarding } from './CloudOnboarding';
import { useAppStore } from '../../lib/store';

// ---------------------------------------------------------------------------
// Step type
// ---------------------------------------------------------------------------

type Step = 'choice' | 'local' | 'cloud';

// ---------------------------------------------------------------------------
// OnboardingFlow — main orchestrator
// ---------------------------------------------------------------------------

export function OnboardingFlow({
  onComplete,
}: {
  onComplete: () => void;
}) {
  const updateSettings = useAppStore((s) => s.updateSettings);
  const [step, setStep] = useState<Step>('choice');

  const handleChoice = (choice: OnboardingChoiceType) => {
    if (choice === 'local') {
      setStep('local');
    } else {
      setStep('cloud');
    }
  };

  const handleLocalComplete = () => {
    updateSettings({ inferenceMode: 'local' });
    onComplete();
  };

  const handleCloudComplete = () => {
    onComplete();
  };

  const goBack = () => {
    if (step === 'local' || step === 'cloud') {
      setStep('choice');
    }
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{ background: 'var(--color-bg)' }}
    >
      {/* Back button (when not on choice screen) */}
      {step !== 'choice' && (
        <button
          onClick={goBack}
          className="absolute top-6 left-6 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all"
          style={{
            color: 'var(--color-text-secondary)',
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            cursor: 'pointer',
          }}
        >
          <ArrowLeft size={14} />
          Back
        </button>
      )}

      {/* Main card */}
      <div
        className="w-full max-w-2xl mx-6 p-8 rounded-2xl"
        style={{
          background: 'var(--color-bg-secondary)',
          border: '1px solid var(--color-border)',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Logo (always visible) */}
        <div className="flex items-center gap-2 mb-6">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'color-mix(in srgb, var(--color-accent) 15%, transparent)', color: 'var(--color-accent)' }}
          >
            <Cpu size={16} />
          </div>
          <span className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>
            Freya
          </span>
        </div>

        {/* Step content */}
        <div className="flex-1 overflow-hidden">
          {step === 'choice' && <OnboardingChoice onSelect={handleChoice} />}
          {step === 'local' && <LocalOnboarding onComplete={handleLocalComplete} />}
          {step === 'cloud' && <CloudOnboarding onComplete={handleCloudComplete} />}
        </div>
      </div>
    </div>
  );
}