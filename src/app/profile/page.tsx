'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { User, Ticket, LogOut, ChevronRight, Send, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth-context';
import { useTickets } from '@/lib/tickets-context';
import { toast } from 'sonner';

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const { getActiveTickets } = useTickets();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  const activeTickets = getActiveTickets();

  const handleLogout = () => {
    logout();
    toast.success('Вы вышли из аккаунта');
    router.push('/');
  };

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="container mx-auto px-4 max-w-2xl">
        {/* Profile card */}
        <div className="glow-card rounded-2xl p-8 mb-8">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {user.avatar ? (
              <Image
                src={user.avatar}
                alt={user.name}
                width={100}
                height={100}
                className="rounded-2xl"
              />
            ) : (
              <div className="w-24 h-24 rounded-2xl bg-primary flex items-center justify-center">
                <User className="w-12 h-12 text-white" />
              </div>
            )}

            <div className="text-center sm:text-left flex-1">
              <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
                <h1 className="text-2xl font-bold">{user.name}</h1>
                <Badge className="bg-[#0088cc]/20 text-[#0088cc] border-0">
                  <Send className="w-3 h-3 mr-1" />
                  Telegram
                </Badge>
              </div>
              <p className="text-muted-foreground">ID: {user.id}</p>
              <p className="text-sm text-muted-foreground mt-1">
                Зарегистрирован: {new Date(user.createdAt).toLocaleDateString('ru-RU')}
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="glow-card rounded-xl p-6 text-center">
            <Ticket className="w-8 h-8 text-primary mx-auto mb-2" />
            <p className="text-3xl font-bold">{activeTickets.length}</p>
            <p className="text-sm text-muted-foreground">Активных билетов</p>
          </div>
          <div className="glow-card rounded-xl p-6 text-center">
            <Shield className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <p className="text-3xl font-bold">Verified</p>
            <p className="text-sm text-muted-foreground">Статус аккаунта</p>
          </div>
        </div>

        {/* Menu */}
        <div className="space-y-2">
          <Link href="/my-tickets">
            <div className="glow-card rounded-xl p-4 flex items-center gap-4 hover:bg-white/5 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <Ticket className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-medium">Мои билеты</p>
                <p className="text-sm text-muted-foreground">Посмотреть купленные билеты</p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </div>
          </Link>

          <button
            onClick={handleLogout}
            className="w-full glow-card rounded-xl p-4 flex items-center gap-4 hover:bg-red-500/10 transition-colors text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
              <LogOut className="w-5 h-5 text-red-500" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-red-500">Выйти</p>
              <p className="text-sm text-muted-foreground">Выйти из аккаунта</p>
            </div>
          </button>
        </div>

        {/* Help */}
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            Нужна помощь?{' '}
            <Link href="/help" className="text-primary hover:underline">
              Написать в поддержку
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
