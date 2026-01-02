
import React, { useState, useEffect } from 'react';
import { Note } from '../types';
import { GeminiService } from '../services/geminiService';

interface NoteEditorProps {
  note: Note;
  onSave: (note: Note) => void;
  onClose: () => void;
}

export const NoteEditor: React.FC<NoteEditorProps> = ({ note, onSave, onClose }) => {
  const [editedNote, setEditedNote] = useState<Note>(note);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const gemini = GeminiService.getInstance();

  const handleAIAction = async () => {
    if (!editedNote.content) return;
    setIsSummarizing(true);
    try {
      const summary = await gemini.summarizeNote(editedNote.title, editedNote.content);
      setEditedNote(prev => ({ ...prev, aiSummary: summary }));
    } catch (err) {
      console.error(err);
    } finally {
      setIsSummarizing(false);
    }
  };

  const autoSave = () => {
    onSave(editedNote);
  };

  useEffect(() => {
    const timer = setTimeout(autoSave, 1000);
    return () => clearTimeout(timer);
  }, [editedNote]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 md:p-8">
      <div className="bg-white w-full max-w-5xl h-full rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row">
        {/* Main Editor Area */}
        <div className="flex-1 flex flex-col p-6 md:p-10">
          <div className="flex items-center justify-between mb-8">
            <button 
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400 font-medium">Last synced: Just now</span>
              <button 
                onClick={handleAIAction}
                disabled={isSummarizing}
                className={`flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all ${isSummarizing ? 'animate-pulse' : ''}`}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                {isSummarizing ? 'AI Thinking...' : 'AI Summary'}
              </button>
            </div>
          </div>

          <input 
            type="text"
            value={editedNote.title}
            onChange={(e) => setEditedNote(prev => ({ ...prev, title: e.target.value, updatedAt: Date.now() }))}
            placeholder="Note Title"
            className="text-4xl font-bold text-slate-800 placeholder-slate-200 focus:outline-none mb-6 border-none"
          />

          <textarea 
            value={editedNote.content}
            onChange={(e) => setEditedNote(prev => ({ ...prev, content: e.target.value, updatedAt: Date.now() }))}
            placeholder="Start writing your thoughts..."
            className="flex-1 text-lg text-slate-600 leading-relaxed placeholder-slate-300 resize-none focus:outline-none border-none"
          />
        </div>

        {/* AI Insight Sidebar */}
        <div className="w-full md:w-80 bg-slate-50 border-l border-slate-100 p-8 overflow-y-auto">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">AI Insights</h4>
          
          {editedNote.aiSummary ? (
            <div className="space-y-6">
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                <p className="text-sm font-bold text-indigo-600 mb-2 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg>
                  Summary
                </p>
                <p className="text-sm text-slate-600 leading-relaxed italic">
                  "{editedNote.aiSummary}"
                </p>
              </div>

              <div className="space-y-3">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Suggested Tags</p>
                <div className="flex flex-wrap gap-2">
                  {['Research', 'Draft', 'Important', 'Work'].map(t => (
                    <button key={t} className="px-3 py-1 bg-white border border-slate-200 rounded-full text-xs text-slate-600 hover:border-indigo-400 transition-colors">
                      + {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-48 flex flex-col items-center justify-center text-center opacity-40">
              <svg className="w-12 h-12 text-slate-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
              <p className="text-sm">Click "AI Summary" to generate insights for this note.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
