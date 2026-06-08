export type Material = 'pena' | 'polimochevina';
export type Status = 'planned' | 'completed';
export type Role = 'admin' | 'manager' | 'foreman';

export interface Order {
  id: string;
  date: string;
  customer_name: string;
  customer_phone: string;
  address: string;
  planned_volume_m2: number;
  actual_volume_m2: number | null;
  material: Material;
  price_per_m2: number;
  total_amount: number;
  crew_rate: number;
  crew_salary: number;
  status: Status;
  created_at: string;
  created_by: string;
  photos: string[];
  description: string;
}

export interface Settings {
  rate_pena: number;
  rate_polimochevina: number;
}

export interface User {
  id: string;
  name: string;
  phone: string;
  role: Role;
}

export const MOCK_USERS: User[] = [
  { id: '1', name: 'Алексей Петров', phone: '+79001234567', role: 'manager' },
  { id: '2', name: 'Иван Смирнов', phone: '+79007654321', role: 'foreman' },
];

const today = new Date();
const fmt = (d: Date) => d.toISOString().split('T')[0];
const addDays = (d: Date, n: number) => { const r = new Date(d); r.setDate(r.getDate() + n); return r; };

export const MOCK_ORDERS: Order[] = [
  {
    id: '1',
    date: fmt(today),
    customer_name: 'Сергей Иванов',
    customer_phone: '+7 (916) 123-45-67',
    address: 'ул. Ленина, 42, кв. 7',
    planned_volume_m2: 120,
    actual_volume_m2: null,
    material: 'pena',
    price_per_m2: 350,
    total_amount: 42000,
    crew_rate: 70,
    crew_salary: 8400,
    status: 'planned',
    created_at: new Date().toISOString(),
    created_by: 'Алексей Петров',
    photos: [],
  },
  {
    id: '2',
    date: fmt(today),
    customer_name: 'Марина Козлова',
    customer_phone: '+7 (903) 987-65-43',
    address: 'пр. Победы, 15',
    planned_volume_m2: 80,
    actual_volume_m2: 85,
    material: 'polimochevina',
    price_per_m2: 600,
    total_amount: 51000,
    crew_rate: 100,
    crew_salary: 8500,
    status: 'completed',
    created_at: new Date().toISOString(),
    created_by: 'Алексей Петров',
    photos: [],
  },
  {
    id: '3',
    date: fmt(addDays(today, 1)),
    customer_name: 'Дмитрий Новиков',
    customer_phone: '+7 (925) 555-12-34',
    address: 'ул. Садовая, 8',
    planned_volume_m2: 200,
    actual_volume_m2: null,
    material: 'pena',
    price_per_m2: 320,
    total_amount: 64000,
    crew_rate: 70,
    crew_salary: 14000,
    status: 'planned',
    created_at: new Date().toISOString(),
    created_by: 'Алексей Петров',
  },
  {
    id: '4',
    date: fmt(addDays(today, -1)),
    customer_name: 'Ольга Федорова',
    customer_phone: '+7 (911) 444-33-22',
    address: 'Московское ш., 100',
    planned_volume_m2: 150,
    actual_volume_m2: 148,
    material: 'polimochevina',
    price_per_m2: 580,
    total_amount: 85840,
    crew_rate: 100,
    crew_salary: 14800,
    status: 'completed',
    created_at: new Date().toISOString(),
    created_by: 'Алексей Петров',
  },
  {
    id: '5',
    date: fmt(addDays(today, 2)),
    customer_name: 'Андрей Белов',
    customer_phone: '+7 (926) 777-88-99',
    address: 'ул. Цветочная, 3',
    planned_volume_m2: 90,
    actual_volume_m2: null,
    material: 'pena',
    price_per_m2: 370,
    total_amount: 33300,
    crew_rate: 70,
    crew_salary: 6300,
    status: 'planned',
    created_at: new Date().toISOString(),
    created_by: 'Алексей Петров',
  },
  {
    id: '6',
    date: fmt(addDays(today, -3)),
    customer_name: 'Наталья Соколова',
    customer_phone: '+7 (905) 321-76-54',
    address: 'пр. Мира, 55, оф. 12',
    planned_volume_m2: 300,
    actual_volume_m2: 310,
    material: 'polimochevina',
    price_per_m2: 620,
    total_amount: 192200,
    crew_rate: 100,
    crew_salary: 31000,
    status: 'completed',
    created_at: new Date().toISOString(),
    created_by: 'Алексей Петров',
  },
];

export const DEFAULT_SETTINGS: Settings = {
  rate_pena: 70,
  rate_polimochevina: 100,
};

export const formatCurrency = (amount: number): string => {
  return amount.toLocaleString('ru-RU') + ' ₽';
};

export const formatDate = (dateStr: string): string => {
  const [y, m, d] = dateStr.split('-');
  return `${d}.${m}.${y}`;
};

export const MATERIAL_LABELS: Record<Material, string> = {
  pena: 'Пена',
  polimochevina: 'Полимочевина',
};

export const STATUS_LABELS: Record<Status, string> = {
  planned: 'Запланирован',
  completed: 'Выполнен',
};