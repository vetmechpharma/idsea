import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { Menu, X, ChevronDown } from 'lucide-react';
import { API } from '../../contexts/AuthContext';
import axios from 'axios';

const DEFAULT_NAV = [
  { id: '1', label: 'Home', to: '/', type: 'internal', visible: true, order: 0 },
  { id: '2', label: 'About IDSEA', to: '/about', type: 'internal', visible: true, order: 1, parent: 'about' },
  { id: '3', label: 'EC Members', to: '/ec-members', type: 'internal', visible: true, order: 2, parent: 'about' },
  { id: '4', label: 'Membership', to: '/members', type: 'internal', visible: true, order: 3 },
  { id: '5', label: 'Events', to: '/events', type: 'internal', visible: true, order: 4 },
  { id: '6', label: 'Publications', to: '/publications', type: 'internal', visible: true, order: 5 },
  { id: '7', label: 'Gallery', to: '/gallery', type: 'internal', visible: true, order: 6 },
  { id: '8', label: 'Verify Certificate', to: '/verify', type: 'internal', visible: true, order: 7 },
  { id: '9', label: 'Contact Us', to: '/contact', type: 'internal', visible: true, order: 8 },
  { id: '10', label: 'Join IDSEA', to: '/apply', type: 'internal', visible: true, order: 9 },
];

export default function PublicNavbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [cms, setCms] = useState({});
  const [pc, setPc] = useState({});
  const [aboutOpen, setAboutOpen] = useState(false);
  const [aboutPc, setAboutPc] = useState({});
  const aboutRef = useRef(null);

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

  // Build nav from DB or fallback
  const rawMenu = (pc.menu_items && pc.menu_items.length > 0) ? pc.menu_items : DEFAULT_NAV;
  const visibleMenu = rawMenu.filter(m => m.visible !== false).sort((a, b) => (a.order || 0) - (b.order || 0));

  // Group: top-level items + "about" dropdown children
  const aboutChildren = visibleMenu.filter(m => m.parent === 'about');
  const topItems = visibleMenu.filter(m => !m.parent);
  const hasAboutDropdown = aboutChildren.length > 0;

  const linkStyle = (isActive) => ({
    color: 'white', textDecoration: 'none', padding: '13px 16px',
    fontSize: '13px', fontFamily: 'Poppins, sans-serif',
    fontWeight: isActive ? 700 : 500, letterSpacing: '0.3px',
    background: isActive ? 'rgba(255,255,255,0.15)' : 'transparent',
    transition: 'background 0.2s ease', whiteSpace: 'nowrap', display: 'block',
  });

  const renderLink = (item) => {
    if (item.type === 'custom') {
      return (
        <a key={item.id} href={item.to} target="_blank" rel="noreferrer"
          data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
          style={linkStyle(false)}>
          {item.label}
        </a>
      );
    }
    return (
      <NavLink key={item.id} to={item.to} end={item.to === '/'}
        data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
        style={({ isActive }) => linkStyle(isActive)}>
        {item.label}
      </NavLink>
    );
  };

  // Insert About dropdown at position of first about child
  const buildDesktopNav = () => {
    const items = [];
    let aboutInserted = false;

    topItems.forEach(item => {
      items.push(renderLink(item));
    });

    // Insert About dropdown if we have children - place after Home
    if (hasAboutDropdown && !aboutInserted) {
      const aboutDropdown = (
        <div key="about-dropdown" ref={aboutRef} className="nav-dropdown-wrap"
          onMouseEnter={() => setAboutOpen(true)}
          onMouseLeave={() => setAboutOpen(false)}>
          <button onClick={() => setAboutOpen(!aboutOpen)} data-testid="nav-about-us" className="nav-dropdown-trigger">
            About Us
            <ChevronDown size={14} style={{ transition: 'transform 0.2s', transform: aboutOpen ? 'rotate(180deg)' : 'rotate(0)' }} />
          </button>
          {aboutOpen && (
            <div className="nav-dropdown-menu">
              {aboutChildren.map(child => {
                if (child.type === 'custom') {
                  return (
                    <a key={child.id} href={child.to} target="_blank" rel="noreferrer"
                      onClick={() => setAboutOpen(false)}
                      data-testid={`nav-${child.label.toLowerCase().replace(/\s+/g, '-')}`}
                      className="nav-dropdown-item">
                      {child.label}
                    </a>
                  );
                }
                return (
                  <NavLink key={child.id} to={child.to} onClick={() => setAboutOpen(false)}
                    data-testid={`nav-${child.label.toLowerCase().replace(/\s+/g, '-')}`}
                    className="nav-dropdown-item"
                    style={({ isActive }) => ({ fontWeight: isActive ? 700 : 400, background: isActive ? 'rgba(255,255,255,0.15)' : 'transparent' })}>
                    {child.label}
                  </NavLink>
                );
              })}
            </div>
          )}
        </div>
      );
      // Insert after first item (Home)
      items.splice(1, 0, aboutDropdown);
    }

    return items;
  };

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
          {buildDesktopNav()}
        </div>
      </nav>

      {/* Mobile Nav */}
      {mobileOpen && (
        <div className="mobile-nav">
          {hasAboutDropdown && (
            <div>
              <div className="mobile-nav-group-label">About Us</div>
              {aboutChildren.map(child => {
                if (child.type === 'custom') {
                  return <a key={child.id} href={child.to} target="_blank" rel="noreferrer" onClick={() => setMobileOpen(false)} className="mobile-nav-link">{child.label}</a>;
                }
                return (
                  <NavLink key={child.id} to={child.to} onClick={() => setMobileOpen(false)}
                    className="mobile-nav-link"
                    style={({ isActive }) => ({ fontWeight: isActive ? 700 : 400, background: isActive ? 'rgba(255,255,255,0.1)' : 'transparent' })}>
                    {child.label}
                  </NavLink>
                );
              })}
            </div>
          )}
          {topItems.map(item => {
            if (item.type === 'custom') {
              return <a key={item.id} href={item.to} target="_blank" rel="noreferrer" onClick={() => setMobileOpen(false)} className="mobile-nav-link">{item.label}</a>;
            }
            return (
              <NavLink key={item.id} to={item.to} end={item.to === '/'} onClick={() => setMobileOpen(false)}
                className="mobile-nav-link"
                style={({ isActive }) => ({ fontWeight: isActive ? 700 : 400, background: isActive ? 'rgba(255,255,255,0.1)' : 'transparent' })}>
                {item.label}
              </NavLink>
            );
          })}
        </div>
      )}
    </header>
  );
}
