import type { Metadata, Viewport } from 'next';
import './globals.css';

export const viewport: Viewport = {
  themeColor: '#22c55e',
};

export const metadata: Metadata = {
  title: {
    template: '%s | Toofan',
    default: 'Toofan — Order Drinks, Cigarettes & Snacks Online | Nepal',
  },
  description:
    "Toofan is Nepal's go-to spot for ordering premium drinks, cigarettes, and snacks online. Browse Carlsberg, Gorkha Beer, Old Durbar Whisky, masala peanuts and more. Quick delivery, easy ordering — no account needed.",
  keywords: [
    'buy drinks online Nepal', 'order beer Nepal', 'Carlsberg Nepal',
    'Gorkha beer delivery', 'cigarettes online Nepal', 'snacks delivery Kathmandu',
    'Toofan drinks', 'drinks delivery Nepal', 'Old Durbar whisky', 'Tuborg Nepal',
  ],
  authors: [{ name: 'Toofan' }],
  creator: 'Toofan',
  metadataBase: new URL('https://toofan.com.np'),
  alternates: { canonical: 'https://toofan.com.np/' },
  openGraph: {
    type: 'website',
    url: 'https://toofan.com.np/',
    siteName: 'Toofan',
    title: 'Toofan — Order Drinks, Cigarettes & Snacks Online | Nepal',
    description: 'Browse and order premium drinks, cigarettes, and snacks online. Delivered to your door in Nepal.',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Toofan — Drinks & Snacks Delivery Nepal' }],
    locale: 'en_NP',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Toofan — Order Drinks, Cigarettes & Snacks Online',
    description: "Nepal's favourite drinks & snacks delivery. No account needed.",
    images: ['/og-image.png'],
  },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large' } },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        {/* Anti-flicker: set theme before first paint */}
        <script dangerouslySetInnerHTML={{ __html: `(function(){var t=localStorage.getItem('toofan_theme')||'light';document.documentElement.setAttribute('data-theme',t);})();` }} />
        {/* Service Worker Registration */}
        <script dangerouslySetInnerHTML={{ __html: `if('serviceWorker' in navigator) { window.addEventListener('load', function() { navigator.serviceWorker.register('/sw.js').then(function(r) { console.log('SW registered'); }, function(e) { console.log('SW registration failed', e); }); }); }` }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@300;400;500;600;700&display=swap" />
        {/* Structured Data: Local Business */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Store',
          name: 'Toofan',
          description: 'Online store for drinks, cigarettes, and snacks delivery in Nepal.',
          url: 'https://toofan.com.np',
          logo: 'https://toofan.com.np/images/logo.png',
          image: 'https://toofan.com.np/og-image.png',
          address: { '@type': 'PostalAddress', addressLocality: 'Kathmandu', addressCountry: 'NP' },
          openingHoursSpecification: {
            '@type': 'OpeningHoursSpecification',
            dayOfWeek: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'],
            opens: '10:00', closes: '22:00',
          },
          priceRange: 'Rs. 30 – Rs. 1800',
        })}} />
        {/* Structured Data: WebSite */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: 'Toofan',
          url: 'https://toofan.com.np',
          potentialAction: {
            '@type': 'SearchAction',
            target: { '@type': 'EntryPoint', urlTemplate: 'https://toofan.com.np/?search={search_term_string}' },
            'query-input': 'required name=search_term_string',
          },
        })}} />
      </head>
      <body>
        {children}
        <a href="#main-content" style={{
          position:'fixed',top:'8px',left:'8px',zIndex:9999,
          background:'var(--clr-accent)',color:'#fff',padding:'8px 16px',
          borderRadius:'8px',fontWeight:700,opacity:0,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any}>Skip to main content</a>
      </body>
    </html>
  );
}
