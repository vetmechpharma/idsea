import React from 'react';
import PublicNavbar from '../../components/public/PublicNavbar';
import PublicFooter from '../../components/public/PublicFooter';
import SEOHead from '../../components/SEOHead';
import { BookOpen, Bell, Mail } from 'lucide-react';

export default function JournalPage() {
  return (
    <div style={{ background: '#f8fafc' }}>
      <SEOHead page="publications" fallback={{ title: 'Journal of Dairy Science and Enterprise (JDSE) | IDSEA', description: 'JDSE - Official journal of IDSEA. Launching soon.' }} />
      <PublicNavbar />

      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, #0c3c60 0%, #1a5f8a 100%)', padding: '180px 24px 60px', textAlign: 'center', color: 'white', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-80px', right: '-80px', width: '300px', height: '300px', borderRadius: '50%', background: 'rgba(255,255,255,0.03)' }} />
        <div style={{ position: 'absolute', bottom: '-60px', left: '-60px', width: '240px', height: '240px', borderRadius: '50%', background: 'rgba(255,255,255,0.03)' }} />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '700px', margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '64px', height: '64px', borderRadius: '18px', background: 'rgba(255,255,255,0.1)', marginBottom: '20px', backdropFilter: 'blur(8px)' }}>
            <BookOpen size={30} style={{ color: '#4ade80' }} />
          </div>
          <h1 style={{ fontFamily: 'Poppins, sans-serif', fontSize: 'clamp(24px, 4vw, 42px)', fontWeight: 800, marginBottom: '12px', lineHeight: 1.2 }}>
            Journal of Dairy Science<br />and Enterprise
          </h1>
          <p style={{ fontSize: '18px', opacity: 0.85, fontFamily: 'Poppins, sans-serif', fontWeight: 500, letterSpacing: '0.5px', marginBottom: '4px' }}>(JDSE)</p>
          <p style={{ fontSize: '14px', opacity: 0.6, fontFamily: 'Inter, sans-serif' }}>Official Journal of IDSEA</p>
        </div>
      </div>

      {/* Launching Soon */}
      <div style={{ maxWidth: '700px', margin: '0 auto', padding: '60px 24px 80px', textAlign: 'center' }}>
        <div style={{ background: 'white', borderRadius: '20px', padding: '48px 32px', boxShadow: '0 4px 24px rgba(0,0,0,0.06)', border: '1px solid #e5e7eb' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg, #fef3c7, #fde68a)', marginBottom: '24px' }}>
            <Bell size={36} style={{ color: '#d97706' }} />
          </div>

          <h2 style={{ fontFamily: 'Poppins, sans-serif', fontSize: 'clamp(22px, 3vw, 32px)', fontWeight: 800, color: '#0c3c60', marginBottom: '14px' }}>
            Launching Soon
          </h2>

          <p style={{ fontSize: '15px', color: '#6b7280', lineHeight: 1.8, fontFamily: 'Inter, sans-serif', maxWidth: '500px', margin: '0 auto 28px' }}>
            The <strong style={{ color: '#0c3c60' }}>Journal of Dairy Science and Enterprise (JDSE)</strong> is the upcoming peer-reviewed publication by the Indian Dairy Scientists and Entrepreneurs Association. Stay tuned for cutting-edge research in dairy science, technology, and entrepreneurship.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', maxWidth: '500px', margin: '0 auto 28px' }}>
            {[
              { label: 'Peer Reviewed', desc: 'Rigorous academic standards' },
              { label: 'Open Access', desc: 'Free for all researchers' },
              { label: 'Dairy Focused', desc: 'Science, tech & enterprise' },
            ].map(f => (
              <div key={f.label} style={{ background: '#f0fdf4', borderRadius: '12px', padding: '16px 14px', border: '1px solid #bbf7d0' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#1e7a4d', fontFamily: 'Poppins', marginBottom: '4px' }}>{f.label}</div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>{f.desc}</div>
              </div>
            ))}
          </div>

          <div style={{ background: '#f0f9ff', borderRadius: '12px', padding: '18px 20px', border: '1px solid #bae6fd', display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
            <Mail size={18} style={{ color: '#0c3c60', flexShrink: 0 }} />
            <span style={{ fontSize: '13px', color: '#374151', fontFamily: 'Inter' }}>
              For submissions & queries: <strong style={{ color: '#0c3c60' }}>journal@idsea.in</strong>
            </span>
          </div>
        </div>
      </div>

      <PublicFooter />
    </div>
  );
}
