import React, { useMemo } from 'react';
import { computeCharDiffStats } from '../../lib/diff_utils';

interface DiffViewProps {
  original: string;
  modified: string;
}

export function DiffView({ original, modified }: DiffViewProps) {
  const stats = useMemo(() => computeCharDiffStats(original, modified), [original, modified]);

  return (
    <div className="space-y-2">
      <div 
        data-testid="copilot-diff-summary"
        className="text-[10px] font-mono text-gray-500 bg-gray-100 p-1 rounded text-center"
      >
        Added: {stats.added} chars, Removed: {stats.removed} chars
      </div>
      
      <div className="grid grid-cols-2 gap-2 h-64">
        <div className="flex flex-col">
          <span className="text-[9px] uppercase font-bold text-gray-400 mb-1">Original</span>
          <div 
            data-testid="copilot-diff-left"
            className="flex-1 p-2 bg-red-50 border border-red-100 rounded text-[10px] font-mono overflow-auto whitespace-pre-wrap select-text"
          >
            {original}
          </div>
        </div>
        <div className="flex flex-col">
          <span className="text-[9px] uppercase font-bold text-blue-400 mb-1">Draft</span>
          <div 
            data-testid="copilot-diff-right"
            className="flex-1 p-2 bg-green-50 border border-green-100 rounded text-[10px] font-mono overflow-auto whitespace-pre-wrap select-text"
          >
            {modified}
          </div>
        </div>
      </div>
    </div>
  );
}
