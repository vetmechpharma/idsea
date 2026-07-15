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
  { id: '11', label: 'Announcements', to: '/announcements', type: 'internal', visible: true, order: 5 },
  { id: '6', label: 'Journal (JDSE)', to: '/journal', type: 'internal', visible: true, order: 6 },
  { id: '12', label: 'Editorial Board', to: '/journal', type: 'internal', visible: true, order: 7, parent: 'journal' },
  { id: '7', label: 'Gallery', to: '/gallery', type: 'internal', visible: true, order: 6 },
  { id: '8', label: 'Verify Certificate', to: '/verify', type: 'internal', visible: true, order: 7 },
  { id: '9', label: 'Contact Us', to: '/contact', type: 'internal', visible: true, order: 8 },
  { id: '10', label: 'Join IDSEA', to: '/apply', type: 'internal', visible: true, order: 9 },
];

export default function PublicNavbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [cms, setCms] = useState({});
  const [pc, setPc] = useState({});
  const [openDropdown, setOpenDropdown] = useState(null);
  const [aboutPc, setAboutPc] = useState({});
  const dropdownRef = useRef(null);

  useEffect(() => {
    axios.get(`${API}/public/cms`).then(r => setCms(r.data)).catch(() => {});
    axios.get(`${API}/public/page-content/navbar`).then(r => setPc(r.data)).catch(() => {});
    axios.get(`${API}/public/page-content/about`).then(r => setAboutPc(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setOpenDropdown(null);
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

  // Group: top-level items + dropdown children
  const dropdownGroups = {};
  visibleMenu.forEach(m => {
    if (m.parent && m.parent !== '') {
      if (!dropdownGroups[m.parent]) dropdownGroups[m.parent] = [];
      dropdownGroups[m.parent].push(m);
    }
  });
  const topItems = visibleMenu.filter(m => !m.parent || m.parent === '');
  // Remove items that are used as top-level but also have children (they become dropdowns)
  const dropdownParentKeys = Object.keys(dropdownGroups);

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

  // Dropdown label map
  const DROPDOWN_LABELS = { about: 'About Us', journal: 'Journal (JDSE)' };

  const buildDesktopNav = () => {
    const items = [];
    topItems.forEach(item => {
      const parentKey = dropdownParentKeys.find(k => {
        // Match: item label contains the key or item.to matches (/about, /journal)
        const path = item.to?.replace('/', '');
        return path === k || item.label.toLowerCase().includes(k);
      });

      if (parentKey && dropdownGroups[parentKey]) {
        // This is a parent item with dropdown children
        const children = dropdownGroups[parentKey];
        const isOpen = openDropdown === parentKey;
        const label = item.label || DROPDOWN_LABELS[parentKey] || parentKey;

        items.push(
          <div key={`dd-${parentKey}`} className="nav-dropdown-wrap"
            onMouseEnter={() => setOpenDropdown(parentKey)}
            onMouseLeave={() => setOpenDropdown(null)}>
            <button onClick={() => setOpenDropdown(isOpen ? null : parentKey)} data-testid={`nav-${parentKey}-dropdown`} className="nav-dropdown-trigger">
              {label}
              <ChevronDown size={14} style={{ transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'rotate(0)' }} />
            </button>
            {isOpen && (
              <div className="nav-dropdown-menu" ref={dropdownRef}>
                {/* Include the parent page itself */}
                {item.to && (
                  <NavLink to={item.to} onClick={() => setOpenDropdown(null)} className="nav-dropdown-item"
                    style={({ isActive }) => ({ fontWeight: isActive ? 700 : 400, background: isActive ? 'rgba(255,255,255,0.15)' : 'transparent' })}>
                    {item.label}
                  </NavLink>
                )}
                {children.map(child => {
                  if (child.type === 'custom') {
                    return <a key={child.id} href={child.to} target="_blank" rel="noreferrer" onClick={() => setOpenDropdown(null)} className="nav-dropdown-item">{child.label}</a>;
                  }
                  return (
                    <NavLink key={child.id} to={child.to} onClick={() => setOpenDropdown(null)} className="nav-dropdown-item"
                      style={({ isActive }) => ({ fontWeight: isActive ? 700 : 400, background: isActive ? 'rgba(255,255,255,0.15)' : 'transparent' })}>
                      {child.label}
                    </NavLink>
                  );
                })}
              </div>
            )}
          </div>
        );
      } else {
        items.push(renderLink(item));
      }
    });
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
          {topItems.map(item => {
            const parentKey = dropdownParentKeys.find(k => item.to?.replace('/', '') === k || item.label.toLowerCase().includes(k));
            if (parentKey && dropdownGroups[parentKey]) {
              return (
                <div key={`mob-${parentKey}`}>
                  <div className="mobile-nav-group-label">{item.label}</div>
                  {dropdownGroups[parentKey].map(child => {
                    if (child.type === 'custom') return <a key={child.id} href={child.to} target="_blank" rel="noreferrer" onClick={() => setMobileOpen(false)} className="mobile-nav-link">{child.label}</a>;
                    return <NavLink key={child.id} to={child.to} onClick={() => setMobileOpen(false)} className="mobile-nav-link" style={({ isActive }) => ({ fontWeight: isActive ? 700 : 400, background: isActive ? 'rgba(255,255,255,0.1)' : 'transparent' })}>{child.label}</NavLink>;
                  })}
                </div>
              );
            }
            if (item.type === 'custom') return <a key={item.id} href={item.to} target="_blank" rel="noreferrer" onClick={() => setMobileOpen(false)} className="mobile-nav-link">{item.label}</a>;
            return <NavLink key={item.id} to={item.to} end={item.to === '/'} onClick={() => setMobileOpen(false)} className="mobile-nav-link" style={({ isActive }) => ({ fontWeight: isActive ? 700 : 400, background: isActive ? 'rgba(255,255,255,0.1)' : 'transparent' })}>{item.label}</NavLink>;
          })}
        </div>
      )}
    </header>
  );
}
