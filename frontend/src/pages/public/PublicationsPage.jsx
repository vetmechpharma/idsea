import React, { useEffect, useState } from 'react';
import axios from 'axios';
import PublicNavbar from '../../components/public/PublicNavbar';
import PublicFooter from '../../components/public/PublicFooter';
import { BookOpen, ExternalLink } from 'lucide-react';
import SEOHead from '../../components/SEOHead';
import { API } from '../../contexts/AuthContext';

export default function PublicationsPage() {
  const [publications, setPublications] = useState([]);
  const [category, setCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [pc, setPc] = useState({});

  useEffect(() => {
    axios.get(`${API}/public/page-content/publications`).then(r => setPc(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    const params = category !== 'all' ? { category } : {};
    axios.get(`${API}/public/publications`, { params }).then(r => { setPublications(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, [category]);

  return (
    <div style={{ background: '#f8fafc' }}>
      <SEOHead page="publications" fallback={{ title: 'IDSEA Publications & Research', description: 'Research papers, journals and technical articles by IDSEA members.' }} />
      <PublicNavbar />
      <div style={{ paddingTop: '170px' }}>
        <div style={{ background: '#0c3c60', padding: '60px 24px', textAlign: 'center', color: 'white' }}>
          <h1 style={{ fontFamily: 'Poppins, sans-serif', fontSize: 'clamp(24px,4vw,40px)', fontWeight: 800, marginBottom: '12px' }}>{pc.hero_title || 'Publications & Research'}</h1>
          <p style={{ fontSize: '15px', opacity: 0.8, fontFamily: 'Inter, sans-serif' }}>{pc.hero_subtitle || 'Research papers, journals, and technical articles by our members'}</p>
        </div>

        <div style={{ background: 'white', padding: '16px 24px', boxShadow: '0 2px 6px rgba(0,0,0,0.05)' }}>
          <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {[['all', 'All'], ['research', 'Research Papers'], ['journal', 'Journals'], ['article', 'Articles'], ['report', 'Reports']].map(([val, label]) => (
              <button key={val} onClick={() => setCategory(val)} data-testid={`pub-filter-${val}`} style={{
                padding: '7px 16px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontSize: '13px',
                fontFamily: 'Poppins, sans-serif', fontWeight: 500, transition: 'all 0.2s ease',
                background: category === val ? '#0c3c60' : '#f1f5f9',
                color: category === val ? 'white' : '#374151'
              }}>{label}</button>
            ))}
          </div>
        </div>

        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '32px 24px' }}>
          {loading ? <div className="loading-spinner">Loading publications...</div> : publications.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 0', color: '#9ca3af' }}>
              <BookOpen size={40} style={{ margin: '0 auto 16px', display: 'block', opacity: 0.4 }} />
              <p style={{ fontFamily: 'Poppins, sans-serif' }}>No publications available yet.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
              {publications.map(pub => (
                <div key={pub.id} data-testid="publication-card" style={{
                  background: 'white', borderRadius: '12px', padding: '24px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid #e5e7eb',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.1)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'; }}
                >
                  <div style={{ display: 'flex', gap: '12px', marginBottom: '14px' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <BookOpen size={20} style={{ color: '#7c3aed' }} />
                    </div>
                    <div>
                      <span style={{ background: '#dbeafe', color: '#1e40af', padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 600, fontFamily: 'Poppins, sans-serif' }}>{pub.category?.toUpperCase()}</span>
                      {pub.published_date && <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>{pub.published_date}</div>}
                    </div>
                  </div>
                  <h3 style={{ fontFamily: 'Poppins, sans-serif', fontSize: '15px', fontWeight: 700, color: '#111827', marginBottom: '8px', lineHeight: 1.4 }}>{pub.title}</h3>
                  <div style={{ fontSize: '13px', color: '#1e7a4d', fontWeight: 600, marginBottom: '10px', fontFamily: 'Poppins, sans-serif' }}>{pub.author}</div>
                  {pub.abstract && <p style={{ fontSize: '13px', color: '#6b7280', lineHeight: 1.6, margin: '0 0 16px', fontFamily: 'Inter, sans-serif', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{pub.abstract}</p>}
                  {pub.pdf_url && (
                    <a href={pub.pdf_url} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#7c3aed', fontSize: '13px', fontWeight: 600, textDecoration: 'none', fontFamily: 'Poppins, sans-serif' }}>
                      <ExternalLink size={14} /> View Full Paper
                    </a>
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
