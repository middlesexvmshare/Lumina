
import React, { useRef, useState } from 'react';
import { FileItem } from '../types';
import { GeminiService } from '../services/geminiService';

interface FileUploadProps {
  files: FileItem[];
  onUpload: (file: FileItem) => void;
  onDelete: (id: string) => void;
  onUpdate: (file: FileItem) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ files, onUpload, onDelete, onUpdate }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const gemini = GeminiService.getInstance();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const newFile: FileItem = {
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        type: file.type,
        size: file.size,
        dataUrl,
        uploadedAt: Date.now()
      };
      onUpload(newFile);
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const analyzeFile = async (file: FileItem) => {
    setAnalyzingId(file.id);
    try {
      const analysis = await gemini.analyzeFile(file.name, file.dataUrl, file.type);
      onUpdate({ ...file, aiAnalysis: analysis });
    } catch (err) {
      console.error(err);
    } finally {
      setAnalyzingId(null);
    }
  };

  return (
    <div className="flex-1 p-8 overflow-y-auto">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h2 className="text-3xl font-bold text-slate-800">Resources</h2>
            <p className="text-slate-500">Upload assets and let Lumina analyze them.</p>
          </div>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 shadow-sm text-slate-700 font-bold rounded-2xl hover:bg-slate-50 transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
            Upload File
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
          />
        </div>

        {files.length === 0 ? (
          <div className="h-64 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center text-slate-400">
            <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
            <p>Your workspace resources appear here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {files.map(file => (
              <div key={file.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all">
                {file.type.startsWith('image/') ? (
                  <img src={file.dataUrl} className="w-full h-40 object-cover" alt={file.name} />
                ) : (
                  <div className="w-full h-40 bg-slate-50 flex items-center justify-center text-slate-300">
                    <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  </div>
                )}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-slate-800 line-clamp-1 flex-1 mr-2">{file.name}</h4>
                    <button 
                      onClick={() => onDelete(file.id)}
                      className="text-slate-300 hover:text-red-500 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                  <p className="text-xs text-slate-400 mb-4 uppercase font-semibold">{(file.size / 1024 / 1024).toFixed(2)} MB • {file.type.split('/')[1]}</p>
                  
                  {file.aiAnalysis ? (
                    <div className="bg-indigo-50 p-3 rounded-xl border border-indigo-100">
                      <p className="text-[10px] font-bold text-indigo-400 uppercase mb-1">AI Analysis</p>
                      <p className="text-xs text-slate-700 leading-tight line-clamp-3">{file.aiAnalysis}</p>
                    </div>
                  ) : (
                    <button 
                      onClick={() => analyzeFile(file)}
                      disabled={analyzingId === file.id}
                      className="w-full py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-600 hover:bg-white hover:border-indigo-400 transition-all flex items-center justify-center gap-2"
                    >
                      {analyzingId === file.id ? (
                        <div className="w-3 h-3 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                      )}
                      {analyzingId === file.id ? 'Analyzing...' : 'Ask AI to Analyze'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
