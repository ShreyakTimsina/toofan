import type { Product, Order, OrderStatus, Settings, Cart } from './types';

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
];

export const DEFAULT_SETTINGS: Settings = {
  adminPassword: 'toofan@admin',
  adminPhone: '',
  defaultSort: 'default',
  storeName: 'Toofan',
  storeTagline: 'Your favourite drinks & more — delivered fast.',
  currency: 'Rs.',
};

const KEYS = { PRODUCTS: 'toofan_products', ORDERS: 'toofan_orders', SETTINGS: 'toofan_settings', CART: 'toofan_cart' } as const;

export function getProducts(): Product[] {
  try {
    const raw = localStorage.getItem(KEYS.PRODUCTS);
    if (!raw) { localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(SEED_PRODUCTS)); return SEED_PRODUCTS; }
    return JSON.parse(raw) as Product[];
  } catch { return SEED_PRODUCTS; }
}
export function saveProducts(products: Product[]): void {
  localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(products));
}

export function getOrders(): Order[] {
  try { const raw = localStorage.getItem(KEYS.ORDERS); return raw ? JSON.parse(raw) as Order[] : []; }
  catch { return []; }
}
export function saveOrder(order: Order): void {
  const orders = getOrders(); orders.unshift(order);
  localStorage.setItem(KEYS.ORDERS, JSON.stringify(orders));
}
export function updateOrderStatus(orderId: string, status: OrderStatus): void {
  const orders = getOrders();
  const idx = orders.findIndex(o => o.id === orderId);
  if (idx !== -1) { orders[idx].status = status; localStorage.setItem(KEYS.ORDERS, JSON.stringify(orders)); }
}
export function isReturningCustomer(phone: string, excludeId?: string): boolean {
  return getOrders().some(o => o.phone === phone && o.status !== 'cancelled' && o.id !== excludeId);
}

export function getCart(): Cart {
  try { const raw = localStorage.getItem(KEYS.CART); return raw ? JSON.parse(raw) as Cart : {}; }
  catch { return {}; }
}
export function saveCart(cart: Cart): void { localStorage.setItem(KEYS.CART, JSON.stringify(cart)); }
export function clearCart(): void { localStorage.removeItem(KEYS.CART); }

export function getSettings(): Settings {
  try { const raw = localStorage.getItem(KEYS.SETTINGS); return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : { ...DEFAULT_SETTINGS }; }
  catch { return { ...DEFAULT_SETTINGS }; }
}
export function saveSettings(s: Settings): void { localStorage.setItem(KEYS.SETTINGS, JSON.stringify(s)); }

export function generateId(prefix = 'ORD'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
}

export async function notifyAdminSMS(order: Order): Promise<void> {
  console.info('[Toofan] Order notification:', order);
  // TODO: Wire in your SMS API (Fast2SMS / Sparrow / Twilio)
}
