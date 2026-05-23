export type Category = 'drinks' | 'cigarettes' | 'snacks';
export type SortMode = 'default' | 'popularity' | 'price-asc' | 'price-desc';
export type OrderStatus = 'pending' | 'confirmed' | 'delivered' | 'cancelled';

export interface Product {
  id: string;
  name: string;
  category: Category;
  description: string;
  price: number;
  image: string;
  orderCount: number;
  active: boolean;
  displayOrder: number;
}

export interface OrderItem {
  productId: string;
  name: string;
  qty: number;
  price: number;
}

export interface Order {
  id: string;
  timestamp: string;
  name: string;
  phone: string;
  address: string;
  remarks: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
}

export type Cart = Record<string, number>; // productId → quantity

export interface Settings {
  adminPassword: string;
  adminPhone: string;
  defaultSort: SortMode;
  storeName: string;
  storeTagline: string;
  currency: string;
}

export const CATEGORY_LABELS: Record<Category, string> = {
  drinks: 'Drinks',
  cigarettes: 'Cigarettes',
  snacks: 'Snacks',
};
