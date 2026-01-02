
import React from 'react';
import { Note } from '../types';

interface NoteCardProps {
  note: Note;
  onClick: () => void;
  onDelete: (e: React.MouseEvent) => void;
}

export const NoteCard: React.FC<NoteCardProps> = ({ note, onClick, onDelete }) => {
  return (
    <div 
      onClick={onClick}
      className="group bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer relative"
    >
      <button 
        onClick={onDelete}
        className="absolute top-4 right-4 p-1 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
      </button>
      
      <div className="flex gap-2 mb-3">
        {note.tags.map(tag => (
          <span key={tag} className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold uppercase rounded">
            {tag}
          </span>
        ))}
      </div>

      <h3 className="text-lg font-bold text-slate-800 mb-2 line-clamp-1">{note.title || 'Untitled Note'}</h3>
      <p className="text-slate-500 text-sm line-clamp-3 leading-relaxed mb-4">
        {note.content || 'No content yet...'}
      </p>

      <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-50">
        <span className="text-xs text-slate-400">
          {new Date(note.updatedAt).toLocaleDateString()}
        </span>
        {note.aiSummary && (
          <div className="flex items-center gap-1 text-indigo-600 text-xs font-medium">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            AI Ready
          </div>
        )}
      </div>
    </div>
  );
};
