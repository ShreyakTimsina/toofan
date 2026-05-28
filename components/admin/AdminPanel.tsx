'use client';
import React, { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { Product, Order, OrderStatus, AdminUser, AdminRole } from '@/lib/types';
import { CATEGORY_LABELS } from '@/lib/types';
import {
  fetchProducts, fetchOrders, updateOrderStatusAPI,
  saveProductAPI, deleteProductAPI, reorderProductsAPI,
  softDeleteOrderAPI, permanentlyDeleteOrderAPI,
  sendOtpAPI, verifyOtpAPI, fetchUsersAPI, saveUserAPI, deleteUserAPI,
  isReturningCustomer
} from '@/lib/data';
import AnalyticsTab from './AnalyticsTab';

type Tab = 'dashboard' | 'analytics' | 'orders' | 'deleted-orders' | 'products' | 'users';

export default function AdminPanel() {
  const [user, setUser]             = useState<AdminUser | null>(null);
  const [uname, setUname]           = useState('');
  const [loginStep, setLoginStep]   = useState<'username' | 'otp'>('username');
  const [otp, setOtp]               = useState('');
  const [authError, setAuthError]   = useState('');
  
  const [tab, setTab]               = useState<Tab>('orders');
  const [orders, setOrders]         = useState<Order[]>([]);
  const [products, setProducts]     = useState<Product[]>([]);
  const [users, setUsers]           = useState<AdminUser[]>([]);
  
  const [orderSearch, setOrderSearch] = useState('');
  const [orderFilter, setOrderFilter] = useState<'all' | OrderStatus>('all');
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [toasts, setToasts]         = useState<string[]>([]);
  
  const [modalOpen, setModalOpen]   = useState(false);
  const [userModalOpen, setUserModalOpen] = useState(false);
  
  const [editingId, setEditingId]   = useState<string | null>(null);
  const [confirmId, setConfirmId]   = useState<string | null>(null);
  const [confirmUserId, setConfirmUserId] = useState<string | null>(null);
  
  const [confirmOrderDelete, setConfirmOrderDelete] = useState<string | null>(null);
  const [confirmOrderHardDelete, setConfirmOrderHardDelete] = useState<string | null>(null);
  
  const [dragSrc, setDragSrc]       = useState<number | null>(null);
  const [theme, setTheme]           = useState<'dark' | 'light'>('light');
  const [loading, setLoading]       = useState(false);

  // Product form
  const [pfName, setPfName]     = useState('');
  const [pfCat, setPfCat]       = useState<Product['category']>('drinks');
  const [pfPrice, setPfPrice]   = useState('');
  const [pfDesc, setPfDesc]     = useState('');
  const [pfImage, setPfImage]   = useState('');

  // User form
  const [ufUsername, setUfUsername] = useState('');
  const [ufPassword, setUfPassword] = useState('');
  const [ufName, setUfName]         = useState('');
  const [ufRole, setUfRole]         = useState<AdminRole>('rider');

  // Dashboard stats
  const [stats, setStats] = useState({ total: 0, today: 0, pending: 0, revenue: 0 });
  const [topProds, setTopProds] = useState<{name: string; qty: number}[]>([]);

  // PWA Install Prompt
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  // Notifications
  const prevOrdersLenRef = useRef<number | null>(null);

  const playChime = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    } catch(e) {}
  };

  const notifyNewOrder = () => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      new Notification('New Order Received! 🌪', {
        body: 'A customer has just placed a new order. Check the Admin Panel.',
        icon: '/icons/icon-192x192.png'
      });
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedUserStr = localStorage.getItem('toofan_admin_user');
      if (savedUserStr) {
        try {
          const saved = JSON.parse(savedUserStr);
          const { lastActive, ...userData } = saved;
          // Check if 5 days have passed (5 * 24 * 60 * 60 * 1000)
          if (Date.now() - (lastActive || 0) > 432000000) {
            localStorage.removeItem('toofan_admin_user');
          } else {
            // Refresh timer
            localStorage.setItem('toofan_admin_user', JSON.stringify({ ...userData, lastActive: Date.now() }));
            setUser(userData);
            load(userData.role);
          }
        } catch (e) {}
      }
      const savedTheme = (localStorage.getItem('toofan_theme') as 'dark' | 'light') || 'light';
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);

      window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        setDeferredPrompt(e);
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Background Polling & Notifications
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (user) {
      if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
        Notification.requestPermission();
      }

      interval = setInterval(async () => {
        try {
          const ords = await fetchOrders();
          setOrders(ords);
        } catch (e) {}
      }, 15000); // Poll every 15 seconds
    }
    return () => clearInterval(interval);
  }, [user]);

  // Trigger chime on new order
  useEffect(() => {
    if (!user) return;
    const activeLen = orders.filter(o => !o.isDeleted).length;
    
    if (prevOrdersLenRef.current !== null && activeLen > prevOrdersLenRef.current) {
      playChime();
      notifyNewOrder();
    }
    prevOrdersLenRef.current = activeLen;
  }, [orders, user]);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('toofan_theme', next);
  };

  const load = async (role: AdminRole) => {
    setLoading(true);
    try {
      const ords = await fetchOrders();
      setOrders(ords);
      
      if (role === 'owner' || role === 'manager') {
        const prods = await fetchProducts();
        setProducts(prods.sort((a,b) => (a.displayOrder||99)-(b.displayOrder||99)));
        if (role === 'owner') calcDashboard(ords, prods);
      }
      
      if (role === 'owner') {
        const u = await fetchUsersAPI();
        setUsers(u);
      }
    } catch (err) {
      addToast('Failed to load data');
    }
    setLoading(false);
  };

  const calcDashboard = (ords: Order[], prods: Product[]) => {
    const activeOrds = ords.filter(o => !o.isDeleted);
    const today = new Date().toDateString();
    const todayO = activeOrds.filter(o => new Date(o.timestamp).toDateString() === today);
    const revenue = activeOrds.filter(o => o.status !== 'cancelled').reduce((s,o) => s+(o.total||0), 0);
    const topMap: Record<string, number> = {};
    activeOrds.filter(o => o.status !== 'cancelled').forEach(o =>
      (o.items||[]).forEach(i => { topMap[i.productId] = (topMap[i.productId]||0) + i.qty; })
    );
    const top = Object.entries(topMap).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([id,qty]) => ({
      name: prods.find(p=>p.id===id)?.name || id, qty,
    }));
    setStats({ total: activeOrds.length, today: todayO.length, pending: activeOrds.filter(o=>o.status==='pending').length, revenue });
    setTopProds(top);
  };

  const addToast = (msg: string) => {
    setToasts(t => [...t, msg]);
    setTimeout(() => setToasts(t => t.slice(1)), 3000);
  };

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      await sendOtpAPI(uname);
      setLoginStep('otp');
      addToast('OTP sent (use 123456 for testing)');
    } catch (err) {
      setAuthError('User not found.');
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      const loggedInUser = await verifyOtpAPI(uname, otp);
      localStorage.setItem('toofan_admin_user', JSON.stringify({ ...loggedInUser, lastActive: Date.now() }));
      setUser(loggedInUser);
      setTab('orders');
      load(loggedInUser.role);
    } catch (err) {
      setAuthError('Invalid OTP.');
    }
  };

  const logout = () => {
    localStorage.removeItem('toofan_admin_user');
    setUser(null); setUname(''); setOtp(''); setLoginStep('username');
  };

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setDeferredPrompt(null);
  };

  /* ── Orders Logic ── */
  let activeOrders = orders.filter(o => !o.isDeleted);
  
  if (user?.role === 'manager') {
    // Restrict to last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    activeOrders = activeOrders.filter(o => new Date(o.timestamp) >= sevenDaysAgo);
  }

  const deletedOrders = orders.filter(o => o.isDeleted);
  
  const filteredOrders = activeOrders.filter(o => {
    const matchSearch = !orderSearch || o.name.toLowerCase().includes(orderSearch.toLowerCase()) || o.phone.includes(orderSearch) || o.id.toLowerCase().includes(orderSearch.toLowerCase());
    const matchFilter = orderFilter === 'all' || o.status === orderFilter;
    return matchSearch && matchFilter;
  });

  const filteredDeletedOrders = deletedOrders.filter(o => {
    return !orderSearch || o.name.toLowerCase().includes(orderSearch.toLowerCase()) || o.phone.includes(orderSearch) || o.id.toLowerCase().includes(orderSearch.toLowerCase());
  });

  const changeStatus = async (id: string, status: OrderStatus) => {
    await updateOrderStatusAPI(id, status);
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
    addToast(`Status updated to ${status}`);
  };

  const softDeleteOrder = async () => {
    if (!confirmOrderDelete) return;
    try {
      await softDeleteOrderAPI(confirmOrderDelete, true);
      setOrders(prev => prev.map(o => o.id === confirmOrderDelete ? { ...o, isDeleted: true } : o));
      setConfirmOrderDelete(null);
      addToast('Order moved to Deleted Orders.');
    } catch {
      addToast('Failed to delete order.');
    }
  };

  const restoreOrder = async (id: string) => {
    try {
      await softDeleteOrderAPI(id, false);
      setOrders(prev => prev.map(o => o.id === id ? { ...o, isDeleted: false } : o));
      addToast('Order restored.');
    } catch {
      addToast('Failed to restore order.');
    }
  };

  const hardDeleteOrder = async () => {
    if (!confirmOrderHardDelete) return;
    try {
      await permanentlyDeleteOrderAPI(confirmOrderHardDelete);
      setOrders(prev => prev.filter(o => o.id !== confirmOrderHardDelete));
      setConfirmOrderHardDelete(null);
      addToast('Order permanently deleted.');
    } catch {
      addToast('Failed to permanently delete order.');
    }
  };

  /* ── Products ── */
  const openAdd  = () => { setEditingId(null); setPfName(''); setPfCat('drinks'); setPfPrice(''); setPfDesc(''); setPfImage(''); setModalOpen(true); };
  const openEdit = (p: Product) => { setEditingId(p.id); setPfName(p.name); setPfCat(p.category); setPfPrice(String(p.price)); setPfDesc(p.description); setPfImage(p.image); setModalOpen(true); };

  const saveProd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await saveProductAPI({ id: editingId, name: pfName, category: pfCat, price: parseFloat(pfPrice), description: pfDesc, image: pfImage || '/images/placeholder.png' });
        setProducts(prev => prev.map(p => p.id === editingId ? { ...p, name: pfName, category: pfCat, price: parseFloat(pfPrice), description: pfDesc, image: pfImage || '/images/placeholder.png' } : p));
        addToast('Product updated!');
      } else {
        const newProd = await saveProductAPI({ name: pfName, category: pfCat, price: parseFloat(pfPrice), description: pfDesc, image: pfImage || '/images/placeholder.png' });
        setProducts(prev => [...prev, newProd].sort((a,b) => (a.displayOrder||99)-(b.displayOrder||99)));
        addToast('Product added!');
      }
      setModalOpen(false);
    } catch {
      addToast('Failed to save product.');
    }
  };

  const deleteProd = async () => {
    if (!confirmId) return;
    try {
      await deleteProductAPI(confirmId);
      setProducts(prev => prev.filter(p => p.id !== confirmId));
      setConfirmId(null);
      addToast('Product deleted.');
    } catch {
      addToast('Failed to delete product.');
    }
  };

  const toggleActive = async (id: string, val: boolean) => {
    try {
      await saveProductAPI({ id, active: val });
      setProducts(prev => prev.map(p => p.id === id ? { ...p, active: val } : p));
    } catch {
      addToast('Failed to update product.');
    }
  };

  const onDragStart = (i: number) => setDragSrc(i);
  const onDrop = async (targetIdx: number) => {
    if (dragSrc === null || dragSrc === targetIdx) return;
    const reordered = [...products];
    const [moved] = reordered.splice(dragSrc, 1);
    reordered.splice(targetIdx, 0, moved);
    reordered.forEach((p,i) => { p.displayOrder = i+1; });
    setProducts([...reordered]);
    setDragSrc(null);
    try {
      await reorderProductsAPI(reordered);
    } catch {
      addToast('Failed to save order.');
    }
  };

  /* ── Users ── */
  const openAddUser = () => { setUfUsername(''); setUfPassword(''); setUfName(''); setUfRole('rider'); setUserModalOpen(true); };
  const saveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newUser = await saveUserAPI({ username: ufUsername, password: ufPassword, name: ufName, role: ufRole });
      setUsers(prev => [...prev, newUser]);
      addToast('User created!');
      setUserModalOpen(false);
    } catch {
      addToast('Failed to create user. Username may be taken.');
    }
  };
  const deleteUser = async () => {
    if (!confirmUserId) return;
    try {
      await deleteUserAPI(confirmUserId);
      setUsers(prev => prev.filter(u => u.id !== confirmUserId));
      setConfirmUserId(null);
      addToast('User deleted.');
    } catch {
      addToast('Failed to delete user.');
    }
  };

  /* ── Login View ── */
  if (!user) return (
    <div className="admin-login">
      <div className="admin-login-card">
        <div className="admin-login-logo">
          <div className="admin-login-mark" aria-hidden="true">🌪</div>
          <h1 className="admin-login-title">Toof<span className="logo-accent">an</span> Admin</h1>
          <p className="admin-login-sub">Restricted access — authorised personnel only</p>
        </div>
        <form className="admin-form" onSubmit={loginStep === 'username' ? handleRequestOtp : handleVerifyOtp}>
          {loginStep === 'username' ? (
            <div style={{marginBottom:'14px'}}>
              <label htmlFor="admin-uname">Email or Phone Number</label>
              <input id="admin-uname" type="text" value={uname} onChange={e=>setUname(e.target.value)} required placeholder="Enter your username, email or phone"/>
            </div>
          ) : (
            <div style={{marginBottom:'14px'}}>
              <label htmlFor="admin-otp">Enter OTP</label>
              <input id="admin-otp" type="text" value={otp} onChange={e=>setOtp(e.target.value)} required placeholder="e.g. 123456"/>
            </div>
          )}
          <p className="admin-login-error" role="alert">{authError}</p>
          <button type="submit" className="admin-login-btn">{loginStep === 'username' ? 'Get OTP →' : 'Verify & Login →'}</button>
          {loginStep === 'otp' && (
            <button type="button" className="btn btn-ghost" style={{width:'100%', marginTop:'8px'}} onClick={()=>setLoginStep('username')}>← Back</button>
          )}
        </form>
        <p className="admin-back-link"><Link href="/">← Back to Storefront</Link></p>
      </div>
    </div>
  );

  const pendingCount = activeOrders.filter(o => o.status === 'pending').length;

  /* ── Tabs configuration ── */
  const TABS: { id: Tab, label: string, roles: AdminRole[] }[] = [
    { id: 'dashboard', label: 'Today (Dashboard)', roles: ['owner'] },
    { id: 'analytics', label: 'Analytics & Reports', roles: ['owner'] },
    { id: 'orders', label: 'Orders', roles: ['owner', 'manager', 'rider'] },
    { id: 'deleted-orders', label: 'Deleted Orders', roles: ['owner'] },
    { id: 'products', label: 'Products', roles: ['owner', 'manager'] },
    { id: 'users', label: 'Staff Users', roles: ['owner'] },
  ];
  const allowedTabs = TABS.filter(t => t.roles.includes(user.role));

  return (
    <div className="admin-shell">
      {/* ── Sidebar ── */}
      <aside className="admin-sidebar" role="navigation">
        <div className="admin-sidebar-logo">
          <div className="sidebar-mark" aria-hidden="true">🌪</div>
          <div className="sidebar-name">Toof<span className="logo-accent">an</span></div>
        </div>
        <div style={{fontSize:'11px',color:'var(--clr-text-3)',marginTop:'4px',textTransform:'uppercase',letterSpacing:'0.06em'}}>
          {user.name} ({user.role})
        </div>
        <nav className="sidebar-nav">
          {allowedTabs.map(({id, label}) => (
            <button key={id} className={`nav-item${tab === id ? ' active' : ''}`} onClick={() => { setTab(id); load(user.role); }}>
              {label}
              {id === 'orders' && pendingCount > 0 && <span className="nav-badge">{pendingCount}</span>}
            </button>
          ))}
        </nav>
        <div className="admin-sidebar-footer" style={{display:'flex', gap:'8px', flexDirection:'column'}}>
          {deferredPrompt && (
             <button className="btn btn-secondary" style={{width:'100%', padding:'8px', fontSize:'11px'}} onClick={handleInstallClick}>
               ↓ Install App
             </button>
          )}
          <button className="logout-btn" onClick={logout}>Logout</button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="admin-main">
        <header className="admin-header">
          <h2>{allowedTabs.find(t=>t.id===tab)?.label || tab}</h2>
          <div className="admin-header-actions">
            <button className="theme-toggle" onClick={toggleTheme}>🌓</button>
            <Link href="/" className="btn btn-ghost" style={{fontSize:'13px'}}>← Storefront</Link>
          </div>
        </header>

        <div className="admin-content">
          {loading && <p style={{color:'var(--clr-text-3)'}}>Loading data...</p>}

          {/* ── Dashboard (Today Only) ── */}
          {!loading && tab === 'dashboard' && user.role === 'owner' && (
            <div>
              <div className="stat-grid">
                <div className="stat-card"><div className="stat-label">Today's Orders</div><div className="stat-value">{stats.today}</div></div>
                <div className="stat-card"><div className="stat-label">Pending Orders</div><div className="stat-value">{stats.pending}</div></div>
                <div className="stat-card"><div className="stat-label">Today's Revenue</div><div className="stat-value" style={{color:'var(--clr-accent)'}}>Rs.{stats.revenue.toLocaleString()}</div></div>
              </div>
              <div className="orders-wrap" style={{padding:'24px', marginTop:'24px'}}>
                <h3 style={{fontSize:'15px',marginBottom:'16px'}}>🏆 Today's Top Products</h3>
                {topProds.length === 0 ? (
                  <p style={{color:'var(--clr-text-3)', fontSize:'13px'}}>No orders today yet.</p>
                ) : (
                  topProds.map((p,i) => (
                    <div key={i} style={{padding:'10px 0',borderBottom:'1px solid var(--clr-border)'}}>
                      {p.name} — <strong style={{color:'var(--clr-accent)'}}>{p.qty} sold</strong>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ── Analytics (Charts & Reports) ── */}
          {!loading && tab === 'analytics' && user.role === 'owner' && (
            <AnalyticsTab orders={orders} />
          )}

          {/* ── Orders ── */}
          {!loading && tab === 'orders' && (
            <div className="orders-wrap">
              <div className="orders-header">
                <h3>Active Orders</h3>
                <input type="search" className="table-search" placeholder="Search orders..." value={orderSearch} onChange={e=>setOrderSearch(e.target.value)}/>
                <select className="table-filter" value={orderFilter} onChange={e=>setOrderFilter(e.target.value as 'all'|OrderStatus)}>
                  <option value="all">All</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div className="table-wrap">
                <table>
                  <thead><tr>
                    <th>ID</th><th>Customer</th><th>Date</th><th>Items</th>
                    {/* Hide Total column for riders, or conditionally hide value for managers */}
                    {user.role !== 'rider' && <th>Total</th>}
                    <th>Status</th><th>Actions</th><th></th>
                  </tr></thead>
                  <tbody>
                    {filteredOrders.map(order => {
                      const d = new Date(order.timestamp);
                      // Manager hides revenue if delivered
                      const hideRevenue = user.role === 'manager' && order.status === 'delivered';
                      const returning = isReturningCustomer(order.phone, orders, order.id);
                      return (
                        <React.Fragment key={order.id}>
                          <tr>
                            <td><code>{order.id.slice(-8)}</code></td>
                            <td>
                              <strong>{order.name}</strong><br/>
                              <span style={{fontSize:'11px'}}>{order.phone}</span>
                              <div style={{marginTop:'4px'}}><span className={`customer-badge ${returning ? 'returning' : 'new'}`}>{returning ? '✓ Returning' : 'New'}</span></div>
                            </td>
                            <td style={{fontSize:'12px'}}>{d.toLocaleDateString()} {d.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</td>
                            <td style={{fontSize:'12px'}}>{order.items?.reduce((s,i)=>s+i.qty,0)||0} items</td>
                            
                            {user.role !== 'rider' && (
                              <td style={{fontWeight:700,color:'var(--clr-accent)'}}>
                                {hideRevenue ? '***' : `Rs.${order.total?.toLocaleString()}`}
                              </td>
                            )}

                            <td>
                              {user.role === 'rider' ? (
                                <span style={{textTransform:'uppercase',fontSize:'11px'}}>{order.status}</span>
                              ) : (
                                <select className="status-select" value={order.status} onChange={e=>changeStatus(order.id, e.target.value as OrderStatus)}>
                                  <option value="pending">Pending</option>
                                  <option value="confirmed">Confirmed</option>
                                  <option value="delivered">Delivered</option>
                                  <option value="cancelled">Cancelled</option>
                                </select>
                              )}
                            </td>
                            <td>
                              {user.role === 'owner' && (
                                <button className="icon-btn delete" onClick={() => setConfirmOrderDelete(order.id)}>
                                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                </button>
                              )}
                              {user.role === 'rider' && order.status !== 'delivered' && (
                                <button className="btn btn-ghost" style={{fontSize:'11px',padding:'4px 8px'}} onClick={() => changeStatus(order.id, 'delivered')}>Mark Delivered</button>
                              )}
                            </td>
                            <td><button className="expand-btn" onClick={()=>setExpandedOrder(expandedOrder===order.id?null:order.id)}>{expandedOrder===order.id?'⌃':'⌄'}</button></td>
                          </tr>
                          {expandedOrder === order.id && (
                            <tr className="order-detail-row">
                              <td colSpan={user.role !== 'rider' ? 8 : 7} className="order-detail-cell">
                                {order.items?.map((item,i) => (
                                  <div key={i}><strong>{item.name}</strong> ×{item.qty} {(!hideRevenue && user.role !== 'rider') && `— Rs.${item.price*item.qty}`}</div>
                                ))}
                                <div style={{marginTop:'10px',fontSize:'12px'}}><strong>Address:</strong> {order.address}</div>
                                {order.deliveryCoords && (
                                  <div style={{marginTop:'4px',fontSize:'11px'}}>
                                    📍 <a href={`https://www.google.com/maps?q=${order.deliveryCoords.lat},${order.deliveryCoords.lng}`} target="_blank" rel="noopener noreferrer" style={{color:'var(--clr-accent)'}}>View on Map</a>
                                  </div>
                                )}
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

          {/* ── Deleted Orders (Owner only) ── */}
          {!loading && tab === 'deleted-orders' && user.role === 'owner' && (
            <div className="orders-wrap">
              <div className="orders-header"><h3>Deleted Orders</h3></div>
              <div className="table-wrap">
                <table>
                  <tbody>
                    {filteredDeletedOrders.map(o => (
                      <tr key={o.id}>
                        <td>{o.name}</td>
                        <td><button onClick={()=>restoreOrder(o.id)}>Restore</button></td>
                        <td><button onClick={()=>setConfirmOrderHardDelete(o.id)}>Permanently Delete</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Products (Owner/Manager) ── */}
          {!loading && tab === 'products' && ['owner', 'manager'].includes(user.role) && (
            <div>
              <div className="products-admin-header">
                <h3>Product Catalogue</h3>
                <button className="btn btn-accent" onClick={openAdd}>+ Add Product</button>
              </div>
              <div>
                {products.map((p, idx) => (
                  <div key={p.id} className="product-admin-row" draggable onDragStart={()=>onDragStart(idx)} onDragOver={e=>e.preventDefault()} onDrop={()=>onDrop(idx)} onDragEnd={()=>setDragSrc(null)}>
                    <span className="drag-handle">⠿</span>
                    <div style={{flex:1}}>{p.name} — Rs.{p.price}</div>
                    <label className="toggle-switch">
                      <input type="checkbox" checked={p.active !== false} onChange={e=>toggleActive(p.id,e.target.checked)}/>
                      <span className="toggle-slider"/>
                    </label>
                    <button className="icon-btn edit" onClick={()=>openEdit(p)}>✏️</button>
                    {user.role === 'owner' && <button className="icon-btn delete" onClick={()=>setConfirmId(p.id)}><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Users (Owner only) ── */}
          {!loading && tab === 'users' && user.role === 'owner' && (
            <div>
              <div className="products-admin-header">
                <h3>Staff Users</h3>
                <button className="btn btn-accent" onClick={openAddUser}>+ Add User</button>
              </div>
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Username</th><th>Name</th><th>Role</th><th>Created</th><th>Actions</th></tr></thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id}>
                        <td>{u.username}</td><td>{u.name}</td><td>{u.role}</td>
                        <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                        <td>{u.username !== 'admin' && <button className="icon-btn delete" onClick={()=>setConfirmUserId(u.id)}><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ── Modals ── */}
      {/* Product Modal */}
      {modalOpen && (
        <div className="admin-modal-backdrop open">
          <div className="admin-modal">
            <h3>{editingId ? 'Edit Product' : 'Add Product'}</h3>
            <form onSubmit={saveProd}>
              <div className="form-group"><label>Name</label><input className="form-input" value={pfName} onChange={e=>setPfName(e.target.value)} required/></div>
              <div className="form-group"><label>Category</label><select className="form-input" value={pfCat} onChange={e=>setPfCat(e.target.value as any)}><option value="drinks">Drinks</option><option value="cigarettes">Cigarettes</option><option value="snacks">Snacks</option></select></div>
              <div className="form-group"><label>Price</label><input type="number" className="form-input" value={pfPrice} onChange={e=>setPfPrice(e.target.value)} required/></div>
              <div className="admin-modal-actions">
                <button type="submit" className="btn btn-accent">Save</button>
                <button type="button" className="btn btn-ghost" onClick={()=>setModalOpen(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* User Modal */}
      {userModalOpen && (
        <div className="admin-modal-backdrop open">
          <div className="admin-modal">
            <h3>Add User</h3>
            <form onSubmit={saveUser}>
              <div className="form-group"><label>Name</label><input className="form-input" value={ufName} onChange={e=>setUfName(e.target.value)} required/></div>
              <div className="form-group"><label>Username</label><input className="form-input" value={ufUsername} onChange={e=>setUfUsername(e.target.value)} required/></div>
              <div className="form-group"><label>Password</label><input type="password" className="form-input" value={ufPassword} onChange={e=>setUfPassword(e.target.value)} required/></div>
              <div className="form-group"><label>Role</label><select className="form-input" value={ufRole} onChange={e=>setUfRole(e.target.value as AdminRole)}><option value="manager">Manager</option><option value="rider">Rider</option><option value="owner">Owner</option></select></div>
              <div className="admin-modal-actions">
                <button type="submit" className="btn btn-accent">Create User</button>
                <button type="button" className="btn btn-ghost" onClick={()=>setUserModalOpen(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmations */}
      {confirmId && <div className="confirm-dialog open"><div className="confirm-box"><p>Delete Product?</p><button className="btn btn-danger" onClick={deleteProd}>Yes</button><button onClick={()=>setConfirmId(null)}>No</button></div></div>}
      {confirmOrderDelete && <div className="confirm-dialog open"><div className="confirm-box"><p>Move to Deleted Orders?</p><button className="btn btn-danger" onClick={softDeleteOrder}>Yes</button><button onClick={()=>setConfirmOrderDelete(null)}>No</button></div></div>}
      {confirmOrderHardDelete && <div className="confirm-dialog open"><div className="confirm-box"><p>Permanently Delete?</p><button className="btn btn-danger" onClick={hardDeleteOrder}>Yes</button><button onClick={()=>setConfirmOrderHardDelete(null)}>No</button></div></div>}
      {confirmUserId && <div className="confirm-dialog open"><div className="confirm-box"><p>Delete User?</p><button className="btn btn-danger" onClick={deleteUser}>Yes</button><button onClick={()=>setConfirmUserId(null)}>No</button></div></div>}

      {/* Toasts */}
      <div className="admin-toast-container">
        {toasts.map((t,i) => <div key={i} className="admin-toast">{t}</div>)}
      </div>
    </div>
  );
}
