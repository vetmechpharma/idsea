import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import PublicNavbar from '../../components/public/PublicNavbar';
import PublicFooter from '../../components/public/PublicFooter';
import { Helmet } from 'react-helmet-async';
import axios from 'axios';
import { Calendar, Tag, ArrowLeft, Share2 } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const BACKEND = process.env.REACT_APP_BACKEND_URL;

const CATEGORY_COLORS = {
  general: { bg: '#dbeafe', color: '#1e40af', label: 'General' },
  academic: { bg: '#d1fae5', color: '#065f46', label: 'Academic' },
  scientific: { bg: '#ede9fe', color: '#5b21b6', label: 'Scientific' },
  conference: { bg: '#d1fae5', color: '#065f46', label: 'Conference' },
  event: { bg: '#fef3c7', color: '#92400e', label: 'Event' },
  industry: { bg: '#fef3c7', color: '#92400e', label: 'Industry' },
  achievement: { bg: '#fce7f3', color: '#831843', label: 'Achievement' },
};

export default function AnnouncementDetailPage() {
  const { newsId } = useParams();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API}/public/news/${newsId}`).then(r => { setItem(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, [newsId]);

  const formatDate = (d) => {
    if (!d) return '';
    return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const resolveImg = (u) => u ? (u.startsWith('http') ? u : `${BACKEND}${u.startsWith('/') ? '' : '/'}${u}`) : '';

  if (loading) return <div style={{ minHeight: '100vh' }}><PublicNavbar /><div className="loading-spinner" style={{ paddingTop: '200px' }}>Loading...</div></div>;

  if (!item) return (
    <div style={{ minHeight: '100vh' }}>
      <PublicNavbar />
      <div style={{ paddingTop: '200px', textAlign: 'center', color: '#9ca3af' }}>
        <h2>Announcement not found</h2>
        <Link to="/announcements" style={{ color: '#2563eb' }}>Back to Announcements</Link>
      </div>
      <PublicFooter />
    </div>
  );

  const cat = CATEGORY_COLORS[item.category] || CATEGORY_COLORS.general;
  const imgUrl = resolveImg(item.image_url);
  const metaTitle = item.meta_title || `${item.title} | IDSEA`;
  const metaDesc = item.meta_description || item.content?.replace(/<[^>]*>/g, '').slice(0, 160);

  return (
    <div data-testid="announcement-detail" style={{ background: '#f8fafc' }}>
      <Helmet>
        <title>{metaTitle}</title>
        <meta name="description" content={metaDesc} />
        {item.meta_keywords && <meta name="keywords" content={item.meta_keywords} />}
        {imgUrl && <meta property="og:image" content={imgUrl} />}
        <meta property="og:title" content={metaTitle} />
        <meta property="og:description" content={metaDesc} />
        <meta property="og:type" content="article" />
      </Helmet>
      <PublicNavbar />

      {/* Hero with image */}
      <div style={{ background: 'linear-gradient(135deg, #0c3c60, #1a5f8a)', padding: '160px 24px 40px', color: 'white' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <Link to="/announcements" data-testid="back-link" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '13px', marginBottom: '16px', fontFamily: 'Poppins' }}>
            <ArrowLeft size={14} /> All Announcements
          </Link>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ background: cat.bg, color: cat.color, padding: '3px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: 600, fontFamily: 'Poppins', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Tag size={10} /> {cat.label}
            </span>
            <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Calendar size={12} /> {formatDate(item.published_date || item.created_at)}
            </span>
          </div>
          <h1 style={{ fontFamily: 'Poppins, sans-serif', fontSize: 'clamp(22px, 3.5vw, 36px)', fontWeight: 800, lineHeight: 1.3, margin: 0 }}>
            {item.title}
          </h1>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 24px 80px' }}>
        <article style={{ background: 'white', borderRadius: '16px', padding: '32px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb' }}>
          {imgUrl && (
            <img src={imgUrl} alt={item.title} style={{ width: '100%', maxHeight: '400px', objectFit: 'cover', borderRadius: '12px', marginBottom: '24px' }} />
          )}
          <div
            data-testid="announcement-content"
            style={{ fontSize: '15px', color: '#374151', lineHeight: 1.9, fontFamily: 'Inter, sans-serif' }}
            dangerouslySetInnerHTML={{ __html: item.content }}
          />
        </article>

        {/* Share + Back */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px' }}>
          <Link to="/announcements" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#0c3c60', textDecoration: 'none', fontSize: '14px', fontWeight: 600, fontFamily: 'Poppins' }}>
            <ArrowLeft size={16} /> Back to Announcements
          </Link>
          <button onClick={() => { navigator.clipboard.writeText(window.location.href); }} style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontFamily: 'Poppins', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Share2 size={13} /> Share
          </button>
        </div>
      </div>

      <PublicFooter />
    </div>
  );
}
