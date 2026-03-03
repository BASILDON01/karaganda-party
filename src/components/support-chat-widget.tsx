'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { MessageCircle, X, Send, User, Headphones } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';

type SupportMessage = {
  id: string;
  userId: string;
  author: 'user' | 'support';
  text: string;
  createdAt: string;
};

export function SupportChatWidget() {
  const { user, isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isClosed, setIsClosed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchMessages = useCallback(() => {
    if (!isAuthenticated) return Promise.resolve();
    return fetch('/api/support/messages', {
      credentials: 'include',
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' },
    })
      .then((res) => {
        if (!res.ok) return null;
        return res.json();
      })
      .then((data) => {
        if (data?.ok && Array.isArray(data.messages)) {
          setMessages(data.messages);
        }
        if (data?.ok && typeof data.unreadCount === 'number') setUnreadCount(data.unreadCount);
        if (data?.ok && typeof data.isClosed === 'boolean') setIsClosed(data.isClosed);
      })
      .catch(() => {});
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchMessages().catch(() => toast.error('Не удалось загрузить сообщения'));
  }, [isAuthenticated, fetchMessages]);

  useEffect(() => {
    if (!open || !isAuthenticated) return;
    setLoading(true);
    fetchMessages()
      .then(() => {
        fetch('/api/support/read', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: '{}' }).catch(() => {});
      })
      .catch(() => toast.error('Не удалось загрузить сообщения'))
      .finally(() => setLoading(false));
  }, [open, isAuthenticated, fetchMessages]);

  useEffect(() => {
    if (!open || !isAuthenticated) return;
    pollRef.current = setInterval(() => fetchMessages(), 2000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = null;
    };
  }, [open, isAuthenticated, fetchMessages]);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    setInput('');
    try {
      const res = await fetch('/api/support/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok && data?.ok && data.message) {
        setMessages((prev) => [...prev, data.message]);
        setIsClosed(false);
      } else {
        toast.error('Не удалось отправить');
        setInput(text);
      }
    } catch {
      toast.error('Ошибка отправки');
      setInput(text);
    } finally {
      setSending(false);
    }
  };

  if (!isAuthenticated) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary text-white shadow-lg shadow-primary/30 hover:shadow-primary/50 flex items-center justify-center transition-all hover:scale-105 relative"
        aria-label="Чат с поддержкой"
      >
        <MessageCircle className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[22px] h-[22px] rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center px-1 shadow">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed right-6 z-50 w-[400px] max-w-[calc(100vw-3rem)] rounded-2xl border border-white/10 bg-card shadow-xl overflow-hidden flex flex-col h-[75vh] min-h-[420px] max-h-[85vh]"
          style={{ bottom: 'calc(1.5rem + 3.5rem + 12px)' }}
        >
          <div className="p-3 border-b border-white/10 flex items-center justify-between bg-primary/10 shrink-0">
            <span className="font-semibold">Поддержка FactorKZ</span>
            <Button variant="ghost" size="icon" onClick={() => setOpen(false)} className="h-8 w-8">
              <X className="w-4 h-4" />
            </Button>
          </div>
          {isClosed && (
            <div className="px-3 py-2 bg-amber-500/20 border-b border-amber-500/30 text-amber-200 text-sm shrink-0">
              Обращение закрыто. Напишите сообщение, чтобы открыть тикет снова.
            </div>
          )}
          <div
            ref={listRef}
            className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0"
          >
            {loading ? (
              <p className="text-sm text-muted-foreground text-center py-8">Загрузка...</p>
            ) : messages.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Напишите вопрос — мы ответим в ближайшее время.
              </p>
            ) : (
              messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex gap-2 ${m.author === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  <div className="shrink-0 w-8 h-8 rounded-full overflow-hidden bg-muted flex items-center justify-center">
                    {m.author === 'user' && user?.avatar ? (
                      <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                    ) : m.author === 'user' ? (
                      <User className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <Headphones className="w-4 h-4 text-primary" />
                    )}
                  </div>
                  <div
                    className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${
                      m.author === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-foreground'
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words">{m.text}</p>
                    <p className={`text-xs mt-1 ${m.author === 'user' ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                      {new Date(m.createdAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="p-3 border-t border-white/10 flex gap-2 shrink-0">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
              placeholder="Сообщение..."
              className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <Button size="icon" onClick={send} disabled={sending || !input.trim()} className="shrink-0">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
