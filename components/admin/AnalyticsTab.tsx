'use client';
import React, { useState, useMemo } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import type { Order } from '@/lib/types';

type Timeframe = 'day' | 'week' | 'month' | 'year' | 'all';

export default function AnalyticsTab({ orders }: { orders: Order[] }) {
  const [timeframe, setTimeframe] = useState<Timeframe>('week');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  const chartData = useMemo(() => {
    const activeOrders = orders.filter(o => !o.isDeleted && o.status !== 'cancelled')
      .sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    
    // Filter by timeframe
    const now = new Date();
    let filtered = activeOrders;
    
    if (timeframe === 'day') {
      const today = now.toDateString();
      filtered = activeOrders.filter(o => new Date(o.timestamp).toDateString() === today);
    } else if (timeframe === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filtered = activeOrders.filter(o => new Date(o.timestamp) >= weekAgo);
    } else if (timeframe === 'month') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      filtered = activeOrders.filter(o => new Date(o.timestamp) >= monthAgo);
    } else if (timeframe === 'year') {
      const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      filtered = activeOrders.filter(o => new Date(o.timestamp) >= yearAgo);
    } else if (timeframe === 'all' && customStart && customEnd) {
      const s = new Date(customStart);
      const e = new Date(customEnd);
      e.setHours(23, 59, 59, 999);
      filtered = activeOrders.filter(o => {
        const d = new Date(o.timestamp);
        return d >= s && d <= e;
      });
    }

    // Group data by date string for the chart
    const groups: Record<string, { date: string, revenue: number, orders: number }> = {};
    
    filtered.forEach(o => {
      const d = new Date(o.timestamp);
      // Format based on timeframe
      let key = d.toLocaleDateString();
      if (timeframe === 'day') {
        key = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } else if (timeframe === 'year') {
        key = d.toLocaleString('default', { month: 'short', year: 'numeric' });
      }

      if (!groups[key]) groups[key] = { date: key, revenue: 0, orders: 0 };
      groups[key].revenue += (o.total || 0);
      groups[key].orders += 1;
    });

    return Object.values(groups);
  }, [orders, timeframe, customStart, customEnd]);

  const totalRevenue = chartData.reduce((s, d) => s + d.revenue, 0);
  const totalOrders = chartData.reduce((s, d) => s + d.orders, 0);

  const completedOrders = useMemo(() => {
    let list = orders.filter(o => o.status === 'delivered' || o.status === 'cancelled').sort((a,b)=>new Date(b.timestamp).getTime()-new Date(a.timestamp).getTime());
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(o => o.name.toLowerCase().includes(q) || o.phone.includes(q) || (o.remarks && o.remarks.toLowerCase().includes(q)));
    }
    return list;
  }, [orders, searchQuery]);

  return (
    <div className="analytics-wrap" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '20px', fontWeight: 600 }}>Reports</h3>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <select className="table-filter" value={timeframe} onChange={e => setTimeframe(e.target.value as Timeframe)}>
            <option value="day">Today</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
            <option value="year">Last Year</option>
            <option value="all">Custom</option>
          </select>
          {timeframe === 'all' && (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input type="date" className="table-filter" value={customStart} onChange={e => setCustomStart(e.target.value)} />
              <span>—</span>
              <input type="date" className="table-filter" value={customEnd} onChange={e => setCustomEnd(e.target.value)} />
            </div>
          )}
        </div>
      </div>

      <div className="stat-grid" style={{ marginBottom: '32px' }}>
        <div className="stat-card">
          <div className="stat-label">Period Revenue</div>
          <div className="stat-value" style={{ color: 'var(--clr-accent)' }}>Rs.{totalRevenue.toLocaleString()}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Period Orders</div>
          <div className="stat-value">{totalOrders}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Avg. Order Value</div>
          <div className="stat-value">Rs.{(totalOrders ? Math.round(totalRevenue / totalOrders) : 0).toLocaleString()}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        <div>
          <h4 style={{ marginBottom: '12px', fontSize: '15px', fontWeight: 600, color: 'var(--clr-text-1)' }}>Revenue Overview</h4>
          <div className="analytics-card" style={{ background: 'var(--clr-surface)', border: '1px solid var(--clr-border)', padding: '16px', height: '250px' }}>
            {chartData.length === 0 ? (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--clr-text-3)' }}>No data</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--clr-border)" vertical={false} />
                  <XAxis dataKey="date" stroke="var(--clr-text-3)" fontSize={10} tickMargin={8} />
                  <YAxis stroke="var(--clr-text-3)" fontSize={10} tickFormatter={(v) => `Rs.${v >= 1000 ? (v/1000).toFixed(1).replace('.0','') + 'k' : v}`} width={50} />
                  <Tooltip contentStyle={{ background: 'var(--clr-bg-2)', border: '1px solid var(--clr-border)', borderRadius: '8px', fontSize: '12px' }} itemStyle={{ color: 'var(--clr-accent)' }} />
                  <Line type="monotone" dataKey="revenue" name="Revenue" stroke="var(--clr-accent)" strokeWidth={3} dot={{ r: 3, fill: 'var(--clr-bg)' }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div>
          <h4 style={{ marginBottom: '12px', fontSize: '15px', fontWeight: 600, color: 'var(--clr-text-1)' }}>Number of Orders</h4>
          <div className="analytics-card" style={{ background: 'var(--clr-surface)', border: '1px solid var(--clr-border)', padding: '16px', height: '250px' }}>
            {chartData.length === 0 ? (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--clr-text-3)' }}>No data</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--clr-border)" vertical={false} />
                  <XAxis dataKey="date" stroke="var(--clr-text-3)" fontSize={10} tickMargin={8} />
                  <YAxis stroke="var(--clr-text-3)" fontSize={10} tickFormatter={(v) => v >= 1000 ? (v/1000).toFixed(1).replace('.0','') + 'k' : v} allowDecimals={false} width={30} />
                  <Tooltip contentStyle={{ background: 'var(--clr-bg-2)', border: '1px solid var(--clr-border)', borderRadius: '8px', fontSize: '12px' }} itemStyle={{ color: '#8b5cf6' }} />
                  <Line type="monotone" dataKey="orders" name="Orders" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 3, fill: 'var(--clr-bg)' }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      <div className="orders-wrap">
        <div className="orders-header">
          <h3>Completed Orders</h3>
          <input type="search" className="table-search" placeholder="Search orders..." value={searchQuery} onChange={e=>setSearchQuery(e.target.value)}/>
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr>
              <th>Customer</th><th>Date</th><th>Items</th><th>Total</th><th>Status</th><th></th>
            </tr></thead>
            <tbody>
              {completedOrders.length === 0 ? (
                <tr><td colSpan={5} style={{textAlign:'center', color:'var(--clr-text-3)'}}>No completed orders found.</td></tr>
              ) : (
                completedOrders.map(order => {
                  const d = new Date(order.timestamp);
                  return (
                    <React.Fragment key={order.id}>
                      <tr>
                        <td>
                          <strong>{order.name}</strong><br/>
                          <span style={{fontSize:'11px'}}>{order.phone}</span>
                        </td>
                        <td style={{fontSize:'12px'}}>{d.toLocaleDateString()} {d.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</td>
                        <td style={{fontSize:'12px'}}>{order.items?.reduce((s,i)=>s+i.qty,0)||0} items</td>
                        <td style={{fontWeight:700,color:'var(--clr-accent)'}}>Rs.{order.total?.toLocaleString()}</td>
                        <td>
                          <span style={{
                            fontSize:'11px', fontWeight:600, textTransform:'uppercase',
                            color: order.status === 'delivered' ? 'var(--clr-accent)' : 'var(--clr-red)'
                          }}>
                            {order.status}
                          </span>
                        </td>
                        <td>
                          <button className="expand-btn" onClick={()=>setExpandedOrder(expandedOrder===order.id?null:order.id)}>
                            {expandedOrder===order.id?'⌃':'⌄'}
                          </button>
                        </td>
                      </tr>
                      {expandedOrder === order.id && (
                        <tr className="order-detail-row">
                          <td colSpan={6} className="order-detail-cell" style={{fontSize: '12px', background: 'var(--clr-bg)', padding: '8px 12px'}}>
                            {order.items?.map((item,i) => (
                              <div key={i}><strong>{item.name}</strong> ×{item.qty} — Rs.{item.price*item.qty}</div>
                            ))}
                            {order.remarks && (
                              <div style={{marginTop:'10px'}}>
                                <strong>Message:</strong> {order.remarks}
                              </div>
                            )}
                            <div style={{marginTop:'10px'}}><strong>Address:</strong> {order.address}</div>
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
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
