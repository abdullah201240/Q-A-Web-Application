import { useTheme } from "@/hooks/use-theme";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/toast";
import { useNavigate } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, LogOut, Menu, MessageSquare, Plus, Send, Trash2, User, Sparkles, X, Paperclip } from "lucide-react";

type ChatAttachment = {
  name: string;
  size: number;
  type: string;
};

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  attachments?: ChatAttachment[];
};

type Conversation = {
  id: string;
  title: string;
  messages: ChatMessage[];
};

export function Dashboard() {
  const { theme } = useTheme();
  const { logout, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const isDark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  const baseUrl = useMemo(() => {
    const url = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
    return url.replace(/\/$/, '');
  }, []);

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([
    {
      id: crypto.randomUUID(),
      title: "New chat",
      messages: [
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "Hi! How can I help you today?"
        }
      ]
    }
  ]);
  const [activeConversationId, setActiveConversationId] = useState<string>(conversations[0].id);
  const [inputValue, setInputValue] = useState("");
  const [isResponding, setIsResponding] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const activeConversation = useMemo(() => conversations.find(c => c.id === activeConversationId)!, [conversations, activeConversationId]);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeConversation.messages.length, isResponding]);

  const createNewChat = () => {
    const newConversation: Conversation = {
      id: crypto.randomUUID(),
      title: "New chat",
      messages: [
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "Hi! How can I help you today?"
        }
      ]
    };
    setConversations([newConversation, ...conversations]);
    setActiveConversationId(newConversation.id);
    setIsSidebarOpen(false);
  };

  const selectConversation = (id: string) => {
    setActiveConversationId(id);
    setIsSidebarOpen(false);
  };

  const deleteConversation = (id: string) => {
    const filtered = conversations.filter(c => c.id !== id);
    setConversations(filtered);
    if (id === activeConversationId && filtered.length > 0) {
      setActiveConversationId(filtered[0].id);
    }
  };

  const updateActiveConversationTitle = (firstUserMessage: string) => {
    const trimmed = firstUserMessage.trim();
    if (!trimmed) return;
    setConversations(prev => prev.map(c => {
      if (c.id !== activeConversationId) return c;
      if (c.title !== "New chat") return c;
      return { ...c, title: trimmed.slice(0, 40) + (trimmed.length > 40 ? "…" : "") };
    }));
  };

  const handleSend = () => {
    const content = inputValue.trim();
    if (!content || isResponding) return;

    const attachments: ChatAttachment[] = selectedFiles.map((f) => ({ name: f.name, size: f.size, type: f.type }));
    const userMessage: ChatMessage = { id: crypto.randomUUID(), role: "user", content, attachments: attachments.length ? attachments : undefined };
    setInputValue("");
    setSelectedFiles([]);
    updateActiveConversationTitle(content);
    setConversations(prev => prev.map(c => c.id === activeConversationId ? { ...c, messages: [...c.messages, userMessage] } : c));
    setIsResponding(true);

    // Simulate assistant response
    setTimeout(() => {
      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: userMessage.attachments?.length
          ? `I received ${userMessage.attachments.length} file(s): ${userMessage.attachments.map(a => a.name).join(', ')}. This is a sample response. Integrate your backend to process files.`
          : "This is a sample response. Integrate your backend to get real answers."
      };
      setConversations(prev => prev.map(c => c.id === activeConversationId ? { ...c, messages: [...c.messages, assistantMessage] } : c));
      setIsResponding(false);
    }, 800);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChooseFiles = () => fileInputRef.current?.click();
  const addFiles = (files: FileList | null) => {
    if (!files) return;
    const incoming = Array.from(files);
    setSelectedFiles((prev) => {
      const names = new Set(prev.map(f => f.name + f.size + f.type));
      const deduped = incoming.filter(f => !names.has(f.name + f.size + f.type));
      return [...prev, ...deduped].slice(0, 10);
    });
  };
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => addFiles(e.target.files);
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); addFiles(e.dataTransfer.files); };
  const preventDefault = (e: React.DragEvent<HTMLDivElement>) => e.preventDefault();

  return (
    <div className={`min-h-screen ${isDark ? 'bg-black text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <div className={`grid grid-cols-1 min-h-screen ${isSidebarOpen ? 'lg:grid-cols-[280px_1fr]' : 'lg:grid-cols-[0_1fr]'} transition-[grid-template-columns] duration-300`}>
        {/* Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-40 w-72 transform transition-transform duration-300 lg:static ${
            isSidebarOpen ? 'translate-x-0 lg:translate-x-0' : '-translate-x-full lg:-translate-x-full'
          } ${isDark ? 'bg-black border-r border-neutral-800' : 'bg-white border-r border-gray-200'}`}
        >
          <div className="flex h-full flex-col">
            <div className="p-3 border-b border-white/5">
              <button
                onClick={createNewChat}
                className={`w-full inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition ${
                  isDark ? 'bg-neutral-900 hover:bg-neutral-800 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                }`}
              >
                <Plus className="h-4 w-4" /> New chat
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {conversations.map((c) => {
                const isActive = c.id === activeConversationId;
                return (
                  <div key={c.id} className="group relative">
                    <button
                      onClick={() => selectConversation(c.id)}
                      className={`w-full flex items-center gap-2 rounded-md px-3 py-2 text-sm text-left transition ${
                        isActive
                          ? (isDark ? 'bg-neutral-900 text-white' : 'bg-gray-200 text-gray-900')
                          : (isDark ? 'hover:bg-neutral-900/60 text-neutral-300' : 'hover:bg-gray-100 text-gray-700')
                      }`}
                    >
                      <MessageSquare className="h-4 w-4 shrink-0" />
                      <span className="truncate flex-1">{c.title}</span>
                    </button>
                    <button
                      aria-label="Delete conversation"
                      onClick={() => deleteConversation(c.id)}
                      className={`absolute right-2 top-1/2 -translate-y-1/2 hidden group-hover:inline-flex p-1 rounded ${
                        isDark ? 'hover:bg-neutral-800' : 'hover:bg-gray-200'
                      }`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
            </div>

            <div className={`p-3 border-t ${isDark ? 'border-neutral-800' : 'border-gray-200'}`}>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center overflow-hidden ${isDark ? 'bg-neutral-900 text-white' : 'bg-gray-200 text-gray-700'}`}>
                    {user?.avatarUrl ? (
                      <img src={user.avatarUrl} alt={user.name} className="h-full w-full object-cover" />
                    ) : (
                      <User className="h-4 w-4" />
                    )}
                  </div>
                  <div className="truncate text-sm">
                    <span className={isDark ? 'text-white' : 'text-gray-900'}>{user?.name ?? 'User'}</span>
                  </div>
                </div>
                <button
                  onClick={async () => {
                    const refreshToken = localStorage.getItem('refreshToken');
                    try {
                      await fetch(`${baseUrl}/api/auth/logout`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify({ refreshToken })
                      }).catch(() => {});
                    } catch {
                      // ignore network errors on logout
                    } finally {
                      logout();
                      toast({ title: 'Logged out', description: 'You have been signed out.', variant: 'info' });
                      navigate('/login');
                    }
                  }}
                  className={`inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition ${
                    isDark ? 'text-red-300 hover:bg-neutral-900' : 'text-red-600 hover:bg-gray-100'
                  }`}
                >
                  <LogOut className="h-4 w-4" /> Logout
                </button>
              </div>
            </div>
          </div>
        </aside>

        {/* Chat Area */}
        <section className={`flex flex-col ${isDark ? 'bg-[#212121]' : ''}`}>
          {/* Header */}
          <div className={`${isDark ? 'bg-[#212121] supports-[backdrop-filter]:bg-[#212121] border-[#212121]' : 'bg-white/80 supports-[backdrop-filter]:bg-white/60 border-gray-200'} sticky top-0 z-20 backdrop-blur border-b`}>
            <div className="flex items-center justify-between gap-2 px-3 py-3 md:px-6">
              <button
                className={`inline-flex items-center justify-center rounded-md p-2 ${isDark ? 'hover:bg-neutral-900' : 'hover:bg-gray-100'}`}
                onClick={() => setIsSidebarOpen((v) => !v)}
                aria-label={isSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
              >
                {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>

              <div className="mx-auto flex items-center gap-2 text-sm">
                <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{activeConversation.title}</span>
                <ChevronDown className="h-4 w-4 opacity-60" />
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={createNewChat}
                  className={`hidden md:inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium ${isDark ? 'bg-neutral-900 hover:bg-neutral-800' : 'bg-gray-100 hover:bg-gray-200'}`}
                >
                  <Plus className="h-4 w-4" /> New chat
                </button>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto">
            <div className="mx-auto w-full max-w-3xl px-3 md:px-6 py-6 space-y-6">
              {activeConversation.messages.map((m) => {
                const isUser = m.role === 'user';
                return (
                  <div key={m.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                    <div className={`flex items-start gap-3 max-w-full`}> 
                      {!isUser && (
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center mt-1 ${isDark ? 'bg-[#212121]' : 'bg-gray-200'}`}>
                          <Sparkles className="h-4 w-4" />
                        </div>
                      )}
                      <div
                        className={`rounded-2xl px-4 py-3 whitespace-pre-wrap break-words ${
                          isUser
                            ? 'bg-blue-600 text-white'
                            : (isDark ? 'bg-neutral-900 text-neutral-100 border border-neutral-800' : 'bg-white text-gray-900 border border-gray-200')
                        }`}
                      >
                        {m.content}
                        {m.attachments && m.attachments.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {m.attachments.map((a) => (
                              <span key={a.name + a.size} className={`inline-flex items-center gap-2 rounded-md px-2 py-1 text-xs border ${isDark ? 'border-neutral-800 bg-black/60 text-neutral-300' : 'border-gray-200 bg-gray-50 text-gray-700'}`}>
                                <Paperclip className="h-3 w-3" /> {a.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      {isUser && (
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center mt-1 ${isDark ? 'bg-neutral-900 text-white' : 'bg-gray-200 text-gray-700'}`}>
                          <User className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {isResponding && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-2 text-sm opacity-80">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center ${isDark ? 'bg-neutral-900' : 'bg-gray-200'}`}>
                      <Sparkles className="h-4 w-4" />
                    </div>
                    <span>Assistant is typing…</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Composer */}
          <div className={`sticky bottom-0 border-t backdrop-blur ${isDark ? 'border-neutral-800 bg-[#212121] supports-[backdrop-filter]:bg-[#212121]' : 'border-gray-200 bg-white/80 supports-[backdrop-filter]:bg-white/60'}`}>
            <div className="mx-auto w-full max-w-3xl px-3 md:px-6 py-3">
              <div
                className={`rounded-2xl p-2 ${isDark ? 'bg-black border border-neutral-800' : 'bg-gray-50 border border-gray-200'}`}
                onDragOver={preventDefault}
                onDrop={handleDrop}
              >
                <div className="flex items-end gap-2">
                  <button
                    type="button"
                    onClick={handleChooseFiles}
                    className={`inline-flex h-9 w-9 items-center justify-center rounded-md transition ${isDark ? 'bg-neutral-900 text-white hover:bg-neutral-800' : 'bg-gray-100 text-gray-900 hover:bg-gray-200'}`}
                    aria-label="Attach files"
                  >
                    <Paperclip className="h-4 w-4" />
                  </button>
                  <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileInputChange} title="Attach files" />
                  <textarea
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    rows={1}
                    placeholder="Message ChatGPT"
                    className={`flex-1 resize-none bg-transparent outline-none px-3 py-2 text-sm ${isDark ? 'placeholder:text-neutral-500' : 'placeholder:text-gray-500'}`}
                    disabled={isResponding}
                  />
                  <button
                    onClick={handleSend}
                    disabled={!inputValue.trim() || isResponding}
                    className={`inline-flex h-9 w-9 items-center justify-center rounded-md transition ${
                      isDark ? 'bg-neutral-900 text-white hover:bg-neutral-800 disabled:bg-neutral-900/60' : 'bg-gray-900 text-white hover:bg-gray-800 disabled:bg-gray-300'
                    }`}
                    aria-label="Send message"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
                {selectedFiles.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2 px-1">
                    {selectedFiles.map((file, idx) => (
                      <span key={file.name + file.size} className={`inline-flex items-center gap-2 rounded-md px-2 py-1 text-xs border ${isDark ? 'border-neutral-800 bg-black/60 text-neutral-300' : 'border-gray-200 bg-white text-gray-700'}`}>
                        <Paperclip className="h-3 w-3" /> {file.name}
                        <button
                          className={`rounded p-0.5 ${isDark ? 'hover:bg-neutral-900' : 'hover:bg-gray-100'}`}
                          onClick={() => setSelectedFiles(prev => prev.filter((_, i) => i !== idx))}
                          aria-label={`Remove ${file.name}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
             
            </div>
          </div>
        </section>
      </div>

      {/* Close Sidebar Button (mobile) */}
      {isSidebarOpen && (
        <button
          className={`fixed left-3 top-3 z-50 inline-flex items-center justify-center rounded-md p-2 lg:hidden ${isDark ? 'bg-neutral-900 hover:bg-neutral-800' : 'bg-white hover:bg-gray-100 border border-gray-200'}`}
          onClick={() => setIsSidebarOpen(false)}
          aria-label="Close sidebar"
        >
          <X className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}
