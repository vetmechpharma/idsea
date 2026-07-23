import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import PublicNavbar from '../../components/public/PublicNavbar';
import PublicFooter from '../../components/public/PublicFooter';
import { Search, Users, MapPin, Briefcase, GraduationCap, ChevronLeft, ChevronRight, LayoutGrid, List, Award } from 'lucide-react';
import SEOHead from '../../components/SEOHead';
import { API } from '../../contexts/AuthContext';

const STATES = ['All States', 'Tamil Nadu', 'Maharashtra', 'Karnataka', 'Kerala', 'Andhra Pradesh', 'Telangana', 'Gujarat', 'Rajasthan', 'Uttar Pradesh', 'Punjab', 'Haryana', 'West Bengal', 'Assam', 'Madhya Pradesh', 'Bihar', 'Odisha', 'Chhattisgarh', 'Jharkhand', 'Uttarakhand'];
const PER_PAGE = 24;

const TYPE_COLORS = {
  academic: { bg: '#eff6ff', border: '#93c5fd', text: '#1e40af', dot: '#2563eb' },
  entrepreneur: { bg: '#fef3c7', border: '#fcd34d', text: '#92400e', dot: '#d97706' },
  corporate: { bg: '#f0fdf4', border: '#86efac', text: '#166534', dot: '#16a34a' },
  international: { bg: '#faf5ff', border: '#c4b5fd', text: '#5b21b6', dot: '#7c3aed' },
};

const capitalize = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : '';

