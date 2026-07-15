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

      {/* ═══ IDSEA Line Art Divider (SVG) ═══ */}
      <div data-testid="footer-lineart" style={{ width: '100%', lineHeight: 0, overflow: 'hidden' }}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 100" preserveAspectRatio="none" style={{ width: '100%', height: '70px', display: 'block' }}>
          <rect width="1600" height="100" fill="#0c3c60"/>
          <g stroke="rgba(255,255,255,0.35)" strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round">
            {/* Ground line */}
            <path d="M0 78 Q200 72 400 76 Q600 80 800 74 Q1000 70 1200 76 Q1400 80 1600 74"/>
            {/* Farm hut */}
            <path d="M60 78 L60 55 L40 42 L80 42 L60 55 M48 78 L48 62 L68 62 L68 78"/>
            {/* Palm tree */}
            <path d="M110 78 L110 48 M105 48 Q110 38 120 42 M115 46 Q110 36 100 40 M108 44 Q112 35 118 38"/>
            {/* Cow */}
            <path d="M170 78 L170 62 L175 58 L220 56 L228 60 L228 78 M185 78 L185 62 M210 78 L210 62 M175 56 L172 48 L178 48 L175 56 M222 56 Q230 54 228 56"/>
            {/* Milk can */}
            <path d="M260 78 L260 64 Q260 60 264 60 L274 60 Q278 60 278 64 L278 78 M262 60 L262 58 Q262 56 264 56 L274 56 Q276 56 276 58 L276 60"/>
            {/* Milk drops */}
            <circle cx="295" cy="68" r="2"/><circle cx="302" cy="72" r="1.5"/><circle cx="308" cy="66" r="1.8"/>
            {/* Farmer */}
            <circle cx="340" cy="42" r="6"/>
            <path d="M340 48 L340 66 M340 54 L328 60 M340 54 L352 60 M340 66 L332 78 M340 66 L348 78"/>
            <path d="M328 60 L325 38 L327 36 L329 38 L328 48"/>
            {/* Wheat/grass */}
            <path d="M380 78 Q382 60 390 50 M385 78 Q387 62 394 54 M390 78 Q392 64 398 56"/>
            {/* DNA helix */}
            <path d="M440 40 Q455 48 470 40 Q485 32 500 40 M440 50 Q455 42 470 50 Q485 58 500 50 M452 44 L452 47 M470 44 L470 47 M488 44 L488 47"/>
            {/* Atom */}
            <circle cx="550" cy="48" r="3"/>
            <ellipse cx="550" cy="48" rx="18" ry="8" transform="rotate(0,550,48)"/>
            <ellipse cx="550" cy="48" rx="18" ry="8" transform="rotate(60,550,48)"/>
            <ellipse cx="550" cy="48" rx="18" ry="8" transform="rotate(120,550,48)"/>
            {/* Microscope */}
            <path d="M620 78 L610 78 L615 72 L612 56 L612 48 Q612 44 616 42 L620 42 L620 48 L618 48 L618 56 L622 72 L625 78 M612 48 L606 44"/>
            {/* Flask */}
            <path d="M660 78 L650 78 L648 66 L652 56 L652 48 L658 48 L658 56 L662 66 L660 78 M650 54 L660 54"/>
            {/* Test tube */}
            <path d="M690 78 L690 46 Q690 42 694 42 L694 78 M688 46 L696 46"/>
            <circle cx="692" cy="58" r="1.5"/>
            <circle cx="692" cy="52" r="1"/>
            {/* Scientist */}
            <circle cx="740" cy="42" r="6"/>
            <path d="M740 48 L740 66 M740 54 L728 58 M740 54 L752 62 M740 66 L732 78 M740 66 L748 78"/>
            <rect x="734" y="48" width="12" height="2" rx="1"/>
            {/* Beaker */}
            <path d="M790 78 L784 78 L782 66 L786 58 L794 58 L798 66 L796 78"/>
            <path d="M784 70 Q790 68 796 70"/>
            {/* Computer/Laptop */}
            <path d="M850 78 L842 78 L844 72 L856 72 L858 78 M844 72 L844 58 L860 58 L860 72 M847 62 L857 62 M847 65 L854 65"/>
            {/* Businessman */}
            <circle cx="900" cy="42" r="6"/>
            <path d="M900 48 L900 66 M900 54 L888 60 M900 54 L912 60 M900 66 L892 78 M900 66 L908 78"/>
            <path d="M896 48 L904 48 L906 54 L894 54 Z"/>
            {/* Bar chart */}
            <path d="M950 78 L950 64 L958 64 L958 78 M962 78 L962 56 L970 56 L970 78 M974 78 L974 48 L982 48 L982 78 M986 78 L986 40 L994 40 L994 78"/>
            {/* Rupee symbol */}
            <path d="M1030 42 L1044 42 M1030 48 L1044 48 M1032 42 Q1040 42 1040 48 Q1040 54 1034 58 L1042 68"/>
            {/* Globe */}
            <circle cx="1090" cy="52" r="16"/>
            <ellipse cx="1090" cy="52" rx="8" ry="16"/>
            <path d="M1074 52 L1106 52 M1076 44 Q1090 40 1104 44 M1076 60 Q1090 64 1104 60"/>
            {/* Arrow on globe */}
            <path d="M1106 42 L1114 36 L1112 42 L1118 40" strokeWidth="1.5"/>
            {/* City buildings */}
            <path d="M1160 78 L1160 52 L1172 52 L1172 78 M1164 56 L1164 58 M1168 56 L1168 58 M1164 62 L1164 64 M1168 62 L1168 64"/>
            <path d="M1176 78 L1176 44 L1186 44 L1186 78 M1179 48 L1179 50 M1183 48 L1183 50 M1179 54 L1179 56 M1183 54 L1183 56"/>
            <path d="M1190 78 L1190 56 L1200 56 L1200 78 M1193 60 L1193 62 M1197 60 L1197 62"/>
            <path d="M1204 78 L1204 38 L1210 34 L1216 38 L1216 78 M1208 42 L1208 44 M1212 42 L1212 44 M1208 50 L1208 52 M1212 50 L1212 52"/>
            {/* Wind turbine */}
            <path d="M1260 78 L1260 48 M1260 48 L1252 36 M1260 48 L1270 38 M1260 48 L1258 60"/>
            <circle cx="1260" cy="48" r="2"/>
            {/* More wheat/plants on right */}
            <path d="M1320 78 Q1322 62 1328 52 M1325 78 Q1327 64 1333 56 M1330 78 Q1332 66 1338 58"/>
            {/* Truck/transport */}
            <path d="M1380 78 L1380 66 L1410 66 L1410 72 L1418 72 L1418 78 M1388 78 Q1388 74 1392 74 Q1396 74 1396 78 M1410 78 Q1410 74 1414 74 Q1418 74 1418 78"/>
            <path d="M1384 66 L1384 60 L1404 60 L1404 66"/>
            {/* Wifi/connectivity */}
            <path d="M1470 60 Q1480 52 1490 60 M1474 56 Q1480 50 1486 56 M1478 52 Q1480 48 1482 52"/>
            {/* More buildings far right */}
            <path d="M1530 78 L1530 58 L1540 58 L1540 78 M1544 78 L1544 50 L1552 50 L1552 78 M1556 78 L1556 62 L1564 62 L1564 78"/>
          </g>
        </svg>
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
