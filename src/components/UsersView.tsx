import { useState, useEffect } from 'react';
import { apiListUsers, apiCreateUser, apiUpdateUser } from '@/api/client';
import Icon from '@/components/ui/icon';

type UserRecord = {
  id: string;
  name: string;
  phone: string;
  role: string;
  is_active: boolean;
  created_at: string;
};

const ROLE_LABELS: Record<string, string> = {
  admin: 'Администратор',
  manager: 'Менеджер',
  foreman: 'Бригадир',
};

const ROLE_COLORS: Record<string, string> = {
  admin: 'text-yellow-400',
  manager: 'neon-text',
  foreman: 'text-blue-400',
};

interface UserFormData {
  name: string;
  phone: string;
  password: string;
  role: string;
  is_active: boolean;
}

const EMPTY_FORM: UserFormData = { name: '', phone: '', password: '', role: 'foreman', is_active: true };

export default function UsersView() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editUser, setEditUser] = useState<UserRecord | null>(null);
  const [form, setForm] = useState<UserFormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const { users: list } = await apiListUsers();
      setUsers(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditUser(null);
    setForm(EMPTY_FORM);
    setError('');
    setShowForm(true);
  };

  const openEdit = (u: UserRecord) => {
    setEditUser(u);
    setForm({ name: u.name, phone: u.phone, password: '', role: u.role, is_active: u.is_active });
    setError('');
    setShowForm(true);
  };

  const handlePhoneChange = (val: string) => {
    let digits = val.replace(/\D/g, '');
    if (digits.startsWith('8')) digits = '7' + digits.slice(1);
    if (!digits.startsWith('7') && digits.length > 0) digits = '7' + digits;
    digits = digits.slice(0, 11);
    let formatted = '+7';
    if (digits.length > 1) formatted += ' (' + digits.slice(1, 4);
    if (digits.length > 4) formatted += ') ' + digits.slice(4, 7);
    if (digits.length > 7) formatted += '-' + digits.slice(7, 9);
    if (digits.length > 9) formatted += '-' + digits.slice(9, 11);
    setForm(f => ({ ...f, phone: formatted }));
  };

  const handleSave = async () => {
    setError('');
    if (!form.name || !form.phone) { setError('Заполните имя и телефон'); return; }
    if (!editUser && !form.password) { setError('Введите пароль'); return; }
    setSaving(true);
    try {
      if (editUser) {
        const { user } = await apiUpdateUser({ id: editUser.id, ...form });
        setUsers(prev => prev.map(u => u.id === editUser.id ? { ...u, ...user, is_active: form.is_active } : u));
      } else {
        await apiCreateUser({ name: form.name, phone: form.phone, password: form.password, role: form.role });
        await load();
      }
      setShowForm(false);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-neon border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3" translate="no">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-bold">Пользователи</h2>
        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 px-3 py-2 neon-bg rounded-xl text-xs font-bold hover-scale transition-all"
        >
          <Icon name="UserPlus" size={14} className="text-black" />
          <span className="text-black">Добавить</span>
        </button>
      </div>

      <div className="space-y-2">
        {users.map(u => (
          <div
            key={u.id}
            onClick={() => openEdit(u)}
            className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between cursor-pointer hover:bg-white/8 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold ${u.is_active ? 'bg-white/10' : 'bg-white/5 opacity-50'}`}>
                {u.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className={`text-sm font-medium ${!u.is_active && 'opacity-50'}`}>{u.name}</div>
                <div className="text-xs text-muted-foreground">{u.phone}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!u.is_active && <span className="text-xs text-muted-foreground">Откл.</span>}
              <span className={`text-xs font-medium ${ROLE_COLORS[u.role] || 'text-muted-foreground'}`}>
                {ROLE_LABELS[u.role] || u.role}
              </span>
              <Icon name="ChevronRight" size={14} className="text-muted-foreground" />
            </div>
          </div>
        ))}
      </div>

      {/* Форма */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={() => setShowForm(false)}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-lg bg-[#111] rounded-t-3xl border-t border-white/10 overflow-y-auto animate-slide-up"
            style={{ maxHeight: '90dvh' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-[#111] z-10 px-6 pt-6 pb-3 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-lg font-bold">{editUser ? 'Редактировать' : 'Новый пользователь'}</h3>
              <button onClick={() => setShowForm(false)} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                <Icon name="X" size={16} />
              </button>
            </div>

            <div className="px-6 py-4 space-y-3">
              <div>
                <label className="text-xs text-muted-foreground block mb-1.5">Имя</label>
                <input
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Иван Иванов"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-neon transition-colors"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1.5">Телефон</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={e => handlePhoneChange(e.target.value)}
                  placeholder="+7 (999) 999-99-99"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-neon transition-colors"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1.5">
                  {editUser ? 'Новый пароль (оставьте пустым, чтобы не менять)' : 'Пароль'}
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="••••••"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-neon transition-colors"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1.5">Роль</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['foreman', 'manager', 'admin'] as const).map(r => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, role: r }))}
                      className={`py-2.5 rounded-xl text-xs font-medium transition-colors ${form.role === r ? 'neon-bg text-black' : 'bg-white/5 text-muted-foreground hover:bg-white/10'}`}
                    >
                      {ROLE_LABELS[r]}
                    </button>
                  ))}
                </div>
              </div>
              {editUser && (
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                  <span className="text-sm">Активен</span>
                  <button
                    onClick={() => setForm(f => ({ ...f, is_active: !f.is_active }))}
                    className={`w-11 h-6 rounded-full transition-colors ${form.is_active ? 'bg-neon' : 'bg-white/20'}`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white mx-0.5 transition-transform ${form.is_active ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                  <Icon name="AlertCircle" size={14} className="text-red-400 shrink-0" />
                  <p className="text-xs text-red-400">{error}</p>
                </div>
              )}

              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full neon-bg rounded-xl py-3.5 text-sm font-bold hover-scale transition-all disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {saving
                  ? <><div className="w-4 h-4 rounded-full border-2 border-black/40 border-t-transparent animate-spin" />Сохранение...</>
                  : 'Сохранить'
                }
              </button>
              <div className="h-2" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
