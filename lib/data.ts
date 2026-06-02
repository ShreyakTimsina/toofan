import type { Product, Order, Cart, Settings, SortMode } from './types';

// ─── Seed Data ─────────────────────────────────────────────
export const SEED_PRODUCTS: Product[] = [
  { id: 'p001', name: 'Carlsberg Beer',      category: 'drinks',     description: 'Classic Danish lager. Crisp, smooth, refreshing.',                    price: 550,  image: '/images/carlsberg.png',  orderCount: 142, active: true, displayOrder: 1  },
  { id: 'p002', name: 'Tuborg Strong',       category: 'drinks',     description: 'Bold, full-bodied strong lager with rich malt character.',             price: 500,  image: '/images/tuborg.png',     orderCount: 98,  active: true, displayOrder: 2  },
  { id: 'p003', name: 'Gorkha Beer',         category: 'drinks',     description: "Nepal's original premium lager — clean & golden.",                    price: 480,  image: '/images/gorkha.png',     orderCount: 210, active: true, displayOrder: 3  },
  { id: 'p004', name: 'Old Durbar Whisky',   category: 'drinks',     description: 'Premium Nepali blended whisky. Smooth finish, warm notes.',            price: 1800, image: '/images/old_durbar.png', orderCount: 67,  active: true, displayOrder: 4  },
  { id: 'p005', name: '8848 Vodka',          category: 'drinks',     description: 'Nepal crafted vodka. Clean, pure, triple-distilled.',                  price: 1500, image: '/images/8848_vodka.png', orderCount: 55,  active: true, displayOrder: 5  },
  { id: 'p006', name: 'Coca-Cola 500ml',     category: 'drinks',     description: 'Ice-cold Coke. The classic chaser.',                                   price: 80,   image: '/images/cola.png',       orderCount: 330, active: true, displayOrder: 6  },
  { id: 'p007', name: 'Sprite 500ml',        category: 'drinks',     description: 'Lemon-lime sparkle. Perfect mixer or standalone refresher.',           price: 80,   image: '/images/sprite.png',     orderCount: 280, active: true, displayOrder: 7  },
  { id: 'p008', name: 'Red Bull Energy',     category: 'drinks',     description: 'Wings when you need them. Original energy drink, 250ml.',              price: 220,  image: '/images/redbull.png',    orderCount: 190, active: true, displayOrder: 8  },
  { id: 'p009', name: 'Surya Classic',       category: 'cigarettes', description: "Nepal's best-selling cigarette. Mild, smooth draw.",                  price: 250,  image: '/images/surya.png',      orderCount: 415, active: true, displayOrder: 9  },
  { id: 'p010', name: 'Shikhar Filter',      category: 'cigarettes', description: 'Light filter cigarettes — easy and consistent.',                       price: 230,  image: '/images/shikhar.png',    orderCount: 360, active: true, displayOrder: 10 },
  { id: 'p011', name: 'Marlboro Red',        category: 'cigarettes', description: 'Full-flavour international blend. Bold & rich.',                       price: 600,  image: '/images/marlboro.png',   orderCount: 85,  active: true, displayOrder: 11 },
  { id: 'p012', name: 'Masala Peanuts',      category: 'snacks',     description: 'Spicy roasted peanuts — the perfect drinking companion.',              price: 120,  image: '/images/peanuts.png',    orderCount: 520, active: true, displayOrder: 12 },
  { id: 'p013', name: 'Wai Wai Noodles',    category: 'snacks',     description: 'Crunchy dry noodles or quick soup — iconic Nepali snack.',             price: 30,   image: '/images/waiwai.png',     orderCount: 450, active: true, displayOrder: 13 },
  { id: 'p014', name: 'Kurkure Masala',      category: 'snacks',     description: 'Crispy corn puffs with bold masala heat.',                             price: 60,   image: '/images/kurkure.png',    orderCount: 310, active: true, displayOrder: 14 },
  { id: 'p015', name: 'Chips Combo (2pcs)',  category: 'snacks',     description: 'Two packs of assorted potato chips. Great for groups.',                price: 100,  image: '/images/chips.png',      orderCount: 175, active: true, displayOrder: 15 },
  { id: 'p016', name: 'Hokkah Coil',         category: 'hokkah',     description: 'Premium quick-light hokkah charcoal coil.',                            price: 250,  image: '/images/placeholder.png', orderCount: 0,   active: true, displayOrder: 16 },
  { id: 'p017', name: 'Hokkah Flavour',      category: 'hokkah',     description: 'Double Apple premium hokkah flavour pack.',                            price: 450,  image: '/images/placeholder.png', orderCount: 0,   active: true, displayOrder: 17 },
  { id: 'p018', name: 'Hokkah Mint Flavour', category: 'hokkah',     description: 'Refreshing mint premium hokkah flavour pack.',                         price: 450,  image: '/images/placeholder.png', orderCount: 0,   active: true, displayOrder: 18 },
  { id: 'p019', name: 'Hokkah Foil',         category: 'hokkah',     description: 'Pre-cut aluminium foil for hokkah bowls.',                             price: 150,  image: '/images/placeholder.png', orderCount: 0,   active: true, displayOrder: 19 },
  { id: 'p020', name: 'Hokkah Mouthpiece',   category: 'hokkah',     description: 'Disposable plastic mouthpieces (pack of 10).',                         price: 100,  image: '/images/placeholder.png', orderCount: 0,   active: true, displayOrder: 20 },
];

