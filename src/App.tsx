import { useState, useCallback, useEffect } from 'react';
import { Order, Settings, DEFAULT_SETTINGS, User } from '@/data/mockData';
import {
  apiGetOrders, apiCreateOrder, apiUpdateOrder, apiDeleteOrder,
  apiGetSettings, apiSaveSettings, apiMe, apiLogout, getToken, clearToken
} from '@/api/client';
import CalendarView from '@/components/CalendarView';
import JournalView from '@/components/JournalView';
import DashboardView from '@/components/DashboardView';
import SettingsView from '@/components/SettingsView';
import UsersView from '@/components/UsersView';
import OrderModal from '@/components/OrderModal';
import OrderForm from '@/components/OrderForm';
import LoginScreen from '@/components/LoginScreen';
import Icon from '@/components/ui/icon';

type Tab = 'calendar' | 'journal' | 'dashboard' | 'settings' | 'users';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  const [tab, setTab] = useState<Tab>('calendar');
  const [orders, setOrders] = useState<Order[]>([]);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editOrder, setEditOrder] = useState<Order | null>(null);
  const [formDate, setFormDate] = useState('');

  // Проверка сессии при старте
  useEffect(() => {
    const token = getToken();
    if (!token) { setAuthChecked(true); return; }
    apiMe()
      .then(({ user: u }) => setUser(u))
      .catch(() => clearToken())
      .finally(() => setAuthChecked(true));
  }, []);

  // Загрузка данных после авторизации
  useEffect(() => {
    if (!user) return;
    setLoading(true);
    Promise.all([apiGetOrders(), apiGetSettings()])
      .then(([ords, sets]) => { setOrders(ords); setSettings(sets); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  const handleRefresh = useCallback(async () => {
    if (syncing) return;
    setSyncing(true);
    try {
      const ords = await apiGetOrders();
      setOrders(ords);
    } catch (e) { console.error(e); }
    finally { setSyncing(false); }
  }, [syncing]);

  const handleLogin = useCallback((u: User) => setUser(u), []);

  const handleLogout = useCallback(async () => {
    await apiLogout();
    setUser(null);
    setOrders([]);
    setTab('calendar');
  }, []);

  const handleCardClick = useCallback((order: Order) => setSelectedOrder(order), []);

  const handleAddOrder = useCallback((date: string) => {
    setFormDate(date);
    setEditOrder(null);
    setShowForm(true);
  }, []);

  const handleEditOrder = useCallback((order: Order) => {
    setEditOrder(order);
    setShowForm(true);
  }, []);

  const handleComplete = useCallback(async (orderId: string, actualVolume: number, total?: number, salary?: number) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    setSyncing(true);
    try {
      const updated = await apiUpdateOrder(orderId, {
        ...order,
        status: 'completed',
        actual_volume_m2: actualVolume,
        ...(total !== undefined && { total_amount: total }),
        ...(salary !== undefined && { crew_salary: salary }),
      });
      setOrders(prev => prev.map(o => o.id === orderId ? updated : o));
      setSelectedOrder(null);
    } catch (e) { console.error(e); }
    finally { setSyncing(false); }
  }, [orders]);

  const handleSaveOrder = useCallback(async (data: Partial<Order>): Promise<boolean> => {
    setSyncing(true);
    try {
      if (editOrder) {
        const updated = await apiUpdateOrder(editOrder.id, data);
        setOrders(prev => prev.map(o => o.id === editOrder.id ? updated : o));
      } else {
        const created = await apiCreateOrder({ ...data, created_by: user?.id || '' });
        setOrders(prev => [created, ...prev]);
      }
      setShowForm(false);
      setEditOrder(null);
      return true;
    } catch (e) {
      console.error(e);
      return false;
    } finally {
      setSyncing(false);
    }
  }, [editOrder, user]);

  const handleReopenOrder = useCallback(async (orderId: string) => {
    setSyncing(true);
    try {
      const updated = await apiUpdateOrder(orderId, { _reopen: true } as never);
      setOrders(prev => prev.map(o => o.id === orderId ? updated : o));
      setSelectedOrder(updated);
    } catch (e) { console.error(e); }
    finally { setSyncing(false); }
  }, []);

  const handleDeleteOrder = useCallback(async (orderId: string) => {
    if (!window.confirm('Удалить заказ? Это действие нельзя отменить.')) return;
    setSyncing(true);
    try {
      await apiDeleteOrder(orderId);
      setOrders(prev => prev.filter(o => o.id !== orderId));
      setSelectedOrder(null);
    } catch (e) { console.error(e); }
    finally { setSyncing(false); }
  }, []);

  const handlePhotosChange = useCallback((orderId: string, photos: string[]) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, photos } : o));
    setSelectedOrder(prev => prev?.id === orderId ? { ...prev, photos } : prev);
  }, []);

  const handleSaveSettings = useCallback(async (s: Settings) => {
    setSettings(s);
    try { await apiSaveSettings(s); } catch (e) { console.error(e); }
  }, []);

  // Пока проверяем сессию
  if (!authChecked) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-neon border-t-transparent animate-spin" />
      </div>
    );
  }

  // Экран входа
  if (!user) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  const role = user.role === 'foreman' ? 'foreman' : 'manager';
  const isAdmin = user.role === 'admin';

  const NAV_ITEMS: { id: Tab; label: string; icon: string }[] = [
    { id: 'calendar', label: 'Календарь', icon: 'CalendarDays' },
    { id: 'journal', label: 'Журнал', icon: 'BookOpen' },
    { id: 'dashboard', label: 'Дашборд', icon: 'BarChart2' },
    { id: 'settings', label: 'Настройки', icon: 'Settings' },
    ...(isAdmin ? [{ id: 'users' as Tab, label: 'Команда', icon: 'Users' }] : []),
  ];

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
            <button
              onClick={handleRefresh}
              disabled={syncing}
              className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors disabled:opacity-40"
              title="Обновить заказы"
            >
              <Icon name="RefreshCw" size={13} className={syncing ? 'animate-spin' : ''} />
            </button>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{user.name}</span>
              <button
                onClick={handleLogout}
                className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                title="Выйти"
              >
                <Icon name="LogOut" size={13} />
              </button>
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
          <CalendarView orders={orders} role={role} onCardClick={handleCardClick} onAddOrder={handleAddOrder} />
        </div>
        <div className={`absolute inset-0 transition-opacity duration-200 ${tab === 'journal' ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
          <JournalView orders={orders} role={role} onOrderClick={handleCardClick} />
        </div>
        <div className={`absolute inset-0 transition-opacity duration-200 ${tab === 'dashboard' ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
          <DashboardView orders={orders} />
        </div>
        <div className={`absolute inset-0 transition-opacity duration-200 ${tab === 'settings' ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
          <SettingsView settings={settings} onSaveSettings={handleSaveSettings} />
        </div>
        {isAdmin && (
          <div className={`absolute inset-0 transition-opacity duration-200 ${tab === 'users' ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
            <UsersView />
          </div>
        )}
      </div>

      {/* FAB */}
      {tab === 'calendar' && role === 'manager' && (
        <button
          onClick={() => handleAddOrder(new Date().toISOString().split('T')[0])}
          className="fixed right-5 bottom-24 z-40 w-14 h-14 rounded-2xl neon-bg shadow-lg hover-scale transition-all flex items-center justify-center"
          style={{ boxShadow: '0 4px 24px rgba(57,232,124,0.35)' }}
        >
          <Icon name="Plus" size={24} className="text-black" />
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
                  <Icon name={item.icon} size={20} />
                </div>
                <span className="text-[10px] font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Order Modal */}
      {selectedOrder && (
        <OrderModal
          order={selectedOrder}
          role={role}
          onClose={() => setSelectedOrder(null)}
          onComplete={handleComplete}
          onEdit={role === 'manager' ? handleEditOrder : undefined}
          onDelete={role === 'manager' ? handleDeleteOrder : undefined}
          onReopen={role === 'manager' ? handleReopenOrder : undefined}
          onPhotosChange={handlePhotosChange}
        />
      )}

      {/* Order Form */}
      {showForm && (
        <OrderForm
          order={editOrder}
          defaultDate={formDate}
          settings={settings}
          onSave={handleSaveOrder}
          onClose={() => { setShowForm(false); setEditOrder(null); }}
        />
      )}
    </div>
  );
}