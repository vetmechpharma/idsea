import React, { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import PublicNavbar from '../../components/public/PublicNavbar';
import PublicFooter from '../../components/public/PublicFooter';
import { CheckCircle } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const MEMBERSHIP_FEES = { academic: 3100, entrepreneur: 5100, corporate: 25100 };
const INDIAN_STATES = ['Andhra Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Delhi', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal'];

export default function MembershipApplyPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [memberId, setMemberId] = useState('');
  const [form, setForm] = useState({
    name: '', email: '', phone: '', qualification: '', specialization: '',
    organization: '', address: '', state: '', photo_url: '', membership_type: 'academic', payment_status: 'pending'
  });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await axios.post(`${API}/public/members/apply`, form);
      setMemberId(res.data.id);
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.detail || 'Submission failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div style={{ background: '#f8fafc', minHeight: '100vh' }}>
        <PublicNavbar />
        <div style={{ paddingTop: '100px', maxWidth: '600px', margin: '0 auto', padding: '80px 24px', textAlign: 'center' }}>
          <div style={{ background: 'white', borderRadius: '20px', padding: '48px', boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
            <div style={{ width: '72px', height: '72px', background: '#d1fae5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
              <CheckCircle size={36} style={{ color: '#1e7a4d' }} />
            </div>
            <h2 style={{ fontFamily: 'Poppins, sans-serif', fontSize: '24px', fontWeight: 700, color: '#0c3c60', marginBottom: '12px' }}>Application Submitted!</h2>
            <p style={{ color: '#6b7280', fontSize: '15px', lineHeight: 1.6, marginBottom: '8px', fontFamily: 'Inter, sans-serif' }}>
              Your membership application has been submitted successfully. Our team will review it and approve within 3-5 business days.
            </p>
            <p style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '32px', fontFamily: 'Inter, sans-serif' }}>Application Reference: <strong style={{ color: '#0c3c60' }}>{memberId?.substring(0, 8).toUpperCase()}</strong></p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/" className="btn-primary" style={{ textDecoration: 'none' }}>Go to Home</Link>
              <Link to="/members" style={{ background: 'white', color: '#0c3c60', border: '2px solid #0c3c60', padding: '10px 20px', borderRadius: '6px', textDecoration: 'none', fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: '14px' }}>View Members</Link>
            </div>
          </div>
        </div>
        <PublicFooter />
      </div>
    );
  }

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh' }}>
      <PublicNavbar />
      <div style={{ paddingTop: '100px' }}>
        <div style={{ background: '#0c3c60', padding: '60px 24px', textAlign: 'center', color: 'white' }}>
          <h1 style={{ fontFamily: 'Poppins, sans-serif', fontSize: 'clamp(22px,3vw,36px)', fontWeight: 800, marginBottom: '12px' }}>Apply for Membership</h1>
          <p style={{ fontSize: '15px', opacity: 0.8, fontFamily: 'Inter, sans-serif' }}>Join the Indian Dairy Scientists and Entrepreneurs Association</p>
        </div>

        <div style={{ maxWidth: '700px', margin: '0 auto', padding: '40px 24px' }}>
          {/* Membership Type Selection */}
          <div style={{ marginBottom: '28px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            {[
              { type: 'academic', label: 'Academic Member', fee: '₹3,100', desc: 'Scientists, Researchers, Academicians' },
              { type: 'entrepreneur', label: 'Entrepreneur Member', fee: '₹5,100', desc: 'Dairy Entrepreneurs, Startups, MSMEs' },
              { type: 'corporate', label: 'Corporate Member', fee: '₹25,100', desc: 'Corporates, Cooperatives, Institutions' },
            ].map(({ type, label, fee, desc }) => (
              <div key={type} onClick={() => setForm({ ...form, membership_type: type })} data-testid={`membership-type-${type}`} style={{
                background: 'white', borderRadius: '12px', padding: '18px', cursor: 'pointer',
                border: form.membership_type === type ? '2px solid #1e7a4d' : '2px solid #e5e7eb',
                boxShadow: form.membership_type === type ? '0 4px 12px rgba(30,122,77,0.15)' : '0 2px 6px rgba(0,0,0,0.05)',
                transition: 'all 0.2s ease'
              }}>
                <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '14px', color: '#111827', marginBottom: '4px' }}>{label}</div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#1e7a4d', fontFamily: 'Poppins, sans-serif', marginBottom: '4px' }}>{fee}</div>
                <div style={{ fontSize: '12px', color: '#9ca3af', fontFamily: 'Inter, sans-serif' }}>{desc}</div>
                <div style={{ marginTop: '8px', color: form.membership_type === type ? '#1e7a4d' : '#d1d5db', fontSize: '12px', fontFamily: 'Poppins, sans-serif', fontWeight: 600 }}>
                  {form.membership_type === type ? '✓ Selected' : 'Click to select'}
                </div>
              </div>
            ))}
          </div>

          {/* Application Form */}
          <div style={{ background: 'white', borderRadius: '16px', padding: '32px', boxShadow: '0 4px 16px rgba(0,0,0,0.06)', border: '1px solid #e5e7eb' }}>
            <h2 style={{ fontFamily: 'Poppins, sans-serif', fontSize: '18px', fontWeight: 700, color: '#0c3c60', marginBottom: '24px' }}>Personal Information</h2>

            {error && <div style={{ background: '#fee2e2', border: '1px solid #fecaca', color: '#991b1b', padding: '12px 16px', borderRadius: '8px', fontSize: '13px', marginBottom: '20px' }}>{error}</div>}

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input name="name" value={form.name} onChange={handleChange} className="form-input" placeholder="Dr. / Mr. / Ms." required />
                </div>
                <div className="form-group">
                  <label className="form-label">Email Address *</label>
                  <input type="email" name="email" value={form.email} onChange={handleChange} className="form-input" placeholder="your@email.com" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input name="phone" value={form.phone} onChange={handleChange} className="form-input" placeholder="+91 9XXXXXXXXX" />
                </div>
                <div className="form-group">
                  <label className="form-label">Qualification</label>
                  <input name="qualification" value={form.qualification} onChange={handleChange} className="form-input" placeholder="Ph.D., M.V.Sc., B.Tech..." />
                </div>
                <div className="form-group">
                  <label className="form-label">Specialization</label>
                  <input name="specialization" value={form.specialization} onChange={handleChange} className="form-input" placeholder="Dairy Technology, Dairy Science..." />
                </div>
                <div className="form-group">
                  <label className="form-label">Organization / Institution</label>
                  <input name="organization" value={form.organization} onChange={handleChange} className="form-input" placeholder="University / Company name" />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Address</label>
                  <textarea name="address" value={form.address} onChange={handleChange} className="form-textarea" placeholder="Your mailing address" rows={3} />
                </div>
                <div className="form-group">
                  <label className="form-label">State</label>
                  <select name="state" value={form.state} onChange={handleChange} className="form-select">
                    <option value="">Select State</option>
                    {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Photo URL (Optional)</label>
                  <input name="photo_url" value={form.photo_url} onChange={handleChange} className="form-input" placeholder="https://..." />
                </div>
              </div>

              <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '10px', padding: '16px', margin: '20px 0', fontSize: '13px', color: '#0369a1', fontFamily: 'Inter, sans-serif' }}>
                <strong>Membership Fee:</strong> ₹{MEMBERSHIP_FEES[form.membership_type]?.toLocaleString()} (Admission: ₹100 + Membership: ₹{(MEMBERSHIP_FEES[form.membership_type] - 100)?.toLocaleString()}) — Permanent Membership
                <br />Payment will be collected after admin approval.
              </div>

              <button type="submit" disabled={loading} className="btn-primary" data-testid="apply-submit-btn" style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: '15px' }}>
                {loading ? 'Submitting...' : 'Submit Application'}
              </button>
            </form>
          </div>
        </div>
      </div>
      <PublicFooter />
    </div>
  );
}
