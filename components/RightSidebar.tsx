
import React, { useRef } from 'react';
import { History, FolderOpen, FileText, X, Upload, Database } from 'lucide-react';
import { ChatSession, ProjectFile } from '../types';

interface RightSidebarProps {
  sessions: ChatSession[];
  activeSessionId: string;
  projectFiles: ProjectFile[];
  onSelectSession: (id: string) => void;
  onUploadFile: (file: File) => void;
  onRemoveFile: (id: string) => void;
  onClose: () => void;
}

export const RightSidebar: React.FC<RightSidebarProps> = ({
  sessions,
  activeSessionId,
  projectFiles,
  onSelectSession,
  onUploadFile,
  onRemoveFile,
  onClose
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onUploadFile(e.target.files[0]);
    }
  };

  return (
    <aside className="w-80 bg-slate-900 border-l border-slate-800 flex flex-col shrink-0 animate-in slide-in-from-right duration-300">
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <h2 className="font-semibold text-sm flex items-center gap-2">
          <Database size={16} className="text-blue-500" />
          Knowledge & History
        </h2>
        <button onClick={onClose} className="p-1 hover:bg-slate-800 rounded-lg text-slate-500">
          <X size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-8">
        {/* History */}
        <section>
          <div className="flex items-center justify-between mb-3 px-2">
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
              <History size={12} />
              Recent Chats
            </h3>
          </div>
          <div className="space-y-1">
            {sessions.length === 0 ? (
              <p className="text-xs text-slate-600 italic px-2">No history yet</p>
            ) : (
              sessions.map((session) => (
                <button
                  key={session.id}
                  onClick={() => onSelectSession(session.id)}
                  className={`w-full text-left p-3 rounded-lg text-xs transition-all border ${
                    activeSessionId === session.id
                      ? 'bg-slate-800 border-slate-700 text-slate-100'
                      : 'border-transparent text-slate-400 hover:bg-slate-800/50'
                  }`}
                >
                  <p className="font-medium truncate mb-1">{session.title || 'Untitled Chat'}</p>
                  <p className="text-[10px] opacity-50">
                    {new Date(session.createdAt).toLocaleDateString()} • {session.providerId}
                  </p>
                </button>
              ))
            )}
          </div>
        </section>

        {/* Project Memory */}
        <section>
          <div className="flex items-center justify-between mb-3 px-2">
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
              <FolderOpen size={12} />
              Project Memory
            </h3>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="p-1 hover:bg-slate-800 rounded text-blue-500"
            >
              <Upload size={14} />
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              className="hidden" 
              accept=".txt,.md,.js,.ts,.tsx,.json,.pdf"
            />
          </div>
          
          <div className="space-y-2">
            {projectFiles.length === 0 ? (
              <div className="border-2 border-dashed border-slate-800 rounded-xl p-6 text-center">
                <FileText className="mx-auto text-slate-700 mb-2" size={24} />
                <p className="text-[10px] text-slate-600">Upload files to add them to AI context memory.</p>
              </div>
            ) : (
              projectFiles.map((file) => (
                <div key={file.id} className="flex items-center justify-between p-2 bg-slate-950 border border-slate-800 rounded-lg group">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="p-1.5 bg-blue-600/10 text-blue-500 rounded">
                      <FileText size={14} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-medium text-slate-200 truncate">{file.name}</p>
                      <p className="text-[9px] text-slate-500 uppercase">{file.size}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => onRemoveFile(file.id)}
                    className="p-1 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
          
          {projectFiles.length > 0 && (
            <div className="mt-4 p-3 bg-blue-600/5 border border-blue-600/20 rounded-lg">
              <p className="text-[10px] text-blue-400 font-medium flex items-center gap-1.5 mb-1">
                <Database size={10} /> Memory Active
              </p>
              <p className="text-[9px] text-slate-500 leading-relaxed">
                Gemini will use these {projectFiles.length} files as context for future messages in this session.
              </p>
            </div>
          )}
        </section>
      </div>

      <div className="p-4 bg-slate-950/50 border-t border-slate-800">
        <p className="text-[10px] text-slate-600 text-center">
          OmniChat Project Sync v1.0
        </p>
      </div>
    </aside>
  );
};
