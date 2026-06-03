import { useState, useCallback, useEffect } from 'react';
import { Order, User, Settings, DEFAULT_SETTINGS } from '@/data/mockData';
import {
  apiLogin, apiGetOrders, apiCreateOrder, apiUpdateOrder,
  apiGetSettings, apiSaveSettings
} from '@/api/client';
import LoginScreen from '@/components/LoginScreen';
import CalendarView from '@/components/CalendarView';
import JournalView from '@/components/JournalView';
import DashboardView from '@/components/DashboardView';
import SettingsView from '@/components/SettingsView';
import OrderModal from '@/components/OrderModal';
import OrderForm from '@/components/OrderForm';
import Icon from '@/components/ui/icon';

type Tab = 'calendar' | 'journal' | 'dashboard' | 'settings';

const NAV_ITEMS: { id: Tab; label: string; icon: string }[] = [
  { id: 'calendar', label: 'Календарь', icon: 'CalendarDays' },
  { id: 'journal', label: 'Журнал', icon: 'BookOpen' },
  { id: 'dashboard', label: 'Дашборд', icon: 'BarChart2' },
  { id: 'settings', label: 'Настройки', icon: 'Settings' },
];

const SESSION_KEY = 'ppu_session';

export default function App() {
  const [user, setUser] = useState<User | null>(() => {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); } catch { return null; }
  });
  const [tab, setTab] = useState<Tab>('calendar');
  const [orders, setOrders] = useState<Order[]>([]);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editOrder, setEditOrder] = useState<Order | null>(null);
  const [formDate, setFormDate] = useState('');

  // Загрузка данных после входа
  useEffect(() => {
    if (!user) return;
    setLoading(true);
    Promise.all([apiGetOrders(), apiGetSettings()])
      .then(([ords, sets]) => {
        setOrders(ords);
        setSettings(sets);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  // Polling каждые 15 сек для синхронизации
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      apiGetOrders().then(setOrders).catch(() => {});
    }, 15000);
    return () => clearInterval(interval);
  }, [user]);

  const handleLogin = useCallback(async (phone: string, password: string): Promise<string | null> => {
    try {
      const { user: u } = await apiLogin(phone, password);
      localStorage.setItem(SESSION_KEY, JSON.stringify(u));
      setUser(u);
      return null;
    } catch (e: unknown) {
      return e instanceof Error ? e.message : 'Ошибка входа';
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem(SESSION_KEY);
    setUser(null);
    setOrders([]);
  };

  const handleCardClick = useCallback((order: Order) => {
    setSelectedOrder(order);
  }, []);

  const handleAddOrder = useCallback((date: string) => {
    setFormDate(date);
    setEditOrder(null);
    setShowForm(true);
  }, []);

  const handleEditOrder = useCallback((order: Order) => {
    setEditOrder(order);
    setShowForm(true);
  }, []);

  const handleComplete = useCallback(async (orderId: string, actualVolume: number) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    setSyncing(true);
    try {
      const updated = await apiUpdateOrder(orderId, {
        ...order,
        status: 'completed',
        actual_volume_m2: actualVolume,
      });
      setOrders(prev => prev.map(o => o.id === orderId ? updated : o));
      setSelectedOrder(null);
    } catch (e) { console.error(e); }
    finally { setSyncing(false); }
  }, [orders]);

  const handleSaveOrder = useCallback(async (data: Partial<Order>) => {
    setSyncing(true);
    try {
      if (editOrder) {
        const updated = await apiUpdateOrder(editOrder.id, { ...editOrder, ...data });
        setOrders(prev => prev.map(o => o.id === editOrder.id ? updated : o));
      } else {
        const created = await apiCreateOrder({ ...data, created_by: user?.name || '' });
        setOrders(prev => [created, ...prev]);
      }
      setShowForm(false);
      setEditOrder(null);
    } catch (e) { console.error(e); }
    finally { setSyncing(false); }
  }, [editOrder, user]);

  const handleSaveSettings = useCallback(async (s: Settings) => {
    setSettings(s);
    try { await apiSaveSettings(s); } catch (e) { console.error(e); }
  }, []);

  if (!user) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col font-golos" translate="no">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-white/6">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">🏗️</span>
            <span className="font-black text-base tracking-tight">
              ППУ <span className="neon-text">CRM</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            {syncing && (
              <div className="w-1.5 h-1.5 rounded-full bg-neon animate-pulse" />
            )}
            <div className={`text-xs font-medium px-2.5 py-1 rounded-full ${
              user.role === 'manager'
                ? 'bg-neon/10 text-neon'
                : 'bg-blue-500/10 text-blue-400'
            }`}>
              {user.role === 'manager' ? 'Менеджер' : 'Бригадир'}
            </div>
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-neon border-t-transparent animate-spin" />
            <span className="text-sm text-muted-foreground">Загрузка...</span>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 relative overflow-hidden" style={{ minHeight: 'calc(100vh - 112px)' }}>
        <div className={`absolute inset-0 transition-opacity duration-200 ${tab === 'calendar' ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
          <CalendarView orders={orders} role={user.role} onCardClick={handleCardClick} onAddOrder={handleAddOrder} />
        </div>
        <div className={`absolute inset-0 transition-opacity duration-200 ${tab === 'journal' ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
          <JournalView orders={orders} role={user.role} onOrderClick={handleCardClick} />
        </div>
        <div className={`absolute inset-0 transition-opacity duration-200 ${tab === 'dashboard' ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
          <DashboardView orders={orders} />
        </div>
        <div className={`absolute inset-0 transition-opacity duration-200 ${tab === 'settings' ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
          <SettingsView settings={settings} currentUser={user} onSaveSettings={handleSaveSettings} onLogout={handleLogout} />
        </div>
      </div>

      {/* FAB */}
      {user.role === 'manager' && tab === 'calendar' && (
        <button
          onClick={() => handleAddOrder(new Date().toISOString().split('T')[0])}
          className="fixed right-5 bottom-24 z-40 w-14 h-14 rounded-2xl neon-bg shadow-lg hover-scale transition-all flex items-center justify-center"
          style={{ boxShadow: '0 4px 24px rgba(57,232,124,0.35)' }}
        >
          <Icon name="Plus" size={24} />
        </button>
      )}

      {/* Bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-background/90 backdrop-blur-xl border-t border-white/6">
        <div className="flex items-stretch">
          {NAV_ITEMS.map((item) => {
            const isActive = tab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                className={`flex-1 flex flex-col items-center justify-center py-3 gap-1 transition-all ${
                  isActive ? 'nav-item-active' : 'text-muted-foreground'
                }`}
              >
                <div className={`relative transition-transform duration-200 ${isActive ? 'scale-110' : ''}`}>
                  {isActive && <div className="absolute inset-0 -m-1 rounded-lg bg-neon/10" />}
                  <Icon name={item.icon as Parameters<typeof Icon>[0]['name']} size={20} />
                </div>
                <span className={`text-[10px] font-medium transition-all ${isActive ? 'neon-text' : ''}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
        <div style={{ height: 'env(safe-area-inset-bottom, 0px)' }} />
      </div>

      {/* Modals */}
      {selectedOrder && (
        <OrderModal
          order={selectedOrder}
          role={user.role}
          onClose={() => setSelectedOrder(null)}
          onComplete={handleComplete}
          onEdit={user.role === 'manager' ? handleEditOrder : undefined}
        />
      )}
      {showForm && (
        <OrderForm
          order={editOrder}
          defaultDate={formDate}
          settings={settings}
          onSave={handleSaveOrder}
          onCancel={() => { setShowForm(false); setEditOrder(null); }}
        />
      )}
    </div>
  );
}
