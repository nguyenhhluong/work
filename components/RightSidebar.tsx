
import React, { useRef } from 'react';
import { History, FolderOpen, FileText, X, Upload, Database, ChevronRight, Clock, PanelRight } from 'lucide-react';
import { ChatSession, ProjectFile } from '../types';

interface RightSidebarProps {
  sessions: ChatSession[];
  activeSessionId: string;
  projectFiles: ProjectFile[];
  onSelectSession: (id: string) => void;
  onUploadFile: (file: File) => void;
  onRemoveFile: (id: string) => void;
  isOpen: boolean;
  onToggle: (open: boolean) => void;
}

export const RightSidebar: React.FC<RightSidebarProps> = ({
  sessions,
  activeSessionId,
  projectFiles,
  onSelectSession,
  onUploadFile,
  onRemoveFile,
  isOpen,
  onToggle
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <aside className={`${isOpen ? 'w-80' : 'w-0'} bg-black border-l border-grok-border flex flex-col shrink-0 transition-all duration-200 z-50 relative overflow-hidden`}>
      <div className="w-80 flex flex-col h-full">
        <header className="h-14 border-b border-grok-border flex items-center justify-between px-6">
          <h3 className="text-xs font-bold uppercase tracking-widest text-grok-muted">Context</h3>
          <button onClick={() => onToggle(false)} className="p-1.5 text-grok-muted hover:text-white">
            <PanelRight size={18} className="rotate-180" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-10">
          <section>
            <h4 className="text-[10px] font-black text-grok-muted uppercase tracking-[0.2em] mb-4">History</h4>
            <div className="space-y-1">
              {sessions.map((s) => (
                <button
                  key={s.id}
                  onClick={() => onSelectSession(s.id)}
                  className={`w-full text-left p-3 rounded-xl transition-all ${activeSessionId === s.id ? 'bg-grok-secondary text-white' : 'text-grok-muted hover:bg-white/5 hover:text-white'}`}
                >
                  <p className="text-xs font-medium truncate">{s.title}</p>
                </button>
              ))}
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-[10px] font-black text-grok-muted uppercase tracking-[0.2em]">Files</h4>
              <button onClick={() => fileInputRef.current?.click()} className="text-grok-accent hover:text-white transition-all">
                <Upload size={14} />
              </button>
              <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => e.target.files?.[0] && onUploadFile(e.target.files[0])} />
            </div>
            <div className="space-y-2">
              {projectFiles.map((f) => (
                <div key={f.id} className="flex items-center justify-between p-2 bg-grok-secondary rounded-xl border border-grok-border">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText size={14} className="text-grok-accent" />
                    <span className="text-xs text-white truncate">{f.name}</span>
                  </div>
                  <button onClick={() => onRemoveFile(f.id)} className="text-grok-muted hover:text-grok-error">
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </aside>
  );
};
