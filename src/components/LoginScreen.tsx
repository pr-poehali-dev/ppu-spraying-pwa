import { useState } from 'react';
import { MOCK_USERS, User } from '@/data/mockData';

interface LoginScreenProps {
  onLogin: (user: User) => void;
}

export default function LoginScreen({ onLogin }: LoginScreenProps) {
  const [phone, setPhone] = useState('+7 (');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

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
    setPhone(formatted);
  };

  const handleLogin = () => {
    const cleanPhone = phone.replace(/\D/g, '');
    const user = MOCK_USERS.find(u => u.phone.replace(/\D/g, '') === cleanPhone);
    if (!user) { setError('Пользователь не найден'); return; }
    if (password !== '1234') { setError('Неверный пароль'); return; }
    onLogin(user);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-background relative overflow-hidden" translate="no">
      {/* Background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full bg-neon/5 blur-[80px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-48 h-48 rounded-full bg-blue-500/5 blur-[60px] pointer-events-none" />

      <div className="w-full max-w-sm animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-neon/20 to-neon/5 border border-neon/20 flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🏗️</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight">ППУ <span className="neon-text">CRM</span></h1>
          <p className="text-muted-foreground text-sm mt-1">Управление заказами на напыление</p>
        </div>

        {/* Form */}
        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground block mb-1.5">Номер телефона</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => handlePhoneChange(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 text-sm focus:outline-none focus:border-neon transition-colors"
              placeholder="+7 (999) 999-99-99"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1.5">Пароль</label>
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 text-sm focus:outline-none focus:border-neon transition-colors"
              placeholder="••••••"
            />
          </div>

          {error && (
            <div className="text-xs text-red-400 px-1 animate-fade-in">{error}</div>
          )}

          <button
            onClick={handleLogin}
            className="w-full neon-bg rounded-2xl py-4 text-sm font-bold mt-2 hover-scale transition-all"
          >
            Войти
          </button>
        </div>

        {/* Demo hints */}
        <div className="mt-6 p-4 rounded-2xl bg-white/3 border border-white/6">
          <p className="text-xs text-muted-foreground mb-2 font-medium">Демо-аккаунты (пароль: 1234):</p>
          <div className="space-y-1.5">
            {MOCK_USERS.map(u => (
              <button
                key={u.id}
                onClick={() => { setPhone(u.phone); setPassword('1234'); setError(''); }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-white/5 transition-colors text-left"
              >
                <span className="text-xs text-foreground">{u.name}</span>
                <span className={`text-xs font-medium ${u.role === 'manager' ? 'neon-text' : 'text-blue-400'}`}>
                  {u.role === 'manager' ? 'Менеджер' : 'Бригадир'}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}