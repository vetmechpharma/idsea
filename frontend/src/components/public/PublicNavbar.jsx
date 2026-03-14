import React, { useState, useEffect } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { API } from '../../contexts/AuthContext';
import axios from 'axios';

const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/about', label: 'About Us' },
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

  useEffect(() => {
    axios.get(`${API}/public/cms`).then(r => setCms(r.data)).catch(() => {});
  }, []);

  const logoUrl = cms.logo_url
    ? (cms.logo_url.startsWith('http') ? cms.logo_url : `${API.replace('/api', '')}${cms.logo_url}`)
    : null;

  return (
    <header style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, background: 'white' }}>
      {/* Top Brand Section - White, tall, with logo + name */}
      <div style={{ background: 'white', borderBottom: '1px solid #e5e7eb' }}>
        <div style={{
          maxWidth: '1280px', margin: '0 auto', padding: '16px 24px',
          display: 'flex', alignItems: 'center', gap: '20px',
        }}>
          {/* Large Emblem Logo */}
          <Link to="/" style={{ textDecoration: 'none', flexShrink: 0 }} data-testid="nav-logo">
            {logoUrl ? (
              <img src={logoUrl} alt="IDSEA" style={{
                height: '90px', width: '90px', objectFit: 'contain',
              }} />
            ) : (
              <div style={{
                width: '90px', height: '90px', borderRadius: '50%',
                background: '#0c3c60', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ color: 'white', fontWeight: 800, fontSize: '24px', fontFamily: 'Poppins, sans-serif' }}>IDSEA</span>
              </div>
            )}
          </Link>

          {/* Organization Name */}
          <div style={{ flex: 1 }}>
            <h1 style={{
              fontFamily: 'Poppins, sans-serif',
              fontSize: 'clamp(18px, 3vw, 28px)',
              fontWeight: 800,
              color: '#0c3c60',
              margin: '0 0 4px',
              lineHeight: 1.2,
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
            }}>
              Indian Dairy Scientists and Entrepreneurs Association
            </h1>
            <p style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: 'clamp(11px, 1.5vw, 14px)',
              color: '#6b7280',
              margin: 0,
              fontStyle: 'italic',
            }}>
              (IDSEA)
            </p>
          </div>

          {/* Mobile Toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer', color: '#0c3c60', padding: '4px' }}
            className="mobile-menu-btn"
            data-testid="mobile-menu-btn"
          >
            {mobileOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </div>

      {/* Navigation Bar - Colored strip with white links */}
      <nav style={{
        background: '#0c3c60',
      }} className="desktop-nav">
        <div style={{
          maxWidth: '1280px', margin: '0 auto', padding: '0 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: '0',
          flexWrap: 'wrap',
        }}>
          {navLinks.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              data-testid={`nav-${label.toLowerCase().replace(/\s+/g, '-')}`}
              style={({ isActive }) => ({
                color: 'white',
                textDecoration: 'none',
                padding: '13px 18px',
                fontSize: '14px',
                fontFamily: 'Poppins, sans-serif',
                fontWeight: isActive ? 700 : 500,
                letterSpacing: '0.3px',
                background: isActive ? 'rgba(255,255,255,0.15)' : 'transparent',
                transition: 'background 0.2s ease',
                whiteSpace: 'nowrap',
                display: 'block',
              })}
              onMouseEnter={e => { if (!e.currentTarget.classList.contains('active')) e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
              onMouseLeave={e => { if (!e.currentTarget.classList.contains('active')) e.currentTarget.style.background = 'transparent'; }}
            >
              {label}
            </NavLink>
          ))}
          <Link
            to="/admin/login"
            data-testid="nav-admin-btn"
            style={{
              color: 'rgba(255,255,255,0.6)',
              textDecoration: 'none',
              padding: '13px 18px',
              fontSize: '13px',
              fontFamily: 'Poppins, sans-serif',
              fontWeight: 500,
              transition: 'color 0.2s ease',
              whiteSpace: 'nowrap',
              marginLeft: 'auto',
            }}
            onMouseEnter={e => e.currentTarget.style.color = 'white'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.6)'}
          >
            Admin
          </Link>
        </div>
      </nav>

      {/* Mobile Nav Dropdown */}
      {mobileOpen && (
        <div style={{
          background: '#0c3c60',
          padding: '8px 24px 16px',
          display: 'flex', flexDirection: 'column', gap: '0',
          boxShadow: '0 12px 24px rgba(0,0,0,0.2)',
        }}>
          {navLinks.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={() => setMobileOpen(false)}
              style={({ isActive }) => ({
                color: 'white',
                textDecoration: 'none',
                padding: '12px 12px',
                fontSize: '14px',
                fontFamily: 'Poppins, sans-serif',
                fontWeight: isActive ? 700 : 400,
                background: isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
                borderRadius: '6px',
                display: 'block',
              })}
            >
              {label}
            </NavLink>
          ))}
          <Link
            to="/admin/login"
            onClick={() => setMobileOpen(false)}
            style={{
              color: 'rgba(255,255,255,0.6)',
              textDecoration: 'none',
              padding: '12px 12px',
              fontSize: '13px',
              fontFamily: 'Poppins, sans-serif',
              borderTop: '1px solid rgba(255,255,255,0.1)',
              marginTop: '8px',
            }}
          >
            Admin Panel
          </Link>
        </div>
      )}
    </header>
  );
}
