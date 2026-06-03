import { useState } from 'react';
import { Order, formatCurrency, formatDate, MATERIAL_LABELS } from '@/data/mockData';
import Icon from '@/components/ui/icon';

interface OrderModalProps {
  order: Order;
  role: 'manager' | 'foreman';
  onClose: () => void;
  onComplete: (orderId: string, actualVolume: number) => void;
  onEdit?: (order: Order) => void;
}

export default function OrderModal({ order, role, onClose, onComplete, onEdit }: OrderModalProps) {
  const [actualVolume, setActualVolume] = useState<string>(
    order.actual_volume_m2?.toString() || order.planned_volume_m2.toString()
  );
  const isCompleted = order.status === 'completed';

  const handleComplete = () => {
    const vol = parseFloat(actualVolume);
    if (vol > 0) {
      onComplete(order.id, vol);
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-lg bg-[#111] rounded-t-3xl p-6 animate-slide-up border-t border-white/10" translate="no"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
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

        <h2 className="text-xl font-bold mb-1">{order.customer_name}</h2>
        <p className="text-muted-foreground text-sm mb-4">{formatDate(order.date)}</p>

        <div className="space-y-3 mb-5">
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
        </div>

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
              className="w-full neon-bg rounded-xl py-3.5 text-sm font-bold hover-scale transition-all"
            >
              Отметить выполненным
            </button>
          </div>
        )}

        {isCompleted && role === 'manager' && onEdit && (
          <button
            onClick={() => { onEdit(order); onClose(); }}
            className="w-full bg-white/10 rounded-xl py-3.5 text-sm font-medium hover:bg-white/15 transition-colors"
          >
            Редактировать
          </button>
        )}
      </div>
    </div>
  );
}