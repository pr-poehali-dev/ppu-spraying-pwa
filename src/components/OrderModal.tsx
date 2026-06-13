import { useState, useRef } from 'react';
import { Order, formatCurrency, formatDate, MATERIAL_LABELS } from '@/data/mockData';
import { apiUploadPhoto, apiDeletePhoto } from '@/api/client';
import Icon from '@/components/ui/icon';

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

interface OrderModalProps {
  order: Order;
  role: 'manager' | 'foreman';
  onClose: () => void;
  onComplete: (orderId: string, actualVolume: number) => Promise<void> | void;
  onEdit?: (order: Order) => void;
  onDelete?: (orderId: string) => void;
  onReopen?: (orderId: string) => void;
  onPhotosChange?: (orderId: string, photos: string[]) => void;
}

export default function OrderModal({ order, role, onClose, onComplete, onEdit, onDelete, onReopen, onPhotosChange }: OrderModalProps) {
  const [actualVolume, setActualVolume] = useState<string>(
    order.actual_volume_m2?.toString() || order.planned_volume_m2.toString()
  );
  const [photos, setPhotos] = useState<string[]>(order.photos || []);
  const [uploading, setUploading] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const isCompleted = order.status === 'completed';

  const [completing, setCompleting] = useState(false);

  const handleComplete = async () => {
    const vol = parseFloat(actualVolume);
    if (!vol || vol <= 0) return;
    setCompleting(true);
    try {
      await onComplete(order.id, vol);
    } finally {
      setCompleting(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    try {
      for (const file of files) {
        const base64 = await fileToBase64(file);
        const result = await apiUploadPhoto(order.id, base64, file.type);
        setPhotos(result.photos);
        onPhotosChange?.(order.id, result.photos);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeletePhoto = async (url: string) => {
    try {
      const result = await apiDeletePhoto(order.id, url);
      setPhotos(result.photos || []);
      onPhotosChange?.(order.id, result.photos || []);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={onClose}>
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
        <div
          className="relative w-full max-w-lg bg-[#111] rounded-t-3xl animate-slide-up border-t border-white/10 overflow-y-auto"
          style={{ maxHeight: '92dvh' }}
          onClick={(e) => e.stopPropagation()}
          translate="no"
        >
          {/* Header */}
          <div className="sticky top-0 bg-[#111] z-10 px-6 pt-6 pb-3 border-b border-white/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${isCompleted ? 'bg-neon' : 'bg-white/40'}`} />
                <span className={`text-sm font-medium ${isCompleted ? 'neon-text' : 'text-muted-foreground'}`}>
                  {isCompleted ? 'Выполнен' : 'Запланирован'}
                </span>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
              >
                <Icon name="X" size={16} />
              </button>
            </div>
            <h2 className="text-xl font-bold mt-3">{order.customer_name}</h2>
            <p className="text-muted-foreground text-sm">{formatDate(order.date)}</p>
          </div>

          <div className="px-6 py-4 space-y-4">
            {/* Контакты */}
            <div className="space-y-2">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                <Icon name="Phone" size={16} className="text-muted-foreground shrink-0" />
                <a href={`tel:${order.customer_phone}`} className="text-sm hover:neon-text transition-colors">
                  {order.customer_phone}
                </a>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                <Icon name="MapPin" size={16} className="text-muted-foreground shrink-0" />
                <span className="text-sm">{order.address}</span>
              </div>
            </div>

            {/* Данные */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 rounded-xl bg-white/5">
                <div className="text-xs text-muted-foreground mb-1">Материал</div>
                <div className="text-sm font-medium">{MATERIAL_LABELS[order.material]}</div>
              </div>
              <div className="p-3 rounded-xl bg-white/5">
                <div className="text-xs text-muted-foreground mb-1">Цена / м²</div>
                <div className="text-sm font-medium">{order.price_per_m2} ₽</div>
              </div>
              <div className="p-3 rounded-xl bg-white/5">
                <div className="text-xs text-muted-foreground mb-1">Плановый объём</div>
                <div className="text-sm font-medium">{order.planned_volume_m2} м²</div>
              </div>
              <div className="p-3 rounded-xl bg-white/5">
                <div className="text-xs text-muted-foreground mb-1">Факт. объём</div>
                <div className="text-sm font-medium">
                  {order.actual_volume_m2 ? `${order.actual_volume_m2} м²` : '—'}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 rounded-xl bg-white/5">
                <div className="text-xs text-muted-foreground mb-1">Сумма</div>
                <div className="text-sm font-bold neon-text">{formatCurrency(order.total_amount)}</div>
              </div>
              <div className="p-3 rounded-xl bg-white/5">
                <div className="text-xs text-muted-foreground mb-1">Зарплата бригады</div>
                <div className="text-sm font-semibold">{formatCurrency(order.crew_salary)}</div>
              </div>
            </div>

            {/* Описание */}
            {order.description && (
              <div className="p-3 rounded-xl bg-white/5">
                <div className="text-xs text-muted-foreground mb-1">Описание объекта</div>
                <div className="text-sm whitespace-pre-wrap">{order.description}</div>
              </div>
            )}

            {/* Фотографии */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground font-medium">
                  Фото объекта {photos.length > 0 && `(${photos.length})`}
                </span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="flex items-center gap-1.5 text-xs text-neon hover:opacity-80 transition-opacity disabled:opacity-40"
                  >
                    {uploading
                      ? <div className="w-3.5 h-3.5 rounded-full border border-neon border-t-transparent animate-spin" />
                      : <Icon name="Camera" size={14} />
                    }
                    {uploading ? 'Загрузка...' : 'Камера'}
                  </button>
                  <button
                    onClick={() => galleryInputRef.current?.click()}
                    disabled={uploading}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-white transition-colors disabled:opacity-40"
                  >
                    <Icon name="Image" size={14} />
                    Галерея
                  </button>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  multiple
                  className="hidden"
                  onChange={handleFileChange}
                />
                <input
                  ref={galleryInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>

              {photos.length > 0 ? (
                <div className="grid grid-cols-3 gap-1.5">
                  {photos.map((url, i) => (
                    <div key={i} className="relative aspect-square rounded-xl overflow-hidden group">
                      <img
                        src={url}
                        alt={`Фото ${i + 1}`}
                        className="w-full h-full object-cover cursor-pointer"
                        onClick={() => setLightbox(url)}
                      />
                      {role === 'manager' && (
                        <button
                          onClick={() => handleDeletePhoto(url)}
                          className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Icon name="X" size={10} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-6 rounded-xl border border-dashed border-white/10 flex flex-col items-center gap-2 text-muted-foreground hover:border-white/20 hover:text-white/60 transition-colors"
                >
                  <Icon name="Camera" size={22} />
                  <span className="text-xs">Нажмите, чтобы добавить фото объекта</span>
                </button>
              )}
            </div>

            {/* Действия */}
            {!isCompleted && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground block mb-1.5">
                    Фактический объём (м²)
                  </label>
                  <input
                    type="number"
                    value={actualVolume}
                    onChange={(e) => setActualVolume(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-neon transition-colors"
                    placeholder="Введите фактический объём"
                  />
                </div>
                <button
                  onClick={handleComplete}
                  disabled={completing}
                  className="w-full neon-bg rounded-xl py-3.5 text-sm font-bold hover-scale transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {completing
                    ? <><div className="w-4 h-4 rounded-full border-2 border-black/40 border-t-transparent animate-spin" />Сохранение...</>
                    : 'Отметить выполненным'
                  }
                </button>
              </div>
            )}

            {isCompleted && role === 'manager' && onReopen && (
              <button
                onClick={() => onReopen(order.id)}
                className="w-full bg-white/10 rounded-xl py-3.5 text-sm font-medium hover:bg-white/15 transition-colors"
              >
                Вернуть в работу
              </button>
            )}

            {role === 'manager' && onEdit && (
              <button
                onClick={() => { onEdit(order); onClose(); }}
                className="w-full bg-white/10 rounded-xl py-3.5 text-sm font-medium hover:bg-white/15 transition-colors"
              >
                Редактировать
              </button>
            )}

            {role === 'manager' && onDelete && (
              <button
                onClick={() => onDelete(order.id)}
                className="w-full bg-red-500/10 text-red-400 rounded-xl py-3.5 text-sm font-medium hover:bg-red-500/20 transition-colors"
              >
                Удалить заказ
              </button>
            )}

            <div className="h-2" />
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[60] bg-black/95 flex items-center justify-center"
          onClick={() => setLightbox(null)}
        >
          <button
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"
            onClick={() => setLightbox(null)}
          >
            <Icon name="X" size={18} />
          </button>
          <img
            src={lightbox}
            alt="Фото объекта"
            className="max-w-full max-h-full object-contain rounded-xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}