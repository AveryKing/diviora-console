import React, { useState } from 'react';
import { BugTriageFields, assembleBugTriagePrompt, parseBugTriageFromText } from '../../lib/prompt_assembly';

interface SectionComposerProps {
  draft: string;
  onAssemble: (prompt: string) => void;
  className?: string;
}

export function SectionComposer({ draft, onAssemble, className }: SectionComposerProps) {
  const [fields, setFields] = useState<BugTriageFields>({
    repro_steps: '',
    expected: '',
    actual: '',
    suspected_cause: '',
    fix_plan: '',
  });

  const handleFillFromDraft = () => {
    const parsed = parseBugTriageFromText(draft);
    setFields(prev => ({
      ...prev,
      ...parsed
    }));
  };

  const handleAssemble = () => {
    const prompt = assembleBugTriagePrompt(fields);
    onAssemble(prompt);
  };

  return (
    <div data-testid="composer" className={`p-4 bg-gray-50 border border-gray-200 rounded-lg space-y-4 ${className}`}>
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-xs font-bold uppercase text-gray-500">Section Composer</h3>
        <button
          onClick={handleFillFromDraft}
          data-testid="composer-fill-from-draft"
          className="text-xs text-blue-600 hover:text-blue-800 underline"
        >
          Fill from Draft
        </button>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Reproduction Steps</label>
          <textarea
            data-testid="composer-repro_steps"
            value={fields.repro_steps}
            onChange={e => setFields({...fields, repro_steps: e.target.value})}
            className="w-full text-xs p-2 border rounded font-mono h-20"
            placeholder="- Step 1..."
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Expected Outcome</label>
            <textarea
              data-testid="composer-expected"
              value={fields.expected}
              onChange={e => setFields({...fields, expected: e.target.value})}
              className="w-full text-xs p-2 border rounded font-mono h-20"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Actual Outcome</label>
            <textarea
              data-testid="composer-actual"
              value={fields.actual}
              onChange={e => setFields({...fields, actual: e.target.value})}
              className="w-full text-xs p-2 border rounded font-mono h-20"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Suspected Cause</label>
          <textarea
            data-testid="composer-suspected_cause"
            value={fields.suspected_cause}
            onChange={e => setFields({...fields, suspected_cause: e.target.value})}
            className="w-full text-xs p-2 border rounded font-mono h-16"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Fix Plan</label>
          <textarea
            data-testid="composer-fix_plan"
            value={fields.fix_plan}
            onChange={e => setFields({...fields, fix_plan: e.target.value})}
            className="w-full text-xs p-2 border rounded font-mono h-20"
            placeholder="- Fix step 1..."
          />
        </div>
      </div>

      <button
        onClick={handleAssemble}
        data-testid="composer-assemble"
        className="w-full py-2 bg-blue-600 text-white text-xs font-bold rounded hover:bg-blue-700 transition"
      >
        Assemble Prompt
      </button>
    </div>
  );
}
