'use client';

import { MessageCircle } from 'lucide-react';

export function SupportChatTrigger() {
  const handleClick = () => {
    window.dispatchEvent(new CustomEvent('support-chat:open'));
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="glow-card rounded-xl p-5 flex items-center gap-4 hover:bg-white/5 transition-colors w-full text-left"
    >
      <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
        <MessageCircle className="w-6 h-6 text-primary" />
      </div>
      <div>
        <p className="font-semibold text-white">Чат на сайте</p>
        <p className="text-sm text-muted-foreground">Открыть окно поддержки</p>
      </div>
    </button>
  );
}
