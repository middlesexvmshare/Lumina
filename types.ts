
export interface Note {
  id: string;
  title: string;
  content: string;
  updatedAt: number;
  tags: string[];
  aiSummary?: string;
  isFavorite: boolean;
}

export interface FileItem {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  data: string; // Base64
  uploadedAt: number;
  aiDescription?: string;
}

export type ViewType = 'notes' | 'files' | 'favorites' | 'settings';
