import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Users, IndianRupee, TrendingUp, MapPin, BarChart3 } from 'lucide-react';
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { API } from '../../contexts/AuthContext';

const COLORS = ['#0c3c60', '#1e7a4d', '#7c3aed', '#d97706', '#ef4444', '#06b6d4', '#ec4899'];

export default function ReportsAdmin() {
  const [stats, setStats] = useState(null);
  const [charts, setCharts] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      axios.get(`${API}/admin/reports/stats`),
      axios.get(`${API}/admin/reports/monthly-growth`)
    ]).then(([s, c]) => {
      setStats(s.data);
      setCharts(c.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-spinner">Loading reports...</div>;
  if (!stats) return <div className="loading-spinner">Failed to load reports.</div>;

  const typeData = charts?.type_distribution || [];
  const stateData = charts?.state_distribution || [];
  const memberGrowth = charts?.member_growth || [];
  const revenueGrowth = charts?.revenue_growth || [];
  const statusData = charts?.status_distribution || [];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Reports & Analytics</h1>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: 'Total Members', value: stats.total_members, icon: Users, color: '#0c3c60', bg: '#dbeafe' },
          { label: 'Approved', value: stats.approved_members, icon: Users, color: '#1e7a4d', bg: '#d1fae5' },
          { label: 'Pending', value: stats.pending_members, icon: Users, color: '#d97706', bg: '#fef3c7' },
          { label: 'New This Month', value: stats.new_this_month, icon: TrendingUp, color: '#7c3aed', bg: '#ede9fe' },
          { label: 'Revenue', value: `₹${(stats.total_revenue || 0).toLocaleString()}`, icon: IndianRupee, color: '#1e7a4d', bg: '#d1fae5' },
          { label: 'Events', value: stats.events?.total || 0, icon: BarChart3, color: '#0c3c60', bg: '#dbeafe' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="stat-card" data-testid={`report-stat-${label.toLowerCase().replace(/\s+/g, '-')}`}>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px' }}>
              <Icon size={17} style={{ color }} />
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color, fontFamily: 'Poppins', lineHeight: 1 }}>{value}</div>
            <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px', fontFamily: 'Inter' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px', marginBottom: '20px' }}>
        {/* Member Growth */}
        <div className="admin-card" data-testid="member-growth-chart">
          <h3 style={{ fontFamily: 'Poppins', fontSize: '14px', fontWeight: 700, color: '#0c3c60', marginBottom: '16px' }}>Member Growth (Monthly)</h3>
          {memberGrowth.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={memberGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#6b7280' }} />
                <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }} />
                <Bar dataKey="members" fill="#0c3c60" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p style={{ color: '#9ca3af', fontSize: '13px', textAlign: 'center', padding: '40px 0' }}>No growth data yet</p>}
        </div>

        {/* Membership Type Distribution */}
        <div className="admin-card" data-testid="type-distribution-chart">
          <h3 style={{ fontFamily: 'Poppins', fontSize: '14px', fontWeight: 700, color: '#0c3c60', marginBottom: '16px' }}>Membership Type Distribution</h3>
          {typeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={typeData} dataKey="count" nameKey="type" cx="50%" cy="50%" outerRadius={80} label={({ type, count }) => `${type} (${count})`} labelLine={true}>
                  {typeData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : <p style={{ color: '#9ca3af', fontSize: '13px', textAlign: 'center', padding: '40px 0' }}>No data</p>}
        </div>
      </div>

      {/* Charts Row 2 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px', marginBottom: '20px' }}>
        {/* Revenue Chart */}
        <div className="admin-card" data-testid="revenue-chart">
          <h3 style={{ fontFamily: 'Poppins', fontSize: '14px', fontWeight: 700, color: '#0c3c60', marginBottom: '16px' }}>Revenue (Monthly)</h3>
          {revenueGrowth.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={revenueGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#6b7280' }} />
                <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }} formatter={(v) => [`₹${v.toLocaleString()}`, 'Revenue']} />
                <Line type="monotone" dataKey="revenue" stroke="#1e7a4d" strokeWidth={2} dot={{ r: 4, fill: '#1e7a4d' }} />
              </LineChart>
            </ResponsiveContainer>
          ) : <p style={{ color: '#9ca3af', fontSize: '13px', textAlign: 'center', padding: '40px 0' }}>No revenue data yet</p>}
        </div>

        {/* Status Distribution */}
        <div className="admin-card" data-testid="status-distribution-chart">
          <h3 style={{ fontFamily: 'Poppins', fontSize: '14px', fontWeight: 700, color: '#0c3c60', marginBottom: '16px' }}>Member Status Distribution</h3>
          {statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={statusData} dataKey="count" nameKey="status" cx="50%" cy="50%" innerRadius={50} outerRadius={80} label={({ status, count }) => `${status} (${count})`}>
                  {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : <p style={{ color: '#9ca3af', fontSize: '13px', textAlign: 'center', padding: '40px 0' }}>No data</p>}
        </div>
      </div>

      {/* State Distribution */}
      <div className="admin-card" data-testid="state-distribution-chart">
        <h3 style={{ fontFamily: 'Poppins', fontSize: '14px', fontWeight: 700, color: '#0c3c60', marginBottom: '16px' }}>
          <MapPin size={15} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />Members by State
        </h3>
        {stateData.length > 0 ? (
          <ResponsiveContainer width="100%" height={Math.max(200, stateData.length * 36)}>
            <BarChart data={stateData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#6b7280' }} />
              <YAxis type="category" dataKey="state" width={120} tick={{ fontSize: 11, fill: '#374151' }} />
              <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }} />
              <Bar dataKey="count" fill="#1e7a4d" radius={[0, 4, 4, 0]} barSize={18} />
            </BarChart>
          </ResponsiveContainer>
        ) : <p style={{ color: '#9ca3af', fontSize: '13px', textAlign: 'center', padding: '40px 0' }}>No state data available</p>}
      </div>
    </div>
  );
}
