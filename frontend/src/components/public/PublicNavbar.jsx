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

  const [aboutPc, setAboutPc] = useState({});

  useEffect(() => {
    axios.get(`${API}/public/cms`).then(r => setCms(r.data)).catch(() => {});
    axios.get(`${API}/public/page-content/navbar`).then(r => setPc(r.data)).catch(() => {});
    axios.get(`${API}/public/page-content/about`).then(r => setAboutPc(r.data)).catch(() => {});
  }, []);

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
  const regNumber = aboutPc.cert_reg_number || '';

  const linkStyle = (isActive) => ({
    color: 'white', textDecoration: 'none', padding: '13px 16px',
    fontSize: '13px', fontFamily: 'Poppins, sans-serif',
    fontWeight: isActive ? 700 : 500, letterSpacing: '0.3px',
    background: isActive ? 'rgba(255,255,255,0.15)' : 'transparent',
    transition: 'background 0.2s ease', whiteSpace: 'nowrap', display: 'block',
  });

  return (
    <header className="public-header">
      {/* Top Brand Section */}
      <div className="header-brand">
        <div className="header-brand-inner">
          <Link to="/" className="header-logo-link" data-testid="nav-logo">
            {logoUrl ? (
              <img src={logoUrl} alt="IDSEA" className="header-logo-img" />
            ) : (
              <div className="header-logo-fallback">
                <span>IDSEA</span>
              </div>
            )}
          </Link>
          <div className="header-org-info">
            <h1 className="header-org-name">{orgName}</h1>
            <div className="header-org-sub">
              <span className="header-org-short">{orgShort}</span>
              {regNumber && <span className="header-reg-number">Reg. No: {regNumber}</span>}
            </div>
          </div>
          <button onClick={() => setMobileOpen(!mobileOpen)} className="mobile-menu-btn" data-testid="mobile-menu-btn">
            {mobileOpen ? <X size={26} /> : <Menu size={26} />}
          </button>
        </div>
      </div>

      {/* Navigation Bar */}
      <nav className="desktop-nav">
        <div className="nav-inner">
          {navLinks.map((item) => {
            if (item.children) {
              return (
                <div key={item.label} ref={aboutRef} className="nav-dropdown-wrap"
                  onMouseEnter={() => setAboutOpen(true)}
                  onMouseLeave={() => setAboutOpen(false)}>
                  <button onClick={() => setAboutOpen(!aboutOpen)} data-testid="nav-about-us" className="nav-dropdown-trigger">
                    {item.label}
                    <ChevronDown size={14} style={{ transition: 'transform 0.2s', transform: aboutOpen ? 'rotate(180deg)' : 'rotate(0)' }} />
                  </button>
                  {aboutOpen && (
                    <div className="nav-dropdown-menu">
                      {item.children.map(child => (
                        <NavLink key={child.to} to={child.to} onClick={() => setAboutOpen(false)}
                          data-testid={`nav-${child.label.toLowerCase().replace(/\s+/g, '-')}`}
                          className="nav-dropdown-item"
                          style={({ isActive }) => ({ fontWeight: isActive ? 700 : 400, background: isActive ? 'rgba(255,255,255,0.15)' : 'transparent' })}>
                          {child.label}
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              );
            }
            return (
              <NavLink key={item.to} to={item.to} end={item.to === '/'}
                data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                style={({ isActive }) => linkStyle(isActive)}>
                {item.label}
              </NavLink>
            );
          })}
          <Link to="/admin/login" data-testid="nav-admin-btn" className="nav-admin-link">Admin</Link>
        </div>
      </nav>

      {/* Mobile Nav */}
      {mobileOpen && (
        <div className="mobile-nav">
          {navLinks.map((item) => {
            if (item.children) {
              return (
                <div key={item.label}>
                  <div className="mobile-nav-group-label">{item.label}</div>
                  {item.children.map(child => (
                    <NavLink key={child.to} to={child.to} onClick={() => setMobileOpen(false)}
                      className="mobile-nav-link"
                      style={({ isActive }) => ({ fontWeight: isActive ? 700 : 400, background: isActive ? 'rgba(255,255,255,0.1)' : 'transparent' })}>
                      {child.label}
                    </NavLink>
                  ))}
                </div>
              );
            }
            return (
              <NavLink key={item.to} to={item.to} end={item.to === '/'} onClick={() => setMobileOpen(false)}
                className="mobile-nav-link"
                style={({ isActive }) => ({ fontWeight: isActive ? 700 : 400, background: isActive ? 'rgba(255,255,255,0.1)' : 'transparent' })}>
                {item.label}
              </NavLink>
            );
          })}
          <Link to="/admin/login" onClick={() => setMobileOpen(false)} className="mobile-nav-admin">Admin Panel</Link>
        </div>
      )}
    </header>
  );
}
