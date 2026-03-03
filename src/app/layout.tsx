import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/header";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/lib/auth-context";
import { TicketsProvider } from "@/lib/tickets-context";

export const metadata: Metadata = {
  title: "FactorKZ - Билеты на вечеринки в Караганде",
  description: "Платформа для покупки билетов на лучшие вечеринки Караганды. Dragon Party, Pizdec Party, Hello Kitty и многое другое.",
  keywords: ["караганда", "вечеринки", "билеты", "party", "клуб", "dj"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className="dark">
      <body className="min-h-screen bg-background text-foreground antialiased">
        <AuthProvider>
          <TicketsProvider>
            <Header />
            <main>{children}</main>
            <Toaster />
          </TicketsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
