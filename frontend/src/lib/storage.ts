import { Chat, PromptTemplate } from '@/types';

export const PROMPT_TEMPLATES: PromptTemplate[] = [
  {
    id: 'legal-analysis',
    category: 'Legal Advisory',
    title: 'BNS & BNSS Statute Analysis',
    prompt: 'What are the legal provisions, mandatory procedures, and bail eligibility under the Bharatiya Nagarik Suraksha Sanhita (BNSS) for cognizable offences?'
  },
  {
    id: 'pocso-act',
    category: 'Special Acts',
    title: 'POCSO & Special Statutory Provisions',
    prompt: 'Explain the mandatory reporting requirements, investigation timelines, and statutory safeguards under the POCSO Act.'
  },
  {
    id: 'ndps-act',
    category: 'Special Acts',
    title: 'NDPS Act Search & Seizure Protocols',
    prompt: 'What are the statutory search, seizure, and arrest protocols mandated under Section 42 and Section 50 of the NDPS Act?'
  },
  {
    id: 'arms-uapa',
    category: 'Criminal Law',
    title: 'Arms Act & UAPA Legal Provisions',
    prompt: 'What are the defining elements of unlawful activity and scheduled offences under the UAPA and the Arms Act?'
  }
];

const STORAGE_KEYS = {
  CHATS: 'project_access_chats_v3',
  ACTIVE_CHAT: 'project_access_active_chat_v3',
  THEME: 'project_access_theme_v3'
};

export const createStarterChat = (): Chat => ({
  id: 'chat_' + Date.now(),
  title: 'Welcome to Project Access',
  createdAt: Date.now(),
  updatedAt: Date.now(),
  pinned: false,
  messages: [
    {
      id: 'msg_welcome',
      role: 'assistant',
      timestamp: Date.now(),
      thinking: 'Initialized Project Access legal RAG pipeline. Connected to Indian Criminal Law vector index.',
      content: `Hello. I am **Project Access**, your legal intelligence assistant.\n\nI can assist you with:\n* **Indian Criminal Law (BNS, BNSS, BSA)**: Statutory definitions, procedural safeguards, and bail provisions.\n* **Special Acts**: POCSO Act, NDPS Act, Arms Act, Domestic Violence Act, and UAPA.\n* **Section & Case Analysis**: Grounded legal citations with act titles, section numbers, and statutory text.\n\nType your query below or select one of the suggested prompts to get started.`,
      sources: [
        {
          title: 'Project Access Knowledge Base',
          act_title: 'Indian Criminal Law Index (BNS, BNSS, BSA)',
          snippet: 'Statutory guidance and legal vector search index.',
          score: 0.98
        }
      ]
    }
  ]
});

export const Storage = {
  getTheme: (): 'dark' | 'light' | 'system' => {
    if (typeof window === 'undefined') return 'dark';
    return (localStorage.getItem(STORAGE_KEYS.THEME) as any) || 'dark';
  },

  saveTheme: (theme: string): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  },

  getChats: (): Chat[] => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CHATS);
      if (saved) {
        return JSON.parse(saved);
      }
      const starter = createStarterChat();
      Storage.saveChats([starter]);
      Storage.setActiveChatId(starter.id);
      return [starter];
    } catch {
      return [];
    }
  },

  saveChats: (chats: Chat[]): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEYS.CHATS, JSON.stringify(chats));
    } catch (e) {
      console.error('Failed to save chats:', e);
    }
  },

  getActiveChatId: (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_CHAT);
  },

  setActiveChatId: (id: string | null): void => {
    if (typeof window === 'undefined') return;
    if (id) {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_CHAT, id);
    } else {
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_CHAT);
    }
  }
};
