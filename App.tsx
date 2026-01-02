
import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar.tsx';
import { NoteCard } from './components/NoteCard.tsx';
import { NoteEditor } from './components/NoteEditor.tsx';
import { FileUpload } from './components/FileUpload.tsx';
import { Note, FileItem, ViewMode } from './types.ts';

const App: React.FC = () => {
  const [view, setView] = useState<ViewMode>(ViewMode.NOTES);
  const [notes, setNotes] = useState<Note[]>(() => {
    const saved = localStorage.getItem('lumina_notes');
    return saved ? JSON.parse(saved) : [];
  });
  const [files, setFiles] = useState<FileItem[]>(() => {
    const saved = localStorage.getItem('lumina_files');
    return saved ? JSON.parse(saved) : [];
  });
  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Persist to local storage
  useEffect(() => {
    localStorage.setItem('lumina_notes', JSON.stringify(notes));
  }, [notes]);

  useEffect(() => {
    localStorage.setItem('lumina_files', JSON.stringify(files));
  }, [files]);

  const createNote = () => {
    const newNote: Note = {
      id: Math.random().toString(36).substr(2, 9),
      title: '',
      content: '',
      updatedAt: Date.now(),
      tags: ['New']
    };
    setNotes(prev => [newNote, ...prev]);
    setActiveNote(newNote);
  };

  const handleUpdateNote = (updatedNote: Note) => {
    setNotes(prev => prev.map(n => n.id === updatedNote.id ? updatedNote : n));
  };

  const deleteNote = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setNotes(prev => prev.filter(n => n.id !== id));
  };

  const filteredNotes = notes.filter(n => 
    n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-screen w-full bg-slate-50">
      <Sidebar currentView={view} setView={setView} />
      
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Header Section */}
        <header className="h-20 bg-white border-b border-slate-200 px-8 flex items-center justify-between z-10">
          <div className="flex-1 max-w-xl">
            <div className="relative group">
              <svg className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input 
                type="text"
                placeholder="Search notes, files, or AI summaries..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-100 border-none rounded-2xl focus:ring-2 focus:ring-indigo-100 focus:bg-white transition-all outline-none text-sm text-slate-700 font-medium"
              />
            </div>
          </div>
          <div className="flex items-center gap-4 ml-6">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 border-2 border-white shadow-md flex items-center justify-center text-white font-bold text-xs">
              JD
            </div>
          </div>
        </header>

        {/* View Content */}
        {view === ViewMode.NOTES && (
          <div className="flex-1 p-8 overflow-y-auto">
            <div className="max-w-6xl mx-auto">
              <div className="flex items-center justify-between mb-10">
                <div>
                  <h2 className="text-3xl font-bold text-slate-800">Your Workspace</h2>
                  <p className="text-slate-500">Organize your thoughts and sync with AI.</p>
                </div>
                <button 
                  onClick={createNote}
                  className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-bold rounded-2xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all hover:-translate-y-0.5"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                  New Note
                </button>
              </div>

              {filteredNotes.length === 0 ? (
                <div className="h-96 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center text-slate-400">
                  <svg className="w-16 h-16 mb-4 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                  <p className="font-medium">No notes found matching your search.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredNotes.map(note => (
                    <NoteCard 
                      key={note.id} 
                      note={note} 
                      onClick={() => setActiveNote(note)}
                      onDelete={(e) => deleteNote(e, note.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {view === ViewMode.FILES && (
          <FileUpload 
            files={files} 
            onUpload={(f) => setFiles(prev => [f, ...prev])}
            onDelete={(id) => setFiles(prev => prev.filter(f => f.id !== id))}
            onUpdate={(f) => setFiles(prev => prev.map(item => item.id === f.id ? f : item))}
          />
        )}

        {view === ViewMode.FAVORITES && (
          <div className="flex-1 flex items-center justify-center text-slate-400">
            <div className="text-center">
              <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
              <h3 className="text-xl font-bold text-slate-800">No Favorites Yet</h3>
              <p>Bookmark important notes to see them here.</p>
            </div>
          </div>
        )}
      </main>

      {/* Overlays */}
      {activeNote && (
        <NoteEditor 
          note={activeNote}
          onSave={handleUpdateNote}
          onClose={() => setActiveNote(null)}
        />
      )}
    </div>
  );
};

export default App;
