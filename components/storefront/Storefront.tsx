'use client';
import { useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import type { Product, Cart, SortMode, Category, DeliveryCoords } from '@/lib/types';
import { CATEGORY_LABELS } from '@/lib/types';
import {
  getCart, saveCart, clearCart,
  fetchProducts, submitOrder, notifyAdminSMS,
  generateId, getSettings,
} from '@/lib/data';

// Map picker loaded client-only (Leaflet requires browser APIs)
const MapAddressPicker = dynamic(
  () => import('./MapAddressPicker'),
  { ssr: false, loading: () => (
    <div style={{height:'280px',background:'var(--clr-bg-3)',borderRadius:'12px',display:'flex',alignItems:'center',justifyContent:'center',color:'var(--clr-text-3)',fontSize:'13px'}}>
      Loading map…
    </div>
  )}
);

export default function Storefront() {
  const [products, setProducts]         = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [cart, setCart]                 = useState<Cart>({});
  const [category, setCategory]         = useState<Category | 'all'>('all');
  const [sortMode, setSortMode]         = useState<SortMode>('default');
  const [query, setQuery]               = useState('');
  const [cartOpen, setCartOpen]         = useState(false);
  const [modalOpen, setModalOpen]       = useState(false);
  const [orderDone, setOrderDone]       = useState(false);
  const [lastOrderId, setLastOrderId]   = useState('');
  const [toasts, setToasts]             = useState<string[]>([]);
  const [faqOpen, setFaqOpen]           = useState<number | null>(null);
  const [theme, setTheme]               = useState<'dark' | 'light'>('light');

  // Form
  const [name, setName]         = useState('');
  const [phone, setPhone]       = useState('');
  const [address, setAddress]   = useState('');
  const [deliveryCoords, setDeliveryCoords] = useState<DeliveryCoords | null>(null);
  const [remarks, setRemarks]   = useState('');
  const [errors, setErrors]     = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // Hydrate
  useEffect(() => {
    // Theme
    const saved = (localStorage.getItem('toofan_theme') as 'dark' | 'light') || 'light';
    setTheme(saved);
    document.documentElement.setAttribute('data-theme', saved);

    // Cart
    setCart(getCart());
    setSortMode(getSettings().defaultSort);

    // Products from MongoDB
    fetchProducts().then(prods => {
      setProducts(prods.filter(p => p.active !== false));
      setProductsLoading(false);
    });
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('toofan_theme', next);
  };

  // Persist cart
  useEffect(() => { saveCart(cart); }, [cart]);

  const addToast = (msg: string) => {
    setToasts(t => [...t, msg]);
    setTimeout(() => setToasts(t => t.slice(1)), 3000);
  };

  /* ── Map callback ── */
  const handleMapChange = useCallback((coords: DeliveryCoords | null, addr: string) => {
    setDeliveryCoords(coords);
    setAddress(addr);
    if (errors.address) setErrors(prev => ({ ...prev, address: '' }));
  }, [errors.address]);

  /* ── Filtering & Sorting ── */
  const filtered = (() => {
    let r = products.filter(p => category === 'all' || p.category === category);
    if (query) {
      const q = query.toLowerCase();
      r = r.filter(p => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
    }
    switch (sortMode) {
      case 'popularity': r = [...r].sort((a,b) => (b.orderCount||0) - (a.orderCount||0)); break;
      case 'price-asc':  r = [...r].sort((a,b) => a.price - b.price); break;
      case 'price-desc': r = [...r].sort((a,b) => b.price - a.price); break;
      default:           r = [...r].sort((a,b) => (a.displayOrder||99) - (b.displayOrder||99));
    }
    return r;
  })();

  /* ── Cart ── */
  const changeQty = useCallback((id: string, delta: number) => {
    setCart(prev => {
      const next = { ...prev };
      const cur = next[id] || 0;
      if (cur + delta <= 0) delete next[id];
      else next[id] = cur + delta;
      return next;
    });
  }, []);

  const totalQty = Object.values(cart).reduce((s,q) => s+q, 0);
  const totalAmt = Object.entries(cart).reduce((s,[id,q]) => {
    const p = products.find(x => x.id === id);
    return s + (p ? p.price*q : 0);
  }, 0);
  const currency = getSettings().currency;

  /* ── Order Submit ── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string,string> = {};
    if (!name.trim())                          errs.name    = 'Full name is required.';
    if (!phone.trim())                         errs.phone   = 'Phone number is required.';
    else if (!/^[0-9]{10}$/.test(phone))       errs.phone   = 'Enter a valid 10-digit number.';
    if (!address.trim())                       errs.address = 'Please pin or type your delivery address.';
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setSubmitting(true);
    try {
      const items = Object.entries(cart).map(([id,qty]) => {
        const p = products.find(x => x.id === id);
        return { productId: id, name: p?.name || id, qty, price: p?.price || 0 };
      });
      const order = {
        id: generateId('ORD'), timestamp: new Date().toISOString(),
        name: name.trim(), phone, address: address.trim(),
        ...(deliveryCoords ? { deliveryCoords } : {}),
        remarks: remarks.trim(),
        items, total: totalAmt, status: 'pending' as const,
      };
      await submitOrder(order);
      await notifyAdminSMS(order);
      clearCart();
      setCart({});
      setLastOrderId(order.id);
      setOrderDone(true);
    } catch {
      addToast('Failed to place order. Please try again.');
    }
    setSubmitting(false);
  };

  const openModal  = () => { setCartOpen(false); setModalOpen(true); setOrderDone(false); setErrors({}); setAddress(''); setDeliveryCoords(null); };
  const closeModal = () => { setModalOpen(false); };

  const faqs = [
    { q: 'How do I place an order?', a: 'Browse the product catalogue, add items using the + button on each card, then click Place Order. Fill in your name, phone, and pin your delivery location on the map — done!' },
    { q: 'Do I need to create an account?', a: "No account required. Just provide your name, phone, and delivery location at checkout." },
    { q: 'How do I pay?', a: 'Payment is through cash on delivery or manual bank transfer. First-time customers may be asked for a small advance.' },
    { q: 'What drinks do you carry?', a: 'Carlsberg, Tuborg Strong, Gorkha Beer, Old Durbar Whisky, 8848 Vodka, Coca-Cola, Sprite, Red Bull and more!' },
    { q: 'Do you sell cigarettes and snacks too?', a: 'Yes! Surya Classic, Shikhar Filter, Marlboro Red, masala peanuts, Wai Wai noodles, Kurkure, and chips combos.' },
  ];

  // Skeleton cards while loading
  const skeletonCards = Array.from({ length: 6 }, (_, i) => (
    <div key={i} className="product-card" style={{ minHeight: '280px' }}>
      <div className="skeleton" style={{ height: '190px', borderRadius: '0' }} />
      <div className="card-body" style={{ gap: '8px' }}>
        <div className="skeleton" style={{ height: '20px', width: '70%' }} />
        <div className="skeleton" style={{ height: '14px', width: '90%' }} />
        <div className="skeleton" style={{ height: '14px', width: '60%' }} />
      </div>
    </div>
  ));

  return (
    <>
      {/* ── HEADER ── */}
      <header className="site-header" role="banner">
        <a href="/" className="header-logo" aria-label="Toofan — Home">
          <div className="logo-mark" aria-hidden="true">🌪</div>
          <span>Toof<span className="logo-accent">an</span></span>
        </a>
        <nav className="header-nav" aria-label="Primary navigation" style={{display:'flex',alignItems:'center',gap:'10px'}}>
          <button
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
          >
            <svg className="icon-sun" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <circle cx="12" cy="12" r="5"/>
              <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
              <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
            </svg>
            <svg className="icon-moon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>
          </button>
          <button className="btn-cart" onClick={() => setCartOpen(true)} aria-label={`Open shopping cart, ${totalQty} items`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
            <span>Cart{totalQty > 0 ? ` (${totalQty})` : ''}</span>
            {totalQty > 0 && <span className="cart-count-badge" aria-hidden="true">{totalQty}</span>}
          </button>
        </nav>
      </header>

      <main id="main-content">
        {/* ── HERO ── */}
        <section className="hero" aria-labelledby="hero-heading">
          <div className="hero-eyebrow"><span aria-hidden="true">🌪</span> Nepal&apos;s favourite drinks spot</div>
          <h1 id="hero-heading">Your <span className="accent">Favourite</span><br/>Drinks &amp; More</h1>
          <p className="hero-sub">Premium beers, whiskies, cigarettes, and munchies — all in one place. Browse, pick what you love, and get it delivered.</p>
          <div className="hero-stats" aria-label="Toofan by the numbers">
            <div className="hero-stat"><span className="stat-num">15+</span><span className="stat-lbl">Products</span></div>
            <div className="hero-divider" aria-hidden="true"/>
            <div className="hero-stat"><span className="stat-num">3</span><span className="stat-lbl">Categories</span></div>
            <div className="hero-divider" aria-hidden="true"/>
            <div className="hero-stat"><span className="stat-num">Fast</span><span className="stat-lbl">Delivery</span></div>
            <div className="hero-divider" aria-hidden="true"/>
            <div className="hero-stat"><span className="stat-num">No</span><span className="stat-lbl">Account Needed</span></div>
          </div>
        </section>

        {/* ── TOOLBAR ── */}
        <section className="toolbar" aria-label="Filter and sort products">
          <div className="search-wrap" role="search">
            <svg className="search-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <label htmlFor="search-input" className="sr-only">Search products</label>
            <input id="search-input" type="search" className="search-input" placeholder="Search drinks, snacks…" value={query} onChange={e => setQuery(e.target.value)} autoComplete="off"/>
          </div>
          <div className="filter-chips" role="group" aria-label="Filter by category">
            {(['all', 'drinks', 'cigarettes', 'snacks'] as const).map(cat => (
              <button key={cat} className={`chip${category === cat ? ' active' : ''}`}
                onClick={() => setCategory(cat)} aria-pressed={category === cat}>
                {cat === 'all' ? 'All' : cat === 'drinks' ? '🍺 Drinks' : cat === 'cigarettes' ? '🚬 Cigarettes' : '🍿 Snacks'}
              </button>
            ))}
          </div>
          <label htmlFor="sort-select" className="sr-only">Sort products</label>
          <select id="sort-select" className="sort-select" value={sortMode} onChange={e => setSortMode(e.target.value as SortMode)}>
            <option value="default">Default Order</option>
            <option value="popularity">Most Popular</option>
            <option value="price-asc">Price: Low → High</option>
            <option value="price-desc">Price: High → Low</option>
          </select>
          <span className="result-count" aria-live="polite">{filtered.length} product{filtered.length !== 1 ? 's' : ''}</span>
        </section>

        {/* ── PRODUCTS ── */}
        <section className="section-main" id="products" aria-labelledby="products-heading">
          <h2 id="products-heading" className="sr-only">Product Listing</h2>
          <div className="products-grid" role="list" aria-label="Product catalogue">
            {productsLoading ? skeletonCards : filtered.length === 0 ? (
              <div className="empty-state"><div className="empty-icon">🔍</div><p>No products found.</p></div>
            ) : filtered.map(product => {
              const qty = cart[product.id] || 0;
              return (
                <article key={product.id} className={`product-card${qty > 0 ? ' in-cart' : ''}`} role="listitem" aria-label={product.name}>
                  <div className="card-img-wrap">
                    <Image src={product.image} alt={`${product.name} — ${CATEGORY_LABELS[product.category]} from Toofan`} fill style={{objectFit:'contain',padding:'16px'}} loading="lazy" onError={() => {}}/>
                    <span className={`badge badge--${product.category} card-category-badge`}>{CATEGORY_LABELS[product.category]}</span>
                  </div>
                  <div className="card-body">
                    <h2 className="card-name">{product.name}</h2>
                    <p className="card-desc">{product.description}</p>
                  </div>
                  <div className="card-footer">
                    <div className="card-price"><span className="card-price-unit">{currency}</span>{product.price.toLocaleString()}</div>
                    {qty > 0 ? (
                      <div className="qty-ctrl">
                        <button className="qty-btn" onClick={() => changeQty(product.id, -1)} aria-label={`Remove one ${product.name}`}>−</button>
                        <span className="qty-num" aria-live="polite">{qty}</span>
                        <button className="qty-btn" onClick={() => changeQty(product.id, 1)} aria-label={`Add another ${product.name}`}>+</button>
                      </div>
                    ) : (
                      <button className="add-btn" onClick={() => { changeQty(product.id, 1); addToast(`${product.name} added to cart`); }} aria-label={`Add ${product.name} to cart`}>+</button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* ── WHY TOOFAN ── */}
        <section className="why-section" aria-labelledby="why-heading">
          <div className="section-header">
            <span className="section-eyebrow">Why Toofan?</span>
            <h2 className="section-title" id="why-heading">The Easiest Way to Order<br/>Drinks in Nepal</h2>
            <p className="section-sub">No signups, no hassle. Just browse, pick, and enjoy.</p>
          </div>
          <div className="features-grid" role="list">
            {[
              { icon: '⚡', cls: '1', title: 'Lightning-Fast Ordering', desc: 'Add items directly from the listing — just tap + and you\'re done. No digging through product pages.' },
              { icon: '📍', cls: '2', title: 'Smart Map Delivery', desc: 'Pin your exact delivery location on the map, use GPS, or type your address. We\'ll find you wherever you are.' },
              { icon: '🛒', cls: '3', title: 'Wide Selection', desc: 'Carlsberg, Gorkha Beer, Old Durbar Whisky, Surya cigarettes, masala peanuts, Wai Wai and more — all in one place.' },
              { icon: '📞', cls: '4', title: 'Direct & Personal', desc: 'Every order is handled personally. We confirm over the phone and ensure everything reaches you as requested.' },
            ].map(f => (
              <article key={f.title} className="feature-card" role="listitem">
                <div className={`feature-icon feature-icon--${f.cls}`} aria-hidden="true">{f.icon}</div>
                <h3 className="feature-title">{f.title}</h3>
                <p className="feature-desc">{f.desc}</p>
              </article>
            ))}
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="faq-section" aria-labelledby="faq-heading">
          <div className="section-header">
            <span className="section-eyebrow">FAQ</span>
            <h2 className="section-title" id="faq-heading">Frequently Asked Questions</h2>
          </div>
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
            '@context': 'https://schema.org', '@type': 'FAQPage',
            mainEntity: faqs.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
          })}}/>
          <div className="faq-list">
            {faqs.map((faq, i) => (
              <div key={i} className="faq-item">
                <button className="faq-question" onClick={() => setFaqOpen(faqOpen === i ? null : i)} aria-expanded={faqOpen === i}>
                  {faq.q}
                  <span className="faq-chevron" style={{transform: faqOpen === i ? 'rotate(180deg)' : 'none'}}>⌄</span>
                </button>
                <div className={`faq-answer${faqOpen === i ? ' open' : ''}`}>
                  <p>{faq.a}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* ── FOOTER ── */}
      <footer className="site-footer" role="contentinfo">
        <div className="footer-logo">Toof<span className="logo-accent">an</span></div>
        <p className="footer-tagline">Your favourite drinks &amp; more — delivered fast.</p>
        <nav className="footer-links" aria-label="Footer links">
          <a href="#products">Products</a>
          <a href="#why-heading">Why Toofan</a>
          <a href="#faq-heading">FAQ</a>
          <a href="/admin">Admin Panel</a>
        </nav>
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} Toofan. All rights reserved. | Serving Kathmandu, Nepal.</p>
          <p className="footer-disclaimer">🔞 Alcohol and tobacco products are for adults (21+) only. Please drink responsibly.</p>
        </div>
      </footer>

      {/* ── CART SIDEBAR ── */}
      <div className={`cart-overlay${cartOpen ? ' open' : ''}`} onClick={() => setCartOpen(false)} aria-hidden="true"/>
      <aside className={`cart-sidebar${cartOpen ? ' open' : ''}`} role="complementary" aria-label="Shopping cart" aria-hidden={!cartOpen}>
        <div className="cart-header">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
          <h2>Your Cart</h2>
          <button className="cart-close" onClick={() => setCartOpen(false)} aria-label="Close cart">✕</button>
        </div>
        {totalQty === 0 ? (
          <div className="cart-empty"><div className="cart-empty-icon" aria-hidden="true">🛒</div><p>Your cart is empty.<br/>Add something tasty!</p></div>
        ) : (
          <div className="cart-items" role="list">
            {Object.entries(cart).map(([id, qty]) => {
              const p = products.find(x => x.id === id);
              if (!p) return null;
              return (
                <div key={id} className="cart-item" role="listitem">
                  <div className="cart-item-img">
                    <Image src={p.image} alt={p.name} fill style={{objectFit:'contain',padding:'6px'}} loading="lazy"/>
                  </div>
                  <div className="cart-item-info">
                    <div className="cart-item-name">{p.name}</div>
                    <div className="cart-item-price">{currency}{(p.price * qty).toLocaleString()} (×{qty})</div>
                  </div>
                  <div className="qty-ctrl">
                    <button className="qty-btn" onClick={() => changeQty(id, -1)} aria-label={`Remove one ${p.name}`}>−</button>
                    <span className="qty-num">{qty}</span>
                    <button className="qty-btn" onClick={() => changeQty(id, 1)} aria-label={`Add one ${p.name}`}>+</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <div className="cart-footer">
          <div className="cart-total-row">
            <span className="cart-total-label">Total</span>
            <span className="cart-total-amount">{currency}{totalAmt.toLocaleString()}</span>
          </div>
          <button className="btn-primary" onClick={openModal} disabled={totalQty === 0}>Place Order →</button>
          <button className="btn-secondary" onClick={() => { setCart({}); addToast('Cart cleared 🗑'); }}>🗑 Clear Cart</button>
        </div>
      </aside>

      {/* ── ORDER MODAL ── */}
      <div className={`modal-backdrop${modalOpen ? ' open' : ''}`} role="dialog" aria-modal="true" aria-labelledby="order-modal-title" onClick={e => { if (e.target === e.currentTarget) closeModal(); }}>
        <div className="modal">
          {!orderDone ? (
            <>
              <div className="modal-header">
                <h2 className="modal-title" id="order-modal-title">Complete Your Order</h2>
                <button className="cart-close" onClick={closeModal} aria-label="Close">✕</button>
              </div>
              <p className="modal-sub">Fill in your details and pin your delivery location on the map.</p>

              {/* Order summary */}
              <div className="order-summary">
                <div className="summary-title">Order Summary</div>
                {Object.entries(cart).map(([id,qty]) => {
                  const p = products.find(x => x.id === id);
                  if (!p) return null;
                  return <div key={id} className="summary-item"><span className="summary-name">{p.name} ×{qty}</span><span className="summary-price">{currency}{(p.price*qty).toLocaleString()}</span></div>;
                })}
                <div className="summary-total"><span>Total</span><span className="summary-total-amt">{currency}{totalAmt.toLocaleString()}</span></div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} noValidate>
                <div className="form-group">
                  <label className="form-label" htmlFor="input-name">Full Name <span className="form-req">*</span></label>
                  <input id="input-name" type="text" className={`form-input${errors.name ? ' has-error' : ''}`} placeholder="e.g. Ram Bahadur Shrestha" value={name} onChange={e => setName(e.target.value)} autoComplete="name" aria-describedby="err-name"/>
                  <span className="form-error" id="err-name" role="alert">{errors.name}</span>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="input-phone">Phone Number <span className="form-req">*</span></label>
                  <div className="phone-row">
                    <input id="input-phone" type="tel" className={`form-input${errors.phone ? ' has-error' : ''}`} placeholder="98XXXXXXXX" value={phone} onChange={e => setPhone(e.target.value)} autoComplete="tel" maxLength={10} aria-describedby="err-phone"/>
                    <button type="button" className="otp-btn" onClick={() => addToast('OTP verification coming soon 📱')}>Verify OTP</button>
                  </div>
                  <span className="otp-note">OTP verification coming soon</span>
                  <span className="form-error" id="err-phone" role="alert">{errors.phone}</span>
                </div>

                {/* ── MAP ADDRESS PICKER ── */}
                <div className="form-group">
                  <label className="form-label">
                    Delivery Location <span className="form-req">*</span>
                  </label>
                  <MapAddressPicker
                    onChange={handleMapChange}
                    hasError={!!errors.address}
                  />
                  {errors.address && (
                    <span className="form-error" role="alert">{errors.address}</span>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="input-remarks">Remarks <span style={{color:'var(--clr-text-3)',fontWeight:400}}>(optional)</span></label>
                  <input id="input-remarks" type="text" className="form-input" placeholder="e.g. Call before arriving" value={remarks} onChange={e => setRemarks(e.target.value)}/>
                </div>
                <div className="modal-actions">
                  <button type="submit" className="btn-primary" disabled={submitting}>{submitting ? 'Placing…' : 'Confirm Order →'}</button>
                </div>
              </form>
            </>
          ) : (
            <div className="success-screen">
              <div className="success-icon" aria-hidden="true">✓</div>
              <h3>Order Placed!</h3>
              <p>Your order has been received. We&apos;ll contact you shortly on your phone to confirm delivery details.</p>
              <div className="order-id-chip">Order ID: {lastOrderId}</div>
              <br/><br/>
              <button className="btn-primary" style={{margin:'0 auto'}} onClick={() => { closeModal(); }}>Browse More →</button>
            </div>
          )}
        </div>
      </div>

      {/* ── TOASTS ── */}
      <div className="toast-container" aria-live="polite" aria-atomic="false">
        {toasts.map((t,i) => <div key={i} className="toast">{t}</div>)}
      </div>

      {/* ── FLOATING ORDER BAR ── */}
      <div className={`floating-order-bar${totalQty > 0 ? ' visible' : ''}`} role="complementary" aria-label="Order summary">
        <div className="floating-order-bar__left">
          <span className="floating-order-bar__qty">{totalQty} item{totalQty !== 1 ? 's' : ''}</span>
          <span className="floating-order-bar__sep">·</span>
          <span className="floating-order-bar__total">{currency}{totalAmt.toLocaleString()}</span>
        </div>
        <div className="floating-order-bar__actions">
          <button
            className="floating-order-bar__cart-btn"
            onClick={() => setCartOpen(true)}
            aria-label="View cart"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
            View Cart
          </button>
          <button
            className="floating-order-bar__order-btn"
            onClick={openModal}
            aria-label="Place order now"
          >
            Place Order →
          </button>
        </div>
      </div>
    </>
  );
}
