import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL;

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [logoUrl, setLogoUrl] = useState('');

  useEffect(() => {
    axios.get(`${API}/api/public/cms`).then(res => {
      const url = res.data?.logo_url;
      if (url) {
        setLogoUrl(url.startsWith('http') ? url : `${API.replace('/api', '')}${url}`);
      }
    }).catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(form.email, form.password);
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', fontFamily: 'Inter, sans-serif',
      background: 'linear-gradient(135deg, #0c3c60 0%, #1e5a8a 50%, #0c3c60 100%)'
    }}>
      {/* Left Branding */}
      <div style={{
        flex: 1, display: 'none', flexDirection: 'column', justifyContent: 'center',
        padding: '60px', background: 'rgba(0,0,0,0.1)'
      }} className="login-left">
        <div style={{ color: 'white' }}>
          <div style={{ fontSize: '48px', fontWeight: 800, fontFamily: 'Poppins, sans-serif', marginBottom: '8px' }}>IDSEA</div>
          <div style={{ fontSize: '16px', opacity: 0.8, marginBottom: '48px', lineHeight: 1.6 }}>
            Indian Dairy Scientists and<br />Entrepreneurs Association
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {['Manage Members & Approvals', 'Track Payments & Subscriptions', 'Organize Events & Conferences', 'Publish News & Research'].map(item => (
              <div key={item} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#4ade80', flexShrink: 0 }} />
                <span style={{ fontSize: '15px', opacity: 0.9 }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Login Form */}
      <div style={{
        flex: 1, maxWidth: '480px', width: '100%', margin: '0 auto',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px'
      }}>
        <div style={{ width: '100%', background: 'white', borderRadius: '20px', padding: '40px', boxShadow: '0 24px 64px rgba(0,0,0,0.2)' }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            {logoUrl ? (
              <img
                src={logoUrl}
                alt="IDSEA"
                data-testid="login-logo"
                style={{ width: '80px', height: '80px', objectFit: 'contain', margin: '0 auto 16px', display: 'block' }}
              />
            ) : (
              <div style={{
                width: '60px', height: '60px', borderRadius: '16px', background: '#0c3c60',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 16px', boxShadow: '0 8px 24px rgba(12,60,96,0.3)'
              }}>
                <span style={{ color: 'white', fontWeight: 800, fontSize: '20px', fontFamily: 'Poppins, sans-serif' }}>ID</span>
              </div>
            )}
            <h1 style={{ fontFamily: 'Poppins, sans-serif', fontSize: '22px', fontWeight: 700, color: '#0c3c60', margin: '0 0 6px' }}>Admin Login</h1>
            <p style={{ color: '#6b7280', fontSize: '13px', margin: 0 }}>Sign in to IDSEA administration panel</p>
          </div>

          {error && (
            <div data-testid="login-error" style={{
              background: '#fee2e2', border: '1px solid #fecaca', color: '#991b1b',
              padding: '12px 16px', borderRadius: '8px', fontSize: '13px', marginBottom: '20px',
              fontFamily: 'Inter, sans-serif'
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                <input
                  type="email"
                  data-testid="login-email"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  className="form-input"
                  style={{ paddingLeft: '38px' }}
                  placeholder="admin@idsea.org"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                <input
                  type={showPass ? 'text' : 'password'}
                  data-testid="login-password"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  className="form-input"
                  style={{ paddingLeft: '38px', paddingRight: '38px' }}
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '8px', padding: '10px 14px', marginBottom: '20px', fontSize: '12px', color: '#0369a1', fontFamily: 'Inter, sans-serif' }}>
              Default: admin@idsea.org / Admin@123
            </div>

            <button
              type="submit"
              data-testid="login-submit-btn"
              disabled={loading}
              style={{
                width: '100%', padding: '12px', background: loading ? '#6b7280' : '#1e7a4d',
                color: 'white', border: 'none', borderRadius: '8px', fontSize: '15px',
                fontWeight: 700, fontFamily: 'Poppins, sans-serif', cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'background 0.2s ease'
              }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '24px' }}>
            <a href="/" style={{ color: '#0c3c60', fontSize: '13px', textDecoration: 'none', fontFamily: 'Inter, sans-serif' }}>
              &larr; Back to public website
            </a>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.25)', padding: '12px 24px', textAlign: 'center', backdropFilter: 'blur(8px)' }}>
        <p style={{ margin: '0 0 4px', fontSize: '11px', color: 'rgba(255,255,255,0.45)', fontFamily: 'Inter, sans-serif' }}>
          &copy; {new Date().getFullYear()} Indian Dairy Scientists and Entrepreneurs Association (IDSEA). All rights reserved.
        </p>
        <p style={{ margin: 0, fontSize: '10px', color: 'rgba(255,255,255,0.3)', fontFamily: 'Inter, sans-serif' }}>
          Developed by <strong style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 700 }}>ANIMitra Softwares</strong> &mdash; <strong style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 700 }}>Engineering the Future of Animal Health</strong>
        </p>
      </div>
    </div>
  );
}
