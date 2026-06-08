import { useState } from 'react';
import { Order, formatCurrency } from '@/data/mockData';
import Icon from '@/components/ui/icon';

interface DashboardViewProps {
  orders: Order[];
}

export default function DashboardView({ orders }: DashboardViewProps) {
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [weekOffset, setWeekOffset] = useState(0);

  const MONTHS_RU = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
  const MONTHS_RU_GEN = ['Января','Февраля','Марта','Апреля','Мая','Июня','Июля','Августа','Сентября','Октября','Ноября','Декабря'];

  const prevMonth = () => {
    if (selectedMonth === 0) { setSelectedMonth(11); setSelectedYear(y => y - 1); }
    else setSelectedMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (selectedMonth === 11) { setSelectedMonth(0); setSelectedYear(y => y + 1); }
    else setSelectedMonth(m => m + 1);
  };
  const isCurrentMonth = selectedYear === now.getFullYear() && selectedMonth === now.getMonth();

  const getWeekBounds = (offset: number) => {
    const d = new Date(now);
    const day = (d.getDay() + 6) % 7;
    const mon = new Date(d); mon.setDate(d.getDate() - day + offset * 7); mon.setHours(0,0,0,0);
    const sun = new Date(mon); sun.setDate(mon.getDate() + 6); sun.setHours(23,59,59,999);
    return { from: mon.toISOString().split('T')[0], to: sun.toISOString().split('T')[0], mon, sun };
  };

  const getMonthBounds = (year: number, month: number) => {
    const from = `${year}-${String(month+1).padStart(2,'0')}-01`;
    const lastDay = new Date(year, month+1, 0).getDate();
    const to = `${year}-${String(month+1).padStart(2,'0')}-${String(lastDay).padStart(2,'0')}`;
    return { from, to };
  };

  const weekBounds = getWeekBounds(weekOffset);
  const monthB = getMonthBounds(selectedYear, selectedMonth);

  const completedOrders = orders.filter(o => o.status === 'completed');

  const weekOrders = completedOrders.filter(o => o.date >= weekBounds.from && o.date <= weekBounds.to);
  const monthOrders = completedOrders.filter(o => o.date >= monthB.from && o.date <= monthB.to);

  const weekRevenue = weekOrders.reduce((s, o) => s + o.total_amount, 0);
  const weekSalary = weekOrders.reduce((s, o) => s + o.crew_salary, 0);
  const monthRevenue = monthOrders.reduce((s, o) => s + o.total_amount, 0);
  const monthSalary = monthOrders.reduce((s, o) => s + o.crew_salary, 0);

  const totalPlanned = orders.filter(o => o.status === 'planned').length;
  const totalCompleted = completedOrders.length;
  const totalVolume = completedOrders.reduce((s, o) => s + (o.actual_volume_m2 || o.planned_volume_m2), 0);

  const monthLabel = `${MONTHS_RU_GEN[selectedMonth]} ${selectedYear}`;

  const fmtShort = (d: Date) => `${d.getDate()} ${MONTHS_RU[d.getMonth()].slice(0,3).toLowerCase()}`;
  const weekLabel = `${fmtShort(weekBounds.mon)} — ${fmtShort(weekBounds.sun)}`;

  return (
    <div className="flex flex-col h-full overflow-y-auto pb-24">
      <div className="px-4 pt-5 pb-4">
        <h2 className="text-xl font-bold mb-1">Дашборд</h2>
        <p className="text-muted-foreground text-sm">Финансовые показатели</p>
      </div>

      {/* Stats row */}
      <div className="px-4 mb-5">
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Выполнено', value: totalCompleted, icon: 'CheckCircle' },
            { label: 'В плане', value: totalPlanned, icon: 'Clock' },
            { label: 'Объём, м²', value: totalVolume, icon: 'Layers' },
          ].map((s) => (
            <div key={s.label} className="glass-card rounded-2xl p-3 text-center">
              <Icon name={s.icon as Parameters<typeof Icon>[0]['name']} size={18} className="neon-text mx-auto mb-1.5" />
              <div className="text-lg font-bold">{s.value}</div>
              <div className="text-[10px] text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* This week */}
      <div className="px-4 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Icon name="Calendar" size={16} className="text-muted-foreground" />
          <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            {weekOffset === 0 ? 'Эта неделя' : 'Неделя'}
          </span>
          <div className="ml-auto flex items-center gap-1">
            <button onClick={() => setWeekOffset(o => o - 1)} className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
              <Icon name="ChevronLeft" size={14} />
            </button>
            <span className="text-xs font-medium min-w-[110px] text-center">{weekLabel}</span>
            <button onClick={() => setWeekOffset(o => o + 1)} disabled={weekOffset >= 0} className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors disabled:opacity-30">
              <Icon name="ChevronRight" size={14} />
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="glass-card rounded-2xl p-4 animate-fade-in">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-neon/15 flex items-center justify-center">
                <Icon name="TrendingUp" size={14} className="neon-text" />
              </div>
              <span className="text-xs text-muted-foreground">Выручка</span>
            </div>
            <div className="text-xl font-black neon-text neon-glow-text leading-none">
              {weekRevenue > 0 ? weekRevenue.toLocaleString('ru-RU') : '0'}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">₽</div>
          </div>
          <div className="glass-card rounded-2xl p-4 animate-fade-in" style={{animationDelay:'60ms'}}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-white/8 flex items-center justify-center">
                <Icon name="Users" size={14} className="text-foreground" />
              </div>
              <span className="text-xs text-muted-foreground">Бригада</span>
            </div>
            <div className="text-xl font-black leading-none">
              {weekSalary > 0 ? weekSalary.toLocaleString('ru-RU') : '0'}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">₽</div>
          </div>
        </div>
        {weekOrders.length > 0 && (
          <div className="mt-2 p-3 rounded-xl bg-white/3 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Заказов выполнено</span>
            <span className="text-xs font-semibold">{weekOrders.length}</span>
          </div>
        )}
      </div>

      {/* This month */}
      <div className="px-4 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Icon name="BarChart2" size={16} className="text-muted-foreground" />
          <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Месяц</span>
          <div className="ml-auto flex items-center gap-1">
            <button onClick={prevMonth} className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
              <Icon name="ChevronLeft" size={14} />
            </button>
            <span className="text-xs font-medium min-w-[110px] text-center">{monthLabel}</span>
            <button onClick={nextMonth} disabled={isCurrentMonth} className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors disabled:opacity-30">
              <Icon name="ChevronRight" size={14} />
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="glass-card rounded-2xl p-4 animate-fade-in" style={{animationDelay:'120ms'}}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-neon/15 flex items-center justify-center">
                <Icon name="TrendingUp" size={14} className="neon-text" />
              </div>
              <span className="text-xs text-muted-foreground">Выручка</span>
            </div>
            <div className="text-xl font-black neon-text neon-glow-text leading-none">
              {monthRevenue > 0 ? monthRevenue.toLocaleString('ru-RU') : '0'}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">₽</div>
          </div>
          <div className="glass-card rounded-2xl p-4 animate-fade-in" style={{animationDelay:'180ms'}}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-white/8 flex items-center justify-center">
                <Icon name="Users" size={14} className="text-foreground" />
              </div>
              <span className="text-xs text-muted-foreground">Бригада</span>
            </div>
            <div className="text-xl font-black leading-none">
              {monthSalary > 0 ? monthSalary.toLocaleString('ru-RU') : '0'}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">₽</div>
          </div>
        </div>
        {monthOrders.length > 0 && (
          <div className="mt-2 p-3 rounded-xl bg-white/3 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Заказов выполнено</span>
            <span className="text-xs font-semibold">{monthOrders.length}</span>
          </div>
        )}
      </div>

      {/* Profit indicator */}
      {monthRevenue > 0 && (
        <div className="px-4">
          <div className="glass-card rounded-2xl p-4 animate-fade-in" style={{animationDelay:'240ms'}}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold">Маржа (месяц)</span>
              <span className="text-xs text-muted-foreground">выручка − бригада</span>
            </div>
            <div className="text-2xl font-black neon-text">
              {formatCurrency(monthRevenue - monthSalary)}
            </div>
            <div className="mt-3 h-2 rounded-full bg-white/8 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-neon/60 to-neon transition-all duration-700"
                style={{ width: `${Math.min(100, ((monthRevenue - monthSalary) / monthRevenue) * 100)}%` }}
              />
            </div>
            <div className="text-xs text-muted-foreground mt-1.5">
              {monthRevenue > 0 ? Math.round(((monthRevenue - monthSalary) / monthRevenue) * 100) : 0}% от выручки
            </div>
          </div>
        </div>
      )}
    </div>
  );
}