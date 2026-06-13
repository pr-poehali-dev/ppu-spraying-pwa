import { useState } from 'react';
import { Order, Material, Settings, MATERIAL_LABELS } from '@/data/mockData';
import Icon from '@/components/ui/icon';

interface OrderFormProps {
  order?: Order | null;
  defaultDate?: string;
  settings: Settings;
  onSave: (order: Partial<Order>) => Promise<boolean>;
  onCancel: () => void;
}

export default function OrderForm({ order, defaultDate, settings, onSave, onCancel }: OrderFormProps) {
  const today = new Date().toISOString().split('T')[0];

  const [form, setForm] = useState({
    date: order?.date || defaultDate || today,
    customer_name: order?.customer_name || '',
    customer_phone: order?.customer_phone || '+7 (',
    address: order?.address || '',
    planned_volume_m2: order?.planned_volume_m2?.toString() || '',
    material: (order?.material || 'pena') as Material,
    price_per_m2: order?.price_per_m2?.toString() || '',
    description: order?.description || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const crewRate = form.material === 'pena' ? settings.rate_pena : settings.rate_polimochevina;
  const volume = parseFloat(form.planned_volume_m2) || 0;
  const price = parseFloat(form.price_per_m2) || 0;
  const totalAmount = volume * price;
  const crewSalary = volume * crewRate;

  const handlePhoneChange = (val: string) => {
    let digits = val.replace(/\D/g, '');
    if (digits.startsWith('8')) digits = '7' + digits.slice(1);
    if (!digits.startsWith('7')) digits = '7' + digits;
    digits = digits.slice(0, 11);
    let formatted = '+7';
    if (digits.length > 1) formatted += ' (' + digits.slice(1, 4);
    if (digits.length > 4) formatted += ') ' + digits.slice(4, 7);
    if (digits.length > 7) formatted += '-' + digits.slice(7, 9);
    if (digits.length > 9) formatted += '-' + digits.slice(9, 11);
    setForm(f => ({ ...f, customer_phone: formatted }));
  };

  const handleSubmit = async () => {
    setError('');
    setSaving(true);
    try {
      const ok = await onSave({
        date: form.date,
        customer_name: form.customer_name,
        customer_phone: form.customer_phone,
        address: form.address,
        planned_volume_m2: volume,
        material: form.material,
        price_per_m2: price,
        total_amount: totalAmount,
        crew_rate: crewRate,
        crew_salary: crewSalary,
        status: order?.status || 'planned',
        description: form.description,
      });
      if (!ok) {
        setError('Ошибка при сохранении. Попробуйте ещё раз.');
        setSaving(false);
      }
    } catch (e) {
      console.error('[OrderForm] save error:', e);
      setError('Ошибка при сохранении. Попробуйте ещё раз.');
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={onCancel}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-lg bg-[#111] rounded-t-3xl border-t border-white/10 animate-slide-up max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        translate="no"
      >
        <div className="sticky top-0 bg-[#111] border-b border-white/8 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">{order ? 'Редактировать заказ' : 'Новый заказ'}</h2>
          <button
            onClick={onCancel}
            className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <Icon name="X" size={16} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs text-muted-foreground block mb-1.5">Дата</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm(f => ({ ...f, date: e.target.value }))}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-neon transition-colors [color-scheme:dark]"
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground block mb-1.5">ФИО клиента</label>
            <input
              type="text"
              value={form.customer_name}
              onChange={(e) => { setForm(f => ({ ...f, customer_name: e.target.value })); setError(''); }}
              placeholder="Иванов Иван Иванович"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-neon transition-colors"
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground block mb-1.5">Телефон</label>
            <input
              type="tel"
              value={form.customer_phone}
              onChange={(e) => handlePhoneChange(e.target.value)}
              placeholder="+7 (999) 999-99-99"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-neon transition-colors"
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground block mb-1.5">Адрес</label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => { setForm(f => ({ ...f, address: e.target.value })); setError(''); }}
              placeholder="ул. Ленина, 42"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-neon transition-colors"
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground block mb-1.5">Описание объекта</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Тип кровли, особенности объекта, пожелания клиента..."
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-neon transition-colors resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground block mb-1.5">Объём, м²</label>
              <input
                type="number"
                value={form.planned_volume_m2}
                onChange={(e) => { setForm(f => ({ ...f, planned_volume_m2: e.target.value })); setError(''); }}
                placeholder="100"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-neon transition-colors"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1.5">Цена / м², ₽</label>
              <input
                type="number"
                value={form.price_per_m2}
                onChange={(e) => { setForm(f => ({ ...f, price_per_m2: e.target.value })); setError(''); }}
                placeholder="350"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-neon transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground block mb-1.5">Материал</label>
            <div className="grid grid-cols-2 gap-2">
              {(['pena', 'polimochevina'] as Material[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setForm(f => ({ ...f, material: m }))}
                  className={`py-3 rounded-xl text-sm font-medium transition-all ${
                    form.material === m
                      ? 'neon-bg'
                      : 'bg-white/5 border border-white/10 hover:bg-white/10'
                  }`}
                >
                  {MATERIAL_LABELS[m]}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="p-3 rounded-xl bg-white/5">
              <div className="text-xs text-muted-foreground mb-1">Итого</div>
              <div className="text-base font-bold neon-text">
                {totalAmount > 0 ? totalAmount.toLocaleString('ru-RU') + ' ₽' : '—'}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-white/5">
              <div className="text-xs text-muted-foreground mb-1">Зарплата бригады</div>
              <div className="text-base font-semibold">
                {crewSalary > 0 ? crewSalary.toLocaleString('ru-RU') + ' ₽' : '—'}
              </div>
            </div>
          </div>

          {error && (
            <div className="text-xs text-red-400 px-1">{error}</div>
          )}

          <div className="flex gap-3 pt-2 pb-2">
            <button
              onClick={onCancel}
              disabled={saving}
              className="flex-1 bg-white/10 rounded-xl py-3.5 text-sm font-medium hover:bg-white/15 transition-colors disabled:opacity-40"
            >
              Отмена
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="flex-1 neon-bg rounded-xl py-3.5 text-sm font-bold hover-scale transition-all disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {saving
                ? <><div className="w-4 h-4 rounded-full border-2 border-black/40 border-t-transparent animate-spin" /> Сохранение...</>
                : 'Сохранить'
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}