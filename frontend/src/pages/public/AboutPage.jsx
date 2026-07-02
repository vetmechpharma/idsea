import React, { useEffect, useState } from 'react';
import axios from 'axios';
import PublicNavbar from '../../components/public/PublicNavbar';
import PublicFooter from '../../components/public/PublicFooter';
import { API } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export default function AboutPage() {
  const [cms, setCms] = useState({});
  const [pc, setPc] = useState({});

  useEffect(() => {
    axios.get(`${API}/public/cms`).then(r => setCms(r.data)).catch(() => {});
    axios.get(`${API}/public/page-content/about`).then(r => setPc(r.data)).catch(() => {});
  }, []);

  const objectives = (pc.objectives || '').split('\n').filter(o => o.trim());

  return (
    <div style={{ background: 'white' }}>
      <PublicNavbar />
      <div style={{ paddingTop: '170px' }}>
        {/* Hero */}
        <div style={{ background: '#0c3c60', padding: '80px 24px', textAlign: 'center', color: 'white' }}>
          <h1 style={{ fontFamily: 'Poppins, sans-serif', fontSize: 'clamp(28px,4vw,42px)', fontWeight: 800, marginBottom: '16px' }}>{pc.hero_title || 'About IDSEA'}</h1>
          <p style={{ fontSize: '15px', opacity: 0.8, maxWidth: '640px', margin: '0 auto', lineHeight: 1.7, fontFamily: 'Inter, sans-serif' }}>
            {pc.hero_subtitle || 'Indian Dairy Scientists and Entrepreneurs Association — bridging dairy science with industry since our founding.'}
          </p>
        </div>

        {/* Vision & Mission */}
        <section style={{ padding: '80px 24px' }}>
          <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '40px', marginBottom: '60px' }}>
              <div style={{ background: '#f0f9ff', borderRadius: '16px', padding: '32px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#0c3c60', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                  <span style={{ color: 'white', fontSize: '20px', fontWeight: 700, fontFamily: 'Poppins' }}>V</span>
                </div>
                <h3 style={{ fontFamily: 'Poppins, sans-serif', fontSize: '18px', fontWeight: 700, color: '#0c3c60', marginBottom: '12px' }}>Vision</h3>
                <p style={{ color: '#4b5563', fontSize: '14px', lineHeight: 1.8, margin: 0, fontFamily: 'Inter, sans-serif' }}>
                  {cms.vision || 'To be a premier national and international platform integrating dairy science, innovation, and entrepreneurship for the sustainable growth of the Indian dairy sector.'}
                </p>
              </div>
              <div style={{ background: '#f0fdf4', borderRadius: '16px', padding: '32px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#1e7a4d', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                  <span style={{ color: 'white', fontSize: '20px', fontWeight: 700, fontFamily: 'Poppins' }}>M</span>
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
                {cms.about_content || 'IDSEA is a national professional and scientific body established to bridge the gap between dairy scientists and dairy entrepreneurs.'}
              </p>
            </div>

            {/* Objectives */}
            {objectives.length > 0 && (
              <div style={{ marginBottom: '60px' }}>
                <h2 style={{ fontFamily: 'Poppins, sans-serif', fontSize: '24px', fontWeight: 700, color: '#0c3c60', marginBottom: '24px' }}>Our Objectives</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
                  {objectives.map((obj, i) => (
                    <div key={i} style={{ display: 'flex', gap: '12px', padding: '16px', background: 'white', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb' }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#1e7a4d', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, fontFamily: 'Poppins', flexShrink: 0 }}>{i + 1}</div>
                      <p style={{ fontSize: '13px', color: '#4b5563', lineHeight: 1.6, margin: 0, fontFamily: 'Inter, sans-serif' }}>{obj}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* EC Members CTA */}
            <div style={{ background: '#0c3c60', borderRadius: '16px', padding: '40px', textAlign: 'center', marginBottom: '60px' }}>
              <h2 style={{ fontFamily: 'Poppins, sans-serif', fontSize: '22px', fontWeight: 700, color: 'white', marginBottom: '12px' }}>Executive Council</h2>
              <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '14px', lineHeight: 1.7, marginBottom: '24px', fontFamily: 'Inter, sans-serif', maxWidth: '500px', margin: '0 auto 24px' }}>
                Meet the office bearers, patrons, founders, and executive committee members who lead IDSEA.
              </p>
              <Link to="/ec-members" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#1e7a4d', color: 'white', textDecoration: 'none', padding: '12px 28px', borderRadius: '8px', fontWeight: 700, fontFamily: 'Poppins, sans-serif', fontSize: '14px', transition: 'background 0.2s ease' }}
                data-testid="view-ec-members-btn">
                View EC Members <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </section>

        {/* Headquarters */}
        <section style={{ padding: '80px 24px' }}>
          <div style={{ maxWidth: '700px', margin: '0 auto', textAlign: 'center' }}>
            <h2 style={{ fontFamily: 'Poppins, sans-serif', fontSize: 'clamp(22px,3vw,32px)', fontWeight: 800, color: '#0c3c60', marginBottom: '24px' }}>{pc.hq_title || 'Headquarters'}</h2>
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
