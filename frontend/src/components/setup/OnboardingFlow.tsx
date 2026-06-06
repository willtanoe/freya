import { CloudOnboarding } from './CloudOnboarding';

// ---------------------------------------------------------------------------
// OnboardingFlow — simplified: always cloud-first, no local mode choice.
// ---------------------------------------------------------------------------

export function OnboardingFlow({
  onComplete,
}: {
  onComplete: () => void;
}) {
  return (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{ background: 'var(--color-bg)' }}
    >
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
        {/* Logo */}
        <div className="flex items-center gap-3 mb-6">
          <img
            src="/logo.ico"
            alt="Freya"
            className="w-10 h-10 rounded-lg"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          <div>
            <span
              className="text-lg font-bold"
              style={{ color: 'var(--color-text)' }}
            >
              Freya
            </span>
            <span
              className="ml-2 text-xs px-2 py-0.5 rounded-full"
              style={{
                background: 'var(--color-accent-subtle)',
                color: 'var(--color-accent)',
              }}
            >
              Cloud
            </span>
          </div>
        </div>

        {/* Cloud onboarding */}
        <div className="flex-1 overflow-hidden">
          <CloudOnboarding onComplete={onComplete} />
        </div>
      </div>
    </div>
  );
}
