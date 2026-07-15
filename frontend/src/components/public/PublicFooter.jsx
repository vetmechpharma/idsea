import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin } from 'lucide-react';
import { API } from '../../contexts/AuthContext';
import axios from 'axios';

const BACKEND = API.replace('/api', '');

/* Brand-colored social SVG icons */
const FacebookIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="#1877F2"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
);
const TwitterIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="#000000"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
);
const LinkedInIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="#0A66C2"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
);
const YouTubeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="#FF0000"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z"/><polygon fill="#fff" points="9.545,15.568 15.818,12 9.545,8.432"/></svg>
);
const InstagramIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="url(#ig-gradient)"><defs><linearGradient id="ig-gradient" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" stopColor="#feda75"/><stop offset="25%" stopColor="#fa7e1e"/><stop offset="50%" stopColor="#d62976"/><stop offset="75%" stopColor="#962fbf"/><stop offset="100%" stopColor="#4f5bd5"/></linearGradient></defs><path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z"/></svg>
);

const SOCIAL_ICONS = [
  { key: 'facebook', Icon: FacebookIcon, bgHover: '#1877F2' },
  { key: 'twitter', Icon: TwitterIcon, bgHover: '#000000' },
  { key: 'linkedin', Icon: LinkedInIcon, bgHover: '#0A66C2' },
  { key: 'youtube', Icon: YouTubeIcon, bgHover: '#FF0000' },
  { key: 'instagram', Icon: InstagramIcon, bgHover: '#E4405F' },
];

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
    ? (cms.logo_url.startsWith('http') ? cms.logo_url : `${BACKEND}${cms.logo_url}`)
    : null;

  const socialUrls = {
    facebook: cms.facebook_url || '',
    twitter: cms.twitter_url || '',
    linkedin: cms.linkedin_url || '',
    youtube: cms.youtube_url || '',
    instagram: cms.instagram_url || '',
  };

  return (
    <footer style={{ background: '#0c3c60', color: 'white', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '48px 24px 0' }}>
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
              {/* Social Icons with brand colors */}
              <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                {SOCIAL_ICONS.map(({ key, Icon, bgHover }) => {
                  const url = socialUrls[key];
                  return (
                    <a key={key} href={url || undefined} target={url ? '_blank' : undefined} rel="noreferrer"
                      data-testid={`social-${key}`}
                      onClick={e => { if (!url) e.preventDefault(); }}
                      style={{
                        width: '34px', height: '34px', borderRadius: '50%',
                        background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'background 0.2s ease, transform 0.2s ease'
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = bgHover; e.currentTarget.style.transform = 'scale(1.1)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.transform = 'scale(1)'; }}
                    >
                      <Icon />
                    </a>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ IDSEA Line Art Divider ═══ */}
      <div data-testid="footer-lineart" style={{
        width: '100%',
        lineHeight: 0,
      }}>
        <img
          src={`${BACKEND}/api/uploads/idsea_footer_final.webp`}
          alt=""
          aria-hidden="true"
          style={{
            width: '100%',
            height: 'auto',
            display: 'block',
          }}
          loading="lazy"
        />
      </div>

      {/* ═══ Copyright Bar ═══ */}
      <div style={{ background: '#091f32', padding: '16px 24px', textAlign: 'center' }}>
        <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.45)', fontFamily: 'Inter, sans-serif' }}>
          &copy; {new Date().getFullYear()} {pc.copyright_text || 'Indian Dairy Scientists and Entrepreneurs Association (IDSEA). All rights reserved.'}
        </p>
      </div>
    </footer>
  );
}
