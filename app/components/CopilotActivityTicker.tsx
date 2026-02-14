import { useState, useEffect } from 'react';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';

export type TickerPhase = 'reading_context' | 'checking_template' | 'identifying_gaps' | 'drafting' | 'ready';

interface CopilotActivityTickerProps {
  isActive: boolean;
  onComplete?: () => void;
}

const PHASES: TickerPhase[] = [
  'reading_context',
  'checking_template',
  'identifying_gaps',
  'drafting',
  'ready'
];

const PHASE_LABELS: Record<TickerPhase, string> = {
  reading_context: 'Reading context...',
  checking_template: 'Checking template...',
  identifying_gaps: 'Identifying gaps...',
  drafting: 'Drafting suggestion...',
  ready: 'Ready!'
};

export function CopilotActivityTicker({ isActive, onComplete }: CopilotActivityTickerProps) {
  const [completedPhases, setCompletedPhases] = useState<Set<TickerPhase>>(new Set());
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(isActive ? 0 : -1);
  const [isVisible, setIsVisible] = useState(isActive);
  const isReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (currentPhaseIndex >= 0 && currentPhaseIndex < PHASES.length) {
      const timer = setTimeout(() => {
        const phase = PHASES[currentPhaseIndex];
        setCompletedPhases(prev => new Set(prev).add(phase));
        
        if (currentPhaseIndex === PHASES.length - 1) {
          // Finished
          onComplete?.();
          if (!isReducedMotion) {
            setTimeout(() => setIsVisible(false), 1500);
          } else {
            setIsVisible(false);
          }
        } else {
          setCurrentPhaseIndex(prev => prev + 1);
        }
      }, isReducedMotion ? 0 : 400); // Instant if reduced motion

      return () => clearTimeout(timer);
    }
  }, [currentPhaseIndex, onComplete, isReducedMotion]);

  if (!isVisible) return null;

  return (
    <div 
      data-testid="copilot-activity-ticker"
      className="p-3 bg-gray-50 border-b border-gray-100 space-y-2 animate-in fade-in slide-in-from-top duration-300"
    >
      <div className="flex flex-wrap gap-2">
        {PHASES.map((phase, idx) => {
          const isDone = completedPhases.has(phase);
          const isCurrent = currentPhaseIndex === idx;
          
          return (
            <div 
              key={phase}
              data-testid={`copilot-activity-chip-${phase}`}
              className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider transition-all duration-300 flex items-center gap-1 ${
                isDone 
                  ? 'bg-green-100 text-green-700' 
                  : isCurrent 
                    ? 'bg-blue-100 text-blue-700 animate-pulse' 
                    : 'bg-gray-200 text-gray-400'
              }`}
            >
              {isDone && <span className="text-[8px]">✓</span>}
              {PHASE_LABELS[phase]}
            </div>
          );
        })}
      </div>
    </div>
  );
}
