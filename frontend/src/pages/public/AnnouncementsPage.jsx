import React, { useEffect, useState } from 'react';
import PublicNavbar from '../../components/public/PublicNavbar';
import PublicFooter from '../../components/public/PublicFooter';
import SEOHead from '../../components/SEOHead';
import axios from 'axios';
import { Megaphone, Calendar, Tag, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const BACKEND = process.env.REACT_APP_BACKEND_URL;

const CATEGORY_COLORS = {
  general: { bg: '#dbeafe', color: '#1e40af', label: 'General' },
  academic: { bg: '#d1fae5', color: '#065f46', label: 'Academic' },
  scientific: { bg: '#ede9fe', color: '#5b21b6', label: 'Scientific' },
  event: { bg: '#fef3c7', color: '#92400e', label: 'Event' },
  achievement: { bg: '#fce7f3', color: '#831843', label: 'Achievement' },
};

export default function AnnouncementsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API}/public/news`).then(r => {
      const sorted = (r.data || []).sort((a, b) => new Date(b.published_date || b.created_at) - new Date(a.published_date || a.created_at));
      setItems(sorted);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const formatDate = (d) => {
    if (!d) return '';
    const dt = new Date(d);
    return dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div data-testid="announcements-page" style={{ background: '#f8fafc' }}>
      <SEOHead page="news" fallback={{ title: 'Announcements | IDSEA', description: 'Latest announcements from IDSEA' }} />
      <PublicNavbar />

      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, #0c3c60 0%, #1a5f8a 100%)', padding: '160px 24px 50px', textAlign: 'center', color: 'white' }}>
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(255,255,255,0.1)', marginBottom: '16px' }}>
            <Megaphone size={26} style={{ color: '#4ade80' }} />
          </div>
          <h1 style={{ fontFamily: 'Poppins, sans-serif', fontSize: 'clamp(24px, 4vw, 40px)', fontWeight: 800, marginBottom: '10px' }}>Announcements</h1>
          <p style={{ fontSize: '15px', opacity: 0.7, fontFamily: 'Inter' }}>Latest news and updates from IDSEA</p>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 24px 80px' }}>
        {loading ? (
          <div className="loading-spinner">Loading...</div>
        ) : items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9ca3af' }}>
            <Megaphone size={40} style={{ marginBottom: '12px', opacity: 0.3 }} />
            <h3 style={{ fontFamily: 'Poppins', color: '#6b7280', fontWeight: 600 }}>No announcements yet</h3>
            <p style={{ fontSize: '14px' }}>Check back soon for the latest updates from IDSEA.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '18px' }}>
            {items.map((item, i) => {
              const cat = CATEGORY_COLORS[item.category] || CATEGORY_COLORS.general;
              const imgUrl = item.image_url ? (item.image_url.startsWith('http') ? item.image_url : `${BACKEND}${item.image_url}`) : null;
              const isRecent = (new Date() - new Date(item.published_date || item.created_at)) < 7 * 86400000;

              return (
                <article key={item.id} data-testid={`announcement-${i}`} style={{
                  background: 'white', borderRadius: '16px', overflow: 'hidden',
                  border: '1px solid #e5e7eb', boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
                  display: 'flex', transition: 'box-shadow 0.2s',
                }}>
                  {/* Image (if available) */}
                  {imgUrl && (
                    <div style={{ width: '200px', flexShrink: 0, background: `url(${imgUrl}) center/cover no-repeat` }} />
                  )}

                  <div style={{ padding: '22px 24px', flex: 1 }}>
                    {/* Header: Category + Date */}
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap' }}>
                      {isRecent && (
                        <span style={{ background: '#dc2626', color: 'white', padding: '2px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 700, fontFamily: 'Poppins', textTransform: 'uppercase', letterSpacing: '0.5px' }}>New</span>
                      )}
                      <span style={{ background: cat.bg, color: cat.color, padding: '3px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: 600, fontFamily: 'Poppins', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Tag size={10} /> {cat.label}
                      </span>
                      <span style={{ fontSize: '12px', color: '#9ca3af', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Calendar size={11} /> {formatDate(item.published_date || item.created_at)}
                      </span>
                    </div>

                    {/* Title */}
                    <h2 style={{ fontFamily: 'Poppins, sans-serif', fontSize: '17px', fontWeight: 700, color: '#111827', marginBottom: '8px', lineHeight: 1.4 }}>
                      {item.title}
                    </h2>

                    {/* Content */}
                    <p style={{ fontSize: '14px', color: '#6b7280', lineHeight: 1.7, margin: '0 0 14px', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {item.content?.replace(/<[^>]*>/g, '')}
                    </p>

                    {/* Read More */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <Link to={`/announcements/${item.id}`} data-testid={`read-more-${i}`} style={{
                        display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#0c3c60',
                        fontSize: '13px', fontWeight: 600, fontFamily: 'Poppins', textDecoration: 'none',
                        padding: '6px 14px', borderRadius: '8px', border: '1px solid #e2e8f0',
                        background: '#f8fafc', transition: 'all 0.2s'
                      }}>
                        Read More <ArrowRight size={14} />
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      <PublicFooter />
    </div>
  );
}
