import React, { useEffect, useState } from 'react';
import axios from 'axios';
import PublicNavbar from '../../components/public/PublicNavbar';
import PublicFooter from '../../components/public/PublicFooter';
import { Mail, Phone, MapPin, Send } from 'lucide-react';
import { API } from '../../contexts/AuthContext';

export default function ContactPage() {
  const [cms, setCms] = useState({});
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [sent, setSent] = useState(false);

  useEffect(() => {
    axios.get(`${API}/public/cms`).then(r => setCms(r.data)).catch(() => {});
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <div style={{ background: '#f8fafc' }}>
      <PublicNavbar />
      <div style={{ paddingTop: '170px' }}>
        <div style={{ background: '#0c3c60', padding: '60px 24px', textAlign: 'center', color: 'white' }}>
          <h1 style={{ fontFamily: 'Poppins, sans-serif', fontSize: 'clamp(24px,4vw,40px)', fontWeight: 800, marginBottom: '12px' }}>Contact Us</h1>
          <p style={{ fontSize: '15px', opacity: 0.8, fontFamily: 'Inter, sans-serif' }}>Get in touch with IDSEA</p>
        </div>

        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '60px 24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '40px' }}>
          {/* Contact Info */}
          <div>
            <h2 style={{ fontFamily: 'Poppins, sans-serif', fontSize: '22px', fontWeight: 700, color: '#0c3c60', marginBottom: '24px' }}>Contact Information</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {[
                { icon: MapPin, label: 'Address', value: cms.contact_address || 'Dept. of Livestock Products Technology (Dairy Science), VCRI, Namakkal - 637002, Tamil Nadu, India' },
                { icon: Mail, label: 'Email', value: cms.contact_email || 'info@idsea.org' },
                { icon: Phone, label: 'Phone', value: cms.contact_phone || '+91 98765 43210' },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} style={{ display: 'flex', gap: '14px', padding: '16px', background: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={18} style={{ color: '#1e7a4d' }} />
                  </div>
                  <div>
                    <div style={{ fontFamily: 'Poppins, sans-serif', fontSize: '12px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>{label}</div>
                    <div style={{ fontSize: '14px', color: '#374151', fontFamily: 'Inter, sans-serif', lineHeight: 1.5 }}>{value}</div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '32px', background: '#0c3c60', borderRadius: '12px', padding: '24px', color: 'white' }}>
              <h3 style={{ fontFamily: 'Poppins, sans-serif', fontSize: '16px', fontWeight: 700, marginBottom: '12px' }}>Become a Member</h3>
              <p style={{ fontSize: '13px', opacity: 0.85, lineHeight: 1.6, margin: '0 0 16px', fontFamily: 'Inter, sans-serif' }}>
                Join IDSEA to connect with dairy scientists and entrepreneurs across India.
              </p>
              <a href="/apply" style={{ background: '#1e7a4d', color: 'white', textDecoration: 'none', padding: '10px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: 700, fontFamily: 'Poppins, sans-serif', display: 'inline-block' }}>Apply Now</a>
            </div>
          </div>

          {/* Contact Form */}
          <div style={{ background: 'white', borderRadius: '16px', padding: '32px', boxShadow: '0 4px 12px rgba(0,0,0,0.06)', border: '1px solid #e5e7eb' }}>
            <h2 style={{ fontFamily: 'Poppins, sans-serif', fontSize: '20px', fontWeight: 700, color: '#0c3c60', marginBottom: '24px' }}>Send Message</h2>
            {sent ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <Send size={24} style={{ color: '#1e7a4d' }} />
                </div>
                <h3 style={{ fontFamily: 'Poppins, sans-serif', color: '#1e7a4d', marginBottom: '8px' }}>Message Sent!</h3>
                <p style={{ color: '#6b7280', fontSize: '14px', fontFamily: 'Inter, sans-serif' }}>Thank you for contacting IDSEA. We'll get back to you soon.</p>
                <button onClick={() => setSent(false)} style={{ marginTop: '16px', background: '#1e7a4d', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontFamily: 'Poppins, sans-serif', fontWeight: 600 }}>Send Another</button>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="form-input" placeholder="Your full name" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="form-input" placeholder="your@email.com" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Subject</label>
                  <input value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} className="form-input" placeholder="Subject of your message" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Message</label>
                  <textarea value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} className="form-textarea" placeholder="Your message..." required rows={5} />
                </div>
                <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} data-testid="contact-submit-btn">
                  Send Message <Send size={16} />
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
      <PublicFooter />
    </div>
  );
}
