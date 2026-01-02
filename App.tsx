
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { GoogleGenAI } from '@google/genai';
import { 
  Search, 
  Plus, 
  FileText, 
  FolderOpen, 
  Heart, 
  Settings, 
  Trash2, 
  Sparkles, 
  Clock, 
  ChevronRight, 
  LogOut,
  Upload,
  FileSearch,
  CheckCircle2,
  MoreVertical
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Note, FileItem, ViewType } from './types.ts';

// --- Utility for Tailwind classes ---
const cn = (...classes: string[]) => classes.filter(Boolean).join(' ');

const App: React.FC = () => {
  // --- State ---
  const [view, setView] = useState<ViewType>('notes');
  const [notes, setNotes] = useState<Note[]>(() => {
    const saved = localStorage.getItem('lumina_notes_v2');
    return saved ? JSON.parse(saved) : [];
  });
  const [files, setFiles] = useState<FileItem[]>(() => {
    const saved = localStorage.getItem('lumina_files_v2');
    return saved ? JSON.parse(saved) : [];
  });
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isProcessingAI, setIsProcessingAI] = useState(false);

  // --- Persistence ---
  useEffect(() => {
    localStorage.setItem('lumina_notes_v2', JSON.stringify(notes));
  }, [notes]);

  useEffect(() => {
    localStorage.setItem('lumina_files_v2', JSON.stringify(files));
  }, [files]);

  // --- Derived State ---
  const activeNote = useMemo(() => 
    notes.find(n => n.id === activeNoteId) || null
  , [notes, activeNoteId]);

  const filteredNotes = useMemo(() => {
    let result = notes;
    if (view === 'favorites') result = notes.filter(n => n.isFavorite);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(n => 
        n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)
      );
    }
    return result.sort((a, b) => b.updatedAt - a.updatedAt);
  }, [notes, view, searchQuery]);

  // --- Actions ---
  const createNewNote = useCallback(() => {
    const newNote: Note = {
      id: crypto.randomUUID(),
      title: '',
      content: '',
      updatedAt: Date.now(),
      tags: [],
      isFavorite: false
    };
    setNotes(prev => [newNote, ...prev]);
    setActiveNoteId(newNote.id);
  }, []);

  const updateNote = useCallback((id: string, updates: Partial<Note>) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, ...updates, updatedAt: Date.now() } : n));
  }, []);

  const deleteNote = useCallback((id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
    if (activeNoteId === id) setActiveNoteId(null);
  }, [activeNoteId]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      const newFile: FileItem = {
        id: crypto.randomUUID(),
        name: file.name,
        mimeType: file.type,
        size: file.size,
        data: base64,
        uploadedAt: Date.now()
      };
      setFiles(prev => [newFile, ...prev]);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const deleteFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  // --- AI Logic ---
  const summarizeNote = async () => {
    if (!activeNote || !activeNote.content || isProcessingAI) return;
    setIsProcessingAI(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Summarize the following note into a concise, professional paragraph:\n\nTitle: ${activeNote.title || 'Untitled'}\n\nContent: ${activeNote.content}`
      });
      updateNote(activeNote.id, { aiSummary: response.text });
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessingAI(false);
    }
  };

  const analyzeFile = async (file: FileItem) => {
    if (isProcessingAI) return;
    setIsProcessingAI(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const base64Data = file.data.split(',')[1];
      
      const parts: any[] = [{ text: "Briefly explain the contents of this file in two sentences." }];
      if (file.mimeType.startsWith('image/')) {
        parts.push({
          inlineData: { mimeType: file.mimeType, data: base64Data }
        });
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: { parts }
      });

      setFiles(prev => prev.map(f => f.id === file.id ? { ...f, aiDescription: response.text } : f));
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessingAI(false);
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#f8fafc] overflow-hidden">
      {/* Sidebar */}
      <motion.aside 
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="w-72 bg-white border-r border-slate-200 flex flex-col p-8 z-20"
      >
        <div className="flex items-center gap-3 mb-12">
          <div className="w-11 h-11 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-100 ring-4 ring-indigo-50">
            <Sparkles className="w-6 h-6 fill-white" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-800">Lumina</h1>
        </div>

        <nav className="flex-1 space-y-2">
          <SidebarItem active={view === 'notes'} onClick={() => setView('notes')} icon={FileText} label="All Notes" />
          <SidebarItem active={view === 'files'} onClick={() => setView('files')} icon={FolderOpen} label="Resources" />
          <SidebarItem active={view === 'favorites'} onClick={() => setView('favorites')} icon={Heart} label="Favorites" />
          <SidebarItem active={view === 'settings'} onClick={() => setView('settings')} icon={Settings} label="Settings" />
        </nav>

        <div className="mt-auto space-y-6">
          <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Workspace</span>
              <span className="text-[10px] font-bold text-indigo-500 uppercase">Pro</span>
            </div>
            <p className="text-sm font-bold text-slate-800 mb-4">You have 128 notes synced.</p>
            <button className="w-full py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95">
              Sync All
            </button>
          </div>

          <div className="flex items-center gap-3 pt-4 border-t border-slate-100 group cursor-pointer">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-slate-200 to-slate-300 flex items-center justify-center text-slate-500 font-bold overflow-hidden border-2 border-white shadow-sm">
              <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="avatar" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-800 truncate">Felix Miller</p>
              <p className="text-[10px] text-slate-400 font-medium truncate">felix@lumina.ai</p>
            </div>
            <LogOut className="w-4 h-4 text-slate-300 group-hover:text-rose-500 transition-colors" />
          </div>
        </div>
      </motion.aside>

      {/* List Panel */}
      <section className="w-[420px] bg-white border-r border-slate-100 flex flex-col shadow-[10px_0_30px_-15px_rgba(0,0,0,0.05)] z-10">
        <div className="p-8 pb-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-extrabold text-slate-800 capitalize tracking-tight">
              {view === 'favorites' ? 'Pinned' : view === 'notes' ? 'Notes' : 'Resources'}
            </h2>
            <button 
              onClick={createNewNote}
              className="w-10 h-10 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center transition-all active:scale-90"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
          
          <div className="relative group">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Search in workspace..." 
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-transparent rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 pt-2 space-y-4">
          <AnimatePresence mode="popLayout">
            {(view === 'notes' || view === 'favorites') ? (
              filteredNotes.length > 0 ? (
                filteredNotes.map((note, idx) => (
                  <motion.div
                    key={note.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <NoteCard 
                      note={note} 
                      active={activeNoteId === note.id} 
                      onClick={() => setActiveNoteId(note.id)} 
                    />
                  </motion.div>
                ))
              ) : (
                <EmptyState label="No notes found" sub="Start creating your first idea" />
              )
            ) : view === 'files' ? (
              <div className="space-y-6">
                <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-slate-200 rounded-3xl hover:border-indigo-400 hover:bg-indigo-50 transition-all cursor-pointer group">
                  <Upload className="w-6 h-6 text-slate-300 group-hover:text-indigo-500 mb-2 transition-colors" />
                  <span className="text-xs font-bold text-slate-400 group-hover:text-indigo-600">Upload new resource</span>
                  <input type="file" className="hidden" onChange={handleFileUpload} />
                </label>
                {files.map(file => (
                  <FileCard key={file.id} file={file} onDelete={() => deleteFile(file.id)} onAnalyze={() => analyzeFile(file)} />
                ))}
              </div>
            ) : null}
          </AnimatePresence>
        </div>
      </section>

      {/* Editor Panel */}
      <main className="flex-1 bg-slate-50/30 flex flex-col overflow-hidden relative">
        <AnimatePresence mode="wait">
          {activeNote ? (
            <motion.div 
              key={activeNote.id}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="flex-1 flex flex-col h-full"
            >
              {/* Toolbar */}
              <div className="h-20 flex items-center justify-between px-12 z-10">
                <div className="flex items-center gap-6">
                  <button 
                    onClick={() => updateNote(activeNote.id, { isFavorite: !activeNote.isFavorite })}
                    className={cn(
                      "p-3 rounded-2xl transition-all shadow-sm active:scale-95",
                      activeNote.isFavorite ? "text-rose-500 bg-white" : "text-slate-300 bg-white hover:text-slate-500"
                    )}
                  >
                    <Heart className="w-5 h-5" fill={activeNote.isFavorite ? "currentColor" : "none"} />
                  </button>
                  <div className="h-6 w-px bg-slate-200" />
                  <button 
                    onClick={summarizeNote}
                    disabled={isProcessingAI}
                    className="flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white rounded-2xl text-xs font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 disabled:opacity-50"
                  >
                    <Sparkles className={cn("w-3.5 h-3.5", isProcessingAI && "animate-spin")} />
                    {isProcessingAI ? 'Analyzing...' : 'Generate AI Summary'}
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right mr-2 hidden sm:block">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Last edited</p>
                    <p className="text-xs font-medium text-slate-600">{new Date(activeNote.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                  <button 
                    onClick={() => deleteNote(activeNote.id)}
                    className="p-3 bg-white text-slate-300 hover:text-rose-500 rounded-2xl shadow-sm transition-all"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Content Area */}
              <div className="flex-1 overflow-y-auto px-12 pb-20 custom-scrollbar">
                <div className="max-w-4xl mx-auto space-y-10 mt-10">
                  <textarea 
                    value={activeNote.title}
                    onChange={(e) => updateNote(activeNote.id, { title: e.target.value })}
                    placeholder="Note Title"
                    rows={1}
                    className="w-full text-5xl font-extrabold text-slate-900 border-none outline-none bg-transparent placeholder:text-slate-200 resize-none leading-tight"
                  />

                  {activeNote.aiSummary && (
                    <motion.div 
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      className="p-8 bg-white border border-indigo-100 rounded-[2.5rem] shadow-xl shadow-indigo-50/50 relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-full -mr-16 -mt-16 blur-3xl opacity-50" />
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center text-white">
                          <Sparkles className="w-4 h-4 fill-white" />
                        </div>
                        <h4 className="text-sm font-bold text-indigo-600 uppercase tracking-widest">Intelligence Summary</h4>
                      </div>
                      <p className="text-slate-600 leading-relaxed font-medium">
                        {activeNote.aiSummary}
                      </p>
                    </motion.div>
                  )}

                  <textarea 
                    value={activeNote.content}
                    onChange={(e) => updateNote(activeNote.id, { content: e.target.value })}
                    placeholder="Capture your brilliance here..."
                    className="w-full min-h-[60vh] text-xl text-slate-700 leading-relaxed border-none outline-none bg-transparent resize-none placeholder:text-slate-200"
                  />
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex-1 flex flex-col items-center justify-center text-slate-300"
            >
              <div className="relative mb-8">
                <div className="absolute inset-0 bg-indigo-500/10 blur-3xl rounded-full scale-150" />
                <div className="w-32 h-32 bg-white rounded-[2.5rem] shadow-2xl flex items-center justify-center text-slate-200 relative">
                  <FileText className="w-12 h-12" strokeWidth={1.5} />
                </div>
              </div>
              <h2 className="text-2xl font-extrabold text-slate-800 mb-2 tracking-tight">Focus Workspace</h2>
              <p className="text-slate-400 font-medium">Select a note to begin or create a new one.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

// --- Modern Sub-components ---

const SidebarItem = ({ active, onClick, icon: Icon, label }: any) => (
  <button 
    onClick={onClick}
    className={cn(
      "w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-sm font-bold transition-all group",
      active ? "sidebar-item-active" : "text-slate-400 hover:bg-slate-50 hover:text-slate-600"
    )}
  >
    <Icon className={cn("w-5 h-5 transition-transform group-hover:scale-110", active ? "text-indigo-600" : "text-slate-300")} />
    {label}
  </button>
);

const NoteCard = ({ note, active, onClick }: { note: Note, active: boolean, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className={cn(
      "w-full p-6 rounded-[2rem] text-left transition-all relative overflow-hidden group border",
      active 
        ? "bg-white border-indigo-200 shadow-2xl shadow-indigo-100/50 scale-[1.02] ring-1 ring-indigo-100" 
        : "bg-transparent border-transparent hover:bg-white hover:border-slate-100 hover:shadow-lg hover:scale-[1.01]"
    )}
  >
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <Clock className="w-3 h-3 text-slate-300" />
        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
          {new Date(note.updatedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
        </span>
      </div>
      {note.isFavorite && <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />}
    </div>
    <h3 className={cn("text-lg font-extrabold mb-2 line-clamp-1 leading-tight", active ? "text-indigo-900" : "text-slate-800")}>
      {note.title || 'Draft Note'}
    </h3>
    <p className="text-sm text-slate-500 line-clamp-2 font-medium leading-relaxed opacity-80 group-hover:opacity-100 transition-opacity">
      {note.content || 'Start writing...'}
    </p>
    
    {note.aiSummary && (
      <div className="mt-4 flex items-center gap-2">
        <div className="flex -space-x-1">
          <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center ring-2 ring-white">
            <Sparkles className="w-3 h-3 text-white fill-white" />
          </div>
        </div>
        <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-tight">AI Augmented</span>
      </div>
    )}

    {active && (
      <motion.div 
        layoutId="active-indicator"
        className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-indigo-600 rounded-r-full"
      />
    )}
  </button>
);

const FileCard = ({ file, onDelete, onAnalyze }: { file: FileItem; onDelete: () => void; onAnalyze: () => void }) => (
  <div className="group bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all hover:border-indigo-100">
    <div className="flex items-center justify-between mb-4">
      <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-inner">
        {file.mimeType.startsWith('image/') ? <Upload className="w-6 h-6" /> : <FileSearch className="w-6 h-6" />}
      </div>
      <button 
        onClick={onDelete} 
        className="opacity-0 group-hover:opacity-100 p-2 text-slate-200 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
    <h4 className="text-base font-bold text-slate-800 truncate mb-1">{file.name}</h4>
    <div className="flex items-center gap-2 mb-4">
      <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">{(file.size / 1024).toFixed(0)} KB</span>
      <div className="w-1 h-1 bg-slate-200 rounded-full" />
      <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">{file.mimeType.split('/')[1]}</span>
    </div>
    
    {file.aiDescription ? (
      <div className="p-4 bg-slate-50/50 rounded-2xl text-xs font-medium text-slate-600 leading-relaxed border border-slate-50">
        <div className="flex items-center gap-1.5 mb-2">
          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Analyzed</span>
        </div>
        {file.aiDescription}
      </div>
    ) : (
      <button 
        onClick={onAnalyze}
        className="w-full py-3 bg-white border border-slate-100 text-indigo-600 rounded-2xl text-xs font-bold hover:bg-indigo-600 hover:text-white hover:shadow-lg hover:shadow-indigo-100 transition-all flex items-center justify-center gap-2"
      >
        <Sparkles className="w-3.5 h-3.5" />
        Analyze Content
      </button>
    )}
  </div>
);

const EmptyState = ({ label, sub }: { label: string, sub: string }) => (
  <div className="h-64 flex flex-col items-center justify-center text-center opacity-40 py-10">
    <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
      <Search className="w-8 h-8 text-slate-300" />
    </div>
    <h3 className="text-sm font-bold text-slate-800 mb-1">{label}</h3>
    <p className="text-xs font-medium text-slate-500">{sub}</p>
  </div>
);

export default App;
