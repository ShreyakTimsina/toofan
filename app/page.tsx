import type { Metadata } from 'next';
import Storefront from '@/components/storefront/Storefront';

export const metadata: Metadata = {
  title: 'Toofan — Order Drinks, Cigarettes & Snacks Online | Fast Delivery Nepal',
  description: "Toofan is Nepal's go-to spot for ordering premium drinks, cigarettes, and snacks online. Browse Carlsberg, Gorkha Beer, Old Durbar Whisky, masala peanuts and more. Quick delivery — no account needed.",
  alternates: { canonical: 'https://toofan.com.np/' },
};

export default function HomePage() {
  return <Storefront />;
}
