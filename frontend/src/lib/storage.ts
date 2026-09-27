import { PromptTemplate } from "@/types";

export const PROMPT_TEMPLATES: PromptTemplate[] = [
  {
    id: "legal-analysis",
    category: "Legal Advisory",
    title: "BNS & BNSS Statute Analysis",
    prompt:
      "What are the legal provisions, mandatory procedures, and bail eligibility under the Bharatiya Nagarik Suraksha Sanhita (BNSS) for cognizable offences?",
  },
  {
    id: "pocso-act",
    category: "Special Acts",
    title: "POCSO & Special Statutory Provisions",
    prompt:
      "Explain the mandatory reporting requirements, investigation timelines, and statutory safeguards under the POCSO Act.",
  },
  {
    id: "ndps-act",
    category: "Special Acts",
    title: "NDPS Act Search & Seizure Protocols",
    prompt:
      "What are the statutory search, seizure, and arrest protocols mandated under Section 42 and Section 50 of the NDPS Act?",
  },
  {
    id: "arms-uapa",
    category: "Criminal Law",
    title: "Arms Act & UAPA Legal Provisions",
    prompt:
      "What are the defining elements of unlawful activity and scheduled offences under the UAPA and the Arms Act?",
  },
];

const STORAGE_KEYS = {
  ACTIVE_CHAT: "project_access_active_chat_v3",
  RESPONSE_LANGUAGE: "project_access_response_language_v1",
  DISCLAIMER_ACCEPTED: "project_access_disclaimer_accepted_v1",
  SAVE_IN_CHAT: "project_access_save_in_chat_v1",
};

export const Storage = {
  getActiveChatId: (): string | null => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_CHAT);
  },

  setActiveChatId: (id: string | null): void => {
    if (typeof window === "undefined") return;
    if (id) {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_CHAT, id);
    } else {
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_CHAT);
    }
  },

  getResponseLanguage: (): string => {
    if (typeof window === "undefined") return "English";
    return localStorage.getItem(STORAGE_KEYS.RESPONSE_LANGUAGE) || "English";
  },

  setResponseLanguage: (lang: string): void => {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEYS.RESPONSE_LANGUAGE, lang);
  },

  hasAcceptedDisclaimer: (): boolean => {
    if (typeof window === "undefined") return true;
    return localStorage.getItem(STORAGE_KEYS.DISCLAIMER_ACCEPTED) === "true";
  },

  setDisclaimerAccepted: (): void => {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEYS.DISCLAIMER_ACCEPTED, "true");
  },

  getSaveInChatEnabled: (): boolean => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(STORAGE_KEYS.SAVE_IN_CHAT) === "true";
  },

  setSaveInChatEnabled: (enabled: boolean): void => {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEYS.SAVE_IN_CHAT, String(enabled));
  },
};