export default function MembersPage() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [state, setState] = useState('All States');
  const [type, setType] = useState('all');
  const [pc, setPc] = useState(null);
  const [page, setPage] = useState(1);
  const [view, setView] = useState('grid');

  useEffect(() => {
    axios.get(`${API}/public/page-content/members`).then(r => setPc(r.data)).catch(() => setPc({}));
  }, []);

  useEffect(() => { loadMembers(); }, [state, type]);

  const loadMembers = async () => {
    setLoading(true);
    try {
      const params = {};
      if (state !== 'All States') params.state = state;
      if (type !== 'all') params.membership_type = type;
      if (search) params.search = search;
      const r = await axios.get(`${API}/public/members`, { params });
      setMembers(r.data);
      setPage(1);
    } catch { setMembers([]); }
    setLoading(false);
  };

  const handleSearch = (e) => { e.preventDefault(); loadMembers(); };

  const totalPages = Math.ceil(members.length / PER_PAGE);
  const paginated = useMemo(() => members.slice((page - 1) * PER_PAGE, page * PER_PAGE), [members, page]);

  const typeCounts = useMemo(() => {
    const c = { all: members.length, academic: 0, entrepreneur: 0, corporate: 0, international: 0 };
    members.forEach(m => { if (c[m.membership_type] !== undefined) c[m.membership_type]++; });
    return c;
  }, [members]);

  const fullName = (m) => m.prefix ? `${m.prefix} ${m.name}` : m.name;
  const tc = (t) => TYPE_COLORS[t] || TYPE_COLORS.academic;

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh' }}>
      <SEOHead page="members" fallback={{ title: 'IDSEA Member Directory', description: 'Search and discover IDSEA members across India.' }} />
      <PublicNavbar />

      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, #0c3c60 0%, #164e7e 50%, #1a6da0 100%)', padding: '170px 24px 48px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'radial-gradient(circle at 20% 80%, rgba(255,255,255,0.04) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.06) 0%, transparent 50%)' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)', borderRadius: '24px', padding: '6px 18px', marginBottom: '16px', border: '1px solid rgba(255,255,255,0.15)' }}>
            <Users size={14} style={{ color: '#93c5fd' }} />
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#bfdbfe', fontFamily: 'Poppins, sans-serif', letterSpacing: '0.5px' }}>{members.length} MEMBERS</span>
          </div>
          <h1 style={{ fontFamily: 'Poppins, sans-serif', fontSize: 'clamp(26px, 4vw, 42px)', fontWeight: 800, color: 'white', marginBottom: '12px', letterSpacing: '-0.02em' }}>
            {pc?.hero_title || 'Member Directory'}
          </h1>
          <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.7)', margin: '0 auto', fontFamily: 'Inter, sans-serif', maxWidth: '500px', lineHeight: 1.6 }}>
            {pc?.hero_subtitle || 'Discover dairy scientists and entrepreneurs across India'}
          </p>
        </div>
      </div>

      {/* Search & Filters */}
      <div style={{ background: 'white', borderBottom: '1px solid #e5e7eb', position: 'sticky', top: 0, zIndex: 30 }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '16px 24px' }}>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '260px' }}>
              <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
              <input
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search by name, organization, specialization..."
                data-testid="members-search-input"
                style={{ width: '100%', padding: '10px 14px 10px 40px', border: '1px solid #e5e7eb', borderRadius: '10px', fontSize: '14px', fontFamily: 'Inter, sans-serif', outline: 'none', transition: 'border-color 0.2s', background: '#fafbfc' }}
                onFocus={e => e.target.style.borderColor = '#0c3c60'}
                onBlur={e => e.target.style.borderColor = '#e5e7eb'}
              />
            </div>
            <button type="submit" data-testid="members-search-btn" style={{ padding: '10px 20px', background: '#0c3c60', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 600, fontSize: '13px', cursor: 'pointer', fontFamily: 'Poppins, sans-serif', whiteSpace: 'nowrap' }}>
              Search
            </button>
            <select value={state} onChange={e => setState(e.target.value)} data-testid="members-state-filter"
              style={{ padding: '10px 14px', border: '1px solid #e5e7eb', borderRadius: '10px', fontSize: '13px', fontFamily: 'Inter, sans-serif', background: '#fafbfc', minWidth: '160px', cursor: 'pointer' }}>
              {STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <div style={{ display: 'flex', border: '1px solid #e5e7eb', borderRadius: '10px', overflow: 'hidden' }}>
              <button type="button" onClick={() => setView('grid')} style={{ padding: '8px 12px', background: view === 'grid' ? '#0c3c60' : 'white', color: view === 'grid' ? 'white' : '#6b7280', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }} data-testid="view-grid"><LayoutGrid size={16} /></button>
              <button type="button" onClick={() => setView('list')} style={{ padding: '8px 12px', background: view === 'list' ? '#0c3c60' : 'white', color: view === 'list' ? 'white' : '#6b7280', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }} data-testid="view-list"><List size={16} /></button>
            </div>
          </form>

          {/* Type Pills */}
          <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
            {[{ key: 'all', label: 'All' }, { key: 'academic', label: 'Academic' }, { key: 'entrepreneur', label: 'Entrepreneur' }, { key: 'corporate', label: 'Corporate' }, { key: 'international', label: 'International' }].map(t => (
              <button key={t.key} onClick={() => setType(t.key)} data-testid={`type-filter-${t.key}`}
                style={{
                  padding: '6px 16px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                  fontFamily: 'Poppins, sans-serif', border: 'none', transition: 'all 0.2s',
                  background: type === t.key ? '#0c3c60' : '#f1f5f9',
                  color: type === t.key ? 'white' : '#64748b',
                }}>
                {t.label} <span style={{ opacity: 0.7, marginLeft: '4px' }}>({typeCounts[t.key] || 0})</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '28px 24px 60px' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '80px 0', gap: '16px' }}>
            <div style={{ width: '40px', height: '40px', border: '3px solid #e5e7eb', borderTopColor: '#0c3c60', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <span style={{ color: '#6b7280', fontSize: '14px', fontFamily: 'Inter' }}>Loading members...</span>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : members.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <Users size={48} style={{ margin: '0 auto 16px', display: 'block', color: '#d1d5db' }} />
            <p style={{ fontFamily: 'Poppins, sans-serif', fontSize: '16px', color: '#9ca3af', fontWeight: 600 }}>No members found</p>
            <p style={{ fontSize: '13px', color: '#d1d5db' }}>Try adjusting your search or filters</p>
          </div>
        ) : view === 'grid' ? (
          /* Grid View */
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
            {paginated.map(member => {
              const colors = tc(member.membership_type);
              return (
                <div key={member.id} data-testid="member-card" style={{
                  background: 'white', borderRadius: '14px', overflow: 'hidden',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
                  border: '1px solid #f1f5f9', transition: 'all 0.25s ease', cursor: 'default',
                }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 28px rgba(0,0,0,0.08)'; e.currentTarget.style.borderColor = colors.border; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)'; e.currentTarget.style.borderColor = '#f1f5f9'; }}
                >
                  {/* Top color strip */}
                  <div style={{ height: '4px', background: `linear-gradient(90deg, ${colors.dot}, ${colors.border})` }} />
                  <div style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                      {member.photo_url ? (
                        <img src={member.photo_url} alt={fullName(member)} style={{ width: '56px', height: '56px', borderRadius: '14px', objectFit: 'cover', flexShrink: 0, border: `2px solid ${colors.border}` }} />
                      ) : (
                        <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: `linear-gradient(135deg, ${colors.dot}, ${colors.text})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: '20px', fontFamily: 'Poppins, sans-serif', flexShrink: 0 }}>
                          {member.name?.charAt(0)}
                        </div>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h3 style={{ fontFamily: 'Poppins, sans-serif', fontSize: '15px', fontWeight: 700, color: '#111827', margin: '0 0 6px', lineHeight: 1.3 }}>{fullName(member)}</h3>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '3px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, fontFamily: 'Poppins, sans-serif', background: colors.bg, color: colors.text, border: `1px solid ${colors.border}` }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: colors.dot }} />
                          {capitalize(member.membership_type)}
                        </span>
                      </div>
                    </div>

                    <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {member.qualification && (
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '12px', color: '#4b5563', fontFamily: 'Inter, sans-serif' }}>
                          <GraduationCap size={13} style={{ flexShrink: 0, marginTop: '1px', color: '#9ca3af' }} />
                          <span style={{ lineHeight: 1.4 }}>{member.qualification}</span>
                        </div>
                      )}
                      {member.organization && (
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '12px', color: '#4b5563', fontFamily: 'Inter, sans-serif' }}>
                          <Briefcase size={13} style={{ flexShrink: 0, marginTop: '1px', color: '#9ca3af' }} />
                          <span style={{ lineHeight: 1.4 }}>{member.organization}</span>
                        </div>
                      )}
                      {member.state && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#1e7a4d', fontWeight: 600, fontFamily: 'Inter, sans-serif' }}>
                          <MapPin size={13} style={{ flexShrink: 0, color: '#1e7a4d' }} />
                          {member.state}
                        </div>
                      )}
                    </div>

                    {member.membership_id && (
                      <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Award size={12} style={{ color: '#9ca3af' }} />
                        <span style={{ fontSize: '11px', color: '#9ca3af', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.5px' }}>{member.membership_id}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* List View */
          <div style={{ background: 'white', borderRadius: '14px', overflow: 'hidden', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e5e7eb' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: '#64748b', fontFamily: 'Poppins, sans-serif', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Member</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: '#64748b', fontFamily: 'Poppins, sans-serif', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Type</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: '#64748b', fontFamily: 'Poppins, sans-serif', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Qualification</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: '#64748b', fontFamily: 'Poppins, sans-serif', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Organization</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: '#64748b', fontFamily: 'Poppins, sans-serif', letterSpacing: '0.5px', textTransform: 'uppercase' }}>State</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: '#64748b', fontFamily: 'Poppins, sans-serif', letterSpacing: '0.5px', textTransform: 'uppercase' }}>ID</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((member, idx) => {
                  const colors = tc(member.membership_type);
                  return (
                    <tr key={member.id} data-testid="member-row" style={{ borderBottom: '1px solid #f1f5f9', background: idx % 2 === 0 ? 'white' : '#fafbfc', transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f0f9ff'}
                      onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 0 ? 'white' : '#fafbfc'}>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          {member.photo_url ? (
                            <img src={member.photo_url} alt="" style={{ width: '36px', height: '36px', borderRadius: '10px', objectFit: 'cover', border: `2px solid ${colors.border}` }} />
                          ) : (
                            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: `linear-gradient(135deg, ${colors.dot}, ${colors.text})`, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '14px', fontFamily: 'Poppins', flexShrink: 0 }}>
                              {member.name?.charAt(0)}
                            </div>
                          )}
                          <span style={{ fontWeight: 600, fontSize: '13px', color: '#111827', fontFamily: 'Poppins, sans-serif' }}>{fullName(member)}</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '3px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, background: colors.bg, color: colors.text, border: `1px solid ${colors.border}` }}>
                          <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: colors.dot }} />
                          {capitalize(member.membership_type)}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '12px', color: '#4b5563', fontFamily: 'Inter, sans-serif', maxWidth: '180px' }}>{member.qualification || '-'}</td>
                      <td style={{ padding: '12px 16px', fontSize: '12px', color: '#4b5563', fontFamily: 'Inter, sans-serif', maxWidth: '200px' }}>{member.organization || '-'}</td>
                      <td style={{ padding: '12px 16px' }}>
                        {member.state ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#1e7a4d', fontWeight: 600 }}><MapPin size={11} />{member.state}</span> : '-'}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '11px', color: '#9ca3af', fontFamily: 'JetBrains Mono, monospace' }}>{member.membership_id || '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '32px' }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} data-testid="page-prev"
              style={{ padding: '8px 14px', borderRadius: '10px', border: '1px solid #e5e7eb', background: 'white', cursor: page === 1 ? 'default' : 'pointer', opacity: page === 1 ? 0.4 : 1, display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: 600, color: '#374151' }}>
              <ChevronLeft size={16} /> Prev
            </button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              let p;
              if (totalPages <= 7) p = i + 1;
              else if (page <= 4) p = i + 1;
              else if (page >= totalPages - 3) p = totalPages - 6 + i;
              else p = page - 3 + i;
              return (
                <button key={p} onClick={() => setPage(p)} data-testid={`page-${p}`}
                  style={{ width: '36px', height: '36px', borderRadius: '10px', border: page === p ? 'none' : '1px solid #e5e7eb', background: page === p ? '#0c3c60' : 'white', color: page === p ? 'white' : '#374151', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Poppins' }}>
                  {p}
                </button>
              );
            })}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} data-testid="page-next"
              style={{ padding: '8px 14px', borderRadius: '10px', border: '1px solid #e5e7eb', background: 'white', cursor: page === totalPages ? 'default' : 'pointer', opacity: page === totalPages ? 0.4 : 1, display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: 600, color: '#374151' }}>
              Next <ChevronRight size={16} />
            </button>
          </div>
        )}
        {totalPages > 1 && (
          <p style={{ textAlign: 'center', fontSize: '12px', color: '#9ca3af', marginTop: '12px', fontFamily: 'Inter' }}>
            Page {page} of {totalPages} ({members.length} members)
          </p>
        )}
      </div>
      <PublicFooter />
    </div>
  );
}
