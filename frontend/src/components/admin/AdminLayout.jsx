import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  LayoutDashboard, Users, CreditCard, Calendar, Newspaper,
  Image, BookOpen, Mail, UserCheck, Award, BarChart3,
  Settings, Shield, LogOut, Menu, X, FileText, SlidersHorizontal, MessageSquare, Crown, HardDrive
} from 'lucide-react';

const navItems = [
  { path: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard', module: '*' },
  { path: '/admin/members', icon: Users, label: 'Members', module: 'members' },
  { path: '/admin/membership-plans', icon: Crown, label: 'Membership Plans', module: 'members' },
  { path: '/admin/payments', icon: CreditCard, label: 'Payments', module: 'payments' },
  { path: '/admin/events', icon: Calendar, label: 'Events', module: 'events' },
  { path: '/admin/news', icon: Newspaper, label: 'Announcements', module: 'announcements' },
  { path: '/admin/gallery', icon: Image, label: 'Gallery', module: 'gallery' },
  { path: '/admin/publications', icon: BookOpen, label: 'Publications', module: 'publications' },
  { path: '/admin/journal', icon: BookOpen, label: 'Journal', module: 'publications' },
  { path: '/admin/email', icon: Mail, label: 'Email System', module: 'email' },
  { path: '/admin/email-templates', icon: FileText, label: 'Email Templates', module: 'email' },
  { path: '/admin/executive', icon: UserCheck, label: 'Executive Committee', module: 'executive' },
  { path: '/admin/certificates', icon: Award, label: 'Certificates', module: 'certificates' },
  { path: '/admin/reports', icon: BarChart3, label: 'Reports', module: '*' },
  { path: '/admin/cms', icon: Settings, label: 'CMS Settings', module: 'cms' },
  { path: '/admin/sliders', icon: SlidersHorizontal, label: 'Slider Management', module: 'cms' },
  { path: '/admin/payment-settings', icon: CreditCard, label: 'Payment Settings', module: 'payments' },
  { path: '/admin/whatsapp', icon: MessageSquare, label: 'WhatsApp', module: 'whatsapp' },
  { path: '/admin/whatsapp-templates', icon: FileText, label: 'WA Templates', module: 'whatsapp' },
  { path: '/admin/backup', icon: HardDrive, label: 'Backup & Restore', module: 'super_only' },
  { path: '/admin/roles', icon: Shield, label: 'Admin Users', module: 'super_only' },
];

const ROLE_MODULES = {
  super_admin: ['*'],
  admin: ['members', 'events', 'certificates', 'cms', 'email', 'whatsapp', 'payments', 'gallery', 'announcements', 'publications', 'executive'],
  event_manager: ['events', 'certificates', 'gallery'],
};

const canAccess = (role, permissions, module) => {
  if (module === '*') return true;
  if (module === 'super_only') return role === 'super_admin';
  const roleModules = ROLE_MODULES[role] || [];
  return roleModules.includes('*') || roleModules.includes(module) || (permissions || []).includes(module);
};

export default function AdminLayout() {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const SidebarContent = () => (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '20px 16px', borderBottom: '1px solid rgba(30,122,77,0.3)', textAlign: 'center' }}>
        <div style={{ fontSize: '22px', fontWeight: 800, color: 'white', letterSpacing: '1px', fontFamily: 'Poppins, sans-serif' }}>IDSEA</div>
        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.65)', marginTop: '4px', fontFamily: 'Poppins, sans-serif' }}>Admin Panel</div>
        {admin?.role && <div style={{ fontSize: '10px', color: admin.role === 'super_admin' ? '#fca5a5' : '#93c5fd', marginTop: '2px', fontFamily: 'Poppins', fontWeight: 600, textTransform: 'capitalize' }}>{admin.role.replace('_', ' ')}</div>}
      </div>

      <nav style={{ flex: 1, padding: '12px 8px', overflowY: 'auto' }}>
        {navItems.filter(item => canAccess(admin?.role, admin?.permissions, item.module)).map(({ path, icon: Icon, label }) => (
          <NavLink
            key={path}
            to={path}
            className="admin-nav-link"
            data-testid={`nav-${label.toLowerCase().replace(/\s+/g, '-')}`}
            onClick={() => setMobileOpen(false)}
          >
            <Icon size={17} strokeWidth={2} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div style={{ padding: '16px 8px', borderTop: '1px solid rgba(30,122,77,0.3)' }}>
        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', marginBottom: '10px', paddingLeft: '12px', fontFamily: 'Poppins, sans-serif' }}>
          {admin?.username}
          <span style={{ display: 'block', fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>{admin?.role?.replace('_', ' ')}</span>
        </div>
        <button
          onClick={handleLogout}
          data-testid="admin-logout-btn"
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            width: '100%', padding: '9px 12px',
            background: 'rgba(239,68,68,0.15)', color: '#fca5a5',
            border: 'none', borderRadius: '6px', cursor: 'pointer',
            fontSize: '13px', fontFamily: 'Poppins, sans-serif', fontWeight: 500,
            transition: 'background 0.2s ease'
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.3)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.15)'}
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', background: '#f4f6f9', minHeight: '100vh' }}>
      {/* Desktop Sidebar */}
      <aside style={{
        width: '260px', background: '#0c3c60', color: 'white',
        position: 'fixed', top: 0, left: 0, bottom: 0,
        zIndex: 50, display: 'flex', flexDirection: 'column'
      }}>
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 60 }}
          onClick={() => setMobileOpen(false)}
        />
      )}
      {mobileOpen && (
        <aside style={{
          position: 'fixed', top: 0, left: 0, bottom: 0,
          width: '260px', background: '#0c3c60', zIndex: 70,
          display: 'flex', flexDirection: 'column'
        }}>
          <button
            onClick={() => setMobileOpen(false)}
            style={{ position: 'absolute', top: '12px', right: '12px', background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
          <SidebarContent />
        </aside>
      )}

      {/* Main Content */}
      <main style={{ marginLeft: '260px', flex: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        {/* Topbar */}
        <header style={{
          background: 'white', padding: '0 24px', height: '64px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          boxShadow: '0 2px 5px rgba(0,0,0,0.08)', position: 'sticky', top: 0, zIndex: 40
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={() => setMobileOpen(true)}
              style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer', color: '#0c3c60' }}
              className="mobile-menu-btn"
            >
              <Menu size={22} />
            </button>
            <h3 style={{ color: '#0c3c60', margin: 0, fontSize: '18px', fontWeight: 700, fontFamily: 'Poppins, sans-serif' }}>
              IDSEA Administration
            </h3>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '13px', color: '#64748b', fontFamily: 'Inter, sans-serif' }}>Welcome, {admin?.username}</span>
            <div style={{
              width: '36px', height: '36px', borderRadius: '50%',
              background: '#0c3c60', color: 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '14px', fontWeight: 700, fontFamily: 'Poppins, sans-serif'
            }}>
              {admin?.username?.charAt(0)?.toUpperCase()}
            </div>
          </div>
        </header>

        <div style={{ flex: 1, padding: '24px', background: '#f4f6f9' }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
