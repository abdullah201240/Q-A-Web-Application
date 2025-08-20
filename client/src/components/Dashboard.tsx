import { useTheme } from "@/hooks/use-theme";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { ChevronDown, LogOut, Menu, MessageSquare, Plus, Send, Trash2, User, Sparkles, X, Paperclip, Loader2, Check } from "lucide-react";

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
  const uploadInputRef = useRef<HTMLInputElement | null>(null);
  const [conversationUploads, setConversationUploads] = useState<Record<string, File[]>>({});
  const [conversationDocIds, setConversationDocIds] = useState<Record<string, number[]>>({});
  const [isUploadingMap, setIsUploadingMap] = useState<Record<string, boolean>>({});
  const [uploadedFileKeys, setUploadedFileKeys] = useState<Record<string, string[]>>({});
  const [uploadStateByKey, setUploadStateByKey] = useState<Record<string, { status: 'queued' | 'processing' | 'ready' | 'failed'; error?: string }>>({});

  const activeConversation = useMemo(() => conversations.find(c => c.id === activeConversationId)!, [conversations, activeConversationId]);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const hasUploadedDocs = useMemo(() => (conversationDocIds[activeConversationId]?.length ?? 0) > 0, [conversationDocIds, activeConversationId]);
  const keyOf = (f: File) => `${f.name}|${f.size}|${f.type}`;
  const activeIsUploading = !!isUploadingMap[activeConversationId];

  const parseErrorResponse = useCallback(async (response: Response) => {
    let body: { message?: string; details?: unknown } | null = null;
    try {
      body = await response.clone().json();
    } catch {
      try {
        const text = await response.text();
        body = text ? { message: text } : null;
      } catch {
        body = null;
      }
    }
    const status = response.status;
    const message = body?.message || (status >= 500 ? 'Server error' : 'Request failed');
    return { status, message, details: body?.details } as { status: number; message: string; details?: unknown };
  }, []);

  const allowedMimeTypes = useMemo(() => new Set([
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ]), []);
  const isAllowedFile = (file: File): boolean => {
    if (allowedMimeTypes.has(file.type)) return true;
    const lower = file.name.toLowerCase();
    if (lower.endsWith('.pdf') || lower.endsWith('.doc') || lower.endsWith('.docx')) return true;
    return false;
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeConversation.messages.length, isResponding]);

  // Load existing conversations from server on mount
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;
    const load = async () => {
      try {
        const resp = await fetch(`${baseUrl}/api/conversations`, {
          headers: { 'Authorization': `Bearer ${token}` },
          credentials: 'include'
        });
        if (!resp.ok) {
          if (resp.status === 401) {
            logout();
            toast({ title: 'Session expired', description: 'Please log in again.', variant: 'destructive' });
            navigate('/login');
          }
          return; // keep local default
        }
        const data = await resp.json().catch(() => null) as { conversations?: Array<{ id: number; title: string }> } | null;
        const list = data?.conversations ?? [];
        if (list.length === 0) {
          // Create one on server to match client UX
          const created = await fetch(`${baseUrl}/api/conversations`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({})
          }).then(r => r.json()).catch(() => null) as { id?: number; title?: string } | null;
          if (created?.id) {
            const seed: Conversation = { id: String(created.id), title: created.title || 'New chat', messages: [ { id: crypto.randomUUID(), role: 'assistant', content: 'Hi! How can I help you today?' } ] };
            setConversations([seed]);
            setActiveConversationId(String(created.id));
          }
          return;
        }
        // fetch each conversation details
        const details = await Promise.all(list.map(async (c) => {
          const r = await fetch(`${baseUrl}/api/conversations/${c.id}`, { headers: { 'Authorization': `Bearer ${token}` }, credentials: 'include' });
          if (!r.ok) {
            if (r.status === 401) {
              logout();
              toast({ title: 'Session expired', description: 'Please log in again.', variant: 'destructive' });
              navigate('/login');
            }
            return { id: c.id, title: c.title, messages: [], documentIds: [] };
          }
          const d = await r.json().catch(() => null) as { id?: number; title?: string; messages?: Array<{ id: number; role: 'user'|'assistant'; content: string; attachments?: ChatAttachment[] }>; documentIds?: number[] } | null;
          return d && d.id ? d : { id: c.id, title: c.title, messages: [], documentIds: [] };
        }));
        const mapped: Conversation[] = details.map(d => ({
          id: String(d.id!),
          title: d.title || 'New chat',
          messages: (d.messages || []).map(m => ({ id: String(m.id), role: m.role, content: m.content, attachments: m.attachments }))
        }));
        const docMap: Record<string, number[]> = {};
        for (const d of details) {
          if (d?.id) docMap[String(d.id)] = d.documentIds || [];
        }
        setConversations(mapped.length ? mapped : conversations);
        setConversationDocIds(prev => ({ ...prev, ...docMap }));
        if (mapped.length) setActiveConversationId(mapped[0].id);
      } catch {
        // ignore load errors
      }
    };
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseUrl]);

  const createNewChat = () => {
    const run = async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        // fallback local only
        const local: Conversation = {
          id: crypto.randomUUID(),
          title: 'New chat',
          messages: [{ id: crypto.randomUUID(), role: 'assistant', content: 'Hi! How can I help you today?' }]
        };
        setConversations([local, ...conversations]);
        setActiveConversationId(local.id);
        setIsSidebarOpen(false);
        return;
      }
      try {
        const resp = await fetch(`${baseUrl}/api/conversations`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({}) });
        const data = await resp.json().catch(() => null) as { id?: number; title?: string } | null;
        const idStr = data?.id ? String(data.id) : crypto.randomUUID();
        const newConversation: Conversation = {
          id: idStr,
          title: data?.title || 'New chat',
          messages: [ { id: crypto.randomUUID(), role: 'assistant', content: 'Hi! How can I help you today?' } ]
        };
        setConversations([newConversation, ...conversations]);
        setActiveConversationId(newConversation.id);
        setIsSidebarOpen(false);
      } catch {
        // fallback local on error
        const local: Conversation = {
          id: crypto.randomUUID(),
          title: 'New chat',
          messages: [{ id: crypto.randomUUID(), role: 'assistant', content: 'Hi! How can I help you today?' }]
        };
        setConversations([local, ...conversations]);
        setActiveConversationId(local.id);
        setIsSidebarOpen(false);
      }
    };
    void run();
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
    // Try to delete on server (best-effort)
    const token = localStorage.getItem('accessToken');
    if (token && /^\d+$/.test(id)) {
      void fetch(`${baseUrl}/api/conversations/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` }, credentials: 'include' }).catch(() => {});
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

  const handleSend = async () => {
    const content = inputValue.trim();
    if (!content || isResponding) return;
    if (!hasUploadedDocs) {
      toast({ title: 'Upload required', description: 'Please upload at least one document to start chatting.', variant: 'destructive' });
      return;
    }
    if (isUploadingMap[activeConversationId]) {
      toast({ title: 'Please wait', description: 'Your documents are still uploading. Try again shortly.', variant: 'info' });
      return;
    }

    const attachments: ChatAttachment[] = selectedFiles.map((f) => ({ name: f.name, size: f.size, type: f.type }));
    const userMessage: ChatMessage = { id: crypto.randomUUID(), role: "user", content, attachments: attachments.length ? attachments : undefined };
    setInputValue("");
    setSelectedFiles([]);
    updateActiveConversationTitle(content);
    setConversations(prev => prev.map(c => c.id === activeConversationId ? { ...c, messages: [...c.messages, userMessage] } : c));
    setIsResponding(true);
    try {
      const ids = conversationDocIds[activeConversationId] ?? [];
      const targetId = ids[ids.length - 1];
      if (!targetId) {
        toast({ title: 'No document selected', description: 'Please upload a document and try again.', variant: 'destructive' });
        return;
      }
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 20000);
      // Persist user message
      const token = localStorage.getItem('accessToken');
      if (token && /^\d+$/.test(activeConversationId)) {
        void fetch(`${baseUrl}/api/conversations/${activeConversationId}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          credentials: 'include',
          body: JSON.stringify({ role: 'user', content, attachments })
        }).catch(() => {});
      }

      const response = await fetch(`${baseUrl}/api/documents/${targetId}/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: content }),
        credentials: 'include',
        // include bearer if available
        ...(localStorage.getItem('accessToken') ? { headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` } } : {}),
        signal: controller.signal
      });
      clearTimeout(timer);
      if (!response.ok) {
        const { status, message } = await parseErrorResponse(response);
        if (status === 401) {
          logout();
          toast({ title: 'Session expired', description: 'Please log in again.', variant: 'destructive' });
          navigate('/login');
          return;
        }
        if (status === 400) {
          toast({ title: 'Invalid question', description: 'Question is required.', variant: 'destructive' });
        } else if (status === 404) {
          toast({ title: 'Not found', description: 'Document not found or was removed.', variant: 'destructive' });
        } else if (status === 502) {
          toast({ title: 'Upstream error', description: message || 'LLM provider returned an error.', variant: 'destructive' });
        } else if (status === 403) {
          toast({ title: 'Forbidden', description: 'You do not have access to this document.', variant: 'destructive' });
        } else {
          toast({ title: 'Request failed', description: message, variant: 'destructive' });
        }
        return;
      }
      const data = await response.json().catch(async () => ({ answer: await response.text().catch(() => '') }));
      const answer = data?.answer || 'No answer available.';
      const assistantMessage: ChatMessage = { id: crypto.randomUUID(), role: 'assistant', content: answer };
      setConversations(prev => prev.map(c => c.id === activeConversationId ? { ...c, messages: [...c.messages, assistantMessage] } : c));
      // Persist assistant message
      if (token && /^\d+$/.test(activeConversationId)) {
        void fetch(`${baseUrl}/api/conversations/${activeConversationId}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          credentials: 'include',
          body: JSON.stringify({ role: 'assistant', content: answer })
        }).catch(() => {});
      }
    } catch (err: unknown) {
      const isAbort = (err as Error)?.name === 'AbortError';
      toast({ title: 'Network error', description: isAbort ? 'Request timed out. Please try again.' : 'Failed to get answer from server.', variant: 'destructive' });
    } finally {
      setIsResponding(false);
    }
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
    const all = Array.from(files);
    const incoming = all.filter(isAllowedFile);
    const rejected = all.length - incoming.length;
    if (rejected > 0) {
      toast({ title: 'Some files were rejected', description: 'Only PDF, DOC, and DOCX files are allowed.', variant: 'destructive' });
    }
    setSelectedFiles((prev) => {
      const names = new Set(prev.map(f => f.name + f.size + f.type));
      const deduped = incoming.filter(f => !names.has(f.name + f.size + f.type));
      return [...prev, ...deduped].slice(0, 10);
    });
  };
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => addFiles(e.target.files);
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); addFiles(e.dataTransfer.files); };
  const preventDefault = (e: React.DragEvent<HTMLDivElement>) => e.preventDefault();

  // Conversation-level document uploads (required before chatting)
  const handleChooseUploads = () => uploadInputRef.current?.click();
  const addUploadFiles = (files: FileList | null) => {
    if (!files) return;
    const all = Array.from(files);
    const incoming = all.filter(isAllowedFile);
    const rejected = all.length - incoming.length;
    if (rejected > 0) {
      toast({ title: 'Some files were rejected', description: 'Only PDF, DOC, and DOCX files are allowed.', variant: 'destructive' });
    }
    setConversationUploads((prev) => {
      const current = prev[activeConversationId] ?? [];
      const existingKeySet = new Set(current.map(f => f.name + f.size + f.type));
      const deduped = incoming.filter(f => !existingKeySet.has(f.name + f.size + f.type));
      const updated = [...current, ...deduped].slice(0, 20);
      return { ...prev, [activeConversationId]: updated };
    });
    setUploadStateByKey(prev => {
      const draft = { ...prev } as Record<string, { status: 'queued' | 'processing' | 'ready' | 'failed'; error?: string }>;
      for (const f of incoming) {
        const k = keyOf(f);
        if (!draft[k]) draft[k] = { status: 'queued' };
      }
      return draft;
    });
  };
  const handleUploadInputChange = (e: React.ChangeEvent<HTMLInputElement>) => addUploadFiles(e.target.files);
  const handleUploadDrop = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); addUploadFiles(e.dataTransfer.files); };
  const removeUploadedFile = (idx: number) => {
    setConversationUploads((prev) => {
      const current = prev[activeConversationId] ?? [];
      const updated = current.filter((_, i) => i !== idx);
      return { ...prev, [activeConversationId]: updated };
    });
  };

  // Auto-upload newly attached conversation files
  useEffect(() => {
    const files = conversationUploads[activeConversationId] ?? [];
    if (files.length === 0) return;
    const uploadedKeys = new Set((uploadedFileKeys[activeConversationId] ?? []));
    const toUpload = files.filter(f => !uploadedKeys.has(keyOf(f)));
    if (toUpload.length === 0) return;

    let cancelled = false;
    const run = async () => {
      setIsUploadingMap(prev => ({ ...prev, [activeConversationId]: true }));
      for (const file of toUpload) {
        if (cancelled) break;
        const form = new FormData();
        form.append('file', file);
        try {
          const fk = keyOf(file);
          setUploadStateByKey(prev => ({ ...prev, [fk]: { status: 'processing' } }));
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 120000);
          const headers: Record<string, string> = {};
          const token = localStorage.getItem('accessToken');
          if (token) headers['Authorization'] = `Bearer ${token}`;
          const resp = await fetch(`${baseUrl}/api/documents/upload`, { method: 'POST', body: form, signal: controller.signal, headers, credentials: 'include' });
          clearTimeout(timer);
          if (resp.status === 401) {
            logout();
            toast({ title: 'Session expired', description: 'Please log in again.', variant: 'destructive' });
            navigate('/login');
            return;
          }
          const payload = await resp.json().catch(() => null);
          if (!resp.ok || !payload?.id) {
            const { message } = !resp.ok ? await parseErrorResponse(resp) : { message: 'Upload failed' };
            setUploadStateByKey(prev => ({ ...prev, [fk]: { status: 'failed', error: message || 'Upload failed' } }));
            toast({ title: 'Upload failed', description: `${file.name}: ${message || 'Unable to upload'}`, variant: 'destructive' });
            continue;
          }
          setConversationDocIds(prev => ({
            ...prev,
            [activeConversationId]: [ ...(prev[activeConversationId] ?? []), payload.id ]
          }));
          setUploadedFileKeys(prev => {
            const list = prev[activeConversationId] ? [...prev[activeConversationId] ] : [];
            const k = keyOf(file);
            if (!list.includes(k)) list.push(k);
            return { ...prev, [activeConversationId]: list };
          });
          setUploadStateByKey(prev => ({ ...prev, [fk]: { status: 'ready' } }));
          // Link document to conversation on server
          if (token && /^\d+$/.test(activeConversationId)) {
            const currentIds = (conversationDocIds[activeConversationId] ?? []).concat([payload.id]);
            void fetch(`${baseUrl}/api/conversations/${activeConversationId}/documents`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
              credentials: 'include',
              body: JSON.stringify({ documentIds: currentIds })
            }).then(async (r) => {
              if (r.status === 401) {
                logout();
                toast({ title: 'Session expired', description: 'Please log in again.', variant: 'destructive' });
                navigate('/login');
              }
            }).catch(() => {});
          }
        } catch (err: unknown) {
          const fk = keyOf(file);
          const isAbort = (err as Error)?.name === 'AbortError';
          const msg = isAbort ? 'Upload timed out' : 'Network error';
          setUploadStateByKey(prev => ({ ...prev, [fk]: { status: 'failed', error: msg } }));
          toast({ title: 'Upload error', description: `${file.name}: ${msg}`, variant: 'destructive' });
        }
      }
      setIsUploadingMap(prev => ({ ...prev, [activeConversationId]: false }));
    };
    void run();
    return () => { cancelled = true; };
  }, [conversationUploads, activeConversationId, baseUrl, uploadedFileKeys, toast, parseErrorResponse, conversationDocIds, logout, navigate]);

  return (
    <div className={`h-screen overflow-hidden ${isDark ? 'bg-[#181818] text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-[#181818]/40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <div className={`grid grid-cols-1 h-screen overflow-hidden ${isSidebarOpen ? 'lg:grid-cols-[280px_1fr]' : 'lg:grid-cols-[0_1fr]'} transition-[grid-template-columns] duration-300`}>
        {/* Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-40 w-72 transform transition-transform duration-300 lg:static lg:h-screen ${
            isSidebarOpen ? 'translate-x-0 lg:translate-x-0' : '-translate-x-full lg:-translate-x-full'
          } ${isDark ? 'bg-[#181818] border-r border-neutral-800' : 'bg-white border-r border-gray-200'}`}
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
        <section className={`flex flex-col min-h-0 ${isDark ? 'bg-[#212121]' : ''}`}>
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
              {/* Upload requirement / uploaded docs */}
              {!hasUploadedDocs ? (
                <div
                  className={`${isDark ? 'border-neutral-800 bg-[#181818]' : 'border-gray-300 bg-white'} rounded-2xl border-2 border-dashed p-6 text-sm`}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleUploadDrop}
                >
                  <div className="flex flex-col items-center text-center gap-3">
                    <Paperclip className="h-5 w-5 opacity-70" />
                    <div className="space-y-1">
                      <div className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Upload documents to start chatting</div>
                      <div className={isDark ? 'text-neutral-400' : 'text-gray-600'}>
                        Drag and drop files here, or choose files.
                        {activeIsUploading && (
                          <span className="inline-flex items-center gap-2 ml-2">
                            <Loader2 className="h-4 w-4 animate-spin" /> Processing…
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleChooseUploads}
                        className={`${isDark ? 'bg-neutral-900 hover:bg-neutral-800 text-white' : 'bg-gray-900 hover:bg-gray-800 text-white'} inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium`}
                      >
                        <Plus className="h-4 w-4" /> Choose files
                      </button>
                      <input title="Upload files" ref={uploadInputRef} type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" multiple className="hidden" onChange={handleUploadInputChange} />
                    </div>
                  </div>
                </div>
              ) : (
                <div className={`${isDark ? 'bg-[#181818] border border-neutral-800 text-neutral-300' : 'bg-white border border-gray-200 text-gray-700'} rounded-xl p-3 text-xs`}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 font-medium">
                      <Paperclip className="h-3.5 w-3.5" /> Documents attached to this chat
                      {activeIsUploading && (
                        <span className="inline-flex items-center gap-1 ml-2">
                          <Loader2 className="h-3 w-3 animate-spin" /> Processing…
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={handleChooseUploads}
                      className={`${isDark ? 'bg-neutral-900 hover:bg-neutral-800 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-900'} inline-flex items-center gap-2 rounded-md px-2 py-1 text-xs`}
                    >
                      <Plus className="h-3.5 w-3.5" /> Add more
                    </button>
                    <input title="Upload files" ref={uploadInputRef} type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" multiple className="hidden" onChange={handleUploadInputChange} />
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(conversationUploads[activeConversationId] ?? []).map((file, idx) => {
                      const k = `${file.name}|${file.size}|${file.type}`;
                      const state = uploadStateByKey[k]?.status ?? 'queued';
                      const badge = state === 'ready' ? <Check className="h-3 w-3" /> : state === 'failed' ? <X className="h-3 w-3" /> : <Loader2 className="h-3 w-3 animate-spin" />;
                      const label = state === 'ready' ? 'Ready' : state === 'failed' ? 'Failed' : 'Processing';
                      return (
                        <span key={file.name + file.size} className={`${isDark ? 'border-neutral-800 bg-[#181818]/60' : 'border-gray-200 bg-gray-50'} inline-flex items-center gap-2 rounded-md border px-2 py-1`}>
                          <Paperclip className="h-3 w-3" /> {file.name}
                          <span className={`inline-flex items-center gap-1 rounded px-1 py-0.5 text-[10px] ${state === 'ready' ? (isDark ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-700') : state === 'failed' ? (isDark ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-700') : (isDark ? 'bg-neutral-900 text-neutral-300' : 'bg-gray-100 text-gray-700')}`}>
                            {badge} {label}
                          </span>
                          <button
                            className={`${isDark ? 'hover:bg-neutral-900' : 'hover:bg-gray-100'} rounded p-0.5`}
                            onClick={() => removeUploadedFile(idx)}
                            aria-label={`Remove ${file.name}`}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
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
                              <span key={a.name + a.size} className={`inline-flex items-center gap-2 rounded-md px-2 py-1 text-xs border ${isDark ? 'border-neutral-800 bg-[#181818]/60 text-neutral-300' : 'border-gray-200 bg-gray-50 text-gray-700'}`}>
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
                className={`rounded-2xl p-2 ${isDark ? 'bg-[#181818] border border-neutral-800' : 'bg-gray-50 border border-gray-200'}`}
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
                  <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" multiple className="hidden" onChange={handleFileInputChange} title="Attach files" />
                  <textarea
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    rows={1}
                    placeholder={hasUploadedDocs ? 'Message ChatGPT' : 'Upload a document to start chatting'}
                    className={`flex-1 resize-none bg-transparent outline-none px-3 py-2 text-sm ${isDark ? 'placeholder:text-neutral-500' : 'placeholder:text-gray-500'}`}
                    disabled={isResponding || !hasUploadedDocs}
                  />
                  <button
                    onClick={handleSend}
                    disabled={!inputValue.trim() || isResponding || !hasUploadedDocs}
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
                      <span key={file.name + file.size} className={`inline-flex items-center gap-2 rounded-md px-2 py-1 text-xs border ${isDark ? 'border-neutral-800 bg-[#181818]/60 text-neutral-300' : 'border-gray-200 bg-white text-gray-700'}`}>
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
