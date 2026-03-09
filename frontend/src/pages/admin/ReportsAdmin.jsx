import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { BarChart3, Users, IndianRupee, TrendingUp, MapPin } from 'lucide-react';
import { API } from '../../contexts/AuthContext';

export default function ReportsAdmin() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API}/admin/reports/stats`).then(r => { setData(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-spinner">Loading reports...</div>;
  if (!data) return <div className="loading-spinner">Failed to load reports.</div>;

  const memberTypeData = [
    { label: 'Academic', count: data.membership_types?.academic || 0, color: '#1e40af', bg: '#dbeafe' },
    { label: 'Entrepreneur', count: data.membership_types?.entrepreneur || 0, color: '#5b21b6', bg: '#ede9fe' },
    { label: 'Corporate', count: data.membership_types?.corporate || 0, color: '#92400e', bg: '#fef3c7' },
  ];
  const totalApproved = memberTypeData.reduce((s, t) => s + t.count, 0);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Reports & Analytics</h1>
      </div>

      {/* Overview Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: 'Total Members', value: data.total_members, icon: Users, color: '#0c3c60', bg: '#dbeafe' },
          { label: 'Approved', value: data.approved_members, icon: Users, color: '#1e7a4d', bg: '#d1fae5' },
          { label: 'Pending', value: data.pending_members, icon: Users, color: '#d97706', bg: '#fef3c7' },
          { label: 'New This Month', value: data.new_this_month, icon: TrendingUp, color: '#7c3aed', bg: '#ede9fe' },
          { label: 'Total Revenue', value: `₹${(data.total_revenue || 0).toLocaleString()}`, icon: IndianRupee, color: '#1e7a4d', bg: '#d1fae5' },
          { label: 'Total Events', value: data.events?.total || 0, icon: BarChart3, color: '#0c3c60', bg: '#dbeafe' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="stat-card" data-testid={`report-stat-${label.toLowerCase().replace(/\s+/g, '-')}`}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
              <Icon size={18} style={{ color }} />
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color, fontFamily: 'Poppins', lineHeight: 1 }}>{value}</div>
            <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px', fontFamily: 'Inter' }}>{label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
        {/* Membership Distribution */}
        <div className="admin-card">
          <h3 style={{ fontFamily: 'Poppins', fontSize: '15px', fontWeight: 700, color: '#0c3c60', marginBottom: '20px' }}>Membership Distribution</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {memberTypeData.map(({ label, count, color, bg }) => (
              <div key={label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#374151', fontFamily: 'Inter' }}>{label}</span>
                  <span style={{ fontSize: '13px', fontWeight: 700, color, fontFamily: 'Poppins' }}>{count}</span>
                </div>
                <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${totalApproved ? (count / totalApproved * 100) : 0}%`, background: color, borderRadius: '4px', transition: 'width 0.5s ease' }} />
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: '16px', padding: '12px', background: '#f8fafc', borderRadius: '8px', textAlign: 'center' }}>
            <span style={{ fontSize: '12px', color: '#6b7280' }}>Total Approved: </span>
            <span style={{ fontSize: '14px', fontWeight: 700, color: '#0c3c60', fontFamily: 'Poppins' }}>{totalApproved}</span>
          </div>
        </div>

        {/* State Distribution */}
        <div className="admin-card">
          <h3 style={{ fontFamily: 'Poppins', fontSize: '15px', fontWeight: 700, color: '#0c3c60', marginBottom: '20px' }}>
            <MapPin size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />Top States
          </h3>
          {data.state_stats?.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {data.state_stats.map((s, i) => (
                <div key={s.state} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: i === 0 ? '#f0fdf4' : '#f8fafc', borderRadius: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#9ca3af', fontFamily: 'Poppins', width: '20px' }}>#{i + 1}</span>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>{s.state}</span>
                  </div>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#1e7a4d', fontFamily: 'Poppins' }}>{s.count}</span>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: '#9ca3af', fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>No state data available</p>
          )}
        </div>

        {/* Events Summary */}
        <div className="admin-card">
          <h3 style={{ fontFamily: 'Poppins', fontSize: '15px', fontWeight: 700, color: '#0c3c60', marginBottom: '20px' }}>Events Summary</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={{ padding: '16px', background: '#dbeafe', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0c3c60', fontFamily: 'Poppins' }}>{data.events?.total || 0}</div>
              <div style={{ fontSize: '12px', color: '#1e40af', fontFamily: 'Inter' }}>Total Events</div>
            </div>
            <div style={{ padding: '16px', background: '#d1fae5', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#1e7a4d', fontFamily: 'Poppins' }}>{data.events?.upcoming || 0}</div>
              <div style={{ fontSize: '12px', color: '#065f46', fontFamily: 'Inter' }}>Upcoming</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
