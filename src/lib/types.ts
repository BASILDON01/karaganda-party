export interface Party {
  id: string;
  name: string;
  slug: string;
  description: string;
  date: string;
  time: string;
  endTime?: string;
  venue: Venue;
  image: string;
  gallery?: string[];
  lineup: Artist[];
  ticketTypes: TicketType[];
  dressCode?: string;
  ageRestriction: number;
  organizer: Organizer;
  status: 'upcoming' | 'ongoing' | 'ended' | 'cancelled';
  totalTickets: number;
  soldTickets: number;
  createdAt: string;
  updatedAt: string;
}

export interface Venue {
  id: string;
  name: string;
  address: string;
  city: string;
  mapUrl?: string;
  image?: string;
}

export interface Artist {
  id: string;
  name: string;
  role: string;
  image?: string;
  socialLinks?: {
    instagram?: string;
    soundcloud?: string;
    spotify?: string;
  };
}

export interface TicketType {
  id: string;
  name: string;
  description?: string;
  price: number;
  currency: 'KZT';
  quantity: number;
  sold: number;
  maxPerOrder: number;
  features?: string[];
}

export interface Ticket {
  id: string;
  partyId: string;
  ticketTypeId: string;
  userId: string;
  qrCode: string;
  status: 'active' | 'used' | 'cancelled' | 'refunded';
  purchasedAt: string;
  usedAt?: string;
  paymentMethod: 'kaspi' | 'halyk';
  paymentId: string;
  price: number;
}

export interface User {
  id: string;
  email: string;
  phone: string;
  name: string;
  role: 'user' | 'organizer' | 'admin';
  avatar?: string;
  createdAt: string;
}

export interface Organizer {
  id: string;
  name: string;
  logo?: string;
  description?: string;
  socialLinks?: {
    instagram?: string;
    telegram?: string;
    website?: string;
  };
  verified: boolean;
}

export interface PaymentIntent {
  id: string;
  ticketId: string;
  amount: number;
  currency: 'KZT';
  method: 'kaspi' | 'halyk';
  status: 'pending' | 'completed' | 'failed' | 'expired';
  createdAt: string;
  expiresAt: string;
  redirectUrl?: string;
}

export interface PurchasedTicket {
  id: string;
  userId: string;
  party: Party;
  ticketType: TicketType;
  quantity: number;
  purchasedAt: string;
  status: 'active' | 'used' | 'cancelled';
  qrCode: string;
  paymentMethod: 'kaspi' | 'halyk';
}
