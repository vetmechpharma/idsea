import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Facebook, Twitter, Linkedin } from 'lucide-react';

export default function PublicFooter() {
  return (
    <footer style={{ background: '#0c3c60', color: 'white', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '48px 24px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '40px', marginBottom: '40px' }}>
          {/* Brand */}
          <div>
            <div style={{ fontFamily: 'Poppins, sans-serif', fontSize: '22px', fontWeight: 800, marginBottom: '8px', color: 'white' }}>IDSEA</div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.65)', marginBottom: '16px', lineHeight: 1.6 }}>
              Indian Dairy Scientists and Entrepreneurs Association
            </div>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, margin: 0 }}>
              Bridging dairy science, innovation & entrepreneurship for the sustainable growth of the Indian dairy sector.
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
              {[['Academic Member - ₹3,100', '#1e7a4d'], ['Entrepreneur Member - ₹5,100', '#1e7a4d'], ['Corporate Member - ₹25,100', '#1e7a4d']].map(([label]) => (
                <span key={label} style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px' }}>{label}</span>
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
                <span style={{ lineHeight: 1.6 }}>VCRI, Namakkal - 637002, Tamil Nadu, India</span>
              </div>
              <div style={{ display: 'flex', gap: '10px', color: 'rgba(255,255,255,0.7)', fontSize: '13px', alignItems: 'center' }}>
                <Mail size={16} style={{ flexShrink: 0, color: '#4ade80' }} />
                <span>info@idsea.org</span>
              </div>
              <div style={{ display: 'flex', gap: '10px', color: 'rgba(255,255,255,0.7)', fontSize: '13px', alignItems: 'center' }}>
                <Phone size={16} style={{ flexShrink: 0, color: '#4ade80' }} />
                <span>+91 98765 43210</span>
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
                {[Facebook, Twitter, Linkedin].map((Icon, i) => (
                  <a key={i} href="#" style={{
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
            &copy; {new Date().getFullYear()} Indian Dairy Scientists and Entrepreneurs Association (IDSEA). All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
