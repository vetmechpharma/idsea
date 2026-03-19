import React, { useState, useRef } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import PublicNavbar from '../../components/public/PublicNavbar';
import PublicFooter from '../../components/public/PublicFooter';
import PaymentPage from '../../components/PaymentPage';
import { CheckCircle, Upload, X, Camera } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const MEMBERSHIP_FEES = { academic: 3100, entrepreneur: 5100, corporate: 25100 };
const PREFIXES = ['Dr.', 'Mr.', 'Mrs.', 'Ms.', 'Prof.', 'Shri', 'Smt.'];
const INDIAN_STATES = ['Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Delhi', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal'];

const emptyAddr = { line1: '', line2: '', line3: '', state: '', district: '', pincode: '' };

export default function MembershipApplyPage() {
  const [step, setStep] = useState('form');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [memberId, setMemberId] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('pending');
  const [photoUploading, setPhotoUploading] = useState(false);
  const fileInputRef = useRef(null);
  const [form, setForm] = useState({
    prefix: 'Mr.', name: '', email: '', phone: '', qualification: '', specialization: '',
    organization: '', photo_url: '', membership_type: 'academic', payment_status: 'pending',
    permanent_address: { ...emptyAddr }, contact_address: { ...emptyAddr }, contact_same_as_permanent: false
  });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const fee = MEMBERSHIP_FEES[form.membership_type] || 0;

  const updateAddr = (which, key, val) => setForm(f => ({ ...f, [which]: { ...f[which], [key]: val } }));
  const toggleSameAddress = (checked) => {
    setForm(f => ({ ...f, contact_same_as_permanent: checked, ...(checked ? { contact_address: { ...f.permanent_address } } : {}) }));
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError('Photo must be under 5MB'); return; }
    if (!file.type.startsWith('image/')) { setError('Only image files allowed'); return; }
    setPhotoUploading(true); setError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const r = await axios.post(`${API}/public/upload-photo`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setForm(f => ({ ...f, photo_url: r.data.file_url }));
    } catch (err) { setError(err.response?.data?.detail || 'Photo upload failed'); }
    setPhotoUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email) { setError('Name and email are required'); return; }
    setLoading(true); setError('');
    try {
      const payload = { ...form };
      if (form.contact_same_as_permanent) payload.contact_address = { ...form.permanent_address };
      payload.state = form.permanent_address?.state || '';
      const res = await axios.post(`${API}/public/members/apply`, payload);
      setMemberId(res.data.id);
      setStep('payment');
    } catch (err) { setError(err.response?.data?.detail || 'Submission failed'); }
    setLoading(false);
  };

  const handlePaymentSuccess = (method) => {
    setPaymentStatus(method === 'razorpay' ? 'paid' : 'verification_pending');
    setStep('success');
  };
  const handlePaymentSkip = () => { setPaymentStatus('pending'); setStep('success'); };

  const photoUrl = form.photo_url ? (form.photo_url.startsWith('/api') ? `${API.replace('/api', '')}${form.photo_url}` : form.photo_url) : '';

  const AddressSection = ({ which, label }) => (
    <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '20px', border: '1px solid #e5e7eb' }}>
      <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '14px', color: '#0c3c60', marginBottom: '14px' }}>{label}</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
        <div className="form-group" style={{ margin: 0, gridColumn: '1 / -1' }}><label className="form-label">Address Line 1 *</label><input value={form[which]?.line1 || ''} onChange={e => updateAddr(which, 'line1', e.target.value)} className="form-input" placeholder="House/Flat No, Building Name" required={which === 'permanent_address'} /></div>
        <div className="form-group" style={{ margin: 0, gridColumn: '1 / -1' }}><label className="form-label">Address Line 2</label><input value={form[which]?.line2 || ''} onChange={e => updateAddr(which, 'line2', e.target.value)} className="form-input" placeholder="Street, Area, Locality" /></div>
        <div className="form-group" style={{ margin: 0, gridColumn: '1 / -1' }}><label className="form-label">Address Line 3</label><input value={form[which]?.line3 || ''} onChange={e => updateAddr(which, 'line3', e.target.value)} className="form-input" placeholder="Landmark (optional)" /></div>
        <div className="form-group" style={{ margin: 0 }}><label className="form-label">State *</label>
          <select value={form[which]?.state || ''} onChange={e => updateAddr(which, 'state', e.target.value)} className="form-select" required={which === 'permanent_address'}>
            <option value="">Select State</option>
            {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="form-group" style={{ margin: 0 }}><label className="form-label">District *</label><input value={form[which]?.district || ''} onChange={e => updateAddr(which, 'district', e.target.value)} className="form-input" placeholder="District" required={which === 'permanent_address'} /></div>
        <div className="form-group" style={{ margin: 0 }}><label className="form-label">Pincode *</label><input value={form[which]?.pincode || ''} onChange={e => updateAddr(which, 'pincode', e.target.value)} className="form-input" placeholder="6-digit pincode" maxLength={6} required={which === 'permanent_address'} /></div>
      </div>
    </div>
  );

  if (step === 'success') {
    return (
      <div style={{ background: '#f8fafc', minHeight: '100vh' }}>
        <PublicNavbar />
        <div style={{ paddingTop: '170px', maxWidth: '600px', margin: '0 auto', padding: '80px 24px', textAlign: 'center' }}>
          <div style={{ background: 'white', borderRadius: '20px', padding: '48px', boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
            <div style={{ width: '72px', height: '72px', background: '#d1fae5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}><CheckCircle size={36} style={{ color: '#1e7a4d' }} /></div>
            <h2 style={{ fontFamily: 'Poppins, sans-serif', fontSize: '24px', fontWeight: 700, color: '#0c3c60', marginBottom: '12px' }}>Application Submitted!</h2>
            <p style={{ color: '#6b7280', fontSize: '15px', lineHeight: 1.6, marginBottom: '8px' }}>Your membership application has been submitted successfully.</p>
            <p style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '16px' }}>Reference: <strong style={{ color: '#0c3c60' }}>{memberId?.substring(0, 8).toUpperCase()}</strong></p>
            <div style={{ background: '#f0f9ff', borderRadius: '10px', padding: '16px', marginBottom: '24px', textAlign: 'left' }}>
              <div style={{ display: 'grid', gap: '6px', fontSize: '14px' }}>
                <div><span style={{ color: '#6b7280' }}>Membership:</span> <strong style={{ textTransform: 'capitalize' }}>{form.membership_type}</strong></div>
                <div><span style={{ color: '#6b7280' }}>Fee:</span> <strong>₹{fee.toLocaleString()}</strong></div>
                <div><span style={{ color: '#6b7280' }}>Payment:</span>{' '}
                  {paymentStatus === 'paid' ? <span style={{ color: '#1e7a4d', fontWeight: 600 }}>Paid</span>
                    : paymentStatus === 'verification_pending' ? <span style={{ color: '#d97706', fontWeight: 600 }}>Verification Pending</span>
                      : <span style={{ color: '#d97706', fontWeight: 600 }}>Pending</span>}
                </div>
              </div>
            </div>
            {paymentStatus === 'verification_pending' && <p style={{ color: '#6b7280', fontSize: '13px', marginBottom: '16px' }}>Your payment reference has been submitted and will be verified shortly.</p>}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/" className="btn-primary" style={{ textDecoration: 'none' }}>Go to Home</Link>
            </div>
          </div>
        </div>
        <PublicFooter />
      </div>
    );
  }

  if (step === 'payment') {
    return (
      <div style={{ background: '#f8fafc', minHeight: '100vh' }}>
        <PublicNavbar />
        <div style={{ paddingTop: '170px' }}>
          <div style={{ background: '#0c3c60', padding: '40px 24px', textAlign: 'center', color: 'white' }}>
            <h1 style={{ fontFamily: 'Poppins', fontSize: 'clamp(20px,3vw,32px)', fontWeight: 800, marginBottom: '8px' }}>Complete Membership Payment</h1>
            <p style={{ fontSize: '14px', opacity: 0.8 }}>{form.prefix} {form.name} - {form.membership_type.charAt(0).toUpperCase() + form.membership_type.slice(1)} Membership</p>
          </div>
          <div style={{ maxWidth: '600px', margin: '0 auto', padding: '32px 24px' }}>
            <div style={{ background: 'white', borderRadius: '16px', padding: '32px', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }} data-testid="membership-payment-step">
              <PaymentPage
                amount={fee}
                name={`${form.prefix} ${form.name}`.trim()}
                email={form.email}
                phone={form.phone}
                purpose="membership"
                memberId={memberId}
                membershipType={form.membership_type}
                onSuccess={handlePaymentSuccess}
                onCancel={handlePaymentSkip}
              />
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
      <div style={{ paddingTop: '170px' }}>
        <div style={{ background: '#0c3c60', padding: '60px 24px', textAlign: 'center', color: 'white' }}>
          <h1 style={{ fontFamily: 'Poppins, sans-serif', fontSize: 'clamp(22px,3vw,36px)', fontWeight: 800, marginBottom: '12px' }}>Apply for Membership</h1>
          <p style={{ fontSize: '15px', opacity: 0.8, fontFamily: 'Inter, sans-serif' }}>Join the Indian Dairy Scientists and Entrepreneurs Association</p>
        </div>

        <div style={{ maxWidth: '760px', margin: '0 auto', padding: '40px 24px' }}>
          {/* Membership Type Selection */}
          <div style={{ marginBottom: '28px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
            {[
              { type: 'academic', label: 'Academic Member', fee: '₹3,100', desc: 'Scientists, Researchers, Academicians', prefix: 'ACD' },
              { type: 'entrepreneur', label: 'Entrepreneur Member', fee: '₹5,100', desc: 'Dairy Entrepreneurs, Startups, MSMEs', prefix: 'ENT' },
              { type: 'corporate', label: 'Corporate Member', fee: '₹25,100', desc: 'Corporates, Cooperatives, Institutions', prefix: 'COP' },
            ].map(({ type, label, fee: feeLabel, desc, prefix }) => (
              <div key={type} onClick={() => setForm({ ...form, membership_type: type })} data-testid={`membership-type-${type}`} style={{
                background: 'white', borderRadius: '12px', padding: '20px', cursor: 'pointer',
                border: form.membership_type === type ? '2px solid #1e7a4d' : '2px solid #e5e7eb',
                boxShadow: form.membership_type === type ? '0 4px 12px rgba(30,122,77,0.15)' : '0 2px 6px rgba(0,0,0,0.05)',
                transition: 'all 0.2s ease'
              }}>
                <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '14px', color: '#111827', marginBottom: '4px' }}>{label}</div>
                <div style={{ fontSize: '22px', fontWeight: 800, color: '#1e7a4d', fontFamily: 'Poppins, sans-serif', marginBottom: '4px' }}>{feeLabel}</div>
                <div style={{ fontSize: '12px', color: '#9ca3af', fontFamily: 'Inter, sans-serif', marginBottom: '6px' }}>{desc}</div>
                <div style={{ fontSize: '11px', color: '#6b7280', fontFamily: 'monospace' }}>ID Format: {prefix}/IDSEA/{new Date().getFullYear()}/XXXX</div>
              </div>
            ))}
          </div>

          {/* Application Form */}
          <div style={{ background: 'white', borderRadius: '16px', padding: '32px', boxShadow: '0 4px 16px rgba(0,0,0,0.06)', border: '1px solid #e5e7eb' }}>
            <h2 style={{ fontFamily: 'Poppins, sans-serif', fontSize: '18px', fontWeight: 700, color: '#0c3c60', marginBottom: '24px' }}>Personal Information</h2>
            {error && <div style={{ background: '#fee2e2', border: '1px solid #fecaca', color: '#991b1b', padding: '12px 16px', borderRadius: '8px', fontSize: '13px', marginBottom: '20px' }}>{error}</div>}

            <form onSubmit={handleSubmit}>
              {/* Prefix + Name */}
              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '12px', marginBottom: '12px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Prefix *</label>
                  <select name="prefix" value={form.prefix} onChange={handleChange} className="form-select" data-testid="prefix-select" required>
                    {PREFIXES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Full Name *</label>
                  <input name="name" value={form.name} onChange={handleChange} className="form-input" placeholder="Full Name" required data-testid="apply-name" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                <div className="form-group" style={{ margin: 0 }}><label className="form-label">Email *</label><input type="email" name="email" value={form.email} onChange={handleChange} className="form-input" placeholder="your@email.com" required data-testid="apply-email" /></div>
                <div className="form-group" style={{ margin: 0 }}><label className="form-label">Phone</label><input name="phone" value={form.phone} onChange={handleChange} className="form-input" placeholder="+91 9XXXXXXXXX" data-testid="apply-phone" /></div>
                <div className="form-group" style={{ margin: 0 }}><label className="form-label">Qualification</label><input name="qualification" value={form.qualification} onChange={handleChange} className="form-input" placeholder="Ph.D., M.V.Sc., B.Tech..." /></div>
                <div className="form-group" style={{ margin: 0 }}><label className="form-label">Specialization</label><input name="specialization" value={form.specialization} onChange={handleChange} className="form-input" placeholder="Dairy Technology, Dairy Science..." /></div>
                <div className="form-group" style={{ margin: 0, gridColumn: '1 / -1' }}><label className="form-label">Organization / Institution</label><input name="organization" value={form.organization} onChange={handleChange} className="form-input" placeholder="University / Company name" /></div>
              </div>

              {/* Photo Upload */}
              <div style={{ margin: '16px 0' }}>
                <label className="form-label">Passport Size Photo</label>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <div
                    onClick={() => !photoUploading && fileInputRef.current?.click()}
                    style={{
                      width: '100px', height: '100px', borderRadius: '12px',
                      border: photoUrl ? 'none' : '2px dashed #d1d5db',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      cursor: photoUploading ? 'wait' : 'pointer', background: photoUrl ? 'none' : '#fafafa',
                      overflow: 'hidden', position: 'relative'
                    }}
                    data-testid="photo-upload-area"
                  >
                    {photoUrl ? (
                      <>
                        <img src={photoUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <div onClick={(e) => { e.stopPropagation(); setForm(f => ({ ...f, photo_url: '' })); }} style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.6)', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><X size={12} color="white" /></div>
                      </>
                    ) : photoUploading ? (
                      <span style={{ fontSize: '12px', color: '#9ca3af' }}>Uploading...</span>
                    ) : (
                      <>
                        <Camera size={20} style={{ color: '#9ca3af', marginBottom: '4px' }} />
                        <span style={{ fontSize: '10px', color: '#9ca3af' }}>Upload Photo</span>
                      </>
                    )}
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhotoUpload} style={{ display: 'none' }} data-testid="photo-file-input" />
                  <div style={{ fontSize: '12px', color: '#9ca3af', lineHeight: 1.6 }}>
                    Upload a passport-size photo<br />
                    Formats: JPG, PNG, WebP (Max 5MB)
                  </div>
                </div>
              </div>

              {/* Permanent Address */}
              <div style={{ marginTop: '20px' }}>
                <AddressSection which="permanent_address" label="Permanent Address" />
              </div>

              {/* Same Address Checkbox */}
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '16px 0', cursor: 'pointer', fontSize: '14px', color: '#374151' }}>
                <input type="checkbox" checked={form.contact_same_as_permanent} onChange={e => toggleSameAddress(e.target.checked)} data-testid="same-address-checkbox"
                  style={{ width: '18px', height: '18px', accentColor: '#1e7a4d' }} />
                <span style={{ fontWeight: 600 }}>Contact address is same as permanent address</span>
              </label>

              {/* Contact Address */}
              {!form.contact_same_as_permanent && (
                <AddressSection which="contact_address" label="Contact Address" />
              )}

              <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '10px', padding: '16px', margin: '20px 0', fontSize: '13px', color: '#0369a1' }}>
                <strong>Membership Fee:</strong> ₹{fee.toLocaleString()} — Permanent Membership
                <br /><span style={{ fontSize: '12px' }}>You will be directed to the payment page after submission.</span>
              </div>

              <button type="submit" disabled={loading} className="btn-primary" data-testid="apply-submit-btn" style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: '15px' }}>
                {loading ? 'Submitting...' : 'Submit & Proceed to Payment'}
              </button>
            </form>
          </div>
        </div>
      </div>
      <PublicFooter />
    </div>
  );
}
