export interface PDFDocument {
  _id: string;
  name: string;
  content: string;
  uploadedAt: Date;
  pageCount: number;
  sizeKb: number;
}

export interface PDFDocumentMeta {
  _id: string;
  name: string;
  uploadedAt: Date;
  pageCount: number;
  sizeKb: number;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export interface ChatSession {
  _id: string;
  documentIds: string[];
  messages: ChatMessage[];
  createdAt: Date;
  lastActivity: Date;
}

export interface UploadResponse {
  success: boolean;
  document?: PDFDocumentMeta;
  sessionId?: string;
  error?: string;
}

export interface AuthUser {
  id: string;
  username: string;
}

