import { useState, useCallback, useEffect } from 'react';
import { Order, Settings, DEFAULT_SETTINGS } from '@/data/mockData';
import {
  apiGetOrders, apiCreateOrder, apiUpdateOrder, apiDeleteOrder,
  apiGetSettings, apiSaveSettings
} from '@/api/client';
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

export default function App() {
  const [tab, setTab] = useState<Tab>('calendar');
  const [orders, setOrders] = useState<Order[]>([]);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editOrder, setEditOrder] = useState<Order | null>(null);
  const [formDate, setFormDate] = useState('');

  // Загрузка данных при старте
  useEffect(() => {
    Promise.all([apiGetOrders(), apiGetSettings()])
      .then(([ords, sets]) => {
        setOrders(ords);
        setSettings(sets);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Polling каждые 15 сек
  useEffect(() => {
    const interval = setInterval(() => {
      apiGetOrders().then(setOrders).catch(() => {});
    }, 15000);
    return () => clearInterval(interval);
  }, []);

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
        const created = await apiCreateOrder({ ...data, created_by: '' });
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
  }, [editOrder]);

  const handleReopenOrder = useCallback(async (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    setSyncing(true);
    try {
      const updated = await apiUpdateOrder(orderId, {
        status: 'planned',
        date: order.date, customer_name: order.customer_name,
        customer_phone: order.customer_phone, address: order.address,
        planned_volume_m2: order.planned_volume_m2, material: order.material,
        price_per_m2: order.price_per_m2, crew_rate: order.crew_rate,
      });
      setOrders(prev => prev.map(o => o.id === orderId ? updated : o));
      setSelectedOrder(updated);
    } catch (e) { console.error(e); }
    finally { setSyncing(false); }
  }, [orders]);

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
          {syncing && (
            <div className="w-1.5 h-1.5 rounded-full bg-neon animate-pulse" />
          )}
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
          <CalendarView orders={orders} role="manager" onCardClick={handleCardClick} onAddOrder={handleAddOrder} />
        </div>
        <div className={`absolute inset-0 transition-opacity duration-200 ${tab === 'journal' ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
          <JournalView orders={orders} role="manager" onOrderClick={handleCardClick} />
        </div>
        <div className={`absolute inset-0 transition-opacity duration-200 ${tab === 'dashboard' ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
          <DashboardView orders={orders} />
        </div>
        <div className={`absolute inset-0 transition-opacity duration-200 ${tab === 'settings' ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
          <SettingsView settings={settings} onSaveSettings={handleSaveSettings} />
        </div>
      </div>

      {/* FAB */}
      {tab === 'calendar' && (
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
          role="manager"
          onClose={() => setSelectedOrder(null)}
          onComplete={handleComplete}
          onEdit={handleEditOrder}
          onDelete={handleDeleteOrder}
          onReopen={handleReopenOrder}
          onPhotosChange={handlePhotosChange}
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