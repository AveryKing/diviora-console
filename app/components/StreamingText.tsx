import { useState, useEffect, useCallback } from 'react';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';

interface StreamingTextProps {
  text: string;
  onComplete?: () => void;
}

export function StreamingText({ text, onComplete }: StreamingTextProps) {
  const isReducedMotion = usePrefersReducedMotion();
  const [displayedText, setDisplayedText] = useState(isReducedMotion ? text : '');
  const [isStreaming, setIsStreaming] = useState(!isReducedMotion);

  const handleSkip = useCallback(() => {
    setDisplayedText(text);
    setIsStreaming(false);
    onComplete?.();
  }, [text, onComplete]);

  useEffect(() => {
    if (isReducedMotion) {
      onComplete?.();
      return;
    }

    let index = 0;
    const chunkSize = 15; // 12-24 chars per tick as requested

    const interval = setInterval(() => {
      index += chunkSize;
      if (index >= text.length) {
        setDisplayedText(text);
        setIsStreaming(false);
        clearInterval(interval);
        onComplete?.();
      } else {
        setDisplayedText(text.substring(0, index));
      }
    }, 50);

    return () => clearInterval(interval);
  }, [text, isReducedMotion, onComplete]);

  return (
    <div className="relative group">
      <div 
        data-testid="copilot-suggestion"
        className="text-xs text-gray-700 italic bg-white p-3 rounded-lg border border-blue-100 shadow-sm leading-relaxed min-h-[60px]"
      >
        {displayedText}
        {isStreaming && (
          <span 
            data-testid="copilot-suggestion-cursor"
            className="inline-block w-1 h-4 ml-1 bg-blue-500 animate-pulse align-middle"
          />
        )}
      </div>
      
      {isStreaming && (
        <button
          data-testid="copilot-suggestion-skip"
          onClick={handleSkip}
          className="absolute -bottom-2 -right-1 bg-white border border-gray-200 text-[9px] text-gray-500 px-2 py-0.5 rounded shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:text-blue-600 font-bold uppercase"
        >
          Skip Animation
        </button>
      )}
    </div>
  );
}