export const DEFAULT_SETTINGS: Settings = {
  adminPassword: 'toofan@admin',
  adminPhone: '',
  defaultSort: 'default',
  storeName: 'Toofan',
  storeTagline: 'Your favourite drinks & more — delivered fast.',
  currency: 'Rs.',
  whatsappNumber: '1234567890',
  phoneNumber: '1234567890',
  categories: [
    { id: 'drinks', name: 'Drinks', icon: '🍺' },
    { id: 'cigarettes', name: 'Cigarettes', icon: '🚬' },
    { id: 'snacks', name: 'Snacks', icon: '🍿' },
    { id: 'hokkah', name: 'Hokkah', icon: '💨' }
  ]
};

const KEYS = { SETTINGS: 'toofan_settings', CART: 'toofan_cart' } as const;

// ─── Cart (stays client-side) ──────────────────────────────
export function getCart(): Cart {
  try { const raw = localStorage.getItem(KEYS.CART); return raw ? JSON.parse(raw) as Cart : {}; }
  catch { return {}; }
}
export function saveCart(cart: Cart): void { localStorage.setItem(KEYS.CART, JSON.stringify(cart)); }
export function clearCart(): void { localStorage.removeItem(KEYS.CART); }

// ─── Settings (API-backed) ───────────────────────────────
export async function fetchSettingsAPI(): Promise<Settings> {
  try {
    const res = await fetch('/api/settings');
    if (!res.ok) throw new Error('Failed to fetch settings');
    const data = await res.json();
    return { ...DEFAULT_SETTINGS, ...data };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export async function saveSettingsAPI(s: Partial<Settings>): Promise<Settings> {
  const res = await fetch('/api/settings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(s),
  });
  if (!res.ok) throw new Error('Failed to save settings');
  return res.json();
}

// ─── Legacy localStorage helpers (for admin auth, settings) ─
export function isReturningCustomer(phone: string, orders: import('./types').Order[], excludeId?: string): boolean {
  return orders.some(o => o.phone === phone && o.status !== 'cancelled' && o.id !== excludeId);
}

export function generateId(prefix = 'ORD'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
}

// ─── API-backed data functions ─────────────────────────────

export async function fetchProducts(): Promise<Product[]> {
  try {
    const res = await fetch('/api/products');
    if (!res.ok) throw new Error('Failed to fetch products');
    const data = await res.json();
    return data as Product[];
  } catch {
    // Fallback to seed data if API unavailable
    return SEED_PRODUCTS;
  }
}

export async function fetchOrders(): Promise<import('./types').Order[]> {
  try {
    const res = await fetch('/api/orders');
    if (!res.ok) throw new Error('Failed to fetch orders');
    return await res.json();
  } catch { return []; }
}

export async function submitOrder(order: import('./types').Order): Promise<void> {
  const res = await fetch('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(order),
  });
  if (!res.ok) throw new Error('Failed to submit order');
}

export async function updateOrderStatusAPI(orderId: string, status: import('./types').OrderStatus): Promise<void> {
  const res = await fetch(`/api/orders/${orderId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error('Failed to update order status');
}

export async function softDeleteOrderAPI(orderId: string, isDeleted: boolean): Promise<void> {
  const res = await fetch(`/api/orders/${orderId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ isDeleted }),
  });
  if (!res.ok) throw new Error('Failed to soft delete order');
}

export async function permanentlyDeleteOrderAPI(orderId: string): Promise<void> {
  const res = await fetch(`/api/orders/${orderId}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to permanently delete order');
}

export async function saveProductAPI(product: Partial<Product> & { id?: string }): Promise<Product> {
  if (product.id) {
    // Update existing
    const res = await fetch(`/api/products/${product.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product),
    });
    if (!res.ok) throw new Error('Failed to update product');
    return res.json();
  } else {
    // Create new
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product),
    });
    if (!res.ok) throw new Error('Failed to create product');
    return res.json();
  }
}

export async function deleteProductAPI(id: string): Promise<void> {
  const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete product');
}

export async function sendOtpAPI(username: string): Promise<void> {
  const res = await fetch('/api/auth/send-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: username })
  });
  if (!res.ok) throw new Error('User not found');
}

export async function verifyOtpAPI(username: string, otp: string): Promise<import('./types').AdminUser> {
  const res = await fetch('/api/auth/verify-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: username, otp })
  });
  if (!res.ok) throw new Error('Invalid OTP');
  const data = await res.json();
  return data.user;
}

export async function fetchUsersAPI(): Promise<import('./types').AdminUser[]> {
  const res = await fetch('/api/users', { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch users');
  const data = await res.json();
  return data.users || [];
}

export async function saveUserAPI(user: Partial<import('./types').AdminUser>): Promise<import('./types').AdminUser> {
  const res = await fetch('/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(user)
  });
  if (!res.ok) throw new Error('Failed to save user');
  const data = await res.json();
  return data.user;
}

export async function deleteUserAPI(id: string): Promise<void> {
  const res = await fetch(`/api/users?id=${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete user');
}

export async function reorderProductsAPI(products: Product[]): Promise<void> {
  const res = await fetch('/api/products', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(products),
  });
  if (!res.ok) throw new Error('Failed to reorder products');
}

export async function notifyAdminSMS(order: import('./types').Order): Promise<void> {
  console.info('[Toofan] Order notification:', order);
  // TODO: Wire in your SMS API (Fast2SMS / Sparrow / Twilio)
}

// ─── Kept for backwards compat (used in some admin auth checks) ──
export function getProductsSync(): Product[] { return SEED_PRODUCTS; }
