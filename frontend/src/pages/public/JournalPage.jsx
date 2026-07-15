import React, { useEffect, useState } from 'react';
import PublicNavbar from '../../components/public/PublicNavbar';
import PublicFooter from '../../components/public/PublicFooter';
import { Helmet } from 'react-helmet-async';
import axios from 'axios';
import { BookOpen, Bell, Mail, Phone, User, Globe } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const BACKEND = process.env.REACT_APP_BACKEND_URL;
const resolveImg = (u) => u ? (u.startsWith('http') ? u : `${BACKEND}${u.startsWith('/') ? '' : '/'}${u}`) : '';

function Avatar({ src, name, size = 80 }) {
  const [failed, setFailed] = useState(false);
  const resolved = resolveImg(src);
  if (resolved && !failed) return <img src={resolved} alt={name} onError={() => setFailed(true)} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', border: '3px solid white', boxShadow: '0 4px 14px rgba(0,0,0,0.1)' }} />;
  return <div style={{ width: size, height: size, borderRadius: '50%', background: 'linear-gradient(135deg, #cbd5e1, #94a3b8)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid white', boxShadow: '0 4px 14px rgba(0,0,0,0.1)' }}><User size={size * 0.4} color="white" /></div>;
}

export default function JournalPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API}/public/journal`).then(r => { setData(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ minHeight: '100vh' }}><PublicNavbar /><div className="loading-spinner" style={{ paddingTop: '200px' }}>Loading...</div></div>;

  const s = data?.settings || {};
  const board = data?.board || [];
  const isSoon = s.coming_soon !== false;
  const metaTitle = s.meta_title || `${s.journal_name || 'Journal of Dairy Science and Enterprise'} | IDSEA`;
  const metaDesc = s.meta_description || s.description || 'Official journal of IDSEA';

  return (
    <div data-testid="journal-page" style={{ background: '#f8fafc' }}>
      <Helmet>
        <title>{metaTitle}</title>
        <meta name="description" content={metaDesc} />
        {s.meta_keywords && <meta name="keywords" content={s.meta_keywords} />}
      </Helmet>
      <PublicNavbar />

      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, #0c3c60 0%, #1a5f8a 100%)', padding: '170px 24px 50px', textAlign: 'center', color: 'white', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-80px', right: '-80px', width: '300px', height: '300px', borderRadius: '50%', background: 'rgba(255,255,255,0.03)' }} />
        <div style={{ maxWidth: '700px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '60px', height: '60px', borderRadius: '16px', background: 'rgba(255,255,255,0.1)', marginBottom: '16px' }}>
            <BookOpen size={28} style={{ color: '#4ade80' }} />
          </div>
          <h1 style={{ fontFamily: 'Poppins, sans-serif', fontSize: 'clamp(22px, 3.5vw, 38px)', fontWeight: 800, marginBottom: '8px', lineHeight: 1.25 }}>
            {s.journal_name || 'Journal of Dairy Science and Enterprise'}
          </h1>
          <p style={{ fontSize: '16px', opacity: 0.8, fontFamily: 'Poppins', fontWeight: 500, letterSpacing: '0.5px', marginBottom: '4px' }}>({s.abbreviation || 'JDSE'})</p>
          <p style={{ fontSize: '14px', opacity: 0.6 }}>An Official Publication of IDSEA</p>
        </div>
      </div>

      {isSoon ? (
        /* ═══ COMING SOON ═══ */
        <div style={{ maxWidth: '700px', margin: '0 auto', padding: '60px 24px 80px', textAlign: 'center' }}>
          <div style={{ background: 'white', borderRadius: '20px', padding: '48px 32px', boxShadow: '0 4px 24px rgba(0,0,0,0.06)', border: '1px solid #e5e7eb' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg, #fef3c7, #fde68a)', marginBottom: '24px' }}>
              <Bell size={36} style={{ color: '#d97706' }} />
            </div>
            <h2 style={{ fontFamily: 'Poppins', fontSize: 'clamp(22px, 3vw, 32px)', fontWeight: 800, color: '#0c3c60', marginBottom: '14px' }}>Launching Soon</h2>
            <p style={{ fontSize: '15px', color: '#6b7280', lineHeight: 1.8, maxWidth: '500px', margin: '0 auto 28px' }}>
              {s.description || `The ${s.journal_name || 'Journal of Dairy Science and Enterprise (JDSE)'} is the upcoming peer-reviewed publication by the Indian Dairy Scientists and Entrepreneurs Association.`}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', maxWidth: '500px', margin: '0 auto 28px' }}>
              {[{ label: 'Peer Reviewed', desc: 'Rigorous academic standards' }, { label: 'Open Access', desc: 'Free for all researchers' }, { label: 'Dairy Focused', desc: 'Science, tech & enterprise' }].map(f => (
                <div key={f.label} style={{ background: '#f0fdf4', borderRadius: '12px', padding: '16px 14px', border: '1px solid #bbf7d0' }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#1e7a4d', fontFamily: 'Poppins', marginBottom: '4px' }}>{f.label}</div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>{f.desc}</div>
                </div>
              ))}
            </div>
            <div style={{ background: '#f0f9ff', borderRadius: '12px', padding: '18px 20px', border: '1px solid #bae6fd', display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
              <Mail size={18} style={{ color: '#0c3c60', flexShrink: 0 }} />
              <span style={{ fontSize: '13px', color: '#374151' }}>For submissions & queries: <strong style={{ color: '#0c3c60' }}>journal@idsea.in</strong></span>
            </div>
          </div>
        </div>
      ) : (
        /* ═══ JOURNAL LIVE — EDITORIAL BOARD ═══ */
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '40px 24px 80px' }}>
          {/* Journal Info + Cover */}
          {(s.description || s.cover_image) && (
            <div style={{ background: 'white', borderRadius: '16px', padding: '28px', boxShadow: '0 2px 10px rgba(0,0,0,0.04)', border: '1px solid #e5e7eb', marginBottom: '36px', display: 'flex', gap: '24px', alignItems: 'center', flexWrap: 'wrap' }}>
              {s.cover_image && <img src={resolveImg(s.cover_image)} alt="Journal Cover" style={{ width: '160px', borderRadius: '10px', boxShadow: '0 4px 16px rgba(0,0,0,0.1)', flexShrink: 0 }} />}
              {s.description && <p style={{ fontSize: '15px', color: '#374151', lineHeight: 1.8, margin: 0, flex: 1 }}>{s.description}</p>}
            </div>
          )}

          {/* Editorial Board Sections */}
          {board.map((section, sIdx) => (
            <div key={section.id || sIdx} data-testid={`board-section-${sIdx}`} style={{ marginBottom: '40px' }}>
              <h2 style={{ fontFamily: 'Poppins', fontSize: '22px', fontWeight: 800, color: '#0c3c60', marginBottom: '6px', textAlign: 'center' }}>{section.title}</h2>
              <div style={{ width: '50px', height: '4px', background: '#1e7a4d', borderRadius: '2px', margin: '0 auto 24px' }} />

              {/* If section has 1-2 members, show them large/centered */}
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
                /* 3+ members: compact grid */
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
            <div style={{ textAlign: 'center', color: '#9ca3af', padding: '40px' }}>
              <BookOpen size={40} style={{ marginBottom: '10px', opacity: 0.3 }} />
              <p>Editorial board details coming soon.</p>
            </div>
          )}
        </div>
      )}

      <PublicFooter />
    </div>
  );
}
