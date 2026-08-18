"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Interfaces
interface SourceDoc {
  score: number;
  chunk_id: string;
  act_id: string;
  act_title: string;
  section_number: string;
  section_title: string;
  chapter: string;
  source_label: string;
  text: string;
}

interface Message {
  id: string;
  sender: "user" | "bot";
  text: string;
  timestamp: string;
  classifiedCollection?: string;
  sourceDocs?: SourceDoc[];
  templateClause?: string;
}

interface HistorySession {
  id: string;
  category: string;
  title: string;
  date: string;
  snippet: string;
  messages: Message[];
}

export default function Home() {
  // Navigation & Screen state
  const [activeTab, setActiveTab] = useState<"home" | "chat" | "history" | "privacy">("home");
  const [imageError, setImageError] = useState(false);

  // Chat messages state
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "disc-1",
      sender: "bot",
      text: "Good morning. I am Counselor AI, your secure legal advisory assistant. Please note that while I can provide general legal information and document analysis, this does not constitute a formal attorney-client relationship. How may I assist you with your legal matters today?",
      timestamp: "10:42 AM",
    },
  ]);

  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [expandedDocIndex, setExpandedDocIndex] = useState<number | null>(null);

  // Auto-saved or preset chat history
  const [historySessions, setHistorySessions] = useState<HistorySession[]>([
    {
      id: "hist-1",
      category: "Employment Law",
      title: "Severance Agreement Review",
      date: "Oct 12, 2023",
      snippet: "Analysis of the non-compete clause within the proposed severance package, highlighting potential enforceability issues.",
      messages: [
        {
          id: "m1",
          sender: "bot",
          text: "Hello, let's review your severance package terms. Please paste the clauses of concern.",
          timestamp: "3:10 PM",
        },
        {
          id: "m2",
          sender: "user",
          text: "I need to check the non-compete clause length and boundary terms.",
          timestamp: "3:12 PM",
        },
        {
          id: "m3",
          sender: "bot",
          text: "Typically, non-competes in severance agreements must be reasonable in geography and duration (usually under 12 months for standard employees) to be enforceable under state jurisdictions.",
          timestamp: "3:15 PM",
        },
      ],
    },
    {
      id: "hist-2",
      category: "Real Estate",
      title: "Lease Breakage Penalties",
      date: "Sep 28, 2023",
      snippet: "Guidance on early termination of a residential lease, including statutory requirements for mitigation of damages.",
      messages: [
        {
          id: "m4",
          sender: "user",
          text: "Can my landlord charge me for the full remaining rent if I move out early?",
          timestamp: "11:05 AM",
        },
        {
          id: "m5",
          sender: "bot",
          text: "In most jurisdictions, landlords have a 'duty to mitigate' damages, meaning they must make reasonable efforts to re-rent the property rather than simply charging you for the remaining lease term.",
          timestamp: "11:07 AM",
        },
      ],
    },
    {
      id: "hist-3",
      category: "Intellectual Property",
      title: "Freelance Copyright Ownership",
      date: "Aug 15, 2023",
      snippet: "Clarification on work-for-hire doctrine applicability to independent contractor agreements.",
      messages: [
        {
          id: "m6",
          sender: "bot",
          text: "Welcome. How can I assist you with intellectual property questions today?",
          timestamp: "10:15 AM",
        },
        {
          id: "m7",
          sender: "user",
          text: "Who owns the copyright of illustrations I make as a freelancer?",
          timestamp: "10:18 AM",
        },
        {
          id: "m8",
          sender: "bot",
          text: "As a freelancer, you own the copyright to your work automatically unless there is a signed agreement stating that it is a 'work-for-hire' or containing an explicit assignment of copyrights to the client.",
          timestamp: "10:20 AM",
        },
      ],
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Handle auto-resizing of query input textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  // Format current time helper
  const getFormattedTime = () => {
    const date = new Date();
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    const minutesStr = minutes < 10 ? "0" + minutes : minutes;
    return `${hours}:${minutesStr} ${ampm}`;
  };

  // Submit query function
  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || inputText).trim();
    if (!query) return;

    // Add user message
    const userMsgId = `user-${Date.now()}`;
    const userMessage: Message = {
      id: userMsgId,
      sender: "user",
      text: query,
      timestamp: getFormattedTime(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    setIsTyping(true);
    setExpandedDocIndex(null);

    try {
      // Call FastAPI backend
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        let errorMsg = `HTTP error status: ${response.status}`;
        try {
          const errData = await response.json();
          if (errData && errData.details) {
            errorMsg += `\n\nStderr Logs:\n${errData.details}`;
          } else if (errData && errData.error) {
            errorMsg += `\n\nReason: ${errData.error}`;
          }
        } catch (_) {}
        throw new Error(errorMsg);
      }

      const data = await response.json();

      const botMessage: Message = {
        id: `bot-${Date.now()}`,
        sender: "bot",
        text: data.answer,
        timestamp: getFormattedTime(),
        classifiedCollection: data.classified_collection,
        sourceDocs: data.retrieved_docs,
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err: any) {
      console.error("Failed to query API backend: ", err);

      // Fallback response in case backend is not running
      setTimeout(() => {
        const fallbackMsg: Message = {
          id: `bot-err-${Date.now()}`,
          sender: "bot",
          text: `I had trouble connecting to the Counselor AI JS backend API.\n\n**Error Diagnostics:**\n${err.message || err}`,
          timestamp: getFormattedTime(),
          classifiedCollection: "bnss (Offline Mode)",
        };
        setMessages((prev) => [...prev, fallbackMsg]);
      }, 1500);
    } finally {
      setIsTyping(false);
    }
  };

  // Load a historical chat session
  const handleLoadSession = (session: HistorySession) => {
    setMessages(session.messages);
    setActiveTab("chat");
  };

  // Suggestions handler
  const handleSelectSuggestion = (suggestion: string) => {
    handleSend(suggestion);
  };

  return (
    <div className={`w-full bg-background text-on-background font-body-lg antialiased ${activeTab === "chat" ? "h-screen flex flex-col overflow-hidden" : "min-h-screen flex flex-col"
      }`}>

      <AnimatePresence mode="wait">
        {activeTab === "home" && (
          <motion.main
            key="home"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="w-full flex flex-col min-h-[100svh] px-c-container-margin py-c-xl relative overflow-hidden box-border"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-surface-container-low to-surface opacity-50 -z-10 pointer-events-none"></div>

            <header className="flex items-center justify-center w-full pt-4 fade-in-up">
              <span className="material-symbols-outlined mr-2 text-[28px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>gavel</span>
              <h1 className="font-headline-md text-headline-md text-primary tracking-tight">Counselor AI</h1>
            </header>

            <div className="flex-grow flex flex-col justify-center items-center w-full max-w-md mx-auto mt-8 mb-12">
              <div className="w-full aspect-[4/3] mb-c-xl rounded-xl overflow-hidden shadow-sm border border-outline-variant/20 fade-in-up delay-100 bg-surface-container relative">
                {imageError ? (
                  <div className="w-full h-full flex flex-col justify-center items-center bg-gradient-to-br from-surface-container-low to-surface-variant text-primary p-c-lg text-center select-none">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-20 h-20 text-primary mb-c-md opacity-85">
                      <line x1="12" y1="3" x2="12" y2="21" />
                      <line x1="9" y1="21" x2="15" y2="21" />
                      <line x1="5" y1="7" x2="19" y2="7" />
                      <line x1="5" y1="7" x2="2" y2="15" />
                      <line x1="5" y1="7" x2="8" y2="15" />
                      <path d="M2 15h6c0 1.66-1.34 3-3 3s-3-1.34-3-3z" fill="currentColor" opacity="0.15" />
                      <path d="M2 15h6c0 1.66-1.34 3-3 3s-3-1.34-3-3z" />
                      <line x1="19" y1="7" x2="16" y2="15" />
                      <line x1="19" y1="7" x2="22" y2="15" />
                      <path d="M16 15h6c0 1.66-1.34 3-3 3s-3-1.34-3-3z" fill="currentColor" opacity="0.15" />
                      <path d="M16 15h6c0 1.66-1.34 3-3 3s-3-1.34-3-3z" />
                      <circle cx="12" cy="3" r="1" fill="currentColor" />
                    </svg>
                    <span className="font-headline-sm text-headline-sm text-balance tracking-tight">Indian Criminal Law Advisory</span>
                    <span className="font-label-caps text-label-caps text-on-surface-variant/80 mt-xs uppercase">Secure Vector RAG</span>
                  </div>
                ) : (
                  <img
                    className="w-full h-full object-cover"
                    alt="A highly refined, abstract 3D rendering representing balanced architectural pillars or scales of justice."
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuCzfZLbuakQyQBLC3nQ5wP1Rur1BSzOKTtJS4IqeditOUQdkY4tPuPYbtyBmm6HBit49QqN2If1P4cRD9EoQ-hw1QJiZQFoN8yUDERTU-DbWMOFuz7asSs1U-NV7aaBgeXM2Mr5DB49pDCJKvOOpUG59cHynrFyNakywGIOqdSxTGcbq11ocXh48GlYSjnwelgb7eAJ-5NCiLUEgNASlyxbbsZMOC6ccqlNXswl1Arb-UJKzyrPR1I"
                    onError={() => setImageError(true)}
                  />
                )}
              </div>

              <div className="text-center w-full px-4">
                <h2 className="font-display-lg text-display-lg text-on-surface mb-c-sm fade-in-up delay-200 text-balance">
                  Clarity in complexity.
                </h2>
                <p className="font-body-lg text-body-lg text-on-surface-variant fade-in-up delay-300 text-balance mx-auto max-w-[280px]">
                  Sophisticated, accessible legal guidance tailored to your specific situation. Begin a secure consultation to explore your options.
                </p>
              </div>
            </div>

            <div className="w-full max-w-md mx-auto mt-auto pb-c-lg fade-in-up delay-400">
              <div className="flex items-center justify-center mb-c-md space-x-2 text-on-surface-variant/80">
                <span className="material-symbols-outlined text-[16px]">lock</span>
                <span className="font-label-caps text-label-caps">Secure & Confidential</span>
              </div>
              <button
                onClick={() => setActiveTab("chat")}
                className="w-full h-14 bg-primary text-on-primary rounded-full flex justify-center items-center font-headline-sm text-headline-sm transition-transform duration-300 ease-out active:scale-[0.98] hover:bg-black shadow-sm group"
              >
                Start Consultation
                <span className="material-symbols-outlined ml-2 transition-transform duration-300 group-hover:translate-x-1">arrow_forward</span>
              </button>
            </div>
          </motion.main>
        )}

        {/* ---------------- MAIN APP SCREEN HEADER (CHAT & HISTORY) ---------------- */}
        <AnimatePresence>
          {activeTab !== "home" && (
            <motion.header
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-md border-b border-outline-variant/30 flex items-center justify-between px-c-container-margin h-16"
            >
              <div className="flex items-center gap-c-sm cursor-pointer" onClick={() => setActiveTab("home")}>
                <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>gavel</span>
                <h1 className="font-headline-sm text-headline-sm text-primary tracking-tight">Counselor AI</h1>
              </div>

              {/* Navigation links (visible on desktop) */}
              <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center gap-c-xs bg-surface-container-low/50 p-1 rounded-full border border-outline-variant/20">
                <button
                  onClick={() => setActiveTab("chat")}
                  className={`px-c-md py-1.5 rounded-full font-label-caps text-label-caps text-xs tracking-wider uppercase transition-all duration-200 ${activeTab === "chat" ? "bg-primary text-on-primary shadow-sm" : "text-on-surface-variant hover:text-primary hover:bg-surface-container-low"
                    }`}
                >
                  Consult
                </button>
                <button
                  onClick={() => setActiveTab("history")}
                  className={`px-c-md py-1.5 rounded-full font-label-caps text-label-caps text-xs tracking-wider uppercase transition-all duration-200 ${activeTab === "history" ? "bg-primary text-on-primary shadow-sm" : "text-on-surface-variant hover:text-primary hover:bg-surface-container-low"
                    }`}
                >
                  History
                </button>
                <button
                  onClick={() => setActiveTab("privacy")}
                  className={`px-c-md py-1.5 rounded-full font-label-caps text-label-caps text-xs tracking-wider uppercase transition-all duration-200 ${activeTab === "privacy" ? "bg-primary text-on-primary shadow-sm" : "text-on-surface-variant hover:text-primary hover:bg-surface-container-low"
                    }`}
                >
                  Privacy
                </button>
              </div>

              <div className="flex items-center gap-c-xs">
                <span className="material-symbols-outlined text-outline" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
              </div>
            </motion.header>
          )}
        </AnimatePresence>

        {/* ---------------- CHAT TAB ---------------- */}
        {activeTab === "chat" && (
          <motion.div
            key="chat"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="flex-1 flex flex-col overflow-hidden relative"
          >

            {/* Messages Area */}
            <main className="flex-1 overflow-y-auto w-full max-w-3xl mx-auto pt-24 pb-36 px-c-container-margin no-scrollbar flex flex-col gap-c-lg relative">

              <div className="text-center w-full my-sm">
                <span className="font-label-caps text-label-caps text-on-surface-variant/60">Secure Consultation Session</span>
              </div>

              {messages.map((msg, index) => (
                <motion.div
                  key={msg.id || index}
                  initial={{ opacity: 0, scale: 0.97, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className={`flex flex-col gap-c-base max-w-[85%] ${msg.sender === "user" ? "self-end" : "self-start"
                    }`}
                >
                  {/* Router Info Badge for Bot Responses */}
                  {msg.sender === "bot" && msg.classifiedCollection && (
                    <div className="flex items-center gap-c-xs ml-sm mb-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      <span className="text-[11px] font-label-caps tracking-wider text-emerald-600 font-semibold uppercase">
                        Routed DB Collection: {msg.classifiedCollection}
                      </span>
                    </div>
                  )}

                  <div
                    className={`${msg.sender === "user"
                      ? "bg-primary text-on-primary rounded-2xl rounded-tr-sm shadow-sm"
                      : "bg-surface-container-low text-on-surface rounded-2xl rounded-tl-sm border border-outline-variant/20"
                      } px-c-md py-c-sm`}
                  >
                    <p className="font-chat-bubble text-chat-bubble whitespace-pre-line leading-relaxed">
                      {msg.text}
                    </p>
                  </div>

                  {/* Simulated template card in initial system message */}
                  {msg.id === "disc-1" && (
                    <div className="mt-xs bg-surface-container-lowest border border-outline-variant/40 rounded-lg p-c-sm shadow-sm max-w-md">
                      <div className="flex items-center gap-c-xs mb-base">
                        <span className="material-symbols-outlined text-on-surface-variant text-sm">description</span>
                        <span className="font-label-caps text-label-caps text-on-surface-variant">Try a legal query</span>
                      </div>
                      <p className="font-body-md text-body-md text-on-surface mb-c-sm">
                        "I need to understand what constitutes a penetrative sexual assault on minors and what the punishments are."
                      </p>
                      <button
                        onClick={() => handleSend("What constitutes a penetrative sexual assault on minors and what the punishments are under POCSO?")}
                        className="font-label-caps text-label-caps text-primary hover:opacity-80 transition-opacity uppercase font-semibold text-[11px] tracking-wider"
                      >
                        Use sample query
                      </button>
                    </div>
                  )}

                  {/* Retrieved Legal citations accordion block */}
                  {msg.sender === "bot" && msg.sourceDocs && msg.sourceDocs.length > 0 && (
                    <div className="mt-sm flex flex-col gap-c-xs w-full">
                      <div className="flex items-center gap-c-xs px-c-xs py-1">
                        <span className="material-symbols-outlined text-[15px] text-primary">bookmark</span>
                        <span className="font-label-caps text-label-caps text-primary text-[10px] tracking-widest uppercase">
                          Legal Citations ({msg.sourceDocs.length})
                        </span>
                      </div>

                      <div className="flex flex-col gap-c-xs bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-c-xs shadow-sm">
                        {msg.sourceDocs.map((doc, docIdx) => (
                          <div key={doc.chunk_id || docIdx} className="border-b border-outline-variant/10 last:border-b-0">
                            <button
                              onClick={() => setExpandedDocIndex(expandedDocIndex === docIdx ? null : docIdx)}
                              className="w-full text-left px-sm py-c-xs flex justify-between items-center hover:bg-surface-container-low/50 rounded-lg transition-colors group"
                            >
                              <div className="flex flex-col">
                                <span className="font-body-md text-body-md font-semibold text-primary">{doc.source_label}</span>
                                <span className="text-[11px] text-on-surface-variant/80 font-mono">Chapter: {doc.chapter}</span>
                              </div>
                              <span className="material-symbols-outlined text-outline group-hover:text-primary transition-transform duration-300" style={{ transform: expandedDocIndex === docIdx ? "rotate(180deg)" : "none" }}>
                                keyboard_arrow_down
                              </span>
                            </button>

                            {expandedDocIndex === docIdx && (
                              <div className="px-sm pb-sm pt-xs text-on-surface-variant border-t border-outline-variant/5 bg-surface-container-low/30 rounded-b-lg">
                                <p className="font-body-md text-body-md font-semibold text-primary mb-1">
                                  {doc.section_title ? `Title: ${doc.section_title}` : ""}
                                </p>
                                <p className="font-body-md text-body-md leading-relaxed whitespace-pre-line text-sm bg-white p-c-sm rounded border border-outline-variant/10 shadow-inner">
                                  {doc.text}
                                </p>
                                <div className="mt-xs flex justify-between text-[10px] font-mono text-outline">
                                  <span>Act ID: {doc.act_id}</span>
                                  <span>Similarity Match: {(doc.score * 100).toFixed(1)}%</span>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}

              {/* AI Typing Indicator */}
              {isTyping && (
                <div className="flex items-center gap-c-xs max-w-[85%] self-start mt-sm opacity-50 pl-xs">
                  <div className="w-2 h-2 rounded-full bg-outline animate-bounce" style={{ animationDelay: "0s" }}></div>
                  <div className="w-2 h-2 rounded-full bg-outline animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                  <div className="w-2 h-2 rounded-full bg-outline animate-bounce" style={{ animationDelay: "0.4s" }}></div>
                  <span className="font-label-caps text-label-caps text-outline ml-xs">AI Routing & Searching...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </main>

            {/* Floating Inputs Area */}
            <div className="fixed bottom-[80px] md:bottom-0 w-full max-w-3xl left-1/2 -translate-x-1/2 px-c-container-margin pb-c-md z-40">
              {/* Quick replies suggestion chips */}
              <div className="flex overflow-x-auto no-scrollbar gap-c-sm mb-c-sm py-base">
                <button
                  onClick={() => handleSelectSuggestion("What is the penalty for possession of illegal firearms under the Arms Act?")}
                  className="whitespace-nowrap px-c-md py-c-xs rounded-full border border-outline-variant/50 bg-surface-container-lowest text-on-surface font-body-md text-body-md shadow-sm hover:bg-surface-container-low transition-colors"
                >
                  Arms Act Inquiry
                </button>
                <button
                  onClick={() => handleSelectSuggestion("What are the procedures for bail application under the BNSS 2023?")}
                  className="whitespace-nowrap px-c-md py-c-xs rounded-full border border-outline-variant/50 bg-surface-container-lowest text-on-surface font-body-md text-body-md shadow-sm hover:bg-surface-container-low transition-colors"
                >
                  BNSS Bail Procedure
                </button>
                <button
                  onClick={() => handleSelectSuggestion("Under domestic violence act, what protection orders are granted to women?")}
                  className="whitespace-nowrap px-c-md py-c-xs rounded-full border border-outline-variant/50 bg-surface-container-lowest text-on-surface font-body-md text-body-md shadow-sm hover:bg-surface-container-low transition-colors"
                >
                  Domestic Violence Orders
                </button>
                <button
                  onClick={() => handleSelectSuggestion("What acts are unlawful or considered terrorism under UAPA?")}
                  className="whitespace-nowrap px-c-md py-c-xs rounded-full border border-outline-variant/50 bg-surface-container-lowest text-on-surface font-body-md text-body-md shadow-sm hover:bg-surface-container-low transition-colors"
                >
                  UAPA Terrorism Definition
                </button>
              </div>

              {/* Input Box */}
              <div className="bg-surface-container-lowest rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-outline-variant/20 flex items-center px-sm py-c-xs min-h-[56px]">
                <button className="p-c-sm text-outline hover:text-primary transition-colors">
                  <span className="material-symbols-outlined">add_circle</span>
                </button>
                <textarea
                  ref={textareaRef}
                  value={inputText}
                  onChange={handleInputChange}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  className="flex-1 bg-transparent border-none focus:ring-0 focus:outline-none resize-none font-body-lg text-body-lg text-on-surface placeholder-on-surface-variant/50 py-c-sm px-c-xs no-scrollbar"
                  placeholder="Message Counselor AI..."
                  rows={1}
                  style={{ maxHeight: "120px" }}
                />
                <button
                  onClick={() => handleSend()}
                  className="p-c-sm bg-primary text-on-primary rounded-lg shadow-sm hover:opacity-90 transition-opacity flex items-center justify-center"
                >
                  <span className="material-symbols-outlined">send</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ---------------- HISTORY TAB ---------------- */}
        {activeTab === "history" && (
          <motion.main
            key="history"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="flex-1 pt-[88px] pb-[100px] px-c-container-margin max-w-2xl mx-auto w-full flex flex-col gap-xl overflow-y-auto no-scrollbar"
          >
            <div className="flex flex-col gap-c-xs pt-sm">
              <h1 className="font-display-lg text-display-lg text-on-surface">Consultation History</h1>
              <p className="font-body-md text-body-md text-on-surface-variant">Review past legal sessions, classification tags, and retrieved advisory results.</p>
            </div>

            <div className="flex flex-col gap-c-sm">
              {historySessions.map((session) => (
                <article
                  key={session.id}
                  onClick={() => handleLoadSession(session)}
                  className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-c-md flex flex-col gap-c-sm hover:border-outline-variant/60 transition-colors cursor-pointer group shadow-sm hover:shadow-md duration-300"
                >
                  <div className="flex justify-between items-start w-full">
                    <div className="flex flex-col gap-c-base">
                      <span className="font-label-caps text-label-caps text-on-surface-variant uppercase bg-surface-container-low px-2 py-1 rounded-sm self-start tracking-wider">
                        {session.category}
                      </span>
                      <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold group-hover:text-primary transition-colors">
                        {session.title}
                      </h3>
                    </div>
                    <span className="font-body-md text-body-md text-on-surface-variant opacity-60">{session.date}</span>
                  </div>
                  <p className="font-body-md text-body-md text-on-surface-variant line-clamp-2 mt-xs leading-relaxed">
                    {session.snippet}
                  </p>
                </article>
              ))}
            </div>
          </motion.main>
        )}

        {/* ---------------- PRIVACY VIEW ---------------- */}
        {activeTab === "privacy" && (
          <motion.main
            key="privacy"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="flex-1 pt-[88px] pb-[100px] px-c-container-margin max-w-2xl mx-auto w-full flex flex-col gap-xl overflow-y-auto no-scrollbar"
          >
            <div className="flex flex-col gap-c-xs pt-sm">
              <h1 className="font-display-lg text-display-lg text-on-surface">Privacy & Security</h1>
              <p className="font-body-md text-body-md text-on-surface-variant">Encryption protocols, data storage policies, and compliance metrics.</p>
            </div>

            <div className="flex flex-col gap-c-md bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-c-lg shadow-sm">
              <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold flex items-center gap-c-xs">
                <span className="material-symbols-outlined text-emerald-600">security</span>
                End-to-End Encrypted Sessions
              </h3>
              <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                Counselor AI provides fully E2E encrypted local storage query wrappers. Your data, questions, and responses are encrypted using industry-standard protocols before transmitting.
              </p>
              <hr className="border-outline-variant/20" />
              <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold flex items-center gap-c-xs">
                <span className="material-symbols-outlined text-primary">gavel</span>
                RAG Information Compliance
              </h3>
              <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                All vector database records are retrieved from the verified, flattened acts (Arms Act 1959, BNSS 2023, Domestic Violence Act 2005, NDPS Act 1985, POCSO Act 2012, and UAPA Act 1967).
              </p>
            </div>
          </motion.main>
        )}
      </AnimatePresence>

      {/* ---------------- MOBILE BOTTOM NAVIGATION BAR ---------------- */}
      <AnimatePresence>
        {activeTab !== "home" && (
          <motion.nav
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            transition={{ duration: 0.2 }}
            className="md:hidden fixed bottom-0 w-full z-50 bg-surface border-t border-outline-variant/20 shadow-sm flex justify-around items-center h-20 pb-safe px-4"
          >
            <button
              onClick={() => setActiveTab("chat")}
              className={`flex flex-col items-center justify-center transition-all scale-95 active:scale-90 w-24 gap-1 ${activeTab === "chat" ? "text-primary font-semibold" : "text-on-surface-variant opacity-60 hover:text-primary"
                }`}
            >
              <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: activeTab === "chat" ? "'FILL' 1" : "'FILL' 0" }}>chat_bubble</span>
              <span className="font-label-caps text-label-caps">Consult</span>
            </button>

            <button
              onClick={() => setActiveTab("history")}
              className={`flex flex-col items-center justify-center transition-all scale-95 active:scale-90 w-24 gap-1 ${activeTab === "history" ? "text-primary font-semibold" : "text-on-surface-variant opacity-60 hover:text-primary"
                }`}
            >
              <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: activeTab === "history" ? "'FILL' 1" : "'FILL' 0" }}>history</span>
              <span className="font-label-caps text-label-caps">History</span>
            </button>

            <button
              onClick={() => setActiveTab("privacy")}
              className={`flex flex-col items-center justify-center transition-all scale-95 active:scale-90 w-24 gap-1 ${activeTab === "privacy" ? "text-primary font-semibold" : "text-on-surface-variant opacity-60 hover:text-primary"
                }`}
            >
              <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: activeTab === "privacy" ? "'FILL' 1" : "'FILL' 0" }}>policy</span>
              <span className="font-label-caps text-label-caps">Privacy</span>
            </button>
          </motion.nav>
        )}
      </AnimatePresence>

      {/* Desktop compatibility sidebar/bottom-bar removed in favor of top navigation bar links */}

    </div>
  );
}
