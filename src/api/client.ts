import { Order, Settings, User } from '@/data/mockData';

const URLS = {
  auth: 'https://functions.poehali.dev/08f9c7c4-f54a-488e-abb7-2a86f17e7c4a',
  settings: 'https://functions.poehali.dev/6dba5a64-4b75-431a-977b-e28bab6b26e1',
  orders: 'https://functions.poehali.dev/d82df73f-0c29-4c7d-96ed-0c54bc2f8b9d',
  uploadPhoto: 'https://functions.poehali.dev/4e40e4f1-0d92-4dbb-895f-d2125d427edc',
};

const TOKEN_KEY = 'auth_token';

export function getToken(): string {
  return localStorage.getItem(TOKEN_KEY) || '';
}
export function setToken(t: string) {
  localStorage.setItem(TOKEN_KEY, t);
}
export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function req<T>(url: string, options?: RequestInit): Promise<T> {
  const token = getToken();
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'X-Auth-Token': token } : {}),
    },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Ошибка запроса');
  return data as T;
}

// AUTH
export async function apiLogin(phone: string, password: string): Promise<{ user: User; token: string }> {
  return req(URLS.auth, {
    method: 'POST',
    body: JSON.stringify({ action: 'login', phone, password }),
  });
}

export async function apiMe(): Promise<{ user: User }> {
  return req(URLS.auth);
}

export async function apiLogout(): Promise<void> {
  await req(URLS.auth, {
    method: 'POST',
    body: JSON.stringify({ action: 'logout' }),
  });
  clearToken();
}

export async function apiListUsers(): Promise<{ users: (User & { is_active: boolean; created_at: string })[] }> {
  return req(URLS.auth, {
    method: 'POST',
    body: JSON.stringify({ action: 'list_users' }),
  });
}

export async function apiCreateUser(data: { name: string; phone: string; password: string; role: string }): Promise<{ user: User }> {
  return req(URLS.auth, {
    method: 'POST',
    body: JSON.stringify({ action: 'create_user', ...data }),
  });
}

export async function apiUpdateUser(data: { id: string; name: string; phone: string; role: string; is_active: boolean; password?: string }): Promise<{ user: User }> {
  return req(URLS.auth, {
    method: 'POST',
    body: JSON.stringify({ action: 'update_user', ...data }),
  });
}

// ORDERS
export interface Customer {
  customer_name: string;
  customer_phone: string;
  address: string;
}

export async function apiGetCustomers(): Promise<Customer[]> {
  return req<Customer[]>(`${URLS.orders}/customers`);
}

export async function apiGetOrders(): Promise<Order[]> {
  return req<Order[]>(URLS.orders);
}

export async function apiCreateOrder(order: Partial<Order>): Promise<Order> {
  return req<Order>(URLS.orders, {
    method: 'POST',
    body: JSON.stringify(order),
  });
}

export async function apiUpdateOrder(id: string, data: Partial<Order>): Promise<Order> {
  return req<Order>(URLS.orders, {
    method: 'POST',
    body: JSON.stringify({ _method: 'PUT', id, ...data }),
  });
}

export async function apiDeleteOrder(id: string): Promise<void> {
  return req(URLS.orders, {
    method: 'POST',
    body: JSON.stringify({ _method: 'DELETE', id }),
  });
}

// PHOTOS
export async function apiUploadPhoto(orderId: string, base64: string, contentType: string): Promise<{ url: string; photos: string[] }> {
  return req(URLS.uploadPhoto, {
    method: 'POST',
    body: JSON.stringify({ order_id: orderId, image: base64, content_type: contentType }),
  });
}

export async function apiDeletePhoto(orderId: string, url: string): Promise<{ photos: string[] }> {
  return req(URLS.uploadPhoto, {
    method: 'DELETE',
    body: JSON.stringify({ order_id: orderId, url }),
  });
}

// SETTINGS
export async function apiGetSettings(): Promise<Settings> {
  return req<Settings>(URLS.settings);
}

export async function apiSaveSettings(settings: Settings): Promise<Settings> {
  return req<Settings>(URLS.settings, {
    method: 'POST',
    body: JSON.stringify(settings),
  });
}