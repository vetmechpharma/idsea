import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { Menu, X, ChevronDown } from 'lucide-react';
import { API } from '../../contexts/AuthContext';
import axios from 'axios';

const navLinks = [
  { to: '/', label: 'Home' },
  {
    label: 'About Us', children: [
      { to: '/about', label: 'About IDSEA' },
      { to: '/ec-members', label: 'EC Members' },
    ]
  },
  { to: '/members', label: 'Membership' },
  { to: '/events', label: 'Events' },
  { to: '/publications', label: 'Publications' },
  { to: '/gallery', label: 'Gallery' },
  { to: '/contact', label: 'Contact Us' },
  { to: '/apply', label: 'Join IDSEA' },
];

export default function PublicNavbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [cms, setCms] = useState({});
  const [pc, setPc] = useState({});
  const [aboutOpen, setAboutOpen] = useState(false);
  const aboutRef = useRef(null);

  useEffect(() => {
    axios.get(`${API}/public/cms`).then(r => setCms(r.data)).catch(() => {});
    axios.get(`${API}/public/page-content/navbar`).then(r => setPc(r.data)).catch(() => {});
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (aboutRef.current && !aboutRef.current.contains(e.target)) setAboutOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const logoUrl = cms.logo_url
    ? (cms.logo_url.startsWith('http') ? cms.logo_url : `${API.replace('/api', '')}${cms.logo_url}`)
    : null;

  const orgName = pc.org_name || 'Indian Dairy Scientists and Entrepreneurs Association';
  const orgShort = pc.org_short || '(IDSEA)';

  const linkStyle = (isActive) => ({
    color: 'white', textDecoration: 'none', padding: '13px 18px',
    fontSize: '14px', fontFamily: 'Poppins, sans-serif',
    fontWeight: isActive ? 700 : 500, letterSpacing: '0.3px',
    background: isActive ? 'rgba(255,255,255,0.15)' : 'transparent',
    transition: 'background 0.2s ease', whiteSpace: 'nowrap', display: 'block',
  });

  return (
    <header style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, background: 'white' }}>
      {/* Top Brand Section */}
      <div style={{ background: 'white', borderBottom: '1px solid #e5e7eb' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <Link to="/" style={{ textDecoration: 'none', flexShrink: 0 }} data-testid="nav-logo">
            {logoUrl ? (
              <img src={logoUrl} alt="IDSEA" style={{ height: '90px', width: '90px', objectFit: 'contain' }} />
            ) : (
              <div style={{ width: '90px', height: '90px', borderRadius: '50%', background: '#0c3c60', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: 'white', fontWeight: 800, fontSize: '24px', fontFamily: 'Poppins, sans-serif' }}>IDSEA</span>
              </div>
            )}
          </Link>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontFamily: 'Poppins, sans-serif', fontSize: 'clamp(18px, 3vw, 28px)', fontWeight: 800, color: '#0c3c60', margin: '0 0 4px', lineHeight: 1.2, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
              {orgName}
            </h1>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 'clamp(11px, 1.5vw, 14px)', color: '#6b7280', margin: 0, fontStyle: 'italic' }}>
              {orgShort}
            </p>
          </div>
          <button onClick={() => setMobileOpen(!mobileOpen)}
            style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer', color: '#0c3c60', padding: '4px' }}
            className="mobile-menu-btn" data-testid="mobile-menu-btn">
            {mobileOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </div>

      {/* Navigation Bar */}
      <nav style={{ background: '#0c3c60' }} className="desktop-nav">
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0', flexWrap: 'wrap' }}>
          {navLinks.map((item) => {
            // Dropdown menu for About Us
            if (item.children) {
              return (
                <div key={item.label} ref={aboutRef} style={{ position: 'relative' }}
                  onMouseEnter={() => setAboutOpen(true)}
                  onMouseLeave={() => setAboutOpen(false)}>
                  <button
                    onClick={() => setAboutOpen(!aboutOpen)}
                    data-testid="nav-about-us"
                    style={{
                      color: 'white', background: aboutOpen ? 'rgba(255,255,255,0.15)' : 'transparent',
                      border: 'none', cursor: 'pointer',
                      padding: '13px 18px', fontSize: '14px', fontFamily: 'Poppins, sans-serif',
                      fontWeight: 500, letterSpacing: '0.3px',
                      display: 'flex', alignItems: 'center', gap: '4px',
                      transition: 'background 0.2s ease', whiteSpace: 'nowrap',
                    }}
                  >
                    {item.label}
                    <ChevronDown size={14} style={{ transition: 'transform 0.2s', transform: aboutOpen ? 'rotate(180deg)' : 'rotate(0)' }} />
                  </button>
                  {aboutOpen && (
                    <div style={{
                      position: 'absolute', top: '100%', left: 0,
                      background: '#0c3c60', borderRadius: '0 0 8px 8px',
                      boxShadow: '0 8px 20px rgba(0,0,0,0.25)',
                      minWidth: '200px', overflow: 'hidden', zIndex: 200,
                      border: '1px solid rgba(255,255,255,0.1)', borderTop: 'none',
                    }}>
                      {item.children.map(child => (
                        <NavLink
                          key={child.to} to={child.to}
                          onClick={() => setAboutOpen(false)}
                          data-testid={`nav-${child.label.toLowerCase().replace(/\s+/g, '-')}`}
                          style={({ isActive }) => ({
                            color: 'white', textDecoration: 'none',
                            padding: '12px 20px', fontSize: '13px',
                            fontFamily: 'Poppins, sans-serif',
                            fontWeight: isActive ? 700 : 400,
                            background: isActive ? 'rgba(255,255,255,0.15)' : 'transparent',
                            display: 'block', whiteSpace: 'nowrap',
                            transition: 'background 0.15s ease',
                          })}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                          onMouseLeave={e => { if (!e.currentTarget.classList.contains('active')) e.currentTarget.style.background = 'transparent'; }}
                        >
                          {child.label}
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            // Regular nav link
            return (
              <NavLink key={item.to} to={item.to} end={item.to === '/'}
                data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                style={({ isActive }) => linkStyle(isActive)}
                onMouseEnter={e => { if (!e.currentTarget.classList.contains('active')) e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
                onMouseLeave={e => { if (!e.currentTarget.classList.contains('active')) e.currentTarget.style.background = 'transparent'; }}
              >
                {item.label}
              </NavLink>
            );
          })}
          <Link to="/admin/login" data-testid="nav-admin-btn"
            style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none', padding: '13px 18px', fontSize: '13px', fontFamily: 'Poppins, sans-serif', fontWeight: 500, transition: 'color 0.2s ease', whiteSpace: 'nowrap', marginLeft: 'auto' }}
            onMouseEnter={e => e.currentTarget.style.color = 'white'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.6)'}
          >
            Admin
          </Link>
        </div>
      </nav>

      {/* Mobile Nav Dropdown */}
      {mobileOpen && (
        <div style={{ background: '#0c3c60', padding: '8px 24px 16px', display: 'flex', flexDirection: 'column', gap: '0', boxShadow: '0 12px 24px rgba(0,0,0,0.2)' }}>
          {navLinks.map((item) => {
            if (item.children) {
              return (
                <div key={item.label}>
                  <div style={{ color: 'rgba(255,255,255,0.5)', padding: '12px 12px 4px', fontSize: '11px', fontFamily: 'Poppins, sans-serif', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {item.label}
                  </div>
                  {item.children.map(child => (
                    <NavLink key={child.to} to={child.to} onClick={() => setMobileOpen(false)}
                      style={({ isActive }) => ({
                        color: 'white', textDecoration: 'none', padding: '10px 12px 10px 24px',
                        fontSize: '14px', fontFamily: 'Poppins, sans-serif',
                        fontWeight: isActive ? 700 : 400,
                        background: isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
                        borderRadius: '6px', display: 'block',
                      })}
                    >
                      {child.label}
                    </NavLink>
                  ))}
                </div>
              );
            }
            return (
              <NavLink key={item.to} to={item.to} end={item.to === '/'} onClick={() => setMobileOpen(false)}
                style={({ isActive }) => ({
                  color: 'white', textDecoration: 'none', padding: '12px 12px',
                  fontSize: '14px', fontFamily: 'Poppins, sans-serif',
                  fontWeight: isActive ? 700 : 400,
                  background: isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
                  borderRadius: '6px', display: 'block',
                })}
              >
                {item.label}
              </NavLink>
            );
          })}
          <Link to="/admin/login" onClick={() => setMobileOpen(false)}
            style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none', padding: '12px 12px', fontSize: '13px', fontFamily: 'Poppins, sans-serif', borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: '8px' }}>
            Admin Panel
          </Link>
        </div>
      )}
    </header>
  );
}
