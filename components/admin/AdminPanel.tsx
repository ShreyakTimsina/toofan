'use client';
import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { Product, Order, OrderStatus } from '@/lib/types';
import { CATEGORY_LABELS } from '@/lib/types';
import {
  getProducts, saveProducts, getOrders, updateOrderStatus,
  getSettings, generateId, isReturningCustomer,
} from '@/lib/data';

type Tab = 'dashboard' | 'orders' | 'products';

export default function AdminPanel() {
  const [authed, setAuthed]         = useState(false);
  const [pw, setPw]                 = useState('');
  const [pwError, setPwError]       = useState('');
  const [tab, setTab]               = useState<Tab>('orders');
  const [orders, setOrders]         = useState<Order[]>([]);
  const [products, setProducts]     = useState<Product[]>([]);
  const [orderSearch, setOrderSearch] = useState('');
  const [orderFilter, setOrderFilter] = useState<'all' | OrderStatus>('all');
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [toasts, setToasts]         = useState<string[]>([]);
  const [modalOpen, setModalOpen]   = useState(false);
  const [editingId, setEditingId]   = useState<string | null>(null);
  const [confirmId, setConfirmId]   = useState<string | null>(null);
  const [dragSrc, setDragSrc]       = useState<number | null>(null);
  const [theme, setTheme]           = useState<'dark' | 'light'>('dark');

  // Product form state
  const [pfName, setPfName]     = useState('');
  const [pfCat, setPfCat]       = useState<Product['category']>('drinks');
  const [pfPrice, setPfPrice]   = useState('');
  const [pfDesc, setPfDesc]     = useState('');
  const [pfImage, setPfImage]   = useState('');

  // Dashboard stats
  const [stats, setStats] = useState({ total: 0, today: 0, pending: 0, revenue: 0 });
  const [topProds, setTopProds] = useState<{name: string; qty: number}[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const auth = sessionStorage.getItem('toofan_admin_auth');
      if (auth === '1') { setAuthed(true); load(); }
      const saved = (localStorage.getItem('toofan_theme') as 'dark' | 'light') || 'dark';
      setTheme(saved);
      document.documentElement.setAttribute('data-theme', saved);
    }
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('toofan_theme', next);
  };

  const load = () => {
    setOrders(getOrders());
    setProducts(getProducts().sort((a,b) => (a.displayOrder||99)-(b.displayOrder||99)));
    calcDashboard();
  };

  const calcDashboard = () => {
    const ords = getOrders();
    const prods = getProducts();
    const today = new Date().toDateString();
    const todayO = ords.filter(o => new Date(o.timestamp).toDateString() === today);
    const revenue = ords.filter(o => o.status !== 'cancelled').reduce((s,o) => s+(o.total||0), 0);
    const topMap: Record<string, number> = {};
    ords.filter(o => o.status !== 'cancelled').forEach(o =>
      (o.items||[]).forEach(i => { topMap[i.productId] = (topMap[i.productId]||0) + i.qty; })
    );
    const top = Object.entries(topMap).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([id,qty]) => ({
      name: prods.find(p=>p.id===id)?.name || id, qty,
    }));
    setStats({ total: ords.length, today: todayO.length, pending: ords.filter(o=>o.status==='pending').length, revenue });
    setTopProds(top);
  };

  const addToast = (msg: string) => {
    setToasts(t => [...t, msg]);
    setTimeout(() => setToasts(t => t.slice(1)), 3000);
  };

  const login = (e: React.FormEvent) => {
    e.preventDefault();
    const settings = getSettings();
    if (pw === settings.adminPassword) {
      sessionStorage.setItem('toofan_admin_auth', '1');
      setAuthed(true); load();
    } else {
      setPwError('Incorrect password.'); setTimeout(() => setPwError(''), 3000);
    }
  };

  const logout = () => {
    sessionStorage.removeItem('toofan_admin_auth');
    setAuthed(false); setPw('');
  };

  /* ── Orders ── */
  const filteredOrders = orders.filter(o => {
    const matchSearch = !orderSearch || o.name.toLowerCase().includes(orderSearch.toLowerCase()) || o.phone.includes(orderSearch) || o.id.toLowerCase().includes(orderSearch.toLowerCase());
    const matchFilter = orderFilter === 'all' || o.status === orderFilter;
    return matchSearch && matchFilter;
  });

  const changeStatus = (id: string, status: OrderStatus) => {
    updateOrderStatus(id, status);
    setOrders(getOrders());
    addToast(`Status updated to ${status}`);
  };

  /* ── Products ── */
  const openAdd  = () => { setEditingId(null); setPfName(''); setPfCat('drinks'); setPfPrice(''); setPfDesc(''); setPfImage(''); setModalOpen(true); };
  const openEdit = (p: Product) => { setEditingId(p.id); setPfName(p.name); setPfCat(p.category); setPfPrice(String(p.price)); setPfDesc(p.description); setPfImage(p.image); setModalOpen(true); };

  const saveProd = (e: React.FormEvent) => {
    e.preventDefault();
    const prods = getProducts();
    if (editingId) {
      const idx = prods.findIndex(p => p.id === editingId);
      if (idx !== -1) prods[idx] = { ...prods[idx], name: pfName, category: pfCat, price: parseFloat(pfPrice), description: pfDesc, image: pfImage || '/images/placeholder.png' };
    } else {
      const maxOrder = prods.reduce((m,p) => Math.max(m, p.displayOrder||0), 0);
      prods.push({ id: generateId('P'), name: pfName, category: pfCat, price: parseFloat(pfPrice), description: pfDesc, image: pfImage || '/images/placeholder.png', orderCount: 0, active: true, displayOrder: maxOrder+1 });
    }
    saveProducts(prods);
    setProducts(prods.sort((a,b) => (a.displayOrder||99)-(b.displayOrder||99)));
    setModalOpen(false);
    addToast(editingId ? 'Product updated!' : 'Product added!');
  };

  const deleteProd = () => {
    if (!confirmId) return;
    const prods = getProducts().filter(p => p.id !== confirmId);
    saveProducts(prods);
    setProducts(prods.sort((a,b) => (a.displayOrder||99)-(b.displayOrder||99)));
    setConfirmId(null); addToast('Product deleted.');
  };

  const toggleActive = (id: string, val: boolean) => {
    const prods = getProducts();
    const idx = prods.findIndex(p => p.id === id);
    if (idx !== -1) { prods[idx].active = val; saveProducts(prods); setProducts([...prods].sort((a,b)=>(a.displayOrder||99)-(b.displayOrder||99))); }
    addToast(val ? 'Product visible.' : 'Product hidden.');
  };

  /* ── Drag & Drop ── */
  const onDragStart = (i: number) => setDragSrc(i);
  const onDrop = (targetIdx: number) => {
    if (dragSrc === null || dragSrc === targetIdx) return;
    const prods = getProducts().sort((a,b)=>(a.displayOrder||99)-(b.displayOrder||99));
    const [moved] = prods.splice(dragSrc, 1);
    prods.splice(targetIdx, 0, moved);
    prods.forEach((p,i) => { p.displayOrder = i+1; });
    saveProducts(prods);
    setProducts([...prods]);
    setDragSrc(null);
    addToast('Order saved!');
  };

  if (!authed) return (
    <div className="admin-login">
      <div className="admin-login-card">
        <div className="admin-login-logo">
          <div className="admin-login-mark" aria-hidden="true">🌪</div>
          <h1 className="admin-login-title">Toof<span className="logo-accent">an</span> Admin</h1>
          <p className="admin-login-sub">Restricted access — authorised personnel only</p>
        </div>
        <form className="admin-form" onSubmit={login}>
          <div><label htmlFor="admin-pw">Password</label><input id="admin-pw" type="password" value={pw} onChange={e=>setPw(e.target.value)} placeholder="Enter admin password" autoComplete="current-password"/></div>
          <p className="admin-login-error" role="alert">{pwError}</p>
          <button type="submit" className="admin-login-btn">Sign In →</button>
        </form>
        <p className="admin-back-link"><Link href="/">← Back to Storefront</Link></p>
      </div>
    </div>
  );

  const pendingCount = orders.filter(o => o.status === 'pending').length;

  return (
    <div className="admin-shell">
      {/* ── Sidebar ── */}
      <aside className="admin-sidebar" role="navigation" aria-label="Admin navigation">
        <div className="admin-sidebar-logo">
          <div className="sidebar-mark" aria-hidden="true">🌪</div>
          <div className="sidebar-name">Toof<span className="logo-accent">an</span></div>
        </div>
        <div className="sidebar-label">Menu</div>
        <nav className="sidebar-nav">
          {([['dashboard','Dashboard'], ['orders','Orders'], ['products','Products']] as [Tab,string][]).map(([t,label]) => (
            <button key={t} className={`nav-item${tab === t ? ' active' : ''}`} onClick={() => { setTab(t); if(t!=='dashboard') load(); else calcDashboard(); }}>
              {t === 'dashboard' && <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>}
              {t === 'orders' && <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>}
              {t === 'products' && <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>}
              {label}
              {t === 'orders' && pendingCount > 0 && <span className="nav-badge">{pendingCount}</span>}
            </button>
          ))}
        </nav>
        <div className="admin-sidebar-footer">
          <button className="logout-btn" onClick={logout}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Logout
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="admin-main">
        <header className="admin-header" role="banner">
          <h2>{{dashboard:'Dashboard',orders:'Orders',products:'Products'}[tab]}</h2>
          <div className="admin-header-actions">
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
            <Link href="/" className="btn btn-ghost" style={{fontSize:'13px'}}>← Storefront</Link>
          </div>
        </header>

        <div className="admin-content">
          {/* ── Dashboard ── */}
          {tab === 'dashboard' && (
            <div>
              <div className="stat-grid">
                <div className="stat-card"><div className="stat-label">Total Orders</div><div className="stat-value">{stats.total}</div><div className="stat-sub">All time</div></div>
                <div className="stat-card"><div className="stat-label">Today</div><div className="stat-value">{stats.today}</div><div className="stat-sub">Since midnight</div></div>
                <div className="stat-card"><div className="stat-label">Pending</div><div className="stat-value">{stats.pending}</div><div className="stat-sub">Awaiting confirmation</div></div>
                <div className="stat-card"><div className="stat-label">Revenue</div><div className="stat-value" style={{fontSize:'22px'}}>Rs.{stats.revenue.toLocaleString()}</div><div className="stat-sub">Excl. cancelled</div></div>
              </div>
              <div className="orders-wrap" style={{padding:'24px'}}>
                <h3 style={{fontSize:'15px',fontWeight:700,marginBottom:'16px'}}>🏆 Top Products by Units Sold</h3>
                {topProds.length === 0 ? <p style={{color:'var(--clr-text-3)',fontSize:'13px'}}>No orders yet.</p> : topProds.map((p,i) => (
                  <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 0',borderBottom:'1px solid var(--clr-border)'}}>
                    <span style={{fontSize:'14px'}}>{p.name}</span>
                    <span style={{fontWeight:700,color:'var(--clr-accent)'}}>{p.qty} sold</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Orders ── */}
          {tab === 'orders' && (
            <div className="orders-wrap">
              <div className="orders-header">
                <h3>All Orders</h3>
                <input type="search" className="table-search" placeholder="Search by name, phone, ID…" value={orderSearch} onChange={e=>setOrderSearch(e.target.value)} aria-label="Search orders"/>
                <select className="table-filter" value={orderFilter} onChange={e=>setOrderFilter(e.target.value as 'all'|OrderStatus)} aria-label="Filter by status">
                  <option value="all">All Statuses</option>
                  <option value="pending">⏳ Pending</option>
                  <option value="confirmed">✅ Confirmed</option>
                  <option value="delivered">📦 Delivered</option>
                  <option value="cancelled">❌ Cancelled</option>
                </select>
              </div>
              <div className="table-wrap">
                <table aria-label="Orders table">
                  <thead><tr>
                    <th>Order ID</th><th>Customer</th><th>Customer Type</th>
                    <th>Date &amp; Time</th><th>Items</th><th>Total</th><th>Status</th><th></th>
                  </tr></thead>
                  <tbody>
                    {filteredOrders.length === 0 ? (
                      <tr><td colSpan={8} style={{textAlign:'center',padding:'40px',color:'var(--clr-text-3)'}}>No orders found.</td></tr>
                    ) : filteredOrders.map(order => {
                      const d = new Date(order.timestamp);
                      const returning = isReturningCustomer(order.phone, order.id);
                      return (
                        <React.Fragment key={order.id}>
                          <tr>
                            <td><code style={{fontSize:'11px',color:'var(--clr-text-3)'}}>{order.id.slice(-8)}</code></td>
                            <td><div style={{fontWeight:600}}>{order.name}</div><div style={{fontSize:'11px',color:'var(--clr-text-3)'}}>{order.phone}</div></td>
                            <td><span className={`customer-badge ${returning ? 'returning' : 'new'}`}>{returning ? '✓ Returning' : '⚠ New — Collect Advance'}</span></td>
                            <td style={{fontSize:'12px',color:'var(--clr-text-2)'}}>{d.toLocaleDateString()}<br/>{d.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</td>
                            <td style={{fontSize:'12px',color:'var(--clr-text-2)'}}>{order.items?.reduce((s,i)=>s+i.qty,0)||0} items</td>
                            <td style={{fontWeight:700,color:'var(--clr-accent)'}}>Rs.{order.total?.toLocaleString()}</td>
                            <td>
                              <select className="status-select" value={order.status} onChange={e=>changeStatus(order.id, e.target.value as OrderStatus)}>
                                <option value="pending">⏳ Pending</option>
                                <option value="confirmed">✅ Confirmed</option>
                                <option value="delivered">📦 Delivered</option>
                                <option value="cancelled">❌ Cancelled</option>
                              </select>
                            </td>
                            <td><button className="expand-btn" onClick={()=>setExpandedOrder(expandedOrder===order.id?null:order.id)} aria-label="Expand">{expandedOrder===order.id?'⌃':'⌄'}</button></td>
                          </tr>
                          {expandedOrder === order.id && (
                            <tr className="order-detail-row">
                              <td colSpan={8} className="order-detail-cell">
                                {order.items?.map((item,i) => <div key={i} className="order-item-row"><strong>{item.name}</strong><span>×{item.qty}</span><span>Rs.{(item.price*item.qty).toLocaleString()}</span></div>)}
                                <div style={{marginTop:'10px',fontSize:'12px',color:'var(--clr-text-2)'}}><strong>Address:</strong> {order.address}</div>
                                {order.remarks && <div style={{marginTop:'6px',fontSize:'12px',color:'var(--clr-text-3)',fontStyle:'italic'}}>💬 &quot;{order.remarks}&quot;</div>}
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Products ── */}
          {tab === 'products' && (
            <div>
              <div className="products-admin-header">
                <h3>Product Catalogue</h3>
                <p style={{fontSize:'13px',color:'var(--clr-text-3)',flex:1}}>Drag to reorder · Toggle to show/hide</p>
                <button className="btn btn-accent" onClick={openAdd}>+ Add Product</button>
              </div>
              <div role="list">
                {products.map((p, idx) => (
                  <div key={p.id} className="product-admin-row" role="listitem"
                    draggable onDragStart={()=>onDragStart(idx)} onDragOver={e=>e.preventDefault()} onDrop={()=>onDrop(idx)} onDragEnd={()=>setDragSrc(null)}>
                    <span className="drag-handle" title="Drag to reorder">⠿</span>
                    <div className="product-admin-img">
                      <Image src={p.image} alt={p.name} fill style={{objectFit:'contain',padding:'6px'}} loading="lazy"/>
                    </div>
                    <div className="product-admin-info">
                      <div className="product-admin-name">{p.name}</div>
                      <div className="product-admin-meta">{CATEGORY_LABELS[p.category]} · Rs.{p.price.toLocaleString()}</div>
                    </div>
                    <div className="product-admin-price">Rs.{p.price.toLocaleString()}</div>
                    <label className="toggle-switch" title={p.active ? 'Active' : 'Hidden'}>
                      <input type="checkbox" checked={p.active !== false} onChange={e=>toggleActive(p.id,e.target.checked)}/>
                      <span className="toggle-slider"/>
                    </label>
                    <div className="product-admin-actions">
                      <button className="icon-btn edit" onClick={()=>openEdit(p)} title="Edit">✏️</button>
                      <button className="icon-btn delete" onClick={()=>setConfirmId(p.id)} title="Delete">🗑</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Product Modal ── */}
      <div className={`admin-modal-backdrop${modalOpen ? ' open' : ''}`} role="dialog" aria-modal="true" aria-labelledby="prod-modal-title">
        <div className="admin-modal">
          <h3 className="admin-modal-title" id="prod-modal-title">{editingId ? 'Edit Product' : 'Add New Product'}</h3>
          <form onSubmit={saveProd}>
            <div className="form-group"><label className="form-label">Product Name *</label><input type="text" className="form-input" value={pfName} onChange={e=>setPfName(e.target.value)} placeholder="e.g. Carlsberg Beer" required/></div>
            <div className="form-group"><label className="form-label">Category *</label>
              <select className="admin-form-select" value={pfCat} onChange={e=>setPfCat(e.target.value as Product['category'])} required>
                <option value="drinks">🍺 Drinks</option>
                <option value="cigarettes">🚬 Cigarettes</option>
                <option value="snacks">🍿 Snacks</option>
              </select>
            </div>
            <div className="form-group"><label className="form-label">Price (Rs.) *</label><input type="number" className="form-input" value={pfPrice} onChange={e=>setPfPrice(e.target.value)} placeholder="e.g. 550" min="0" step="1" required/></div>
            <div className="form-group"><label className="form-label">Short Description</label><textarea className="form-textarea" style={{resize:'vertical',minHeight:'72px'}} value={pfDesc} onChange={e=>setPfDesc(e.target.value)} placeholder="Brief description…"/></div>
            <div className="form-group"><label className="form-label">Image Path / URL</label><input type="text" className="form-input" value={pfImage} onChange={e=>setPfImage(e.target.value)} placeholder="/images/myproduct.png"/></div>
            <div className="admin-modal-actions">
              <button type="submit" className="btn btn-accent">Save Product</button>
              <button type="button" className="btn btn-ghost" onClick={()=>setModalOpen(false)}>Cancel</button>
            </div>
          </form>
        </div>
      </div>

      {/* ── Confirm Delete ── */}
      <div className={`confirm-dialog${confirmId ? ' open' : ''}`} role="alertdialog" aria-modal="true">
        <div className="confirm-box">
          <h4>Delete Product?</h4>
          <p>This will permanently remove the product from the catalogue.</p>
          <div className="confirm-actions">
            <button className="btn btn-danger" style={{flex:1}} onClick={deleteProd}>Yes, Delete</button>
            <button className="btn btn-ghost" style={{flex:1}} onClick={()=>setConfirmId(null)}>Cancel</button>
          </div>
        </div>
      </div>

      {/* ── Toasts ── */}
      <div className="admin-toast-container" aria-live="polite">
        {toasts.map((t,i) => <div key={i} className="admin-toast">{t}</div>)}
      </div>
    </div>
  );
}
