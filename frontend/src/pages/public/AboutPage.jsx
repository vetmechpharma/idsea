import React, { useEffect, useState } from 'react';
import axios from 'axios';
import PublicNavbar from '../../components/public/PublicNavbar';
import PublicFooter from '../../components/public/PublicFooter';
import { API } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { ArrowRight, Target, Compass, Award, MapPin, Mail, Phone, ShieldCheck, FileCheck } from 'lucide-react';
import SEOHead from '../../components/SEOHead';

const ACCENT_COLORS = [
  { border: '#d97706', bg: '#fffbeb', badge: '#fbbf24', ring: '#fcd34d' },
  { border: '#059669', bg: '#ecfdf5', badge: '#34d399', ring: '#6ee7b7' },
  { border: '#db2777', bg: '#fdf2f8', badge: '#f472b6', ring: '#f9a8d4' },
  { border: '#2563eb', bg: '#eff6ff', badge: '#60a5fa', ring: '#93c5fd' },
  { border: '#7c3aed', bg: '#f5f3ff', badge: '#a78bfa', ring: '#c4b5fd' },
  { border: '#dc2626', bg: '#fef2f2', badge: '#f87171', ring: '#fca5a5' },
];

export default function AboutPage() {
  const [cms, setCms] = useState(null);
  const [pc, setPc] = useState(null);
  const [founders, setFounders] = useState([]);

  useEffect(() => {
    axios.get(`${API}/public/cms`).then(r => setCms(r.data)).catch(() => setCms({}));
    axios.get(`${API}/public/page-content/about`).then(r => setPc(r.data)).catch(() => setPc({}));
    axios.get(`${API}/public/founders`).then(r => setFounders(r.data || [])).catch(() => {});
  }, []);

  if (!cms || !pc) return <div><PublicNavbar /><div style={{ minHeight: '60vh' }} /></div>;

  const objectives = (pc.objectives || '').split('\n').filter(o => o.trim());
  const certImg = pc.cert_image_url ? (pc.cert_image_url.startsWith('/') ? `${process.env.REACT_APP_BACKEND_URL}${pc.cert_image_url}` : pc.cert_image_url) : '';

  return (
    <div style={{ background: '#fafbfc' }}>
      <SEOHead page="about" fallback={{ title: 'About IDSEA - Vision, Mission & Objectives', description: 'Learn about IDSEA - our vision, mission, objectives, founders and registration details.' }} />
      <PublicNavbar />
      <div>

        {/* Hero - Creative Diagonal */}
        <div style={{ position: 'relative', background: '#0c3c60', padding: '220px 24px 80px', textAlign: 'center', color: 'white', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, right: 0, width: '400px', height: '400px', borderRadius: '50%', background: 'rgba(30,122,77,0.15)', filter: 'blur(80px)', transform: 'translate(30%, -30%)' }} />
          <div style={{ position: 'absolute', bottom: 0, left: 0, width: '300px', height: '300px', borderRadius: '50%', background: 'rgba(59,130,246,0.12)', filter: 'blur(60px)', transform: 'translate(-20%, 30%)' }} />
          <div style={{ position: 'relative', zIndex: 1, maxWidth: '720px', margin: '0 auto' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(30,122,77,0.3)', padding: '6px 18px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, fontFamily: 'Poppins, sans-serif', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '20px', border: '1px solid rgba(30,122,77,0.4)' }}>
              <Award size={14} /> EST. 2026
            </div>
            <h1 style={{ fontFamily: 'Poppins, sans-serif', fontSize: 'clamp(32px,5vw,52px)', fontWeight: 800, marginBottom: '20px', lineHeight: 1.15 }}>
              {pc.hero_title || 'About IDSEA'}
            </h1>
            <p style={{ fontSize: '16px', opacity: 0.85, maxWidth: '580px', margin: '0 auto', lineHeight: 1.8, fontFamily: 'Inter, sans-serif' }}>
              {pc.hero_subtitle || 'Indian Dairy Scientists and Entrepreneurs Association — bridging dairy science with industry since our founding.'}
            </p>
          </div>
          <div style={{ position: 'absolute', bottom: '-1px', left: 0, right: 0 }}>
            <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block', width: '100%' }}>
              <path d="M0 60V30C360 0 720 60 1080 30C1260 15 1350 15 1440 20V60H0Z" fill="#fafbfc" />
            </svg>
          </div>
        </div>

        {/* Vision & Mission - Stacked Cards */}
        <section style={{ padding: '60px 24px 80px' }}>
          <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '28px', marginBottom: '60px' }}>
              <div style={{ background: 'white', borderRadius: '20px', padding: '36px', position: 'relative', overflow: 'hidden', boxShadow: '0 4px 20px rgba(12,60,96,0.08)', border: '1px solid #e8edf2' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(90deg, #0c3c60, #1e7a4d)' }} />
                <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: 'linear-gradient(135deg, #0c3c60, #1e5a8a)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px', boxShadow: '0 4px 12px rgba(12,60,96,0.25)' }}>
                  <Compass size={24} style={{ color: 'white' }} />
                </div>
                <h3 style={{ fontFamily: 'Poppins, sans-serif', fontSize: '20px', fontWeight: 700, color: '#0c3c60', marginBottom: '14px' }}>Our Vision</h3>
                <div style={{ color: '#4b5563', fontSize: '14px', lineHeight: 1.85, margin: 0, fontFamily: 'Inter, sans-serif' }} dangerouslySetInnerHTML={{ __html: cms.vision || 'To be a premier national and international platform integrating dairy science, innovation, and entrepreneurship for the sustainable growth of the Indian dairy sector.' }} />
              </div>
              <div style={{ background: 'white', borderRadius: '20px', padding: '36px', position: 'relative', overflow: 'hidden', boxShadow: '0 4px 20px rgba(30,122,77,0.08)', border: '1px solid #e8edf2' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(90deg, #1e7a4d, #059669)' }} />
                <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: 'linear-gradient(135deg, #1e7a4d, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px', boxShadow: '0 4px 12px rgba(30,122,77,0.25)' }}>
                  <Target size={24} style={{ color: 'white' }} />
                </div>
                <h3 style={{ fontFamily: 'Poppins, sans-serif', fontSize: '20px', fontWeight: 700, color: '#1e7a4d', marginBottom: '14px' }}>Our Mission</h3>
                <div style={{ color: '#4b5563', fontSize: '14px', lineHeight: 1.85, margin: 0, fontFamily: 'Inter, sans-serif' }} dangerouslySetInnerHTML={{ __html: cms.mission || 'To promote advancement and dissemination of knowledge in dairy science, facilitate academia-industry-startup collaboration, and support dairy entrepreneurs.' }} />
              </div>
            </div>

            {/* About the Association */}
            <div style={{ background: 'white', borderRadius: '20px', padding: '44px', marginBottom: '60px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', border: '1px solid #e8edf2', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: '20px', right: '20px', width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(30,122,77,0.06)', filter: 'blur(30px)' }} />
              <h2 style={{ fontFamily: 'Poppins, sans-serif', fontSize: '26px', fontWeight: 800, color: '#0c3c60', marginBottom: '20px', position: 'relative' }}>
                About the Association
                <div style={{ width: '50px', height: '4px', background: 'linear-gradient(90deg, #1e7a4d, #059669)', borderRadius: '2px', marginTop: '10px' }} />
              </h2>
              <div style={{ color: '#4b5563', fontSize: '15px', lineHeight: 1.9, fontFamily: 'Inter, sans-serif', position: 'relative' }} dangerouslySetInnerHTML={{ __html: cms.about_content || 'IDSEA is a national professional and scientific body established to bridge the gap between dairy scientists and dairy entrepreneurs.' }} />
            </div>

            {/* Objectives */}
            {objectives.length > 0 && (
              <div style={{ marginBottom: '80px' }}>
                <div style={{ textAlign: 'center', marginBottom: '36px' }}>
                  <h2 style={{ fontFamily: 'Poppins, sans-serif', fontSize: '28px', fontWeight: 800, color: '#0c3c60', marginBottom: '8px' }}>Our Objectives</h2>
                  <div style={{ width: '50px', height: '4px', background: '#1e7a4d', borderRadius: '2px', margin: '0 auto' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                  {objectives.map((obj, i) => (
                    <div key={i} style={{ display: 'flex', gap: '14px', padding: '20px', background: 'white', borderRadius: '14px', boxShadow: '0 2px 10px rgba(0,0,0,0.04)', border: '1px solid #e8edf2', transition: 'transform 0.2s ease, box-shadow 0.2s ease' }}
                      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.08)'; }}
                      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.04)'; }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'linear-gradient(135deg, #1e7a4d, #059669)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, fontFamily: 'Poppins', flexShrink: 0, boxShadow: '0 2px 8px rgba(30,122,77,0.3)' }}>{i + 1}</div>
                      <p style={{ fontSize: '13px', color: '#374151', lineHeight: 1.7, margin: 0, fontFamily: 'Inter, sans-serif' }}>{obj}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Patron / Founders - Creative Cards */}
        {founders.length > 0 && (
          <section style={{ background: 'white', padding: '80px 24px', position: 'relative', overflow: 'hidden' }} data-testid="founders-section">
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '600px', height: '600px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(30,122,77,0.03) 0%, transparent 70%)' }} />
            <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative' }}>
              <div style={{ textAlign: 'center', marginBottom: '56px' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#1e7a4d', fontWeight: 700, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1.5px', fontFamily: 'Poppins, sans-serif', marginBottom: '12px' }}>
                  <Award size={16} /> {pc.founders_title || 'Patron / Founders'}
                </div>
                <h2 style={{ fontFamily: 'Poppins, sans-serif', fontSize: 'clamp(26px,3.5vw,38px)', fontWeight: 800, color: '#0c3c60', marginBottom: '12px' }}>
                  Meet the Visionaries Behind IDSEA
                </h2>
                <p style={{ fontSize: '15px', color: '#6b7280', fontFamily: 'Inter, sans-serif', maxWidth: '500px', margin: '0 auto' }}>
                  {pc.founders_subtitle || 'The visionaries who established IDSEA'}
                </p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '28px' }}>
                {founders.map((f, idx) => {
                  const ac = ACCENT_COLORS[idx % ACCENT_COLORS.length];
                  const photoSrc = f.photo_url ? (f.photo_url.startsWith('/') ? `${process.env.REACT_APP_BACKEND_URL}${f.photo_url}` : f.photo_url) : '';
                  return (
                    <div key={f.id} data-testid="founder-card" style={{
                      background: ac.bg, borderRadius: '20px', padding: '28px',
                      border: `2px solid ${ac.ring}`,
                      transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                      position: 'relative', overflow: 'hidden',
                    }}
                      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.boxShadow = `0 20px 40px ${ac.border}22`; }}
                      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>
                      <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
                        {/* Photo */}
                        <div style={{ position: 'relative', flexShrink: 0 }}>
                          <div style={{ width: '110px', height: '110px', borderRadius: '16px', overflow: 'hidden', border: `3px solid ${ac.ring}`, background: 'white' }}>
                            {photoSrc ? (
                              <img src={photoSrc} alt={f.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <div style={{ width: '100%', height: '100%', background: `linear-gradient(135deg, ${ac.border}, ${ac.badge})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px', fontWeight: 800, color: 'white', fontFamily: 'Poppins' }}>
                                {f.name?.charAt(0)}
                              </div>
                            )}
                          </div>
                          {/* Accent icon */}
                          <div style={{ position: 'absolute', top: '-6px', right: '-6px', width: '28px', height: '28px', borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}>
                            <Award size={14} style={{ color: ac.border }} />
                          </div>
                        </div>
                        {/* Details */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <h3 style={{ fontFamily: 'Poppins, sans-serif', fontSize: '16px', fontWeight: 700, color: '#111827', margin: '0 0 4px', lineHeight: 1.3 }}>{f.name}</h3>
                          <div style={{ fontSize: '12px', color: ac.border, fontWeight: 600, fontFamily: 'Poppins, sans-serif', marginBottom: '8px' }}>{f.designation || 'Patron / Founder'}</div>
                          <div style={{ width: '30px', height: '3px', background: ac.badge, borderRadius: '2px', marginBottom: '10px' }} />
                          <p style={{ fontSize: '12px', color: '#6b7280', margin: 0, lineHeight: 1.6, fontFamily: 'Inter, sans-serif' }}>{f.affiliation}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* EC Members CTA */}
        <section style={{ padding: '60px 24px' }}>
          <div style={{ maxWidth: '900px', margin: '0 auto' }}>
            <div style={{ background: 'linear-gradient(135deg, #0c3c60, #164e7e)', borderRadius: '24px', padding: '48px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: '50%', right: '-60px', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(30,122,77,0.2)', filter: 'blur(40px)', transform: 'translateY(-50%)' }} />
              <h2 style={{ fontFamily: 'Poppins, sans-serif', fontSize: '24px', fontWeight: 800, color: 'white', marginBottom: '14px', position: 'relative' }}>Executive Council</h2>
              <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '14px', lineHeight: 1.7, fontFamily: 'Inter, sans-serif', maxWidth: '460px', margin: '0 auto 28px', position: 'relative' }}>
                Meet the office bearers and executive committee members who lead IDSEA with vision and dedication.
              </p>
              <Link to="/ec-members" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#1e7a4d', color: 'white', textDecoration: 'none', padding: '14px 32px', borderRadius: '12px', fontWeight: 700, fontFamily: 'Poppins, sans-serif', fontSize: '14px', boxShadow: '0 4px 16px rgba(30,122,77,0.35)', transition: 'transform 0.2s ease', position: 'relative' }}
                data-testid="view-ec-members-btn"
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                View EC Members <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </section>

        {/* Registration Certificate Section */}
        {(pc.cert_image_url || pc.cert_org_name) && (
          <section style={{ padding: '80px 24px', background: 'white' }} data-testid="cert-section">
            <div style={{ maxWidth: '900px', margin: '0 auto' }}>
              <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#1e7a4d', fontWeight: 700, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1.5px', fontFamily: 'Poppins, sans-serif', marginBottom: '12px' }}>
                  <ShieldCheck size={16} /> Official Registration
                </div>
                <h2 style={{ fontFamily: 'Poppins, sans-serif', fontSize: 'clamp(24px,3vw,34px)', fontWeight: 800, color: '#0c3c60', marginBottom: '10px' }}>
                  {pc.cert_title || 'Registration Certificate'}
                </h2>
                <p style={{ fontSize: '15px', color: '#6b7280', fontFamily: 'Inter, sans-serif' }}>
                  {pc.cert_subtitle || 'Officially registered under the Tamil Nadu Societies Registration Act'}
                </p>
              </div>

              <div style={{ background: '#fafbfc', borderRadius: '20px', padding: '40px', border: '1px solid #e8edf2', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
                {pc.cert_org_name && (
                  <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                    <h3 style={{ fontFamily: 'Poppins, sans-serif', fontSize: '18px', fontWeight: 700, color: '#0c3c60', marginBottom: '4px' }}>{pc.cert_org_name}</h3>
                    {pc.cert_act && <p style={{ fontSize: '13px', color: '#6b7280', margin: '0 0 4px', fontFamily: 'Inter, sans-serif' }}>{pc.cert_act}</p>}
                    {pc.cert_reg_number && (
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#d1fae5', padding: '4px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, color: '#065f46', fontFamily: 'Poppins, sans-serif', marginTop: '8px' }}>
                        <FileCheck size={13} /> Reg. No: {pc.cert_reg_number}
                      </div>
                    )}
                  </div>
                )}
                {certImg && (
                  <div style={{ textAlign: 'center' }}>
                    <img src={certImg} alt="Registration Certificate" style={{ maxWidth: '100%', maxHeight: '600px', borderRadius: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb' }} data-testid="cert-image" />
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Headquarters */}
        <section style={{ padding: '80px 24px', background: '#fafbfc' }}>
          <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#1e7a4d', fontWeight: 700, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1.5px', fontFamily: 'Poppins, sans-serif', marginBottom: '12px' }}>
              <MapPin size={16} /> {pc.hq_title || 'Headquarters'}
            </div>
            <h2 style={{ fontFamily: 'Poppins, sans-serif', fontSize: 'clamp(24px,3vw,34px)', fontWeight: 800, color: '#0c3c60', marginBottom: '28px' }}>Our Location</h2>
            <div style={{ background: 'linear-gradient(135deg, #0c3c60, #164e7e)', borderRadius: '20px', padding: '40px', color: 'white', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '150px', height: '150px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
              <div style={{ fontSize: '16px', lineHeight: 1.9, fontFamily: 'Inter, sans-serif', opacity: 0.9, position: 'relative', marginBottom: '24px' }}>
                {cms.contact_address || 'Department of Livestock Products Technology (Dairy Science), Veterinary College and Research Institute (VCRI), Namakkal - 637002, Tamil Nadu, India'}
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '28px', flexWrap: 'wrap', position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', opacity: 0.85 }}>
                  <Mail size={15} style={{ color: '#4ade80' }} /> {cms.contact_email || 'info@idsea.org'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', opacity: 0.85 }}>
                  <Phone size={15} style={{ color: '#4ade80' }} /> {cms.contact_phone || '+91 98765 43210'}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
      <PublicFooter />
    </div>
  );
}
