import React, { useEffect, useState } from 'react';
import axios from 'axios';
import PublicNavbar from '../../components/public/PublicNavbar';
import PublicFooter from '../../components/public/PublicFooter';
import { Search, Filter } from 'lucide-react';
import { API } from '../../contexts/AuthContext';

const STATES = ['All States', 'Tamil Nadu', 'Maharashtra', 'Karnataka', 'Kerala', 'Andhra Pradesh', 'Telangana', 'Gujarat', 'Rajasthan', 'Uttar Pradesh', 'Punjab', 'Haryana', 'West Bengal', 'Assam', 'Madhya Pradesh'];

export default function MembersPage() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [state, setState] = useState('All States');
  const [type, setType] = useState('all');

  useEffect(() => {
    loadMembers();
  }, [state, type]);

  const loadMembers = async () => {
    setLoading(true);
    try {
      const params = {};
      if (state !== 'All States') params.state = state;
      if (type !== 'all') params.membership_type = type;
      if (search) params.search = search;
      const r = await axios.get(`${API}/public/members`, { params });
      setMembers(r.data);
    } catch (e) { setMembers([]); }
    setLoading(false);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    loadMembers();
  };

  return (
    <div style={{ background: '#f8fafc' }}>
      <PublicNavbar />
      <div style={{ paddingTop: '68px' }}>
        <div style={{ background: '#0c3c60', padding: '60px 24px', textAlign: 'center', color: 'white' }}>
          <h1 style={{ fontFamily: 'Poppins, sans-serif', fontSize: 'clamp(24px,4vw,40px)', fontWeight: 800, marginBottom: '12px' }}>Member Directory</h1>
          <p style={{ fontSize: '15px', opacity: 0.8, margin: '0 auto', fontFamily: 'Inter, sans-serif' }}>Search and discover IDSEA members across India</p>
        </div>

        {/* Filters */}
        <div style={{ background: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', padding: '20px 24px' }}>
          <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px', flex: 1, minWidth: '260px' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                <input value={search} onChange={e => setSearch(e.target.value)} className="form-input" style={{ paddingLeft: '36px' }} placeholder="Search by name, organization, specialization..." />
              </div>
              <button type="submit" className="btn-primary" data-testid="members-search-btn">Search</button>
            </form>
            <select value={state} onChange={e => setState(e.target.value)} className="form-select" style={{ width: 'auto', minWidth: '160px' }} data-testid="members-state-filter">
              {STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={type} onChange={e => setType(e.target.value)} className="form-select" style={{ width: 'auto', minWidth: '160px' }} data-testid="members-type-filter">
              <option value="all">All Types</option>
              <option value="academic">Academic</option>
              <option value="entrepreneur">Entrepreneur</option>
              <option value="corporate">Corporate</option>
            </select>
          </div>
        </div>

        {/* Members Grid */}
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '32px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <p style={{ color: '#6b7280', fontSize: '14px', margin: 0, fontFamily: 'Inter, sans-serif' }}>
              Showing <strong style={{ color: '#0c3c60' }}>{members.length}</strong> approved members
            </p>
          </div>

          {loading ? (
            <div className="loading-spinner">Loading members...</div>
          ) : members.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 0', color: '#9ca3af' }}>
              <Filter size={40} style={{ margin: '0 auto 16px', display: 'block', opacity: 0.4 }} />
              <p style={{ fontFamily: 'Poppins, sans-serif', fontSize: '16px' }}>No members found with the selected filters.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '20px' }}>
              {members.map(member => (
                <div key={member.id} data-testid="member-card" style={{
                  background: 'white', borderRadius: '12px', padding: '20px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid #e5e7eb',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.1)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'; }}
                >
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', marginBottom: '12px' }}>
                    {member.photo_url ? (
                      <img src={member.photo_url} alt={member.name} style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                    ) : (
                      <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: '#0c3c60', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '18px', fontFamily: 'Poppins, sans-serif', flexShrink: 0 }}>
                        {member.name?.charAt(0)}
                      </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3 style={{ fontFamily: 'Poppins, sans-serif', fontSize: '14px', fontWeight: 700, color: '#111827', margin: '0 0 4px', lineHeight: 1.3 }}>{member.name}</h3>
                      <span className={`badge badge-${member.membership_type}`}>{member.membership_type}</span>
                    </div>
                  </div>
                  {member.qualification && <div style={{ fontSize: '12px', color: '#4b5563', marginBottom: '4px', fontFamily: 'Inter, sans-serif' }}>{member.qualification}</div>}
                  {member.specialization && <div style={{ fontSize: '12px', color: '#6b7280', fontFamily: 'Inter, sans-serif', marginBottom: '4px' }}>{member.specialization}</div>}
                  {member.organization && <div style={{ fontSize: '12px', color: '#9ca3af', fontFamily: 'Inter, sans-serif' }}>{member.organization}</div>}
                  {member.state && (
                    <div style={{ marginTop: '10px', fontSize: '11px', color: '#1e7a4d', fontWeight: 600, fontFamily: 'Poppins, sans-serif' }}>{member.state}</div>
                  )}
                  {member.membership_id && (
                    <div style={{ marginTop: '8px', fontSize: '11px', color: '#9ca3af', fontFamily: 'Inter, sans-serif' }}>ID: {member.membership_id}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <PublicFooter />
    </div>
  );
}
