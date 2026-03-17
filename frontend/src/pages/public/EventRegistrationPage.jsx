import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import PublicNavbar from '../../components/public/PublicNavbar';
import PublicFooter from '../../components/public/PublicFooter';
import { CheckCircle, ArrowRight, ArrowLeft, User, Phone, Search, Hotel, CreditCard } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const MEMBERSHIP_LABELS = { academic: 'Academic Member', entrepreneur: 'Entrepreneur Member', corporate: 'Corporate Member' };

export default function EventRegistrationPage() {
  const { eventId } = useParams();
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [regResult, setRegResult] = useState(null);

  // Form state
  const [isMember, setIsMember] = useState(null); // null=not chosen, true, false
  const [phone, setPhone] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [memberData, setMemberData] = useState(null);
  const [lookupError, setLookupError] = useState('');
  const [form, setForm] = useState({ name: '', email: '', phone: '', qualification: '', organization: '', state: '' });
  const [memberCategory, setMemberCategory] = useState('');
  const [accomChoice, setAccomChoice] = useState('');
  const [hotelName, setHotelName] = useState('');
  const [wantsMembership, setWantsMembership] = useState(false);
  const [membershipType, setMembershipType] = useState('');

  useEffect(() => {
    axios.get(`${API}/public/events/${eventId}/registration-info`)
      .then(r => { setInfo(r.data); setLoading(false); })
      .catch(e => { setError(e.response?.data?.detail || 'Event not found or registration closed'); setLoading(false); });
  }, [eventId]);

  // Determine current fee tier based on today's date
  const currentTier = useMemo(() => {
    if (!info?.fee_tiers?.length) return null;
    const today = new Date().toISOString().split('T')[0];
    const sorted = [...info.fee_tiers].sort((a, b) => a.deadline.localeCompare(b.deadline));
    for (const tier of sorted) {
      if (today <= tier.deadline) return tier;
    }
    return sorted[sorted.length - 1]; // last tier if all deadlines passed
  }, [info]);

  const lookupMember = async () => {
    if (!phone || phone.length < 5) { setLookupError('Enter a valid phone number'); return; }
    setLookupLoading(true); setLookupError(''); setMemberData(null);
    try {
      const r = await axios.get(`${API}/public/members/lookup?phone=${encodeURIComponent(phone)}`);
      if (r.data.found) {
        setMemberData(r.data.member);
        setMemberCategory(r.data.member.membership_type || '');
        setForm({
          name: r.data.member.name || '', email: r.data.member.email || '',
          phone: r.data.member.phone || phone, qualification: r.data.member.qualification || '',
          organization: r.data.member.organization || '', state: r.data.member.state || ''
        });
      } else {
        setLookupError('No approved member found with this phone number. Please try again or register as a non-member.');
      }
    } catch { setLookupError('Lookup failed. Please try again.'); }
    setLookupLoading(false);
  };

  // Fee calculation
  const regFee = useMemo(() => {
    if (!currentTier) return 0;
    const cat = isMember ? memberCategory : 'non_member';
    return currentTier.fees?.[cat] || 0;
  }, [currentTier, isMember, memberCategory]);

  // Default accommodation fee from tier (category-based)
  const defaultAccomFee = useMemo(() => {
    if (!info?.accommodation?.enabled || !currentTier) return 0;
    const cat = isMember ? memberCategory : 'non_member';
    return currentTier.accommodation_fees?.[cat] || 0;
  }, [info, currentTier, isMember, memberCategory]);

  // Is this category eligible for free accommodation?
  const isFreeAccom = useMemo(() => {
    if (!info?.accommodation?.enabled) return false;
    const cat = isMember ? memberCategory : '';
    return (info.accommodation.free_categories || []).includes(cat);
  }, [info, isMember, memberCategory]);

  // Calculated accommodation fee based on user's choice
  const accomFee = useMemo(() => {
    if (!info?.accommodation?.enabled) return 0;
    if (accomChoice === 'self') return 0;
    if (accomChoice === 'free') return 0;
    if (accomChoice === 'hotel') {
      const hotel = (info.accommodation.hotels || []).find(h => h.name === hotelName);
      return hotel?.fee || 0;
    }
    if (accomChoice === 'default') {
      if (isFreeAccom) return 0;
      return defaultAccomFee;
    }
    return 0;
  }, [info, accomChoice, hotelName, isFreeAccom, defaultAccomFee]);

  const memFee = useMemo(() => {
    if (!wantsMembership || !membershipType || isMember) return 0;
    return info?.membership_fees?.[membershipType] || 0;
  }, [wantsMembership, membershipType, isMember, info]);

  const totalAmount = regFee + accomFee + memFee;

  const handleSubmit = async () => {
    if (!form.name || !form.email || !form.phone) return;
    setSubmitting(true);
    try {
      const payload = {
        is_member: isMember || false,
        member_id: memberData?.membership_id || '',
        member_category: isMember ? memberCategory : '',
        name: form.name, email: form.email, phone: form.phone,
        qualification: form.qualification, organization: form.organization, state: form.state,
        accommodation_choice: accomChoice || 'none',
        hotel_name: accomChoice === 'hotel' ? hotelName : '',
        wants_membership: wantsMembership,
        membership_type: wantsMembership ? membershipType : '',
        registration_fee: regFee,
        accommodation_fee: accomFee,
        membership_fee: memFee,
        total_amount: totalAmount,
        payment_mode: 'offline',
      };
      const r = await axios.post(`${API}/public/events/${eventId}/register`, payload);
      setRegResult(r.data.registration);
      setSubmitted(true);
    } catch (e) { setError(e.response?.data?.detail || 'Registration failed'); }
    setSubmitting(false);
  };

  if (loading) return (<div style={{ background: '#f8fafc' }}><PublicNavbar /><div style={{ paddingTop: '200px', textAlign: 'center' }}><div className="loading-spinner">Loading...</div></div></div>);

  if (error && !info) return (
    <div style={{ background: '#f8fafc', minHeight: '100vh' }}>
      <PublicNavbar />
      <div style={{ paddingTop: '200px', textAlign: 'center', padding: '200px 24px 80px' }}>
        <div style={{ maxWidth: '500px', margin: '0 auto', background: 'white', borderRadius: '16px', padding: '48px', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}>
          <p style={{ color: '#ef4444', fontSize: '16px', fontFamily: 'Poppins', fontWeight: 600 }}>{error}</p>
          <Link to="/events" className="btn-primary" style={{ textDecoration: 'none', marginTop: '16px', display: 'inline-flex' }}>Back to Events</Link>
        </div>
      </div>
      <PublicFooter />
    </div>
  );

  if (submitted) return (
    <div style={{ background: '#f8fafc', minHeight: '100vh' }}>
      <PublicNavbar />
      <div style={{ paddingTop: '200px', padding: '200px 24px 80px' }}>
        <div data-testid="reg-success" style={{ maxWidth: '600px', margin: '0 auto', background: 'white', borderRadius: '16px', padding: '48px', boxShadow: '0 4px 12px rgba(0,0,0,0.06)', textAlign: 'center' }}>
          <div style={{ width: '64px', height: '64px', background: '#d1fae5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}><CheckCircle size={32} style={{ color: '#1e7a4d' }} /></div>
          <h2 style={{ fontFamily: 'Poppins', color: '#0c3c60', fontSize: '22px', fontWeight: 700, marginBottom: '8px' }}>Registration Successful!</h2>
          <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '24px' }}>You have been registered for <strong>{info?.title}</strong>.</p>
          <div style={{ background: '#f0f9ff', borderRadius: '10px', padding: '20px', textAlign: 'left', marginBottom: '24px' }}>
            <div style={{ display: 'grid', gap: '8px', fontSize: '14px' }}>
              <div><span style={{ color: '#6b7280' }}>Name:</span> <strong>{regResult?.name}</strong></div>
              <div><span style={{ color: '#6b7280' }}>Registration Fee:</span> <strong>₹{regResult?.registration_fee}</strong></div>
              {regResult?.accommodation_fee > 0 && <div><span style={{ color: '#6b7280' }}>Accommodation:</span> <strong>₹{regResult?.accommodation_fee}</strong></div>}
              {regResult?.membership_fee > 0 && <div><span style={{ color: '#6b7280' }}>Membership Fee:</span> <strong>₹{regResult?.membership_fee}</strong></div>}
              <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '8px', marginTop: '4px' }}><span style={{ color: '#0c3c60', fontWeight: 700, fontSize: '16px' }}>Total: ₹{regResult?.total_amount}</span></div>
              <div><span style={{ color: '#6b7280' }}>Payment Status:</span> <span style={{ color: '#d97706', fontWeight: 600 }}>Pending (Offline)</span></div>
            </div>
          </div>
          <p style={{ color: '#6b7280', fontSize: '13px', marginBottom: '20px' }}>Payment details will be shared by the organizers. Please contact IDSEA for payment instructions.</p>
          <Link to="/events" className="btn-primary" style={{ textDecoration: 'none', display: 'inline-flex' }}>Back to Events</Link>
        </div>
      </div>
      <PublicFooter />
    </div>
  );

  const accom = info?.accommodation || {};

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh' }}>
      <PublicNavbar />
      <div style={{ paddingTop: '170px' }}>
        {/* Event Header */}
        <div style={{ background: '#0c3c60', padding: '40px 24px', color: 'white', textAlign: 'center' }}>
          <h1 style={{ fontFamily: 'Poppins', fontSize: 'clamp(20px,3vw,32px)', fontWeight: 800, marginBottom: '8px' }}>Event Registration</h1>
          <h2 style={{ fontFamily: 'Poppins', fontSize: '16px', fontWeight: 500, opacity: 0.9, marginBottom: '8px' }}>{info?.title}</h2>
          <p style={{ fontSize: '14px', opacity: 0.7 }}>{info?.date}{info?.end_date ? ` - ${info.end_date}` : ''} | {info?.venue}</p>
        </div>

        {/* Step Indicator */}
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '24px 24px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '8px' }}>
            {['Participant', 'Details', 'Accommodation', 'Review'].map((label, idx) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '13px', fontWeight: 700, fontFamily: 'Poppins',
                  background: step > idx + 1 ? '#1e7a4d' : step === idx + 1 ? '#0c3c60' : '#e5e7eb',
                  color: step >= idx + 1 ? 'white' : '#9ca3af'
                }}>{step > idx + 1 ? '✓' : idx + 1}</div>
                <span style={{ fontSize: '13px', fontFamily: 'Poppins', fontWeight: step === idx + 1 ? 600 : 400, color: step === idx + 1 ? '#0c3c60' : '#9ca3af', display: idx < 3 ? 'inline' : 'inline' }}>{label}</span>
                {idx < 3 && <div style={{ width: '32px', height: '2px', background: step > idx + 1 ? '#1e7a4d' : '#e5e7eb' }} />}
              </div>
            ))}
          </div>
        </div>

        <div style={{ maxWidth: '700px', margin: '0 auto', padding: '24px' }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '32px', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}>

            {/* STEP 1: Member or Non-member */}
            {step === 1 && (
              <div data-testid="step-1">
                <h3 style={{ fontFamily: 'Poppins', fontSize: '18px', fontWeight: 700, color: '#0c3c60', marginBottom: '24px' }}>Are you an IDSEA Member?</h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                  <button onClick={() => { setIsMember(true); setMemberData(null); setLookupError(''); }} data-testid="select-member"
                    style={{
                      padding: '24px', borderRadius: '12px', cursor: 'pointer', textAlign: 'center',
                      border: isMember === true ? '2px solid #1e7a4d' : '2px solid #e5e7eb',
                      background: isMember === true ? '#f0fdf4' : 'white', transition: 'all 0.2s ease'
                    }}>
                    <User size={28} style={{ color: isMember === true ? '#1e7a4d' : '#9ca3af', margin: '0 auto 8px', display: 'block' }} />
                    <div style={{ fontFamily: 'Poppins', fontWeight: 700, fontSize: '15px', color: '#111827' }}>Yes, I'm a Member</div>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>I have an existing IDSEA membership</div>
                  </button>
                  <button onClick={() => { setIsMember(false); setMemberData(null); setMemberCategory(''); }} data-testid="select-non-member"
                    style={{
                      padding: '24px', borderRadius: '12px', cursor: 'pointer', textAlign: 'center',
                      border: isMember === false ? '2px solid #0c3c60' : '2px solid #e5e7eb',
                      background: isMember === false ? '#f0f9ff' : 'white', transition: 'all 0.2s ease'
                    }}>
                    <User size={28} style={{ color: isMember === false ? '#0c3c60' : '#9ca3af', margin: '0 auto 8px', display: 'block' }} />
                    <div style={{ fontFamily: 'Poppins', fontWeight: 700, fontSize: '15px', color: '#111827' }}>Non-Member</div>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>I'm registering without membership</div>
                  </button>
                </div>

                {/* Member Lookup */}
                {isMember === true && !memberData && (
                  <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '20px', border: '1px solid #e5e7eb' }}>
                    <label className="form-label"><Phone size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} />Enter your registered mobile number</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input value={phone} onChange={e => setPhone(e.target.value)} className="form-input" placeholder="+91 98765 43210" data-testid="phone-lookup-input" style={{ flex: 1 }} />
                      <button onClick={lookupMember} disabled={lookupLoading} data-testid="lookup-btn"
                        className="btn-primary" style={{ whiteSpace: 'nowrap' }}>
                        {lookupLoading ? 'Searching...' : <><Search size={14} /> Find</>}
                      </button>
                    </div>
                    {lookupError && <p style={{ color: '#ef4444', fontSize: '13px', marginTop: '8px' }}>{lookupError}</p>}
                  </div>
                )}

                {/* Member Found */}
                {isMember === true && memberData && (
                  <div style={{ background: '#f0fdf4', borderRadius: '10px', padding: '20px', border: '1px solid #bbf7d0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                      <CheckCircle size={18} style={{ color: '#1e7a4d' }} />
                      <span style={{ fontFamily: 'Poppins', fontWeight: 700, color: '#1e7a4d', fontSize: '14px' }}>Member Found!</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '14px' }}>
                      <div><span style={{ color: '#6b7280' }}>Name:</span> <strong>{memberData.name}</strong></div>
                      <div><span style={{ color: '#6b7280' }}>ID:</span> <strong>{memberData.membership_id}</strong></div>
                      <div><span style={{ color: '#6b7280' }}>Category:</span> <span className={`badge badge-${memberData.membership_type}`} style={{ textTransform: 'capitalize' }}>{memberData.membership_type}</span></div>
                      <div><span style={{ color: '#6b7280' }}>Organization:</span> {memberData.organization}</div>
                    </div>
                    {currentTier && (
                      <div style={{ marginTop: '12px', padding: '12px', background: 'white', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                        <span style={{ fontSize: '13px', color: '#6b7280' }}>Registration Fee ({currentTier.name}):</span>
                        <span style={{ fontSize: '18px', fontWeight: 800, color: '#0c3c60', marginLeft: '8px', fontFamily: 'Poppins' }}>₹{currentTier.fees?.[memberData.membership_type] || 0}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Non-member fee preview */}
                {isMember === false && currentTier && (
                  <div style={{ background: '#f0f9ff', borderRadius: '10px', padding: '16px', border: '1px solid #bae6fd' }}>
                    <span style={{ fontSize: '13px', color: '#6b7280' }}>Non-Member Registration Fee ({currentTier.name}):</span>
                    <span style={{ fontSize: '18px', fontWeight: 800, color: '#0c3c60', marginLeft: '8px', fontFamily: 'Poppins' }}>₹{currentTier.fees?.non_member || 0}</span>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
                  <button onClick={() => { if ((isMember && memberData) || isMember === false) setStep(2); }}
                    disabled={isMember === null || (isMember === true && !memberData)}
                    className="btn-primary" data-testid="step1-next" style={{ opacity: (isMember === null || (isMember === true && !memberData)) ? 0.5 : 1 }}>
                    Next <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: Details Form */}
            {step === 2 && (
              <div data-testid="step-2">
                <h3 style={{ fontFamily: 'Poppins', fontSize: '18px', fontWeight: 700, color: '#0c3c60', marginBottom: '24px' }}>
                  {isMember ? 'Confirm Your Details' : 'Participant Details'}
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group"><label className="form-label">Full Name *</label><input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="form-input" data-testid="reg-name" readOnly={!!isMember} /></div>
                  <div className="form-group"><label className="form-label">Email *</label><input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="form-input" data-testid="reg-email" /></div>
                  <div className="form-group"><label className="form-label">Phone *</label><input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="form-input" data-testid="reg-phone" /></div>
                  <div className="form-group"><label className="form-label">Qualification</label><input value={form.qualification} onChange={e => setForm(f => ({ ...f, qualification: e.target.value }))} className="form-input" /></div>
                  <div className="form-group"><label className="form-label">Organization</label><input value={form.organization} onChange={e => setForm(f => ({ ...f, organization: e.target.value }))} className="form-input" /></div>
                  <div className="form-group"><label className="form-label">State</label><input value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))} className="form-input" /></div>
                </div>

                {/* Membership registration for non-members */}
                {!isMember && info?.allow_membership_registration && (
                  <div style={{ background: '#f0fdf4', borderRadius: '10px', padding: '20px', marginTop: '16px', border: '1px solid #bbf7d0' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontFamily: 'Poppins', fontSize: '14px', fontWeight: 600, color: '#0c3c60', marginBottom: '12px' }}>
                      <input type="checkbox" checked={wantsMembership} onChange={e => setWantsMembership(e.target.checked)} data-testid="wants-membership" style={{ width: '16px', height: '16px' }} />
                      I also want to become an IDSEA Member
                    </label>
                    {wantsMembership && (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                        {Object.entries(MEMBERSHIP_LABELS).map(([key, label]) => (
                          <button key={key} onClick={() => setMembershipType(key)} data-testid={`membership-${key}`}
                            style={{
                              padding: '14px 12px', borderRadius: '8px', cursor: 'pointer', textAlign: 'center',
                              border: membershipType === key ? '2px solid #1e7a4d' : '1px solid #e5e7eb',
                              background: membershipType === key ? '#d1fae5' : 'white'
                            }}>
                            <div style={{ fontSize: '13px', fontWeight: 600, color: '#111827', fontFamily: 'Poppins' }}>{label}</div>
                            <div style={{ fontSize: '15px', fontWeight: 800, color: '#1e7a4d', marginTop: '4px', fontFamily: 'Poppins' }}>₹{info?.membership_fees?.[key] || 0}</div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px' }}>
                  <button onClick={() => setStep(1)} className="btn-secondary"><ArrowLeft size={14} /> Back</button>
                  <button onClick={() => { if (form.name && form.email && form.phone) setStep(accom.enabled ? 3 : 4); }}
                    disabled={!form.name || !form.email || !form.phone}
                    className="btn-primary" data-testid="step2-next" style={{ opacity: (!form.name || !form.email || !form.phone) ? 0.5 : 1 }}>
                    Next <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Accommodation */}
            {step === 3 && (
              <div data-testid="step-3">
                <h3 style={{ fontFamily: 'Poppins', fontSize: '18px', fontWeight: 700, color: '#0c3c60', marginBottom: '24px' }}>Accommodation</h3>

                {isFreeAccom && (
                  <div style={{ background: '#d1fae5', borderRadius: '8px', padding: '12px', marginBottom: '16px', fontSize: '14px', color: '#065f46', fontWeight: 600 }}>
                    Free accommodation available for {memberCategory} members! Default accommodation fee is waived.
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {/* Default Accommodation (tier-based fee) */}
                  <button onClick={() => { setAccomChoice(isFreeAccom ? 'free' : 'default'); setHotelName(''); }} data-testid="accom-default"
                    style={{ padding: '18px', borderRadius: '10px', cursor: 'pointer', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      border: (accomChoice === 'default' || accomChoice === 'free') ? '2px solid #1e7a4d' : '1px solid #e5e7eb',
                      background: (accomChoice === 'default' || accomChoice === 'free') ? '#f0fdf4' : 'white' }}>
                    <div>
                      <div style={{ fontFamily: 'Poppins', fontWeight: 600, fontSize: '14px', color: '#111827' }}>
                        {isFreeAccom ? 'Free Accommodation (Default)' : 'Default Accommodation'}
                      </div>
                      <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
                        {isFreeAccom ? `Complimentary for ${memberCategory} members` : 'Standard accommodation included with registration'}
                      </div>
                    </div>
                    <div style={{ fontFamily: 'Poppins', fontWeight: 800, fontSize: '16px', color: isFreeAccom ? '#1e7a4d' : '#0c3c60', whiteSpace: 'nowrap' }}>
                      {isFreeAccom ? 'FREE' : `₹${defaultAccomFee}`}
                    </div>
                  </button>

                  {/* Premium Hotel options (replace default) */}
                  {(accom.hotels || []).length > 0 && (
                    <div style={{ marginTop: '4px' }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#0c3c60', fontFamily: 'Poppins', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Hotel size={14} /> Premium Hotel Options
                        <span style={{ fontSize: '11px', color: '#6b7280', fontWeight: 400 }}>(instead of default accommodation)</span>
                      </div>
                      {(accom.hotels || []).map((hotel, idx) => (
                        <button key={idx} onClick={() => { setAccomChoice('hotel'); setHotelName(hotel.name); }} data-testid={`accom-hotel-${idx}`}
                          style={{ width: '100%', padding: '16px', borderRadius: '10px', cursor: 'pointer', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px',
                            border: (accomChoice === 'hotel' && hotelName === hotel.name) ? '2px solid #0c3c60' : '1px solid #e5e7eb',
                            background: (accomChoice === 'hotel' && hotelName === hotel.name) ? '#f0f9ff' : 'white' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <Hotel size={16} style={{ color: '#0c3c60' }} />
                              <span style={{ fontFamily: 'Poppins', fontWeight: 600, fontSize: '14px', color: '#111827' }}>{hotel.name}</span>
                            </div>
                            {hotel.description && <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px', marginLeft: '24px' }}>{hotel.description}</div>}
                          </div>
                          <div style={{ fontFamily: 'Poppins', fontWeight: 800, fontSize: '16px', color: '#0c3c60' }}>₹{hotel.fee}</div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Self-Accommodation (no fee) */}
                  {accom.self_option && (
                    <div>
                      <button onClick={() => { setAccomChoice('self'); setHotelName(''); }} data-testid="accom-self"
                        style={{ width: '100%', padding: '16px', borderRadius: '10px', cursor: 'pointer', textAlign: 'left',
                          border: accomChoice === 'self' ? '2px solid #6b7280' : '1px solid #e5e7eb',
                          background: accomChoice === 'self' ? '#f8fafc' : 'white' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ fontFamily: 'Poppins', fontWeight: 600, fontSize: '14px', color: '#111827' }}>Self-Accommodation</div>
                            <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>I will arrange my own accommodation (no fee)</div>
                          </div>
                          <div style={{ fontFamily: 'Poppins', fontWeight: 800, fontSize: '16px', color: '#6b7280' }}>₹0</div>
                        </div>
                      </button>

                      {/* Show suggested hotels as info when self is selected */}
                      {accomChoice === 'self' && (accom.hotels || []).length > 0 && (
                        <div style={{ background: '#fffbeb', borderRadius: '8px', padding: '14px', marginTop: '10px', border: '1px solid #fde68a' }}>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: '#92400e', fontFamily: 'Poppins', marginBottom: '8px' }}>Suggested Hotels Nearby</div>
                          {(accom.hotels || []).map((hotel, idx) => (
                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', color: '#78350f', padding: '4px 0' }}>
                              <span>{hotel.name} {hotel.description ? `(${hotel.description})` : ''}</span>
                              <span style={{ fontWeight: 600 }}>₹{hotel.fee}</span>
                            </div>
                          ))}
                          <div style={{ fontSize: '11px', color: '#b45309', marginTop: '6px', fontStyle: 'italic' }}>These are for your reference. You can book directly with the hotel.</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px' }}>
                  <button onClick={() => setStep(2)} className="btn-secondary"><ArrowLeft size={14} /> Back</button>
                  <button onClick={() => { if (accomChoice) setStep(4); }} disabled={!accomChoice}
                    className="btn-primary" data-testid="step3-next" style={{ opacity: !accomChoice ? 0.5 : 1 }}>
                    Next <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: Review & Submit */}
            {step === 4 && (
              <div data-testid="step-4">
                <h3 style={{ fontFamily: 'Poppins', fontSize: '18px', fontWeight: 700, color: '#0c3c60', marginBottom: '24px' }}>Review & Submit</h3>

                <div style={{ display: 'grid', gap: '16px' }}>
                  {/* Participant Info */}
                  <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '20px' }}>
                    <h4 style={{ fontFamily: 'Poppins', fontSize: '14px', fontWeight: 600, color: '#0c3c60', marginBottom: '12px' }}>Participant</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '14px' }}>
                      <div><span style={{ color: '#6b7280' }}>Name:</span> <strong>{form.name}</strong></div>
                      <div><span style={{ color: '#6b7280' }}>Email:</span> {form.email}</div>
                      <div><span style={{ color: '#6b7280' }}>Phone:</span> {form.phone}</div>
                      <div><span style={{ color: '#6b7280' }}>Type:</span> {isMember ? <span className={`badge badge-${memberCategory}`} style={{ textTransform: 'capitalize' }}>{memberCategory} Member</span> : 'Non-Member'}</div>
                      {isMember && memberData?.membership_id && <div><span style={{ color: '#6b7280' }}>Member ID:</span> <strong>{memberData.membership_id}</strong></div>}
                    </div>
                  </div>

                  {/* Accommodation */}
                  {accom.enabled && accomChoice && (
                    <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '20px' }}>
                      <h4 style={{ fontFamily: 'Poppins', fontSize: '14px', fontWeight: 600, color: '#0c3c60', marginBottom: '8px' }}>Accommodation</h4>
                      <p style={{ fontSize: '14px', margin: 0 }}>
                        {accomChoice === 'self' && 'Self-Accommodation (No fee)'}
                        {accomChoice === 'free' && `Free Accommodation (${memberCategory} member)`}
                        {accomChoice === 'default' && `Default Accommodation — ₹${defaultAccomFee}`}
                        {accomChoice === 'hotel' && <>{hotelName} (Premium) — <strong>₹{accomFee}</strong></>}
                      </p>
                    </div>
                  )}

                  {/* Fee Breakdown */}
                  <div style={{ background: '#f0f9ff', borderRadius: '10px', padding: '20px', border: '1px solid #bae6fd' }}>
                    <h4 style={{ fontFamily: 'Poppins', fontSize: '14px', fontWeight: 600, color: '#0c3c60', marginBottom: '12px' }}><CreditCard size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} />Fee Breakdown</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Registration Fee {currentTier ? `(${currentTier.name})` : ''}</span>
                        <strong>₹{regFee}</strong>
                      </div>
                      {accom.enabled && accomChoice && accomChoice !== 'self' && (
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>
                            Accommodation
                            {accomChoice === 'free' && ' (Free)'}
                            {accomChoice === 'default' && ' (Default)'}
                            {accomChoice === 'hotel' && ` (${hotelName})`}
                          </span>
                          <strong>{accomFee === 0 ? 'FREE' : `₹${accomFee}`}</strong>
                        </div>
                      )}
                      {accom.enabled && accomChoice === 'self' && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#6b7280' }}>
                          <span>Accommodation (Self)</span>
                          <strong>₹0</strong>
                        </div>
                      )}
                      {wantsMembership && memFee > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>IDSEA Membership ({membershipType})</span>
                          <strong>₹{memFee}</strong>
                        </div>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid #0c3c60', paddingTop: '10px', marginTop: '4px' }}>
                        <span style={{ fontFamily: 'Poppins', fontWeight: 700, fontSize: '16px', color: '#0c3c60' }}>Total Amount</span>
                        <span style={{ fontFamily: 'Poppins', fontWeight: 800, fontSize: '20px', color: '#0c3c60' }}>₹{totalAmount}</span>
                      </div>
                    </div>
                    <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '12px' }}>Payment Mode: Offline (Pay at venue or via bank transfer)</p>
                  </div>

                  {error && <p style={{ color: '#ef4444', fontSize: '13px' }}>{error}</p>}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px' }}>
                  <button onClick={() => setStep(accom.enabled ? 3 : 2)} className="btn-secondary"><ArrowLeft size={14} /> Back</button>
                  <button onClick={handleSubmit} disabled={submitting} className="btn-primary" data-testid="submit-registration"
                    style={{ padding: '12px 32px', fontSize: '15px' }}>
                    {submitting ? 'Submitting...' : 'Confirm Registration'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <PublicFooter />
    </div>
  );
}
