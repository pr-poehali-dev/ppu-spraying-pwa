import { useState } from 'react';
import { Order } from '@/data/mockData';
import OrderCard from './OrderCard';
import Icon from '@/components/ui/icon';

interface CalendarViewProps {
  orders: Order[];
  role: 'manager' | 'foreman';
  onCardClick: (order: Order) => void;
  onAddOrder: (date: string) => void;
}

const MONTHS = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
const DAYS_SHORT = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

export default function CalendarView({ orders, role, onCardClick, onAddOrder }: CalendarViewProps) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startOffset = (firstDay.getDay() + 6) % 7;

  const cells: (number | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= lastDay.getDate(); d++) cells.push(d);

  const getDateStr = (day: number) => {
    const m = String(month + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return `${year}-${m}-${d}`;
  };

  const getOrdersForDay = (day: number) => {
    const dateStr = getDateStr(day);
    return orders.filter(o => o.date === dateStr);
  };

  const todayStr = now.toISOString().split('T')[0];

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  const weeks: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7).concat(Array(7 - cells.slice(i, i + 7).length).fill(null)));
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-5 pb-3">
        <div className="flex items-center justify-between mb-4">
          <button onClick={prevMonth} className="w-9 h-9 rounded-full bg-white/8 flex items-center justify-center hover:bg-white/15 transition-colors active:scale-95">
            <Icon name="ChevronLeft" size={18} />
          </button>
          <h2 className="text-lg font-bold tracking-wide">
            {MONTHS[month]} <span className="text-muted-foreground font-normal">{year}</span>
          </h2>
          <button onClick={nextMonth} className="w-9 h-9 rounded-full bg-white/8 flex items-center justify-center hover:bg-white/15 transition-colors active:scale-95">
            <Icon name="ChevronRight" size={18} />
          </button>
        </div>

        <div className="grid grid-cols-7 mb-2">
          {DAYS_SHORT.map((d) => (
            <div key={d} className={`text-center text-xs font-medium py-1 ${d === 'Сб' || d === 'Вс' ? 'text-red-400/60' : 'text-muted-foreground'}`}>
              {d}
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-24">
        <div className="grid grid-cols-7 gap-1">
          {weeks.flat().map((day, idx) => {
            if (!day) return <div key={`empty-${idx}`} className="min-h-[60px]" />;

            const dateStr = getDateStr(day);
            const dayOrders = getOrdersForDay(day);
            const isToday = dateStr === todayStr;
            const isWeekend = idx % 7 >= 5;

            return (
              <div
                key={dateStr}
                className={`min-h-[60px] rounded-xl p-1.5 ${
                  isToday ? 'ring-1 ring-neon/50 bg-neon/5' : 'bg-white/[0.02]'
                }`}
              >
                <div className={`text-xs font-semibold mb-1 text-center leading-none ${
                  isToday ? 'neon-text' : isWeekend ? 'text-red-400/60' : 'text-muted-foreground'
                }`}>
                  {day}
                </div>
                <div className="space-y-1">
                  {dayOrders.slice(0, 2).map((order) => (
                    <div
                      key={order.id}
                      onClick={() => onCardClick(order)}
                      className={`rounded-lg px-1.5 py-1 cursor-pointer active:scale-95 transition-transform ${
                        order.status === 'completed' ? 'status-completed' : 'status-planned'
                      }`}
                    >
                      <div className="text-[10px] font-semibold leading-tight truncate">
                        {order.customer_name.split(' ')[0]}
                      </div>
                      <div className="text-[9px] text-muted-foreground truncate">
                        {order.planned_volume_m2}м²
                      </div>
                    </div>
                  ))}
                  {dayOrders.length > 2 && (
                    <div className="text-[9px] text-muted-foreground text-center">
                      +{dayOrders.length - 2}
                    </div>
                  )}
                </div>
                {role === 'manager' && (
                  <button
                    onClick={() => onAddOrder(dateStr)}
                    className="w-full mt-1 rounded-md py-0.5 text-[10px] text-muted-foreground/40 hover:text-neon hover:bg-neon/5 transition-colors"
                  >
                    +
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
