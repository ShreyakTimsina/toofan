import type { Metadata } from 'next';
import AdminPanel from '@/components/admin/AdminPanel';

export const metadata: Metadata = {
  title: 'Admin Panel — Toofan',
  description: 'Toofan admin panel — manage orders, products and settings.',
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return <AdminPanel />;
}
