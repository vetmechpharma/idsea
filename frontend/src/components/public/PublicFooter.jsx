import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Facebook, Twitter, Linkedin } from 'lucide-react';
import { API } from '../../contexts/AuthContext';
import axios from 'axios';

export default function PublicFooter() {
  const [cms, setCms] = useState({});
  const [pc, setPc] = useState({});
  const [plans, setPlans] = useState([]);

  useEffect(() => {
    axios.get(`${API}/public/cms`).then(r => setCms(r.data)).catch(() => {});
    axios.get(`${API}/public/page-content/footer`).then(r => setPc(r.data)).catch(() => {});
    axios.get(`${API}/public/membership-plans`).then(r => setPlans(r.data)).catch(() => {});
  }, []);

  const logoUrl = cms.logo_url
    ? (cms.logo_url.startsWith('http') ? cms.logo_url : `${API.replace('/api', '')}${cms.logo_url}`)
    : null;

  return (
    <footer style={{ background: '#0c3c60', color: 'white', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '48px 24px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '40px', marginBottom: '40px' }}>
          {/* Brand */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
              {logoUrl ? (
                <img src={logoUrl} alt="IDSEA" style={{ height: '44px', width: '44px', objectFit: 'contain', borderRadius: '4px' }} />
              ) : (
                <div style={{ width: '44px', height: '44px', borderRadius: '8px', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ color: 'white', fontWeight: 800, fontSize: '14px', fontFamily: 'Poppins' }}>ID</span>
                </div>
              )}
              <div style={{ fontFamily: 'Poppins, sans-serif', fontSize: '20px', fontWeight: 800, color: 'white' }}>IDSEA</div>
            </div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.65)', marginBottom: '12px', lineHeight: 1.6 }}>
              Indian Dairy Scientists and Entrepreneurs Association
            </div>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, margin: 0 }}>
              {pc.description || 'Bridging dairy science, innovation & entrepreneurship for the sustainable growth of the Indian dairy sector.'}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 style={{ fontFamily: 'Poppins, sans-serif', fontSize: '14px', fontWeight: 600, marginBottom: '16px', color: 'white', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Quick Links</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[['/', 'Home'], ['/about', 'About IDSEA'], ['/members', 'Member Directory'], ['/events', 'Events'], ['/publications', 'Publications'], ['/gallery', 'Gallery']].map(([to, label]) => (
                <Link key={to} to={to} style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '13px', transition: 'color 0.2s ease' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#4ade80'}
                  onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}
                >{label}</Link>
              ))}
            </div>
          </div>

          {/* Membership */}
          <div>
            <h4 style={{ fontFamily: 'Poppins, sans-serif', fontSize: '14px', fontWeight: 600, marginBottom: '16px', color: 'white', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Membership</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {(plans.length > 0 ? plans : [
                { label: 'Academic Member', fee_inr: 3100, key: 'academic' },
                { label: 'Entrepreneur Member', fee_inr: 5100, key: 'entrepreneur' },
                { label: 'Corporate Member', fee_inr: 25100, key: 'corporate' },
              ]).map(plan => (
                <span key={plan.key || plan.label} style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px' }}>
                  {plan.label || plan.name} - {plan.key === 'international' ? `$${plan.fee_usd}` : `\u20B9${(plan.fee_inr || 0).toLocaleString()}`}
                </span>
              ))}
              <Link to="/apply" style={{ marginTop: '8px', background: '#1e7a4d', color: 'white', textDecoration: 'none', padding: '8px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, fontFamily: 'Poppins, sans-serif', display: 'inline-block', textAlign: 'center', transition: 'background 0.2s ease' }}
                onMouseEnter={e => e.currentTarget.style.background = '#166534'}
                onMouseLeave={e => e.currentTarget.style.background = '#1e7a4d'}
              >
                Apply Now
              </Link>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 style={{ fontFamily: 'Poppins, sans-serif', fontSize: '14px', fontWeight: 600, marginBottom: '16px', color: 'white', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Contact</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', gap: '10px', color: 'rgba(255,255,255,0.7)', fontSize: '13px' }}>
                <MapPin size={16} style={{ marginTop: '2px', flexShrink: 0, color: '#4ade80' }} />
                <span style={{ lineHeight: 1.6 }}>{cms.contact_address || 'VCRI, Namakkal - 637002, Tamil Nadu, India'}</span>
              </div>
              <div style={{ display: 'flex', gap: '10px', color: 'rgba(255,255,255,0.7)', fontSize: '13px', alignItems: 'center' }}>
                <Mail size={16} style={{ flexShrink: 0, color: '#4ade80' }} />
                <span>{cms.contact_email || 'info@idsea.org'}</span>
              </div>
              <div style={{ display: 'flex', gap: '10px', color: 'rgba(255,255,255,0.7)', fontSize: '13px', alignItems: 'center' }}>
                <Phone size={16} style={{ flexShrink: 0, color: '#4ade80' }} />
                <span>{cms.contact_phone || '+91 98765 43210'}</span>
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
                {[
                  { Icon: Facebook, url: cms.facebook_url },
                  { Icon: Twitter, url: cms.twitter_url },
                  { Icon: Linkedin, url: cms.linkedin_url },
                ].map(({ Icon, url }, i) => (
                  <a key={i} href={url || '#'} target={url ? '_blank' : undefined} rel="noreferrer" style={{
                    width: '32px', height: '32px', borderRadius: '50%',
                    background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'rgba(255,255,255,0.7)', transition: 'background 0.2s ease'
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = '#1e7a4d'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                  >
                    <Icon size={14} />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px', textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>
            &copy; {new Date().getFullYear()} {pc.copyright_text || 'Indian Dairy Scientists and Entrepreneurs Association (IDSEA). All rights reserved.'}
          </p>
        </div>
      </div>
    </footer>
  );
}
