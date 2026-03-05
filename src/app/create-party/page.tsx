'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ChevronLeft,
  Upload,
  Calendar,
  Clock,
  MapPin,
  Users,
  Ticket,
  Plus,
  Trash2,
  Image as ImageIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth-context';
import { getCities } from '@/lib/cities';
import { toast } from 'sonner';

interface TicketTypeForm {
  id: string;
  name: string;
  price: string;
  quantity: string;
  description: string;
}

export default function CreatePartyPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    date: '',
    startTime: '',
    endTime: '',
    venue: '',
    address: '',
    city: 'Караганда',
    dressCode: '',
    ageRestriction: '18',
  });

  const [ticketTypes, setTicketTypes] = useState<TicketTypeForm[]>([
    { id: '1', name: 'Стандарт', price: '', quantity: '', description: '' },
  ]);

  const [coverImage, setCoverImage] = useState<string | null>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const addTicketType = () => {
    setTicketTypes([
      ...ticketTypes,
      { id: String(Date.now()), name: '', price: '', quantity: '', description: '' },
    ]);
  };

  const removeTicketType = (id: string) => {
    if (ticketTypes.length > 1) {
      setTicketTypes(ticketTypes.filter(t => t.id !== id));
    }
  };

  const updateTicketType = (id: string, field: keyof TicketTypeForm, value: string) => {
    setTicketTypes(ticketTypes.map(t =>
      t.id === id ? { ...t, [field]: value } : t
    ));
  };

  const handleCoverClick = () => {
    coverInputRef.current?.click();
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Выберите изображение (JPG, PNG)');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Размер файла не более 2 МБ');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setCoverImage(reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.date || !formData.startTime || !formData.venue) {
      toast.error('Заполните обязательные поля');
      return;
    }

    const validTickets = ticketTypes.filter(t => t.name && t.price && t.quantity);
    if (validTickets.length === 0) {
      toast.error('Добавьте хотя бы один тип билета с названием, ценой и количеством');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/parties/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim(),
          date: formData.date,
          startTime: formData.startTime,
          endTime: formData.endTime || undefined,
          venue: formData.venue.trim(),
          address: formData.address.trim(),
          city: formData.city,
          dressCode: formData.dressCode.trim() || undefined,
          ageRestriction: Number(formData.ageRestriction) || 18,
          image: coverImage || undefined,
          ticketTypes: validTickets.map(t => ({
            name: t.name.trim(),
            price: Number(t.price) || 0,
            quantity: Number(t.quantity) || 0,
            description: t.description?.trim() || undefined,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.message || 'Не удалось отправить заявку');
        return;
      }
      toast.success('Заявка отправлена!', {
        description: 'Ваше событие будет проверено модератором',
      });
      router.push('/');
    } catch {
      toast.error('Ошибка отправки');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="container mx-auto px-4 max-w-3xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ChevronLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-wider">СОЗДАТЬ ПАТИ</h1>
            <p className="text-muted-foreground mt-1">Заполните информацию о мероприятии</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic info */}
          <div className="glow-card rounded-2xl p-6 space-y-6">
            <h2 className="text-xl font-bold tracking-wider">ОСНОВНАЯ ИНФОРМАЦИЯ</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Название *</label>
                <Input
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="PIZDEC PARTY"
                  className="h-12"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Описание</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Расскажите о мероприятии..."
                  rows={4}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Обложка</label>
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleCoverChange}
                />
                <button
                  type="button"
                  onClick={handleCoverClick}
                  className="w-full border-2 border-dashed border-white/10 rounded-xl p-8 text-center hover:border-primary/50 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {coverImage ? (
                    <img src={coverImage} alt="Превью" className="max-h-48 mx-auto rounded-lg object-cover" />
                  ) : (
                    <>
                      <ImageIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground mb-2">Нажмите для выбора изображения</p>
                      <p className="text-xs text-muted-foreground">PNG, JPG до 2 МБ. Рекомендуется 1920×1080</p>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Date and time */}
          <div className="glow-card rounded-2xl p-6 space-y-6">
            <h2 className="text-xl font-bold tracking-wider flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              ДАТА И ВРЕМЯ
            </h2>

            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Дата *</label>
                <Input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  className="h-12"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Начало *</label>
                <Input
                  type="time"
                  name="startTime"
                  value={formData.startTime}
                  onChange={handleInputChange}
                  className="h-12"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Окончание</label>
                <Input
                  type="time"
                  name="endTime"
                  value={formData.endTime}
                  onChange={handleInputChange}
                  className="h-12"
                />
              </div>
            </div>
          </div>

          {/* Venue */}
          <div className="glow-card rounded-2xl p-6 space-y-6">
            <h2 className="text-xl font-bold tracking-wider flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              МЕСТО ПРОВЕДЕНИЯ
            </h2>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Город *</label>
                <select
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  className="w-full h-12 rounded-lg border border-input bg-background px-3 text-sm"
                >
                  {getCities().map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Название заведения *</label>
                <Input
                  name="venue"
                  value={formData.venue}
                  onChange={handleInputChange}
                  placeholder="Club Inferno"
                  className="h-12"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium mb-2">Адрес</label>
                <Input
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="ул. Ерубаева 45"
                  className="h-12"
                />
              </div>
            </div>
          </div>

          {/* Additional info */}
          <div className="glow-card rounded-2xl p-6 space-y-6">
            <h2 className="text-xl font-bold tracking-wider">ДОПОЛНИТЕЛЬНО</h2>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Дресс-код</label>
                <Input
                  name="dressCode"
                  value={formData.dressCode}
                  onChange={handleInputChange}
                  placeholder="Casual / Smart Casual"
                  className="h-12"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Возрастное ограничение</label>
                <select
                  name="ageRestriction"
                  value={formData.ageRestriction}
                  onChange={handleInputChange}
                  className="w-full h-12 rounded-lg border border-input bg-background px-3 text-sm"
                >
                  <option value="16">16+</option>
                  <option value="18">18+</option>
                  <option value="21">21+</option>
                </select>
              </div>
            </div>
          </div>

          {/* Tickets */}
          <div className="glow-card rounded-2xl p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold tracking-wider flex items-center gap-2">
                <Ticket className="w-5 h-5 text-primary" />
                БИЛЕТЫ
              </h2>
              <Button type="button" variant="outline" size="sm" onClick={addTicketType} className="gap-2">
                <Plus className="w-4 h-4" />
                Добавить тип
              </Button>
            </div>

            <div className="space-y-4">
              {ticketTypes.map((ticket, index) => (
                <div key={ticket.id} className="border border-white/10 rounded-xl p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">Тип {index + 1}</Badge>
                    {ticketTypes.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeTicketType(ticket.id)}
                        className="text-red-500 hover:text-red-400 hover:bg-red-500/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Название *</label>
                      <Input
                        value={ticket.name}
                        onChange={(e) => updateTicketType(ticket.id, 'name', e.target.value)}
                        placeholder="VIP"
                        className="h-10"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Цена (тенге) *</label>
                      <Input
                        type="number"
                        value={ticket.price}
                        onChange={(e) => updateTicketType(ticket.id, 'price', e.target.value)}
                        placeholder="5000"
                        className="h-10"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Количество *</label>
                      <Input
                        type="number"
                        value={ticket.quantity}
                        onChange={(e) => updateTicketType(ticket.id, 'quantity', e.target.value)}
                        placeholder="100"
                        className="h-10"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Описание</label>
                    <Input
                      value={ticket.description}
                      onChange={(e) => updateTicketType(ticket.id, 'description', e.target.value)}
                      placeholder="Вход + welcome drink"
                      className="h-10"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Submit */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              type="submit"
              size="lg"
              className="flex-1"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  Создание...
                </>
              ) : (
                'Создать пати'
              )}
            </Button>
            <Link href="/">
              <Button type="button" variant="outline" size="lg" className="w-full sm:w-auto">
                Отмена
              </Button>
            </Link>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            После создания ваше мероприятие будет отправлено на модерацию.
            Обычно это занимает до 24 часов.
          </p>
        </form>
      </div>
    </div>
  );
}
