import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Users, Clock, TrendingUp, Calendar, ArrowUp } from 'lucide-react';
import { API } from '../../contexts/AuthContext';

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('idsea_token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    axios.get(`${API}/admin/dashboard`, { headers })
      .then(r => { setData(r.data); setLoading(false); })
      .catch(err => {
        const msg = err.response?.data?.detail || err.response?.statusText || err.message || 'Connection failed';
        setError(`${msg} (${err.response?.status || 'network'})`);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="loading-spinner">Loading dashboard...</div>;
  if (!data) return (
    <div className="loading-spinner" data-testid="dashboard-error">
      <p>Failed to load dashboard</p>
      <p style={{ fontSize: '12px', color: '#ef4444', marginTop: '8px' }}>{error}</p>
      <button onClick={() => window.location.reload()} style={{ marginTop: '12px', padding: '8px 16px', background: '#0c3c60', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}>
        Retry
      </button>
    </div>
  );

  const statCards = [
    { label: 'Total Members', value: data.total_members, icon: Users, color: '#0c3c60', bg: '#dbeafe', change: `+${data.new_this_month} this month` },
    { label: 'Pending Approvals', value: data.pending_approvals, icon: Clock, color: '#d97706', bg: '#fef3c7', change: 'Needs attention' },
    { label: 'New This Month', value: data.new_this_month, icon: TrendingUp, color: '#1e7a4d', bg: '#d1fae5', change: 'Current month' },
    { label: 'Upcoming Events', value: data.upcoming_events, icon: Calendar, color: '#7c3aed', bg: '#ede9fe', change: 'Scheduled' },
  ];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Dashboard Overview</h1>
        <span style={{ fontSize: '13px', color: '#6b7280', fontFamily: 'Inter, sans-serif' }}>
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </span>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        {statCards.map(({ label, value, icon: Icon, color, bg, change }) => (
          <div key={label} className="stat-card" data-testid={`dashboard-stat-${label.toLowerCase().replace(/\s+/g, '-')}`}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={20} style={{ color }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#1e7a4d', fontSize: '12px', fontFamily: 'Inter, sans-serif' }}>
                <ArrowUp size={12} /><span>{change}</span>
              </div>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color, fontFamily: 'Poppins, sans-serif', lineHeight: 1 }}>{value}</div>
            <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px', fontFamily: 'Inter, sans-serif' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
        {/* Recent Members */}
        <div className="admin-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontFamily: 'Poppins, sans-serif', fontSize: '15px', fontWeight: 700, color: '#0c3c60', margin: 0 }}>Recent Members</h3>
            <a href="/admin/members" style={{ color: '#1e7a4d', fontSize: '12px', textDecoration: 'none', fontFamily: 'Poppins, sans-serif', fontWeight: 600 }}>View All</a>
          </div>
          {data.recent_members?.length === 0 ? (
            <p style={{ color: '#6b7280', fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>No members yet</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {data.recent_members?.map((m, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: '#f8fafc', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: '#0c3c60', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '13px', fontFamily: 'Poppins, sans-serif', flexShrink: 0 }}>
                      {m.name?.charAt(0)?.toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#111827', fontFamily: 'Inter, sans-serif' }}>{m.name}</div>
                      <div style={{ fontSize: '11px', color: '#9ca3af' }}>{m.membership_type}</div>
                    </div>
                  </div>
                  <span className={`badge badge-${m.status}`}>{m.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Payments */}
        <div className="admin-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontFamily: 'Poppins, sans-serif', fontSize: '15px', fontWeight: 700, color: '#0c3c60', margin: 0 }}>Recent Payments</h3>
            <a href="/admin/payments" style={{ color: '#1e7a4d', fontSize: '12px', textDecoration: 'none', fontFamily: 'Poppins, sans-serif', fontWeight: 600 }}>View All</a>
          </div>
          {data.recent_payments?.length === 0 ? (
            <p style={{ color: '#6b7280', fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>No payments yet</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {data.recent_payments?.map((p, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: '#f8fafc', borderRadius: '8px' }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#111827', fontFamily: 'Inter, sans-serif' }}>{p.member_name || 'Unknown'}</div>
                    <div style={{ fontSize: '11px', color: '#9ca3af' }}>{p.membership_type}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, color: '#1e7a4d', fontSize: '14px', fontFamily: 'Poppins, sans-serif' }}>₹{p.amount?.toLocaleString()}</div>
                    <span className={`badge badge-${p.status}`}>{p.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="admin-card" style={{ marginTop: '20px' }}>
        <h3 style={{ fontFamily: 'Poppins, sans-serif', fontSize: '15px', fontWeight: 700, color: '#0c3c60', marginBottom: '16px' }}>Quick Actions</h3>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {[
            { label: 'Review Pending Members', href: '/admin/members?status=pending', color: '#d97706' },
            { label: 'Add New Event', href: '/admin/events', color: '#1e7a4d' },
            { label: 'Post News', href: '/admin/news', color: '#7c3aed' },
            { label: 'Send Email', href: '/admin/email', color: '#0c3c60' },
            { label: 'View Reports', href: '/admin/reports', color: '#dc2626' },
          ].map(({ label, href, color }) => (
            <a key={label} href={href} style={{
              background: 'white', border: `2px solid ${color}`, color,
              padding: '8px 16px', borderRadius: '8px', textDecoration: 'none',
              fontSize: '13px', fontWeight: 600, fontFamily: 'Poppins, sans-serif',
              transition: 'all 0.2s ease'
            }}
              onMouseEnter={e => { e.currentTarget.style.background = color; e.currentTarget.style.color = 'white'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.color = color; }}
            >
              {label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
