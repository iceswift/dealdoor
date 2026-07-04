// src/components/onboarding/ProgressIndicator.tsx

interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
  labels?: string[];
}

export default function ProgressIndicator({ currentStep, totalSteps, labels }: ProgressIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-2 sm:gap-4 max-w-xl mx-auto py-2">
      {Array.from({ length: totalSteps }, (_, i) => {
        const step = i + 1;
        const isCompleted = step < currentStep;
        const isCurrent = step === currentStep;

        return (
          <div key={step} className="flex items-center gap-2 sm:gap-3 flex-1 last:flex-initial">
            <div className="flex flex-col items-center relative">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-2xl text-xs font-bold transition-all duration-300 border ${
                  isCompleted
                    ? 'bg-primary border-primary text-white shadow-md shadow-primary/20 scale-100'
                    : isCurrent
                    ? 'bg-bg border-primary text-primary shadow-lg shadow-primary/10 ring-4 ring-primary/10 scale-105'
                    : 'bg-bg-secondary border-border/80 text-text-tertiary scale-95'
                }`}
              >
                {isCompleted ? (
                  <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <span>{step}</span>
                )}
              </div>
            </div>
            
            {labels && (
              <span
                className={`hidden md:block text-xs font-extrabold tracking-tight transition-colors duration-200 ${
                  isCurrent ? 'text-primary' : isCompleted ? 'text-secondary' : 'text-text-tertiary'
                }`}
              >
                {labels[i]}
              </span>
            )}
            
            {i < totalSteps - 1 && (
              <div className="flex-1 h-[2px] min-w-[20px] bg-bg-secondary rounded-full overflow-hidden relative">
                <div 
                  className="absolute left-0 top-0 bottom-0 bg-primary transition-all duration-500 ease-out"
                  style={{ width: isCompleted ? '100%' : '0%' }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
