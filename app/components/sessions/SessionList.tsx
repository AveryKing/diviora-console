import { useState } from 'react';
import { useSessionStore, CopilotSession } from '../../../lib/session_store';
import { format } from 'date-fns';
import { cn } from '../../../lib/utils';
import { ChevronRight, ChevronDown, Plus, Edit2, Trash2, Check, X } from 'lucide-react';

interface SessionListProps {
  onSelectSession?: (sessionId: string) => void;
  className?: string;
}

export function SessionList({ onSelectSession, className }: SessionListProps) {
  const { sessions, currentSessionId, actions } = useSessionStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [isOpen, setIsOpen] = useState(true);

  const handleCreate = () => {
    const id = actions.createSession('New Session');
    if (onSelectSession) onSelectSession(id);
  };

  const startEdit = (session: CopilotSession) => {
    setEditingId(session.session_id);
    setEditTitle(session.title);
  };

  const saveEdit = (id: string) => {
    if (editTitle.trim()) {
      actions.renameSession(id, editTitle.trim());
    }
    setEditingId(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this session?')) {
        actions.deleteSession(id);
    }
  };

  return (
    <div data-testid="sessions-list" className={cn("flex flex-col bg-gray-50 border-r border-gray-200 h-full w-64 transition-all duration-300", !isOpen && "w-10", className)}>
      <div className="flex items-center justify-between p-3 border-b border-gray-200">
        <div className={cn("flex items-center gap-2 overflow-hidden", !isOpen && "hidden")}>
           <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Sessions</h3>
        </div>
        <button 
            onClick={() => setIsOpen(!isOpen)}
            className="p-1 hover:bg-gray-200 rounded text-gray-500"
        >
            {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>
      </div>

      {isOpen && (
        <>
            <div className="p-2 border-b border-gray-200">
                <button
                    data-testid="session-new"
                    onClick={handleCreate}
                    className="w-full flex items-center justify-center gap-2 py-1.5 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 transition"
                >
                    <Plus size={14} />
                    New Session
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {sessions.map(session => (
                    <div
                        key={session.session_id}
                        data-testid="session-switch"
                        onClick={() => {
                            if (editingId !== session.session_id) {
                                actions.switchSession(session.session_id);
                                if (onSelectSession) onSelectSession(session.session_id);
                            }
                        }}
                        className={cn(
                            "group relative flex flex-col p-2 rounded cursor-pointer border border-transparent transition-all",
                            session.session_id === currentSessionId ? "bg-white border-gray-200 shadow-sm" : "hover:bg-gray-100"
                        )}
                    >
                        {editingId === session.session_id ? (
                            <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                                <input
                                    data-testid="session-rename-input"
                                    autoFocus
                                    className="w-full text-xs p-1 border rounded"
                                    value={editTitle}
                                    onChange={e => setEditTitle(e.target.value)}
                                    onKeyDown={e => {
                                        if (e.key === 'Enter') saveEdit(session.session_id);
                                        if (e.key === 'Escape') cancelEdit();
                                    }}
                                />
                                <button onClick={() => saveEdit(session.session_id)} className="text-green-600 hover:text-green-800"><Check size={12} /></button>
                                <button onClick={cancelEdit} className="text-red-500 hover:text-red-700"><X size={12} /></button>
                            </div>
                        ) : (
                            <div className="flex justify-between items-start">
                                <span className="text-xs font-medium truncate flex-1 pr-6" title={session.title}>{session.title}</span>
                                <div className="absolute right-2 top-2 hidden group-hover:flex gap-1 bg-white/80 rounded px-1">
                                    <button 
                                        data-testid="session-rename"
                                        onClick={(e) => { e.stopPropagation(); startEdit(session); }}
                                        className="text-gray-400 hover:text-blue-600"
                                    >
                                        <Edit2 size={10} />
                                    </button>
                                    <button 
                                        onClick={(e) => handleDelete(session.session_id, e)}
                                        className="text-gray-400 hover:text-red-600"
                                    >
                                        <Trash2 size={10} />
                                    </button>
                                </div>
                            </div>
                        )}
                        <span className="text-[10px] text-gray-400 mt-1">
                            {format(new Date(session.updated_at), 'MMM d, h:mm a')}
                        </span>
                        {/* Pinned Indicator */}
                        {(session.pinned.proposal_id || session.pinned.run_id) && (
                            <div className="flex gap-1 mt-1">
                                {session.pinned.proposal_id && <span className="text-[9px] bg-blue-100 text-blue-700 px-1 rounded">PROPOSAL</span>}
                                {session.pinned.run_id && <span className="text-[9px] bg-purple-100 text-purple-700 px-1 rounded">RUN</span>}
                            </div>
                        )}
                    </div>
                ))}

                {sessions.length === 0 && (
                    <div className="text-center py-8 text-gray-400 text-xs italic">
                        No sessions yet.
                    </div>
                )}
            </div>
        </>
      )}
    </div>
  );
}
