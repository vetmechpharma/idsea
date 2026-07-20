import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PublicNavbar from '../../components/public/PublicNavbar';
import PublicFooter from '../../components/public/PublicFooter';
import { Helmet } from 'react-helmet-async';
import axios from 'axios';
import { BookOpen, ArrowLeft, FileText, Mail, Share2 } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function JournalGuidelinesPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API}/public/journal`).then(r => { setData(r.data?.settings || {}); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ minHeight: '100vh' }}><PublicNavbar /><div className="loading-spinner" style={{ paddingTop: '200px' }}>Loading...</div></div>;

  const s = data || {};
  const journalName = s.journal_name || '';
  const content = s.guidelines_content || '';

  return (
    <div data-testid="journal-guidelines-page" style={{ background: '#f8fafc' }}>
      <Helmet>
        <title>{`Guidelines for Submission | ${journalName} | IDSEA`}</title>
        <meta name="description" content={`Author guidelines and instructions for manuscript submission to ${journalName}${s.abbreviation ? ` (${s.abbreviation})` : ''}`} />
      </Helmet>
      <PublicNavbar />

      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, #0c3c60 0%, #1a5f8a 100%)', padding: '160px 24px 45px', color: 'white' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <Link to="/journal" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '13px', marginBottom: '14px', fontFamily: 'Poppins' }}>
            <ArrowLeft size={14} /> {journalName}
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '8px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileText size={24} style={{ color: '#4ade80' }} />
            </div>
            <h1 style={{ fontFamily: 'Poppins, sans-serif', fontSize: 'clamp(22px, 3vw, 34px)', fontWeight: 800, margin: 0 }}>Guidelines for Submission</h1>
          </div>
          <p style={{ fontSize: '14px', opacity: 0.65, marginLeft: '62px' }}>{journalName}{s.abbreviation ? ` (${s.abbreviation})` : ''}</p>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 24px 80px' }}>
        {content ? (
          <article style={{ background: 'white', borderRadius: '16px', padding: '36px 32px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb' }}>
            <div
              data-testid="guidelines-content"
              className="journal-guidelines-content"
              style={{ fontSize: '15px', color: '#374151', lineHeight: 1.9, fontFamily: 'Inter, sans-serif' }}
              dangerouslySetInnerHTML={{ __html: content }}
            />
          </article>
        ) : (
          <div style={{ background: 'white', borderRadius: '16px', padding: '60px 32px', textAlign: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb' }}>
            <FileText size={48} style={{ color: '#d1d5db', marginBottom: '16px' }} />
            <h3 style={{ fontFamily: 'Poppins', color: '#6b7280', fontWeight: 600, marginBottom: '8px' }}>Guidelines Coming Soon</h3>
            <p style={{ fontSize: '14px', color: '#9ca3af', maxWidth: '400px', margin: '0 auto 20px' }}>
              Author guidelines for manuscript submission to {journalName} will be published here.
            </p>
            <div style={{ background: '#f0f9ff', borderRadius: '10px', padding: '14px', display: 'inline-flex', alignItems: 'center', gap: '8px', border: '1px solid #bae6fd' }}>
              <Mail size={16} style={{ color: '#0c3c60' }} />
              <span style={{ fontSize: '13px', color: '#374151' }}>Contact: <strong>journal@idsea.in</strong></span>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px' }}>
          <Link to="/journal" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#0c3c60', textDecoration: 'none', fontSize: '14px', fontWeight: 600, fontFamily: 'Poppins' }}>
            <ArrowLeft size={16} /> Back to Journal
          </Link>
          <button onClick={() => navigator.clipboard.writeText(window.location.href)} style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontFamily: 'Poppins', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Share2 size={13} /> Share
          </button>
        </div>
      </div>

      <PublicFooter />
    </div>
  );
}
