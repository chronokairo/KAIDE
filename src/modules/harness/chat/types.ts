export interface Attachment {
  id: string;
  name: string;
  size?: string;
  uploading?: boolean;
}

export interface UsedSource {
  id: string;
  name: string;
  type: 'file' | 'web' | 'text' | 'drive';
}

export interface Message {
  id: number;
  role: 'anna' | 'user';
  content: string;
  usedSources?: UsedSource[];
}
