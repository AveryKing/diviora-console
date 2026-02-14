import { Proposal } from '../../lib/types';
import { getTemplateChecklist } from '../../lib/template_checklist';

interface TemplateChecklistProps {
  templateId: string | undefined;
  proposal: Proposal | null;
}

export function TemplateChecklist({ templateId, proposal }: TemplateChecklistProps) {
  if (templateId !== 'bug_triage') {
    if (templateId && templateId !== 'generic') {
        return (
            <div data-testid="template-checklist" className="p-4 bg-gray-50 border-t border-gray-100 italic text-[10px] text-gray-400">
                Checklist coming soon for this template.
            </div>
        );
    }
    return null;
  }

  const checklist = getTemplateChecklist(templateId, proposal);

  return (
    <div data-testid="template-checklist" className="p-4 bg-gray-50 border-t border-gray-100">
      <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">Template Completeness</h3>
      <ul className="space-y-3">
        {checklist.map((item) => (
          <li 
            key={item.id} 
            data-testid={`template-checklist-item-${item.id}`}
            className="flex items-start gap-3 group"
          >
            <div className={`mt-0.5 w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
              item.isCompleted ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-400'
            }`}>
              {item.isCompleted ? (
                <span className="text-[10px] font-bold">✓</span>
              ) : (
                <span className="text-[10px] font-bold">!</span>
              )}
            </div>
            <div>
              <p className={`text-[11px] font-bold leading-tight ${
                item.isCompleted ? 'text-gray-900 line-through decoration-gray-300' : 'text-gray-900 font-bold'
              }`}>
                {item.label}
              </p>
              {!item.isCompleted && (
                <p className="text-[9px] text-gray-500 mt-0.5 leading-tight">
                    {item.helperText}
                </p>
              )}
            </div>
          </li>
        ))}
      </ul>
      {!proposal && (
          <p className="mt-4 text-[9px] text-amber-600 italic bg-amber-50 p-2 rounded border border-amber-100">
             Submit initial message to evaluate requirements.
          </p>
      )}
    </div>
  );
}
