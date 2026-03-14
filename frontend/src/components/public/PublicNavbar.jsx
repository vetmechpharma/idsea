import React, { useState, useEffect } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { Menu, X, Mail, Phone, Facebook, Twitter, Linkedin } from 'lucide-react';
import { API } from '../../contexts/AuthContext';
import axios from 'axios';

const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/about', label: 'About' },
  { to: '/members', label: 'Members' },
  { to: '/events', label: 'Events' },
  { to: '/publications', label: 'Publications' },
  { to: '/gallery', label: 'Gallery' },
  { to: '/contact', label: 'Contact' },
];

export default function PublicNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [cms, setCms] = useState({});

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    axios.get(`${API}/public/cms`).then(r => setCms(r.data)).catch(() => {});
  }, []);

  const logoUrl = cms.logo_url
    ? (cms.logo_url.startsWith('http') ? cms.logo_url : `${API.replace('/api', '')}${cms.logo_url}`)
    : null;

  return (
    <header style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      transition: 'box-shadow 0.3s ease',
      boxShadow: scrolled ? '0 4px 24px rgba(0,0,0,0.12)' : '0 1px 4px rgba(0,0,0,0.06)',
    }}>
      {/* Top Utility Bar */}
      <div style={{
        background: '#0c3c60',
        fontSize: '12px',
        color: 'rgba(255,255,255,0.85)',
        fontFamily: 'Inter, sans-serif',
      }}>
        <div style={{
          maxWidth: '1280px', margin: '0 auto', padding: '0 24px',
          height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <a href={`mailto:${cms.contact_email || 'info@idsea.org'}`} style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'rgba(255,255,255,0.85)', textDecoration: 'none', transition: 'color 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.color = '#4ade80'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.85)'}
            >
              <Mail size={13} /> {cms.contact_email || 'info@idsea.org'}
            </a>
            <a href={`tel:${cms.contact_phone || ''}`} style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'rgba(255,255,255,0.85)', textDecoration: 'none', transition: 'color 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.color = '#4ade80'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.85)'}
              className="topbar-phone"
            >
              <Phone size={13} /> {cms.contact_phone || '+91 98765 43210'}
            </a>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {[
              { icon: Facebook, url: cms.facebook_url },
              { icon: Twitter, url: cms.twitter_url },
              { icon: Linkedin, url: cms.linkedin_url },
            ].map(({ icon: Icon, url }, i) => (
              <a key={i} href={url || '#'} target="_blank" rel="noreferrer" style={{
                width: '26px', height: '26px', borderRadius: '50%',
                background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'rgba(255,255,255,0.7)', textDecoration: 'none', transition: 'background 0.2s'
              }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
              >
                <Icon size={12} />
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Main Nav Bar */}
      <div style={{
        background: 'white',
        borderBottom: '1px solid #e5e7eb',
      }}>
        <div style={{
          maxWidth: '1280px', margin: '0 auto', padding: '0 24px',
          height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          {/* Logo + Name */}
          <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px' }} data-testid="nav-logo">
            {logoUrl ? (
              <img src={logoUrl} alt="IDSEA" style={{ height: '48px', width: '48px', objectFit: 'contain', borderRadius: '4px' }} />
            ) : (
              <div style={{ width: '48px', height: '48px', borderRadius: '8px', background: '#0c3c60', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: 'white', fontWeight: 800, fontSize: '15px', fontFamily: 'Poppins, sans-serif' }}>ID</span>
              </div>
            )}
            <div>
              <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: '17px', color: '#0c3c60', lineHeight: 1.2, letterSpacing: '0.3px' }}>IDSEA</div>
              <div style={{ fontSize: '10px', color: '#6b7280', fontFamily: 'Inter, sans-serif', lineHeight: 1.3 }}>Indian Dairy Scientists &amp; Entrepreneurs Association</div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '2px' }} className="desktop-nav">
            {navLinks.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) => `pub-nav-link ${isActive ? 'active' : ''}`}
                data-testid={`nav-${label.toLowerCase()}`}
              >
                {label}
              </NavLink>
            ))}
          </nav>

          {/* CTA Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Link
              to="/apply"
              data-testid="nav-apply-btn"
              style={{
                background: '#1e7a4d', color: 'white', textDecoration: 'none',
                padding: '9px 20px', borderRadius: '6px', fontSize: '13px',
                fontWeight: 600, fontFamily: 'Poppins, sans-serif',
                transition: 'background 0.2s ease', display: 'inline-block',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#166534'}
              onMouseLeave={e => e.currentTarget.style.background = '#1e7a4d'}
            >
              Join IDSEA
            </Link>
            <Link
              to="/admin/login"
              data-testid="nav-admin-btn"
              style={{
                background: 'transparent', color: '#0c3c60', textDecoration: 'none',
                padding: '8px 14px', borderRadius: '6px', fontSize: '13px',
                fontWeight: 500, fontFamily: 'Poppins, sans-serif',
                border: '1px solid #d1d5db', transition: 'all 0.2s ease',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#0c3c60'; e.currentTarget.style.color = 'white'; e.currentTarget.style.borderColor = '#0c3c60'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#0c3c60'; e.currentTarget.style.borderColor = '#d1d5db'; }}
            >
              Admin
            </Link>

            {/* Mobile Toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer', color: '#0c3c60', padding: '4px' }}
              className="mobile-menu-btn"
              data-testid="mobile-menu-btn"
            >
              {mobileOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav Dropdown */}
      {mobileOpen && (
        <div style={{
          background: 'white', borderTop: '1px solid #e5e7eb',
          padding: '12px 24px 16px', display: 'flex', flexDirection: 'column', gap: '2px',
          boxShadow: '0 12px 24px rgba(0,0,0,0.1)'
        }}>
          {navLinks.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) => `pub-nav-link ${isActive ? 'active' : ''}`}
              onClick={() => setMobileOpen(false)}
              style={{ display: 'block', padding: '10px 12px' }}
            >
              {label}
            </NavLink>
          ))}
          <div style={{ display: 'flex', gap: '10px', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #f1f5f9' }}>
            <Link to="/apply" onClick={() => setMobileOpen(false)} style={{ flex: 1, background: '#1e7a4d', color: 'white', textDecoration: 'none', padding: '10px', borderRadius: '6px', textAlign: 'center', fontSize: '13px', fontWeight: 600, fontFamily: 'Poppins, sans-serif' }}>Join IDSEA</Link>
            <Link to="/admin/login" onClick={() => setMobileOpen(false)} style={{ flex: 1, border: '1px solid #d1d5db', color: '#0c3c60', textDecoration: 'none', padding: '10px', borderRadius: '6px', textAlign: 'center', fontSize: '13px', fontFamily: 'Poppins, sans-serif' }}>Admin</Link>
          </div>
        </div>
      )}
    </header>
  );
}
