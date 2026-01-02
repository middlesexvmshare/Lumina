
export interface Note {
  id: string;
  title: string;
  content: string;
  updatedAt: number;
  tags: string[];
  aiSummary?: string;
}

export interface FileItem {
  id: string;
  name: string;
  type: string;
  size: number;
  dataUrl: string; // Base64 or Blob URL
  uploadedAt: number;
  aiAnalysis?: string;
}

export enum ViewMode {
  NOTES = 'NOTES',
  FILES = 'FILES',
  FAVORITES = 'FAVORITES',
  AI_CHAT = 'AI_CHAT'
}
