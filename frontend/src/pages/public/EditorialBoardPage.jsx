import React, { useEffect, useState } from 'react';
import PublicNavbar from '../../components/public/PublicNavbar';
import PublicFooter from '../../components/public/PublicFooter';
import axios from 'axios';
import { BookOpen, Mail, Phone, User } from 'lucide-react';
import SEOHead from '../../components/SEOHead';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const BACKEND = process.env.REACT_APP_BACKEND_URL;
const resolveImg = (u) => u ? (u.startsWith('http') ? u : `${BACKEND}${u.startsWith('/') ? '' : '/'}${u}`) : '';

function Avatar({ src, name, size = 80 }) {
  const [failed, setFailed] = useState(false);
  const resolved = resolveImg(src);
  if (resolved && !failed) return <img src={resolved} alt={name} onError={() => setFailed(true)} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', border: '3px solid white', boxShadow: '0 4px 14px rgba(0,0,0,0.1)' }} />;
  return <div style={{ width: size, height: size, borderRadius: '50%', background: 'linear-gradient(135deg, #cbd5e1, #94a3b8)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid white', boxShadow: '0 4px 14px rgba(0,0,0,0.1)' }}><User size={size * 0.4} color="white" /></div>;
}

export default function EditorialBoardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API}/public/journal`).then(r => { setData(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ minHeight: '100vh' }}><PublicNavbar /><div className="loading-spinner" style={{ paddingTop: '200px' }}>Loading...</div></div>;

  const s = data?.settings || {};
  const board = data?.board || [];

  return (
    <div style={{ background: '#f8fafc' }}>
      <SEOHead title={`Editorial Board | ${s.journal_name || 'Journal'} | IDSEA`} description={`Editorial board of ${s.journal_name || 'IDSEA Journal'}`} />
      <PublicNavbar />

      <div style={{ background: 'linear-gradient(135deg, #0c3c60, #1a5276)', padding: '180px 24px 50px', textAlign: 'center', color: 'white' }}>
        <h1 style={{ fontFamily: 'Poppins, sans-serif', fontSize: 'clamp(24px,4vw,40px)', fontWeight: 800, marginBottom: '8px' }}>Editorial Board</h1>
        {s.journal_name && <p style={{ fontSize: '16px', opacity: 0.8, fontFamily: 'Poppins', fontWeight: 500 }}>{s.journal_name}{s.abbreviation ? ` (${s.abbreviation})` : ''}</p>}
      </div>

      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '50px 24px 80px' }}>
        {board.map((section, sIdx) => (
          <div key={section.id || sIdx} data-testid={`board-section-${sIdx}`} style={{ marginBottom: '40px' }}>
            <h2 style={{ fontFamily: 'Poppins', fontSize: '22px', fontWeight: 800, color: '#0c3c60', marginBottom: '6px', textAlign: 'center' }}>{section.title}</h2>
            <div style={{ width: '50px', height: '4px', background: '#1e7a4d', borderRadius: '2px', margin: '0 auto 24px' }} />

            {(section.members || []).length <= 2 ? (
              <div style={{ display: 'flex', gap: '24px', justifyContent: 'center', flexWrap: 'wrap' }}>
                {(section.members || []).map((m, mIdx) => (
                  <div key={m.id || mIdx} style={{ background: 'white', borderRadius: '16px', padding: '28px 24px', textAlign: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb', width: '300px' }}>
                    <Avatar src={m.photo_url} name={m.name} size={90} />
                    <h3 style={{ fontFamily: 'Poppins', fontSize: '17px', fontWeight: 700, color: '#111827', margin: '14px 0 4px' }}>{m.name}</h3>
                    {m.designation && <div style={{ fontSize: '13px', color: '#1e7a4d', fontWeight: 600, marginBottom: '6px' }}>{m.designation}</div>}
                    {m.organization && <div style={{ fontSize: '13px', color: '#6b7280', lineHeight: 1.6, marginBottom: '10px' }}>{m.organization}</div>}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
                      {m.phone && <span style={{ fontSize: '12px', color: '#9ca3af', display: 'flex', alignItems: 'center', gap: '4px' }}><Phone size={11} /> {m.phone}</span>}
                      {m.email && <span style={{ fontSize: '12px', color: '#9ca3af', display: 'flex', alignItems: 'center', gap: '4px' }}><Mail size={11} /> {m.email}</span>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
                {(section.members || []).map((m, mIdx) => (
                  <div key={m.id || mIdx} style={{ background: 'white', borderRadius: '12px', padding: '16px', display: 'flex', gap: '14px', alignItems: 'flex-start', border: '1px solid #e5e7eb' }}>
                    <Avatar src={m.photo_url} name={m.name} size={52} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h4 style={{ fontFamily: 'Poppins', fontSize: '14px', fontWeight: 700, color: '#111827', margin: '0 0 2px' }}>{m.name}</h4>
                      {m.designation && <div style={{ fontSize: '12px', color: '#1e7a4d', fontWeight: 600, marginBottom: '2px' }}>{m.designation}</div>}
                      {m.organization && <div style={{ fontSize: '12px', color: '#6b7280', lineHeight: 1.5, marginBottom: '4px' }}>{m.organization}</div>}
                      <div style={{ fontSize: '11px', color: '#9ca3af' }}>
                        {m.phone && <span style={{ marginRight: '8px' }}>{m.phone}</span>}
                        {m.email && <span>{m.email}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {board.length === 0 && (
          <div style={{ textAlign: 'center', color: '#9ca3af', padding: '60px 20px' }}>
            <BookOpen size={48} style={{ marginBottom: '16px', opacity: 0.3 }} />
            <p style={{ fontSize: '16px' }}>Editorial board details coming soon.</p>
          </div>
        )}
      </div>

      <PublicFooter />
    </div>
  );
}
