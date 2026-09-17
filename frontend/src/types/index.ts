export interface SourceDoc {
  title: string;
  url?: string;
  snippet?: string;
  score?: number;
  act_title?: string;
  section_number?: string;
  section_title?: string;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  thinking?: string;
  sources?: SourceDoc[];
}

export interface Chat {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  pinned: boolean;
  messages: Message[];
}

export interface PromptTemplate {
  id: string;
  category: string;
  title: string;
  prompt: string;
}

// Global type augmentation for Mongoose cached connection
declare global {
  var mongoose: {
    conn: typeof import("mongoose") | null;
    promise: Promise<typeof import("mongoose")> | null;
  } | undefined;
}
