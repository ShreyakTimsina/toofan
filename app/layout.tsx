import type { Metadata, Viewport } from 'next';
import './globals.css';

export const viewport: Viewport = {
  themeColor: '#22c55e',
};

export const metadata: Metadata = {
  title: {
    template: '%s | Toofan Alcohol',
    default: 'Toofan — Free Online Alcohol Delivery in Nepal',
  },
  description:
    "Free online alcohol delivery in Nepal at MRP rates. Toofan Alcohol is your go-to spot for ordering premium drinks, liquor, beer, cigarettes, and snacks online. Fast delivery, no account needed.",
  keywords: [
    'free online alcohol delivery', 'toofan alcohol', 'buy alcohol online Nepal',
    'liquor delivery Kathmandu', 'order beer Nepal', 'cigarettes online Nepal',
    'drinks delivery Nepal', 'Toofan delivery', 'MRP rate alcohol Nepal',
  ],
  authors: [{ name: 'Toofan' }],
  creator: 'Toofan',
  metadataBase: new URL('https://toofan.com.np'),
  alternates: { canonical: 'https://toofan.com.np/' },
  openGraph: {
    type: 'website',
    url: 'https://toofan.com.np/',
    siteName: 'Toofan Alcohol',
    title: 'Toofan — Free Online Alcohol Delivery',
    description: 'Free online alcohol delivery in Nepal at MRP rates. Order premium drinks, cigarettes, and snacks directly to your door.',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Toofan — Free Online Alcohol Delivery' }],
    locale: 'en_NP',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Toofan — Free Online Alcohol Delivery',
    description: "Free online alcohol delivery in Nepal at MRP rates. Fast, reliable, no account needed.",
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
          name: 'Toofan Alcohol',
          description: 'Free online alcohol delivery in Nepal at MRP rates. Buy drinks, liquor, cigarettes, and snacks online.',
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
      <body suppressHydrationWarning>
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
