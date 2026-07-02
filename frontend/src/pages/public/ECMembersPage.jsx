import React, { useEffect, useState } from 'react';
import axios from 'axios';
import PublicNavbar from '../../components/public/PublicNavbar';
import PublicFooter from '../../components/public/PublicFooter';
import { API } from '../../contexts/AuthContext';

export default function ECMembersPage() {
  const [founders, setFounders] = useState([]);
  const [council, setCouncil] = useState([]);
  const [pc, setPc] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      axios.get(`${API}/public/founders`).then(r => setFounders(r.data)).catch(() => {}),
      axios.get(`${API}/public/executive`).then(r => setCouncil(r.data)).catch(() => {}),
      axios.get(`${API}/public/page-content/about`).then(r => setPc(r.data)).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  const officers = council.filter(m => !['EC Member'].includes(m.designation));
  const ecMembers = council.filter(m => m.designation === 'EC Member');

  return (
    <div style={{ background: 'white' }}>
      <PublicNavbar />
      <div style={{ paddingTop: '170px' }}>
        {/* Hero */}
        <div style={{ background: '#0c3c60', padding: '80px 24px', textAlign: 'center', color: 'white' }}>
          <h1 style={{ fontFamily: 'Poppins, sans-serif', fontSize: 'clamp(28px,4vw,42px)', fontWeight: 800, marginBottom: '16px' }}>
            {pc.council_title || 'IDSEA Executive Council'}
          </h1>
          <p style={{ fontSize: '15px', opacity: 0.8, maxWidth: '640px', margin: '0 auto', lineHeight: 1.7, fontFamily: 'Inter, sans-serif' }}>
            {pc.council_subtitle || 'Term: 3 years'}
          </p>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#9ca3af' }}>Loading...</div>
        ) : (
          <>
            {/* Patron / Founders */}
            {founders.length > 0 && (
              <section style={{ background: '#f0f9ff', padding: '80px 24px' }} data-testid="founders-section">
                <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
                  <div style={{ textAlign: 'center', marginBottom: '48px' }}>
                    <h2 style={{ fontFamily: 'Poppins, sans-serif', fontSize: 'clamp(22px,3vw,32px)', fontWeight: 800, color: '#0c3c60', marginBottom: '8px' }}>
                      {pc.founders_title || 'Patron / Founders'}
                    </h2>
                    <p style={{ fontSize: '15px', color: '#6b7280', fontFamily: 'Inter, sans-serif' }}>
                      {pc.founders_subtitle || 'The visionaries who established IDSEA'}
                    </p>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                    {founders.map(f => (
                      <div key={f.id} data-testid="founder-card" style={{
                        background: 'white', borderRadius: '16px', padding: '28px', textAlign: 'center',
                        boxShadow: '0 4px 16px rgba(12,60,96,0.08)', border: '1px solid #dbeafe',
                        transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                      }}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 28px rgba(12,60,96,0.14)'; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(12,60,96,0.08)'; }}
                      >
                        {f.photo_url ? (
                          <img src={f.photo_url} alt={f.name} style={{ width: '90px', height: '90px', borderRadius: '50%', objectFit: 'cover', margin: '0 auto 16px', display: 'block', border: '3px solid #0c3c60' }} />
                        ) : (
                          <div style={{ width: '90px', height: '90px', borderRadius: '50%', background: 'linear-gradient(135deg, #0c3c60, #1e5a8a)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '28px', fontWeight: 700, color: 'white', fontFamily: 'Poppins' }}>
                            {f.name?.charAt(0)}
                          </div>
                        )}
                        <h3 style={{ fontFamily: 'Poppins, sans-serif', fontSize: '15px', fontWeight: 700, color: '#111827', margin: '0 0 8px', lineHeight: 1.3 }}>{f.name}</h3>
                        <p style={{ fontSize: '12px', color: '#4b5563', margin: 0, lineHeight: 1.6, fontFamily: 'Inter, sans-serif' }}>{f.affiliation}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* Executive Council Officers */}
            {officers.length > 0 && (
              <section style={{ background: 'white', padding: '80px 24px' }} data-testid="officers-section">
                <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
                  <div style={{ textAlign: 'center', marginBottom: '48px' }}>
                    <h2 style={{ fontFamily: 'Poppins, sans-serif', fontSize: 'clamp(22px,3vw,32px)', fontWeight: 800, color: '#0c3c60', marginBottom: '8px' }}>Office Bearers</h2>
                    <p style={{ fontSize: '15px', color: '#6b7280', fontFamily: 'Inter, sans-serif' }}>Leading IDSEA with vision and dedication</p>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
                    {officers.map(m => (
                      <div key={m.id} data-testid="officer-card" style={{
                        background: 'white', borderRadius: '16px', padding: '24px', textAlign: 'center',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.06)', border: '1px solid #e5e7eb',
                        transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                      }}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.1)'; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.06)'; }}
                      >
                        {m.photo_url ? (
                          <img src={m.photo_url} alt={m.name} style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', margin: '0 auto 14px', display: 'block', border: '3px solid #e5e7eb' }} />
                        ) : (
                          <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#0c3c60', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', fontSize: '24px', fontWeight: 700, color: 'white', fontFamily: 'Poppins' }}>
                            {m.name?.charAt(0)}
                          </div>
                        )}
                        <div style={{ background: '#1e7a4d', color: 'white', padding: '3px 12px', borderRadius: '12px', fontSize: '11px', fontWeight: 600, fontFamily: 'Poppins', display: 'inline-block', marginBottom: '8px' }}>{m.designation}</div>
                        <h3 style={{ fontFamily: 'Poppins, sans-serif', fontSize: '14px', fontWeight: 700, color: '#111827', margin: '0 0 6px', lineHeight: 1.3 }}>{m.name}</h3>
                        <p style={{ fontSize: '11px', color: '#6b7280', margin: 0, lineHeight: 1.5, fontFamily: 'Inter, sans-serif' }}>{m.affiliation}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* EC Members Table */}
            {ecMembers.length > 0 && (
              <section style={{ background: '#f8fafc', padding: '80px 24px' }} data-testid="ec-members-section">
                <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
                  <div style={{ textAlign: 'center', marginBottom: '48px' }}>
                    <h2 style={{ fontFamily: 'Poppins, sans-serif', fontSize: 'clamp(22px,3vw,32px)', fontWeight: 800, color: '#0c3c60', marginBottom: '8px' }}>EC Members</h2>
                    <p style={{ fontSize: '15px', color: '#6b7280', fontFamily: 'Inter, sans-serif' }}>Executive Committee Members of IDSEA</p>
                  </div>
                  <div style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.06)', border: '1px solid #e5e7eb' }}>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'Inter, sans-serif' }}>
                        <thead>
                          <tr style={{ background: '#0c3c60', color: 'white' }}>
                            <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, fontFamily: 'Poppins', whiteSpace: 'nowrap' }}>S.No.</th>
                            <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, fontFamily: 'Poppins' }}>Name</th>
                            <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, fontFamily: 'Poppins' }}>Affiliation</th>
                          </tr>
                        </thead>
                        <tbody>
                          {ecMembers.map((m, i) => (
                            <tr key={m.id} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? 'white' : '#f8fafc' }}>
                              <td style={{ padding: '12px 16px', fontSize: '13px', color: '#6b7280', fontWeight: 600, fontFamily: 'Poppins' }}>{i + 1}.</td>
                              <td style={{ padding: '12px 16px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#0c3c60', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, fontFamily: 'Poppins', flexShrink: 0 }}>
                                    {m.name?.charAt(0)}
                                  </div>
                                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#111827' }}>{m.name}</span>
                                </div>
                              </td>
                              <td style={{ padding: '12px 16px', fontSize: '13px', color: '#4b5563', lineHeight: 1.5 }}>{m.affiliation}</td>
                            </tr>
                          ))}
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
