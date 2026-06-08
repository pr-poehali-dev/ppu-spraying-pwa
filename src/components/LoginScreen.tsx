import { useState } from 'react';
import { apiLogin, setToken } from '@/api/client';
import { User } from '@/data/mockData';
import Icon from '@/components/ui/icon';

interface LoginScreenProps {
  onLogin: (user: User) => void;
}

export default function LoginScreen({ onLogin }: LoginScreenProps) {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
    setPhone(formatted);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !password) return;
    setError('');
    setLoading(true);
    try {
      const { user, token } = await apiLogin(phone, password);
      setToken(token);
      onLogin(user);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Ошибка входа');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 relative overflow-hidden" translate="no">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full bg-neon/5 blur-[80px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-48 h-48 rounded-full bg-blue-500/5 blur-[60px] pointer-events-none" />

      <div className="w-full max-w-sm animate-fade-in">
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-neon/20 to-neon/5 border border-neon/20 flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🏗️</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight">ППУ <span className="neon-text">CRM</span></h1>
          <p className="text-muted-foreground text-sm mt-1">Управление заказами на напыление</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground block mb-1.5">Номер телефона</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => handlePhoneChange(e.target.value)}
              placeholder="+7 (999) 999-99-99"
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 text-sm focus:outline-none focus:border-neon transition-colors"
              autoComplete="tel"
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground block mb-1.5">Пароль</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                placeholder="••••••"
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 pr-12 py-3.5 text-sm focus:outline-none focus:border-neon transition-colors"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition-colors"
              >
                <Icon name={showPassword ? 'EyeOff' : 'Eye'} size={16} />
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 animate-fade-in">
              <Icon name="AlertCircle" size={14} className="text-red-400 shrink-0" />
              <p className="text-xs text-red-400">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !phone || !password}
            className="w-full neon-bg rounded-2xl py-4 text-sm font-bold mt-2 hover-scale transition-all disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading
              ? <><div className="w-4 h-4 rounded-full border-2 border-black/40 border-t-transparent animate-spin" />Вход...</>
              : 'Войти'
            }
          </button>
        </form>
      </div>
    </div>
  );
}
