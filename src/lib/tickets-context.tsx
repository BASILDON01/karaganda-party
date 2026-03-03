"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

import type { PurchasedTicket } from "./types";

interface TicketsContextType {
  tickets: PurchasedTicket[];
  addTickets: (tickets: PurchasedTicket[]) => void;
  getActiveTickets: () => PurchasedTicket[];
  getUsedTickets: () => PurchasedTicket[];
}

const TicketsContext = createContext<TicketsContextType | undefined>(undefined);

export function TicketsProvider({ children }: { children: ReactNode }) {
  const [tickets, setTickets] = useState<PurchasedTicket[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function loadTickets() {
      try {
        const res = await fetch("/api/tickets/my", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { ok: boolean; tickets: PurchasedTicket[] };
        if (!cancelled && data?.ok && Array.isArray(data.tickets)) {
          setTickets(data.tickets);
        }
      } catch {
        // ignore, can be unauthenticated
      }
    }

    loadTickets();
    return () => {
      cancelled = true;
    };
  }, []);

  const addTickets = (newTickets: PurchasedTicket[]) => {
    if (!newTickets.length) return;
    setTickets((prev) => [...prev, ...newTickets]);
  };

  const getActiveTickets = () => tickets.filter(t => t.status === 'active');
  const getUsedTickets = () => tickets.filter(t => t.status === 'used');

  return (
    <TicketsContext.Provider
      value={{
        tickets,
        addTickets,
        getActiveTickets,
        getUsedTickets,
      }}
    >
      {children}
    </TicketsContext.Provider>
  );
}

export function useTickets() {
  const context = useContext(TicketsContext);
  if (context === undefined) {
    throw new Error("useTickets must be used within a TicketsProvider");
  }
  return context;
}
