import React, { useEffect, useState } from 'react';
import axios from 'axios';
import PublicNavbar from '../../components/public/PublicNavbar';
import PublicFooter from '../../components/public/PublicFooter';
import { API } from '../../contexts/AuthContext';
import { Award, Users, Crown, Shield } from 'lucide-react';
import SEOHead from '../../components/SEOHead';

const ROLE_COLORS = {
  'President': { bg: '#fffbeb', border: '#fcd34d', badge: '#d97706', ring: '#fbbf24', icon: Crown },
  'Vice President': { bg: '#f0f9ff', border: '#93c5fd', badge: '#2563eb', ring: '#60a5fa', icon: Shield },
  'General Secretary': { bg: '#ecfdf5', border: '#6ee7b7', badge: '#059669', ring: '#34d399', icon: Award },
  'Joint Secretary': { bg: '#fdf2f8', border: '#f9a8d4', badge: '#db2777', ring: '#f472b6', icon: Users },
  'Treasurer': { bg: '#f5f3ff', border: '#c4b5fd', badge: '#7c3aed', ring: '#a78bfa', icon: Shield },
  'Editor': { bg: '#fff7ed', border: '#fdba74', badge: '#ea580c', ring: '#fb923c', icon: Award },
  'default': { bg: '#f8fafc', border: '#e2e8f0', badge: '#475569', ring: '#94a3b8', icon: Users },
};

const getColor = (designation) => ROLE_COLORS[designation] || ROLE_COLORS['default'];

