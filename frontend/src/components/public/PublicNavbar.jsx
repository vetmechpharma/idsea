import React, { useState, useEffect } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

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

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      background: scrolled ? 'rgba(255,255,255,0.97)' : 'rgba(255,255,255,0.95)',
      boxShadow: scrolled ? '0 4px 20px rgba(0,0,0,0.1)' : '0 1px 4px rgba(0,0,0,0.06)',
      backdropFilter: 'blur(10px)',
      transition: 'box-shadow 0.3s ease'
    }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px', height: '68px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Logo */}
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '42px', height: '42px', borderRadius: '10px',
            background: '#0c3c60', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <span style={{ color: 'white', fontWeight: 800, fontSize: '14px', fontFamily: 'Poppins, sans-serif' }}>ID</span>
          </div>
          <div>
            <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '16px', color: '#0c3c60', lineHeight: 1.2 }}>IDSEA</div>
            <div style={{ fontSize: '9px', color: '#6b7280', fontFamily: 'Inter, sans-serif', lineHeight: 1.2 }}>Indian Dairy Scientists & Entrepreneurs</div>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '4px' }} className="desktop-nav">
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Link
            to="/apply"
            data-testid="nav-apply-btn"
            style={{
              background: '#1e7a4d', color: 'white', textDecoration: 'none',
              padding: '8px 18px', borderRadius: '6px', fontSize: '13px',
              fontWeight: 600, fontFamily: 'Poppins, sans-serif',
              transition: 'background 0.2s ease',
              display: 'inline-block'
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
              border: '1px solid #0c3c60', transition: 'all 0.2s ease'
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#0c3c60'; e.currentTarget.style.color = 'white'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#0c3c60'; }}
          >
            Admin
          </Link>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer', color: '#0c3c60' }}
            className="mobile-menu-btn"
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      {mobileOpen && (
        <div style={{
          background: 'white', borderTop: '1px solid #e5e7eb',
          padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: '4px'
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
          <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
            <Link to="/apply" onClick={() => setMobileOpen(false)} style={{ flex: 1, background: '#1e7a4d', color: 'white', textDecoration: 'none', padding: '10px', borderRadius: '6px', textAlign: 'center', fontSize: '13px', fontWeight: 600, fontFamily: 'Poppins, sans-serif' }}>Join IDSEA</Link>
            <Link to="/admin/login" onClick={() => setMobileOpen(false)} style={{ flex: 1, border: '1px solid #0c3c60', color: '#0c3c60', textDecoration: 'none', padding: '10px', borderRadius: '6px', textAlign: 'center', fontSize: '13px', fontFamily: 'Poppins, sans-serif' }}>Admin</Link>
          </div>
        </div>
      )}
    </header>
  );
}
