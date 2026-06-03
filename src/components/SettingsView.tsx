import { useState } from 'react';
import { Settings, User } from '@/data/mockData';
import Icon from '@/components/ui/icon';

interface SettingsViewProps {
  settings: Settings;
  currentUser: User;
  onSaveSettings: (s: Settings) => void;
  onLogout: () => void;
}

export default function SettingsView({ settings, currentUser, onSaveSettings, onLogout }: SettingsViewProps) {
  const [ratePena, setRatePena] = useState(settings.rate_pena.toString());
  const [ratePoli, setRatePoli] = useState(settings.rate_polimochevina.toString());
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    onSaveSettings({
      rate_pena: parseFloat(ratePena) || 70,
      rate_polimochevina: parseFloat(ratePoli) || 100,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto pb-24">
      <div className="px-4 pt-5 pb-4">
        <h2 className="text-xl font-bold mb-1">Настройки</h2>
        <p className="text-muted-foreground text-sm">Управление тарифами</p>
      </div>

      {/* User card */}
      <div className="px-4 mb-5">
        <div className="glass-card rounded-2xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-neon/30 to-neon/10 flex items-center justify-center shrink-0">
            <span className="text-lg font-bold neon-text">
              {currentUser.name.split(' ').map(n => n[0]).slice(0,2).join('')}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold truncate">{currentUser.name}</div>
            <div className="text-xs text-muted-foreground">{currentUser.phone}</div>
            <div className={`text-xs mt-0.5 font-medium ${currentUser.role === 'manager' ? 'neon-text' : 'text-blue-400'}`}>
              {currentUser.role === 'manager' ? 'Менеджер' : 'Бригадир'}
            </div>
          </div>
        </div>
      </div>

      {/* Rates */}
      <div className="px-4 mb-5">
        <div className="flex items-center gap-2 mb-3">
          <Icon name="Wrench" size={16} className="text-muted-foreground" />
          <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Ставки бригады</span>
        </div>

        <div className="glass-card rounded-2xl p-4 space-y-4">
          <div>
            <label className="text-xs text-muted-foreground block mb-1.5">
              Ставка — Пена (₽/м²)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                value={ratePena}
                onChange={(e) => setRatePena(e.target.value)}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-neon transition-colors"
              />
              <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center shrink-0">
                <Icon name="Droplets" size={18} className="text-blue-300" />
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground block mb-1.5">
              Ставка — Полимочевина (₽/м²)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                value={ratePoli}
                onChange={(e) => setRatePoli(e.target.value)}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-neon transition-colors"
              />
              <div className="w-10 h-10 rounded-xl bg-purple-500/15 flex items-center justify-center shrink-0">
                <Icon name="Layers" size={18} className="text-purple-300" />
              </div>
            </div>
          </div>

          <div className="pt-1">
            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground mb-3 p-3 rounded-xl bg-white/3">
              <div>Формула зарплаты:</div>
              <div className="text-right font-mono">объём × ставка</div>
              <div>Применяется к:</div>
              <div className="text-right">новым заказам</div>
            </div>

            <button
              onClick={handleSave}
              className={`w-full rounded-xl py-3.5 text-sm font-bold transition-all hover-scale ${
                saved ? 'bg-neon/20 text-neon border border-neon/40' : 'neon-bg'
              }`}
            >
              {saved ? '✓ Сохранено' : 'Сохранить тарифы'}
            </button>
          </div>
        </div>
      </div>

      {/* App info */}
      <div className="px-4 mb-5">
        <div className="flex items-center gap-2 mb-3">
          <Icon name="Info" size={16} className="text-muted-foreground" />
          <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">О приложении</span>
        </div>
        <div className="glass-card rounded-2xl p-4 space-y-2">
          {[
            { label: 'Версия', value: '1.0.0' },
            { label: 'Режим', value: 'PWA' },
          ].map(item => (
            <div key={item.label} className="flex items-center justify-between py-1">
              <span className="text-sm text-muted-foreground">{item.label}</span>
              <span className="text-sm font-medium">{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Logout */}
      <div className="px-4">
        <button
          onClick={onLogout}
          className="w-full glass-card rounded-2xl py-3.5 text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors flex items-center justify-center gap-2"
        >
          <Icon name="LogOut" size={16} />
          Выйти из аккаунта
        </button>
      </div>
    </div>
  );
}