export default function ECMembersPage() {
  const [council, setCouncil] = useState([]);
  const [pc, setPc] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      axios.get(`${API}/public/executive`).then(r => setCouncil(r.data)).catch(() => {}),
      axios.get(`${API}/public/page-content/about`).then(r => setPc(r.data)).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  const officeBearers = council.filter(m => (m.frontend_section || 'office_bearers') === 'office_bearers' && m.designation !== 'EC Member');
  const ecMembers = council.filter(m => m.frontend_section === 'ec_members' || m.designation === 'EC Member');

  const resolvePhoto = (url) => {
    if (!url) return '';
    return url.startsWith('/') ? `${process.env.REACT_APP_BACKEND_URL}${url}` : url;
  };

  return (
    <div style={{ background: '#fafbfc' }}>
      <SEOHead page="about" fallback={{ title: 'IDSEA Executive Council - Office Bearers & EC Members', description: 'Meet the executive council, office bearers and committee members leading IDSEA.' }} />
      <PublicNavbar />
      <div>

        {/* Hero */}
        <div style={{ position: 'relative', background: '#0c3c60', padding: '220px 24px 80px', textAlign: 'center', color: 'white', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, right: 0, width: '400px', height: '400px', borderRadius: '50%', background: 'rgba(30,122,77,0.15)', filter: 'blur(80px)', transform: 'translate(30%, -30%)' }} />
          <div style={{ position: 'absolute', bottom: 0, left: 0, width: '300px', height: '300px', borderRadius: '50%', background: 'rgba(59,130,246,0.12)', filter: 'blur(60px)', transform: 'translate(-20%, 30%)' }} />
          <div style={{ position: 'relative', zIndex: 1, maxWidth: '720px', margin: '0 auto' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(30,122,77,0.3)', padding: '6px 18px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, fontFamily: 'Poppins, sans-serif', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '20px', border: '1px solid rgba(30,122,77,0.4)' }}>
              <Users size={14} /> Executive Council
            </div>
            <h1 style={{ fontFamily: 'Poppins, sans-serif', fontSize: 'clamp(32px,5vw,48px)', fontWeight: 800, marginBottom: '16px', lineHeight: 1.15 }}>
              {pc.council_title || 'IDSEA Executive Council'}
            </h1>
            <p style={{ fontSize: '16px', opacity: 0.85, maxWidth: '560px', margin: '0 auto', lineHeight: 1.8, fontFamily: 'Inter, sans-serif' }}>
              {pc.council_subtitle || 'Term: 3 years'}
            </p>
          </div>
          <div style={{ position: 'absolute', bottom: '-1px', left: 0, right: 0 }}>
            <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block', width: '100%' }}>
              <path d="M0 60V30C360 0 720 60 1080 30C1260 15 1350 15 1440 20V60H0Z" fill="#fafbfc" />
            </svg>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px', color: '#9ca3af' }}>Loading...</div>
        ) : (
          <>
            {/* Office Bearers */}
            {officeBearers.length > 0 && (
              <section style={{ padding: '60px 24px 80px' }} data-testid="officers-section">
                <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                  <div style={{ textAlign: 'center', marginBottom: '56px' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#1e7a4d', fontWeight: 700, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1.5px', fontFamily: 'Poppins, sans-serif', marginBottom: '12px' }}>
                      <Crown size={16} /> Office Bearers
                    </div>
                    <h2 style={{ fontFamily: 'Poppins, sans-serif', fontSize: 'clamp(26px,3.5vw,38px)', fontWeight: 800, color: '#0c3c60', marginBottom: '8px' }}>
                      Leading IDSEA with Vision
                    </h2>
                    <div style={{ width: '50px', height: '4px', background: 'linear-gradient(90deg, #1e7a4d, #059669)', borderRadius: '2px', margin: '0 auto' }} />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
                    {officeBearers.map((m) => {
                      const c = getColor(m.designation);
                      const Icon = c.icon;
                      const photoSrc = resolvePhoto(m.photo_url);
                      const displayDesig = m.sub_division ? `${m.designation} (${m.sub_division})` : m.designation;
                      return (
                        <div key={m.id} data-testid="officer-card" style={{
                          background: 'white', borderRadius: '20px', overflow: 'hidden',
                          boxShadow: '0 4px 20px rgba(0,0,0,0.06)', border: `1px solid #e8edf2`,
                          transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                        }}
                          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.1)'; }}
                          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.06)'; }}>
                          {/* Top color bar */}
                          <div style={{ height: '4px', background: `linear-gradient(90deg, ${c.badge}, ${c.ring})` }} />
                          <div style={{ padding: '28px', display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
                            {/* Photo */}
                            <div style={{ position: 'relative', flexShrink: 0 }}>
                              <div style={{ width: '100px', height: '100px', borderRadius: '16px', overflow: 'hidden', border: `3px solid ${c.ring}`, background: c.bg }}>
                                {photoSrc ? (
                                  <img src={photoSrc} alt={m.display_name || m.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                  <div style={{ width: '100%', height: '100%', background: `linear-gradient(135deg, ${c.badge}, ${c.ring})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', fontWeight: 800, color: 'white', fontFamily: 'Poppins' }}>
                                    {(m.display_name || m.name)?.charAt(0)}
                                  </div>
                                )}
                              </div>
                              <div style={{ position: 'absolute', top: '-6px', right: '-6px', width: '28px', height: '28px', borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
                                <Icon size={14} style={{ color: c.badge }} />
                              </div>
                            </div>
                            {/* Info */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <h3 style={{ fontFamily: 'Poppins, sans-serif', fontSize: '16px', fontWeight: 700, color: '#111827', margin: '0 0 6px', lineHeight: 1.3 }}>{m.display_name || m.name}</h3>
                              <div style={{ display: 'inline-block', background: c.bg, border: `1px solid ${c.border}`, padding: '3px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, color: c.badge, fontFamily: 'Poppins, sans-serif', marginBottom: '10px' }}>
                                {displayDesig}
                              </div>
                              <div style={{ width: '28px', height: '3px', background: c.badge, borderRadius: '2px', marginBottom: '10px' }} />
                              <p style={{ fontSize: '12px', color: '#6b7280', margin: 0, lineHeight: 1.6, fontFamily: 'Inter, sans-serif' }}>{m.affiliation}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </section>
            )}

            {/* EC Members */}
            {ecMembers.length > 0 && (
              <section style={{ background: 'white', padding: '80px 24px' }} data-testid="ec-members-section">
                <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
                  <div style={{ textAlign: 'center', marginBottom: '48px' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#d97706', fontWeight: 700, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1.5px', fontFamily: 'Poppins, sans-serif', marginBottom: '12px' }}>
                      <Users size={16} /> Committee Members
                    </div>
                    <h2 style={{ fontFamily: 'Poppins, sans-serif', fontSize: 'clamp(24px,3vw,34px)', fontWeight: 800, color: '#0c3c60', marginBottom: '8px' }}>EC Members</h2>
                    <div style={{ width: '50px', height: '4px', background: 'linear-gradient(90deg, #d97706, #fbbf24)', borderRadius: '2px', margin: '0 auto' }} />
                  </div>

                  <div style={{ background: 'white', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', border: '1px solid #e8edf2' }}>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'Inter, sans-serif' }}>
                        <thead>
                          <tr style={{ background: 'linear-gradient(90deg, #0c3c60, #164e7e)', color: 'white' }}>
                            <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, fontFamily: 'Poppins', whiteSpace: 'nowrap' }}>S.No.</th>
                            <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, fontFamily: 'Poppins' }}>Name</th>
                            <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, fontFamily: 'Poppins' }}>Designation</th>
                            <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, fontFamily: 'Poppins' }}>Affiliation</th>
                          </tr>
                        </thead>
                        <tbody>
                          {ecMembers.map((m, i) => {
                            const photoSrc = resolvePhoto(m.photo_url);
                            const displayDesig = m.sub_division ? `${m.designation} (${m.sub_division})` : m.designation;
                            return (
                              <tr key={m.id} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? 'white' : '#fafbfc', transition: 'background 0.15s ease' }}
                                onMouseEnter={e => e.currentTarget.style.background = '#f0f9ff'}
                                onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? 'white' : '#fafbfc'}>
                                <td style={{ padding: '14px 16px', fontSize: '13px', color: '#6b7280', fontWeight: 600, fontFamily: 'Poppins' }}>{i + 1}</td>
                                <td style={{ padding: '14px 16px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    {photoSrc ? (
                                      <img src={photoSrc} alt={m.display_name || m.name} style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #e5e7eb' }} />
                                    ) : (
                                      <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'linear-gradient(135deg, #0c3c60, #1e5a8a)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 700, fontFamily: 'Poppins', flexShrink: 0 }}>
                                        {(m.display_name || m.name)?.charAt(0)}
                                      </div>
                                    )}
                                    <span style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>{m.display_name || m.name}</span>
                                  </div>
                                </td>
                                <td style={{ padding: '14px 16px' }}>
                                  <span style={{ fontSize: '12px', background: '#f0f9ff', border: '1px solid #bae6fd', padding: '3px 10px', borderRadius: '12px', color: '#0369a1', fontWeight: 600, fontFamily: 'Poppins', whiteSpace: 'nowrap' }}>
                                    {displayDesig}
                                  </span>
                                </td>
                                <td style={{ padding: '14px 16px', fontSize: '13px', color: '#4b5563', lineHeight: 1.5 }}>{m.affiliation}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </section>
            )}
          </>
        )}
      </div>
      <PublicFooter />
    </div>
  );
}
