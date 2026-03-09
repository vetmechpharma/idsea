import React, { useEffect, useState } from 'react';
import axios from 'axios';
import PublicNavbar from '../../components/public/PublicNavbar';
import PublicFooter from '../../components/public/PublicFooter';
import { API } from '../../contexts/AuthContext';

export default function AboutPage() {
  const [cms, setCms] = useState({});
  const [executive, setExecutive] = useState([]);

  useEffect(() => {
    axios.get(`${API}/public/cms`).then(r => setCms(r.data)).catch(() => {});
    axios.get(`${API}/public/executive`).then(r => setExecutive(r.data)).catch(() => {});
  }, []);

  return (
    <div style={{ background: 'white' }}>
      <PublicNavbar />
      <div style={{ paddingTop: '68px' }}>
        {/* Hero */}
        <div style={{ background: '#0c3c60', padding: '80px 24px', textAlign: 'center', color: 'white' }}>
          <h1 style={{ fontFamily: 'Poppins, sans-serif', fontSize: 'clamp(28px,4vw,42px)', fontWeight: 800, marginBottom: '16px' }}>
            About IDSEA
          </h1>
          <p style={{ fontSize: '15px', opacity: 0.8, maxWidth: '640px', margin: '0 auto', lineHeight: 1.7, fontFamily: 'Inter, sans-serif' }}>
            Indian Dairy Scientists and Entrepreneurs Association — bridging dairy science with industry since our founding.
          </p>
        </div>

        {/* About Content */}
        <section style={{ padding: '80px 24px' }}>
          <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '40px', marginBottom: '60px' }}>
              <div style={{ background: '#f0f9ff', borderRadius: '16px', padding: '32px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#0c3c60', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                  <span style={{ color: 'white', fontSize: '20px' }}>V</span>
                </div>
                <h3 style={{ fontFamily: 'Poppins, sans-serif', fontSize: '18px', fontWeight: 700, color: '#0c3c60', marginBottom: '12px' }}>Vision</h3>
                <p style={{ color: '#4b5563', fontSize: '14px', lineHeight: 1.8, margin: 0, fontFamily: 'Inter, sans-serif' }}>
                  {cms.vision || 'To be a premier national and international platform integrating dairy science, innovation, and entrepreneurship for the sustainable growth of the Indian dairy sector.'}
                </p>
              </div>
              <div style={{ background: '#f0fdf4', borderRadius: '16px', padding: '32px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#1e7a4d', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                  <span style={{ color: 'white', fontSize: '20px' }}>M</span>
                </div>
                <h3 style={{ fontFamily: 'Poppins, sans-serif', fontSize: '18px', fontWeight: 700, color: '#1e7a4d', marginBottom: '12px' }}>Mission</h3>
                <p style={{ color: '#4b5563', fontSize: '14px', lineHeight: 1.8, margin: 0, fontFamily: 'Inter, sans-serif' }}>
                  {cms.mission || 'To promote advancement and dissemination of knowledge in dairy science, facilitate academia-industry-startup collaboration, and support dairy entrepreneurs.'}
                </p>
              </div>
            </div>

            <div style={{ background: '#f8fafc', borderRadius: '16px', padding: '40px', marginBottom: '60px' }}>
              <h2 style={{ fontFamily: 'Poppins, sans-serif', fontSize: '24px', fontWeight: 700, color: '#0c3c60', marginBottom: '20px' }}>About the Association</h2>
              <p style={{ color: '#4b5563', fontSize: '15px', lineHeight: 1.8, fontFamily: 'Inter, sans-serif' }}>
                {cms.about_content || 'IDSEA is a national professional and scientific body established to bridge the gap between dairy scientists and dairy entrepreneurs. We bring together dairy scientists, academicians, technologists, entrepreneurs, industry experts, startups, cooperatives, corporate bodies, and students under one umbrella.'}
              </p>
            </div>

            {/* Objectives */}
            <div style={{ marginBottom: '60px' }}>
              <h2 style={{ fontFamily: 'Poppins, sans-serif', fontSize: '24px', fontWeight: 700, color: '#0c3c60', marginBottom: '24px' }}>Our Objectives</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
                {[
                  'Promote advancement and dissemination of knowledge in dairy science and entrepreneurship',
                  'Provide a common national platform for dairy scientists, academicians, and entrepreneurs',
                  'Support dairy startups, MSMEs, cooperatives, FPOs through knowledge sharing',
                  'Organize conferences, seminars, workshops, training programs, and exhibitions',
                  'Facilitate academia-industry-startup collaboration for innovation and technology transfer',
                  'Publish journals, proceedings, newsletters, reports, and technical bulletins',
                  'Collaborate with universities, research institutes, and international organizations',
                  'Recognize excellence through awards, fellowships, and professional recognitions',
                ].map((obj, i) => (
                  <div key={i} style={{ display: 'flex', gap: '12px', padding: '16px', background: 'white', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#1e7a4d', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, fontFamily: 'Poppins, sans-serif', flexShrink: 0 }}>{i + 1}</div>
                    <p style={{ fontSize: '13px', color: '#4b5563', lineHeight: 1.6, margin: 0, fontFamily: 'Inter, sans-serif' }}>{obj}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Executive Committee */}
        {executive.length > 0 && (
          <section style={{ background: '#f8fafc', padding: '80px 24px' }}>
            <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
              <div style={{ textAlign: 'center', marginBottom: '48px' }}>
                <h2 className="section-title">Executive Committee</h2>
                <p className="section-subtitle">Leading IDSEA's mission across India</p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                {executive.map(exec => (
                  <div key={exec.id} style={{
                    background: 'white', borderRadius: '16px', padding: '24px', textAlign: 'center',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.06)', border: '1px solid #e5e7eb',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                  }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.1)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.06)'; }}
                  >
                    {exec.photo_url ? (
                      <img src={exec.photo_url} alt={exec.name} style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', margin: '0 auto 14px', display: 'block', border: '3px solid #e5e7eb' }} />
                    ) : (
                      <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#0c3c60', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', fontSize: '24px', fontWeight: 700, color: 'white', fontFamily: 'Poppins, sans-serif' }}>
                        {exec.name?.charAt(0)}
                      </div>
                    )}
                    <div style={{ background: '#1e7a4d', color: 'white', padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 600, fontFamily: 'Poppins, sans-serif', display: 'inline-block', marginBottom: '8px' }}>{exec.designation}</div>
                    <h3 style={{ fontFamily: 'Poppins, sans-serif', fontSize: '14px', fontWeight: 700, color: '#111827', margin: '0 0 6px', lineHeight: 1.3 }}>{exec.name}</h3>
                    {exec.profile && <p style={{ fontSize: '11px', color: '#6b7280', margin: 0, lineHeight: 1.5, fontFamily: 'Inter, sans-serif' }}>{exec.profile}</p>}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Headquarters */}
        <section style={{ padding: '80px 24px' }}>
          <div style={{ maxWidth: '700px', margin: '0 auto', textAlign: 'center' }}>
            <h2 className="section-title">Headquarters</h2>
            <div style={{ background: '#0c3c60', borderRadius: '16px', padding: '36px', color: 'white' }}>
              <div style={{ fontSize: '15px', lineHeight: 1.8, fontFamily: 'Inter, sans-serif', opacity: 0.9 }}>
                {cms.contact_address || 'Department of Livestock Products Technology (Dairy Science), Veterinary College and Research Institute (VCRI), Namakkal - 637002, Tamil Nadu, India'}
              </div>
              <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center', gap: '24px', flexWrap: 'wrap' }}>
                <div style={{ fontSize: '13px', opacity: 0.8 }}>Email: {cms.contact_email || 'info@idsea.org'}</div>
                <div style={{ fontSize: '13px', opacity: 0.8 }}>Phone: {cms.contact_phone || '+91 98765 43210'}</div>
              </div>
            </div>
          </div>
        </section>
      </div>
      <PublicFooter />
    </div>
  );
}
