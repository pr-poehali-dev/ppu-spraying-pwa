import { useState } from 'react';
import { Order, formatCurrency, formatDate, MATERIAL_LABELS, STATUS_LABELS } from '@/data/mockData';
import Icon from '@/components/ui/icon';

interface JournalViewProps {
  orders: Order[];
  role: 'manager' | 'foreman';
  onOrderClick: (order: Order) => void;
}

export default function JournalView({ orders, role, onOrderClick }: JournalViewProps) {
  const [statusFilter, setStatusFilter] = useState<'all' | 'planned' | 'completed'>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const filtered = orders.filter(o => {
    if (statusFilter !== 'all' && o.status !== statusFilter) return false;
    if (dateFrom && o.date < dateFrom) return false;
    if (dateTo && o.date > dateTo) return false;
    return true;
  }).sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-5 pb-3 space-y-3">
        <h2 className="text-xl font-bold">Журнал заказов</h2>

        <div className="flex gap-2">
          {(['all', 'planned', 'completed'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all ${
                statusFilter === s
                  ? 'neon-bg'
                  : 'bg-white/5 text-muted-foreground hover:bg-white/10'
              }`}
            >
              {s === 'all' ? 'Все' : s === 'planned' ? 'Запланированные' : 'Выполненные'}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <div className="flex-1 relative">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              placeholder="С"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-neon transition-colors [color-scheme:dark]"
            />
          </div>
          <div className="flex-1 relative">
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              placeholder="По"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-neon transition-colors [color-scheme:dark]"
            />
          </div>
          {(dateFrom || dateTo) && (
            <button
              onClick={() => { setDateFrom(''); setDateTo(''); }}
              className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10"
            >
              <Icon name="X" size={14} />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-24">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
            <Icon name="FileX" size={32} className="mb-3 opacity-40" />
            <span className="text-sm">Нет заказов</span>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((order, i) => (
              <div
                key={order.id}
                onClick={() => onOrderClick(order)}
                className="glass-card rounded-2xl p-4 cursor-pointer hover-scale animate-fade-in"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <div className={`w-2 h-2 rounded-full shrink-0 ${
                        order.status === 'completed' ? 'bg-neon' : 'bg-white/30'
                      }`} />
                      <span className="font-semibold text-sm truncate">{order.customer_name}</span>
                    </div>
                    <div className="text-xs text-muted-foreground pl-4">{formatDate(order.date)}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className={`text-sm font-bold ${order.status === 'completed' ? 'neon-text' : ''}`}>
                      {formatCurrency(order.total_amount)}
                    </div>
                    <div className="text-xs text-muted-foreground">{formatCurrency(order.crew_salary)}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                  <Icon name="MapPin" size={12} />
                  <span className="truncate">{order.address}</span>
                </div>

                {order.description && (
                  <div className="flex items-start gap-2 text-xs text-muted-foreground mb-2">
                    <Icon name="FileText" size={12} className="shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{order.description}</span>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <span className={`text-xs rounded-lg px-2 py-1 ${
                    order.material === 'polimochevina'
                      ? 'bg-purple-500/15 text-purple-300'
                      : 'bg-blue-500/15 text-blue-300'
                  }`}>
                    {MATERIAL_LABELS[order.material]}
                  </span>
                  <span className="text-xs bg-white/5 rounded-lg px-2 py-1">
                    план: {order.planned_volume_m2} м²
                  </span>
                  {order.actual_volume_m2 && (
                    <span className="text-xs bg-neon/10 text-neon rounded-lg px-2 py-1">
                      факт: {order.actual_volume_m2} м²
                    </span>
                  )}
                  <span className={`ml-auto text-xs rounded-lg px-2 py-1 ${
                    order.status === 'completed'
                      ? 'bg-neon/10 text-neon'
                      : 'bg-white/5 text-muted-foreground'
                  }`}>
                    {STATUS_LABELS[order.status]}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}