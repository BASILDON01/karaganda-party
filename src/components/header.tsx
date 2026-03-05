'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { Menu, Ticket, User, LogOut, Settings, Calendar, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useAuth } from '@/lib/auth-context';
import { useTickets } from '@/lib/tickets-context';

const navigation = [
  { name: 'Все пати', href: '/' },
  { name: 'Календарь', href: '/calendar' },
  { name: 'Организаторам', href: '/organizers' },
  { name: 'Тарифы', href: '/pricing' },
  { name: 'Документация', href: '/docs' },
];

export function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { getActiveTickets } = useTickets();

  const activeTicketsCount = getActiveTickets().length;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="relative w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30 group-hover:shadow-primary/50 transition-shadow">
              <span className="text-white font-bold text-lg">F</span>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-pink-500 rounded-full animate-pulse" />
            </div>
            <div className="hidden sm:block">
              <span className="text-xl font-bold tracking-wider">Factor</span>
              <span className="text-xl font-light text-primary ml-1">KZ</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-sm font-medium text-muted-foreground hover:text-white transition-colors relative group"
              >
                {item.name}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300" />
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Link href="/my-tickets" className="hidden sm:flex relative">
              <Button variant="ghost" size="sm" className="gap-2">
                <Ticket className="w-4 h-4" />
                <span className="hidden lg:inline">Мои билеты</span>
                {activeTicketsCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full text-xs flex items-center justify-center">
                    {activeTicketsCount}
                  </span>
                )}
              </Button>
            </Link>

            {isAuthenticated ? (
              <div className="hidden sm:flex items-center gap-2">
                <Link href="/profile">
                  <Button variant="ghost" size="sm" className="gap-2">
                    {user?.avatar ? (
                      <Image
                        src={user.avatar}
                        alt={user.name}
                        width={24}
                        height={24}
                        className="rounded-full"
                      />
                    ) : (
                      <User className="w-4 h-4" />
                    )}
                    <span className="hidden lg:inline">{user?.name}</span>
                  </Button>
                </Link>
                <Button variant="ghost" size="icon" onClick={logout} title="Выйти">
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <Link href="/login" className="hidden sm:flex">
                <Button variant="outline" size="sm" className="gap-2">
                  <User className="w-4 h-4" />
                  <span className="hidden lg:inline">Войти</span>
                </Button>
              </Link>
            )}

            {isAdmin && (
              <Link href="/admin" className="hidden md:flex">
                <Button variant="outline" size="sm" className="gap-2">
                  <Shield className="w-4 h-4" />
                  Админка
                </Button>
              </Link>
            )}
            {/* Mobile Menu */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80 bg-card border-l border-white/10">
                <div className="flex flex-col gap-6 mt-8">
                  {/* User info */}
                  {isAuthenticated && user && (
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5">
                      {user.avatar ? (
                        <Image
                          src={user.avatar}
                          alt={user.name}
                          width={40}
                          height={40}
                          className="rounded-full"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                          <User className="w-5 h-5" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-xs text-muted-foreground">Telegram User</p>
                      </div>
                    </div>
                  )}

                  <nav className="flex flex-col gap-1">
                    {navigation.map((item) => (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-3 text-lg font-medium text-muted-foreground hover:text-white hover:bg-white/5 transition-colors py-3 px-4 rounded-xl"
                      >
                        {item.name}
                      </Link>
                    ))}
                  </nav>

                  <div className="border-t border-white/10 pt-6 space-y-2">
                    <Link href="/my-tickets" onClick={() => setIsOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start gap-3 h-12">
                        <Ticket className="w-5 h-5" />
                        Мои билеты
                        {activeTicketsCount > 0 && (
                          <span className="ml-auto bg-primary text-white text-xs px-2 py-0.5 rounded-full">
                            {activeTicketsCount}
                          </span>
                        )}
                      </Button>
                    </Link>

                    {isAuthenticated ? (
                      <>
                        <Link href="/profile" onClick={() => setIsOpen(false)}>
                          <Button variant="ghost" className="w-full justify-start gap-3 h-12">
                            <Settings className="w-5 h-5" />
                            Настройки
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          className="w-full justify-start gap-3 h-12 text-red-500 hover:text-red-400 hover:bg-red-500/10"
                          onClick={() => {
                            logout();
                            setIsOpen(false);
                          }}
                        >
                          <LogOut className="w-5 h-5" />
                          Выйти
                        </Button>
                      </>
                    ) : (
                      <Link href="/login" onClick={() => setIsOpen(false)}>
                        <Button variant="outline" className="w-full justify-start gap-3 h-12">
                          <User className="w-5 h-5" />
                          Войти через Telegram
                        </Button>
                      </Link>
                    )}

                    {isAdmin && (
                      <Link href="/admin" onClick={() => setIsOpen(false)}>
                        <Button variant="outline" className="w-full justify-start gap-3 h-12">
                          <Shield className="w-5 h-5" />
                          Админка
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
