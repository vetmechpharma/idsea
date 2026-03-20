import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import PublicNavbar from '../../components/public/PublicNavbar';
import PublicFooter from '../../components/public/PublicFooter';
import PaymentPage from '../../components/PaymentPage';
import { CheckCircle, ArrowRight, ArrowLeft, User, Phone, Search, Hotel, CreditCard, CalendarClock, Info } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const MEMBERSHIP_LABELS = { academic: 'Academic Member', entrepreneur: 'Entrepreneur Member', corporate: 'Corporate Member' };

const REG_CATEGORIES = [
  { key: 'idsea_member', label: 'IDSEA Member', description: 'Academic / Entrepreneur / Corporate member' },
  { key: 'non_member', label: 'Non-Member', description: 'General participant' },
  { key: 'student', label: 'Student / JRF / SRF / RA / Retired', description: 'Students, research fellows, retired professionals' },
  { key: 'accompanying', label: 'Accompanying Person', description: 'Husband / Wife / Parents / Children' },
  { key: 'corporate_industry', label: 'Corporate / Industry Personnel', description: 'Max 2 persons per registration' },
  { key: 'international', label: 'International Delegates', description: 'Fees in USD' },
];

export default function EventRegistrationPage() {
  const { eventId } = useParams();
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [regResult, setRegResult] = useState(null);

  // Form state
  const [isMember, setIsMember] = useState(null); // null=not chosen, true, false
  const [registrationCategory, setRegistrationCategory] = useState(''); // broad category
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
  const [accompanyingPersons, setAccompanyingPersons] = useState([{ name: '', relation: '' }]);
  const [corporatePersons, setCorporatePersons] = useState([{ name: '', designation: '' }]);
  const [selectedAddons, setSelectedAddons] = useState([]);

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

  // Fee category key for fee lookup
  const feeCatKey = useMemo(() => {
    if (registrationCategory === 'idsea_member') return memberCategory || 'academic';
    if (registrationCategory) return registrationCategory;
    return isMember ? (memberCategory || 'academic') : 'non_member';
  }, [registrationCategory, isMember, memberCategory]);

  // Fee calculation
  const regFee = useMemo(() => {
    if (!currentTier) return 0;
    return currentTier.fees?.[feeCatKey] || 0;
  }, [currentTier, feeCatKey]);

  // Default accommodation fee from tier (category-based)
  const defaultAccomFee = useMemo(() => {
    if (!info?.accommodation?.enabled || !currentTier) return 0;
    return currentTier.accommodation_fees?.[feeCatKey] || 0;
  }, [info, currentTier, feeCatKey]);

  // Is this category eligible for free accommodation?
  const isFreeAccom = useMemo(() => {
    if (!info?.accommodation?.enabled) return false;
    return (info.accommodation.free_categories || []).includes(feeCatKey);
  }, [info, feeCatKey]);

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

  const addonFee = useMemo(() => {
    if (!selectedAddons.length || !info?.registration_addons?.length) return 0;
    return info.registration_addons
      .filter(a => selectedAddons.includes(a.name))
      .reduce((sum, a) => sum + (a.fee || 0), 0);
  }, [selectedAddons, info]);

  const isInternational = registrationCategory === 'international';
  const currencySymbol = isInternational ? '$' : '₹';
  const totalAmount = regFee + accomFee + memFee + addonFee;

  const accom = info?.accommodation || {};
  const sortedTiers = useMemo(() => {
    if (!info?.fee_tiers?.length) return [];
    return [...info.fee_tiers].sort((a, b) => a.deadline.localeCompare(b.deadline));
  }, [info]);

  const FEE_CATEGORIES = [
    { key: 'academic', label: 'Academic' },
    { key: 'entrepreneur', label: 'Entrepreneur' },
    { key: 'corporate', label: 'Corporate' },
    { key: 'non_member', label: 'Non-Member' },
    { key: 'student', label: 'Student/JRF/SRF/RA/Retired' },
    { key: 'accompanying', label: 'Accompanying Person' },
    { key: 'corporate_industry', label: 'Corporate/Industry' },
    { key: 'international', label: 'International (USD)' },
  ];

  const formatDate = (d) => {
    if (!d) return '';
    try { return new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); }
    catch { return d; }
  };

  const handleSubmit = async () => {
    if (!form.name || !form.email || !form.phone) return;
    setSubmitting(true); setError('');
    const computedTotal = regFee + accomFee + memFee + addonFee;
    try {
      const payload = {
        is_member: isMember || false,
        member_id: memberData?.membership_id || '',
        member_category: isMember ? memberCategory : '',
        registration_category: registrationCategory,
        name: form.name, email: form.email, phone: form.phone,
        qualification: form.qualification, organization: form.organization, state: form.state,
        accommodation_choice: accomChoice || 'none',
        hotel_name: accomChoice === 'hotel' ? hotelName : '',
        wants_membership: wantsMembership,
        membership_type: wantsMembership ? membershipType : '',
        accompanying_persons: registrationCategory === 'accompanying' ? accompanyingPersons.filter(p => p.name) : [],
        corporate_persons: registrationCategory === 'corporate_industry' ? corporatePersons.filter(p => p.name) : [],
        selected_addons: selectedAddons,
        registration_fee: regFee,
        accommodation_fee: accomFee,
        membership_fee: memFee,
        addon_fee: addonFee,
        total_amount: computedTotal,
        payment_mode: 'offline',
      };
      const r = await axios.post(`${API}/public/events/${eventId}/register`, payload);
      const reg = r.data.registration;
      setRegResult(reg);
      const serverTotal = reg?.total_amount ?? computedTotal;
      if (serverTotal > 0) {
        setStep(5);
      } else {
        setSubmitted(true);
      }
    } catch (e) { setError(e.response?.data?.detail || 'Registration failed'); }
    setSubmitting(false);
  };

  const handlePaymentSuccess = (method) => {
    if (regResult) {
      setRegResult({ ...regResult, payment_status: method === 'razorpay' ? 'paid' : 'verification_pending', payment_mode: method });
    }
    setSubmitted(true);
  };

  const handlePaymentSkip = () => {
    setSubmitted(true);
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
              <div><span style={{ color: '#6b7280' }}>Payment Status:</span>{' '}
                {regResult?.payment_status === 'paid'
                  ? <span style={{ color: '#1e7a4d', fontWeight: 600 }}>Paid (Razorpay)</span>
                  : regResult?.payment_status === 'verification_pending'
                    ? <span style={{ color: '#d97706', fontWeight: 600 }}>Verification Pending</span>
                    : <span style={{ color: '#d97706', fontWeight: 600 }}>Pending</span>
                }
              </div>
            </div>
          </div>
          {regResult?.payment_status === 'verification_pending' && (
            <p style={{ color: '#6b7280', fontSize: '13px', marginBottom: '20px' }}>Your payment reference has been submitted. IDSEA team will verify it shortly.</p>
          )}
          {regResult?.payment_status === 'pending' && (
            <p style={{ color: '#6b7280', fontSize: '13px', marginBottom: '20px' }}>You can complete the payment later. Contact IDSEA for payment instructions.</p>
          )}
          {regResult?.payment_status === 'paid' && (
            <p style={{ color: '#1e7a4d', fontSize: '13px', marginBottom: '20px' }}>Payment confirmed! You will receive a confirmation email shortly.</p>
          )}
          <Link to="/events" className="btn-primary" style={{ textDecoration: 'none', display: 'inline-flex' }}>Back to Events</Link>
        </div>
      </div>
      <PublicFooter />
    </div>
  );

  const stepLabels = step === 0
    ? []
    : ['Participant', 'Details', ...(accom.enabled ? ['Accommodation'] : []), 'Review', 'Payment'];

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh' }}>
      <PublicNavbar />
      <style>{`
        .fee-table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
        .fee-table { width: 100%; border-collapse: collapse; font-family: 'Inter', sans-serif; font-size: 14px; min-width: 540px; }
        .fee-table th { background: #0c3c60; color: white; padding: 12px 16px; text-align: left; font-family: 'Poppins', sans-serif; font-weight: 600; font-size: 13px; white-space: nowrap; }
        .fee-table td { padding: 11px 16px; border-bottom: 1px solid #e5e7eb; }
        .fee-table tr:last-child td { border-bottom: none; }
        .fee-table .tier-active { background: #f0fdf4; }
        .fee-table .tier-active td { font-weight: 600; }
        .fee-table .amount { font-family: 'Poppins', sans-serif; font-weight: 700; color: #0c3c60; }
        .fee-table .free-badge { background: #d1fae5; color: #065f46; padding: 2px 8px; border-radius: 10px; font-size: 11px; font-weight: 700; }
        .fee-table .active-badge { background: #1e7a4d; color: white; padding: 2px 8px; border-radius: 10px; font-size: 10px; font-weight: 700; margin-left: 6px; }
        @media (max-width: 640px) {
          .fee-cards-mobile { display: flex; flex-direction: column; gap: 16px; }
          .fee-card { background: white; border-radius: 12px; border: 1px solid #e5e7eb; overflow: hidden; }
          .fee-card.active { border: 2px solid #1e7a4d; box-shadow: 0 4px 12px rgba(30,122,77,0.12); }
          .fee-card-header { padding: 14px 16px; display: flex; justify-content: space-between; align-items: center; }
          .fee-card-body { padding: 0 16px 16px; }
          .fee-card-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
          .fee-card-row:last-child { border-bottom: none; }
          .fee-desktop { display: none !important; }
        }
        @media (min-width: 641px) {
          .fee-cards-mobile { display: none !important; }
        }
      `}</style>
      <div style={{ paddingTop: '170px' }}>
        {/* Event Header */}
        <div style={{ background: '#0c3c60', padding: '40px 24px', color: 'white', textAlign: 'center' }}>
          <h1 style={{ fontFamily: 'Poppins', fontSize: 'clamp(20px,3vw,32px)', fontWeight: 800, marginBottom: '8px' }}>Event Registration</h1>
          <h2 style={{ fontFamily: 'Poppins', fontSize: '16px', fontWeight: 500, opacity: 0.9, marginBottom: '8px' }}>{info?.title}</h2>
          <p style={{ fontSize: '14px', opacity: 0.7 }}>{info?.date}{info?.end_date ? ` - ${info.end_date}` : ''} | {info?.venue}</p>
        </div>

        {/* Step Indicator (hidden on step 0) */}
        {step > 0 && (
          <div style={{ maxWidth: '800px', margin: '0 auto', padding: '24px 24px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '8px' }}>
              {stepLabels.map((label, idx) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '13px', fontWeight: 700, fontFamily: 'Poppins',
                    background: step > idx + 1 ? '#1e7a4d' : step === idx + 1 ? '#0c3c60' : '#e5e7eb',
                    color: step >= idx + 1 ? 'white' : '#9ca3af'
                  }}>{step > idx + 1 ? '✓' : idx + 1}</div>
                  <span style={{ fontSize: '13px', fontFamily: 'Poppins', fontWeight: step === idx + 1 ? 600 : 400, color: step === idx + 1 ? '#0c3c60' : '#9ca3af' }}>{label}</span>
                  {idx < stepLabels.length - 1 && <div style={{ width: '32px', height: '2px', background: step > idx + 1 ? '#1e7a4d' : '#e5e7eb' }} />}
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ maxWidth: step === 0 ? '960px' : '700px', margin: '0 auto', padding: '24px', transition: 'max-width 0.3s ease' }}>

          {/* STEP 0: Fee Overview */}
          {step === 0 && (
            <div data-testid="step-fee-overview">
              {/* Registration Fees Table */}
              {sortedTiers.length > 0 && (
                <div style={{ background: 'white', borderRadius: '16px', padding: '28px', boxShadow: '0 4px 12px rgba(0,0,0,0.06)', marginBottom: '20px' }}>
                  <h3 style={{ fontFamily: 'Poppins', fontSize: '18px', fontWeight: 700, color: '#0c3c60', marginBottom: '6px' }}>Registration Fees</h3>
                  <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '20px', fontFamily: 'Inter, sans-serif' }}>Fees vary based on registration deadline and participant category.</p>

                  {/* Desktop Table */}
                  <div className="fee-table-wrap fee-desktop">
                    <table className="fee-table" data-testid="fee-table-registration">
                      <thead>
                        <tr>
                          <th>Fee Tier</th>
                          <th>Deadline</th>
                          {FEE_CATEGORIES.filter(c => sortedTiers.some(t => t.fees?.[c.key])).map(c => <th key={c.key}>{c.label}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {sortedTiers.map((tier, idx) => {
                          const isActive = currentTier?.name === tier.name;
                          return (
                            <tr key={idx} className={isActive ? 'tier-active' : ''}>
                              <td>
                                <span style={{ fontFamily: 'Poppins', fontWeight: 600, color: '#111827' }}>{tier.name}</span>
                                {isActive && <span className="active-badge">CURRENT</span>}
                              </td>
                              <td style={{ whiteSpace: 'nowrap' }}>
                                <CalendarClock size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px', color: '#6b7280' }} />
                                {formatDate(tier.deadline)}
                              </td>
                              {FEE_CATEGORIES.filter(c => sortedTiers.some(t => t.fees?.[c.key])).map(c => (
                                <td key={c.key} className="amount">{c.key === 'international' ? '$' : '₹'}{(tier.fees?.[c.key] || 0).toLocaleString('en-IN')}</td>
                              ))}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Cards */}
                  <div className="fee-cards-mobile">
                    {sortedTiers.map((tier, idx) => {
                      const isActive = currentTier?.name === tier.name;
                      return (
                        <div key={idx} className={`fee-card ${isActive ? 'active' : ''}`} data-testid={`fee-card-${idx}`}>
                          <div className="fee-card-header" style={{ background: isActive ? '#f0fdf4' : '#f8fafc' }}>
                            <div>
                              <span style={{ fontFamily: 'Poppins', fontWeight: 700, fontSize: '15px', color: '#0c3c60' }}>{tier.name}</span>
                              {isActive && <span className="active-badge" style={{ background: '#1e7a4d', color: 'white', padding: '2px 8px', borderRadius: '10px', fontSize: '10px', fontWeight: 700, marginLeft: '8px' }}>CURRENT</span>}
                            </div>
                            <span style={{ fontSize: '12px', color: '#6b7280' }}>By {formatDate(tier.deadline)}</span>
                          </div>
                          <div className="fee-card-body">
                            {FEE_CATEGORIES.filter(c => tier.fees?.[c.key]).map(c => (
                              <div key={c.key} className="fee-card-row">
                                <span style={{ color: '#374151' }}>{c.label}</span>
                                <span style={{ fontFamily: 'Poppins', fontWeight: 700, color: '#0c3c60' }}>{c.key === 'international' ? '$' : '₹'}{(tier.fees?.[c.key] || 0).toLocaleString('en-IN')}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Accommodation Fees */}
              {accom.enabled && sortedTiers.some(t => t.accommodation_fees) && (
                <div style={{ background: 'white', borderRadius: '16px', padding: '28px', boxShadow: '0 4px 12px rgba(0,0,0,0.06)', marginBottom: '20px' }}>
                  <h3 style={{ fontFamily: 'Poppins', fontSize: '18px', fontWeight: 700, color: '#0c3c60', marginBottom: '6px' }}>Default Accommodation Fees</h3>
                  <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '16px', fontFamily: 'Inter, sans-serif' }}>
                    Included with registration. Premium hotel upgrades available during registration.
                    {(accom.free_categories || []).length > 0 && (
                      <span style={{ display: 'block', marginTop: '4px', color: '#1e7a4d', fontWeight: 600 }}>
                        Free accommodation for: {accom.free_categories.map(c => c.charAt(0).toUpperCase() + c.slice(1)).join(', ')} members
                      </span>
                    )}
                  </p>

                  {/* Desktop Table */}
                  <div className="fee-table-wrap fee-desktop">
                    <table className="fee-table" data-testid="fee-table-accommodation">
                      <thead>
                        <tr>
                          <th>Fee Tier</th>
                          <th>Deadline</th>
                          {FEE_CATEGORIES.filter(c => c.key !== 'international' && sortedTiers.some(t => t.accommodation_fees?.[c.key])).map(c => <th key={c.key}>{c.label}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {sortedTiers.map((tier, idx) => {
                          const isActive = currentTier?.name === tier.name;
                          const freeCats = accom.free_categories || [];
                          return (
                            <tr key={idx} className={isActive ? 'tier-active' : ''}>
                              <td>
                                <span style={{ fontFamily: 'Poppins', fontWeight: 600, color: '#111827' }}>{tier.name}</span>
                                {isActive && <span className="active-badge">CURRENT</span>}
                              </td>
                              <td style={{ whiteSpace: 'nowrap' }}>
                                <CalendarClock size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px', color: '#6b7280' }} />
                                {formatDate(tier.deadline)}
                              </td>
                              {FEE_CATEGORIES.filter(c => c.key !== 'international' && sortedTiers.some(t => t.accommodation_fees?.[c.key])).map(c => (
                                <td key={c.key} className="amount">
                                  {freeCats.includes(c.key)
                                    ? <span className="free-badge">FREE</span>
                                    : `₹${(tier.accommodation_fees?.[c.key] || 0).toLocaleString('en-IN')}`}
                                </td>
                              ))}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Cards */}
                  <div className="fee-cards-mobile">
                    {sortedTiers.map((tier, idx) => {
                      const isActive = currentTier?.name === tier.name;
                      const freeCats = accom.free_categories || [];
                      return (
                        <div key={idx} className={`fee-card ${isActive ? 'active' : ''}`}>
                          <div className="fee-card-header" style={{ background: isActive ? '#f0fdf4' : '#f8fafc' }}>
                            <div>
                              <span style={{ fontFamily: 'Poppins', fontWeight: 700, fontSize: '15px', color: '#0c3c60' }}>{tier.name}</span>
                              {isActive && <span style={{ background: '#1e7a4d', color: 'white', padding: '2px 8px', borderRadius: '10px', fontSize: '10px', fontWeight: 700, marginLeft: '8px' }}>CURRENT</span>}
                            </div>
                            <span style={{ fontSize: '12px', color: '#6b7280' }}>By {formatDate(tier.deadline)}</span>
                          </div>
                          <div className="fee-card-body">
                            {FEE_CATEGORIES.filter(c => c.key !== 'international' && tier.accommodation_fees?.[c.key]).map(c => (
                              <div key={c.key} className="fee-card-row">
                                <span style={{ color: '#374151' }}>{c.label}</span>
                                <span style={{ fontFamily: 'Poppins', fontWeight: 700, color: '#0c3c60' }}>
                                  {freeCats.includes(c.key)
                                    ? <span className="free-badge" style={{ background: '#d1fae5', color: '#065f46', padding: '2px 8px', borderRadius: '10px', fontSize: '11px' }}>FREE</span>
                                    : `₹${(tier.accommodation_fees?.[c.key] || 0).toLocaleString('en-IN')}`}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Premium Hotels & Additional Info */}
              <div style={{ display: 'grid', gridTemplateColumns: (accom.hotels?.length > 0 && info?.allow_membership_registration) ? '1fr 1fr' : '1fr', gap: '20px', marginBottom: '20px' }}>
                {accom.enabled && (accom.hotels || []).length > 0 && (
                  <div style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}>
                    <h4 style={{ fontFamily: 'Poppins', fontSize: '15px', fontWeight: 700, color: '#0c3c60', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Hotel size={16} /> Premium Hotel Options
                    </h4>
                    <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '12px' }}>Upgrade from default accommodation (replaces default fee)</p>
                    {(accom.hotels || []).map((hotel, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#f8fafc', borderRadius: '8px', marginBottom: '8px' }}>
                        <div>
                          <div style={{ fontFamily: 'Poppins', fontWeight: 600, fontSize: '14px', color: '#111827' }}>{hotel.name}</div>
                          {hotel.description && <div style={{ fontSize: '12px', color: '#6b7280' }}>{hotel.description}</div>}
                        </div>
                        <div style={{ fontFamily: 'Poppins', fontWeight: 800, fontSize: '15px', color: '#0c3c60', whiteSpace: 'nowrap' }}>₹{hotel.fee?.toLocaleString('en-IN')}</div>
                      </div>
                    ))}
                    {accom.self_option && (
                      <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Info size={12} /> Self-accommodation option also available (no charge)
                      </div>
                    )}
                  </div>
                )}

                {info?.allow_membership_registration && (
                  <div style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}>
                    <h4 style={{ fontFamily: 'Poppins', fontSize: '15px', fontWeight: 700, color: '#0c3c60', marginBottom: '14px' }}>IDSEA Membership</h4>
                    <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '12px' }}>Non-members can also apply for IDSEA membership during registration</p>
                    {Object.entries(MEMBERSHIP_LABELS).map(([key, label]) => (
                      <div key={key} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: '#f8fafc', borderRadius: '8px', marginBottom: '8px' }}>
                        <span style={{ fontFamily: 'Poppins', fontWeight: 600, fontSize: '14px', color: '#111827' }}>{label}</span>
                        <span style={{ fontFamily: 'Poppins', fontWeight: 800, fontSize: '15px', color: '#1e7a4d' }}>₹{(info?.membership_fees?.[key] || 0).toLocaleString('en-IN')}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Proceed Button */}
              <div style={{ textAlign: 'center', padding: '8px 0 16px' }}>
                <button onClick={() => setStep(1)} className="btn-primary" data-testid="proceed-to-register"
                  style={{ padding: '16px 40px', fontSize: '16px', fontFamily: 'Poppins', fontWeight: 700 }}>
                  Proceed to Register <ArrowRight size={18} />
                </button>
              </div>
            </div>
          )}

          {/* Registration Form Steps (1-4) */}
          {step >= 1 && (
          <div style={{ background: 'white', borderRadius: '16px', padding: '32px', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}>

            {/* STEP 1: Registration Category */}
            {step === 1 && (
              <div data-testid="step-1">
                <h3 style={{ fontFamily: 'Poppins', fontSize: '18px', fontWeight: 700, color: '#0c3c60', marginBottom: '24px' }}>Select Registration Category</h3>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px', marginBottom: '24px' }}>
                  {REG_CATEGORIES.map(cat => {
                    const fee = currentTier?.fees?.[cat.key === 'idsea_member' ? 'academic' : cat.key] || 0;
                    const isSelected = registrationCategory === cat.key;
                    return (
                      <button key={cat.key} onClick={() => { setRegistrationCategory(cat.key); setIsMember(cat.key === 'idsea_member'); if (cat.key !== 'idsea_member') { setMemberData(null); setMemberCategory(''); } }} data-testid={`cat-${cat.key}`}
                        style={{
                          padding: '20px 16px', borderRadius: '12px', cursor: 'pointer', textAlign: 'left',
                          border: isSelected ? '2px solid #1e7a4d' : '2px solid #e5e7eb',
                          background: isSelected ? '#f0fdf4' : 'white', transition: 'all 0.2s ease'
                        }}>
                        <div style={{ fontFamily: 'Poppins', fontWeight: 700, fontSize: '14px', color: '#111827', marginBottom: '4px' }}>{cat.label}</div>
                        <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>{cat.description}</div>
                        {currentTier && cat.key !== 'idsea_member' && (
                          <div style={{ fontFamily: 'Poppins', fontWeight: 800, fontSize: '16px', color: '#0c3c60' }}>
                            {cat.key === 'international' ? '$' : '₹'}{fee.toLocaleString('en-IN')}
                          </div>
                        )}
                        {cat.key === 'idsea_member' && currentTier && (
                          <div style={{ fontSize: '12px', color: '#1e7a4d', fontWeight: 600 }}>Fee based on member type</div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* IDSEA Member Lookup */}
                {registrationCategory === 'idsea_member' && !memberData && (
                  <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '20px', border: '1px solid #e5e7eb', marginBottom: '16px' }}>
                    <label className="form-label"><Phone size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} />Enter your registered mobile number</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input value={phone} onChange={e => setPhone(e.target.value)} className="form-input" placeholder="+91 98765 43210" data-testid="phone-lookup-input" style={{ flex: 1 }} />
                      <button onClick={lookupMember} disabled={lookupLoading} data-testid="lookup-btn" className="btn-primary" style={{ whiteSpace: 'nowrap' }}>
                        {lookupLoading ? 'Searching...' : <><Search size={14} /> Find</>}
                      </button>
                    </div>
                    {lookupError && <p style={{ color: '#ef4444', fontSize: '13px', marginTop: '8px' }}>{lookupError}</p>}
                  </div>
                )}

                {/* Member Found */}
                {registrationCategory === 'idsea_member' && memberData && (
                  <div style={{ background: '#f0fdf4', borderRadius: '10px', padding: '20px', border: '1px solid #bbf7d0', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                      <CheckCircle size={18} style={{ color: '#1e7a4d' }} />
                      <span style={{ fontFamily: 'Poppins', fontWeight: 700, color: '#1e7a4d', fontSize: '14px' }}>Member Found!</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '14px' }}>
                      <div><span style={{ color: '#6b7280' }}>Name:</span> <strong>{memberData.name}</strong></div>
                      <div><span style={{ color: '#6b7280' }}>ID:</span> <strong>{memberData.membership_id}</strong></div>
                      <div><span style={{ color: '#6b7280' }}>Category:</span> <span style={{ textTransform: 'capitalize' }}>{memberData.membership_type}</span></div>
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

                {/* Accompanying Persons */}
                {registrationCategory === 'accompanying' && (
                  <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '20px', border: '1px solid #e5e7eb', marginBottom: '16px' }}>
                    <h4 style={{ fontFamily: 'Poppins', fontSize: '15px', fontWeight: 600, color: '#0c3c60', marginBottom: '12px' }}>Accompanying Person Details</h4>
                    {accompanyingPersons.map((p, idx) => (
                      <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '8px', marginBottom: '8px' }}>
                        <input value={p.name} onChange={e => { const arr = [...accompanyingPersons]; arr[idx] = { ...arr[idx], name: e.target.value }; setAccompanyingPersons(arr); }}
                          className="form-input" placeholder="Full Name" data-testid={`accom-person-name-${idx}`} />
                        <select value={p.relation} onChange={e => { const arr = [...accompanyingPersons]; arr[idx] = { ...arr[idx], relation: e.target.value }; setAccompanyingPersons(arr); }}
                          className="form-input" data-testid={`accom-person-relation-${idx}`}>
                          <option value="">Select Relation</option>
                          <option value="Husband">Husband</option>
                          <option value="Wife">Wife</option>
                          <option value="Father">Father</option>
                          <option value="Mother">Mother</option>
                          <option value="Son">Son</option>
                          <option value="Daughter">Daughter</option>
                          <option value="Other">Other</option>
                        </select>
                        {accompanyingPersons.length > 1 && (
                          <button onClick={() => setAccompanyingPersons(arr => arr.filter((_, i) => i !== idx))} style={{ background: '#fee2e2', color: '#991b1b', border: 'none', padding: '8px', borderRadius: '6px', cursor: 'pointer' }}>X</button>
                        )}
                      </div>
                    ))}
                    <button onClick={() => setAccompanyingPersons(arr => [...arr, { name: '', relation: '' }])} data-testid="add-accompanying-person"
                      style={{ background: '#f0fdf4', border: '1px dashed #1e7a4d', color: '#1e7a4d', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>+ Add Person</button>
                  </div>
                )}

                {/* Corporate/Industry Persons */}
                {registrationCategory === 'corporate_industry' && (
                  <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '20px', border: '1px solid #e5e7eb', marginBottom: '16px' }}>
                    <h4 style={{ fontFamily: 'Poppins', fontSize: '15px', fontWeight: 600, color: '#0c3c60', marginBottom: '12px' }}>Corporate/Industry Personnel (Max 2)</h4>
                    {corporatePersons.map((p, idx) => (
                      <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '8px', marginBottom: '8px' }}>
                        <input value={p.name} onChange={e => { const arr = [...corporatePersons]; arr[idx] = { ...arr[idx], name: e.target.value }; setCorporatePersons(arr); }}
                          className="form-input" placeholder="Full Name" data-testid={`corp-person-name-${idx}`} />
                        <input value={p.designation} onChange={e => { const arr = [...corporatePersons]; arr[idx] = { ...arr[idx], designation: e.target.value }; setCorporatePersons(arr); }}
                          className="form-input" placeholder="Designation" data-testid={`corp-person-desg-${idx}`} />
                        {corporatePersons.length > 1 && (
                          <button onClick={() => setCorporatePersons(arr => arr.filter((_, i) => i !== idx))} style={{ background: '#fee2e2', color: '#991b1b', border: 'none', padding: '8px', borderRadius: '6px', cursor: 'pointer' }}>X</button>
                        )}
                      </div>
                    ))}
                    {corporatePersons.length < 2 && (
                      <button onClick={() => setCorporatePersons(arr => [...arr, { name: '', designation: '' }])} data-testid="add-corporate-person"
                        style={{ background: '#f0fdf4', border: '1px dashed #1e7a4d', color: '#1e7a4d', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>+ Add Person</button>
                    )}
                  </div>
                )}

                {/* Fee preview for non-member categories */}
                {registrationCategory && registrationCategory !== 'idsea_member' && currentTier && (
                  <div style={{ background: '#f0f9ff', borderRadius: '10px', padding: '16px', border: '1px solid #bae6fd', marginBottom: '16px' }}>
                    <span style={{ fontSize: '13px', color: '#6b7280' }}>
                      {REG_CATEGORIES.find(c => c.key === registrationCategory)?.label} Fee ({currentTier.name}):
                    </span>
                    <span style={{ fontSize: '18px', fontWeight: 800, color: '#0c3c60', marginLeft: '8px', fontFamily: 'Poppins' }}>
                      {registrationCategory === 'international' ? '$' : '₹'}{currentTier.fees?.[registrationCategory] || 0}
                    </span>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
                  <button onClick={() => {
                    if (registrationCategory === 'idsea_member' && memberData) setStep(2);
                    else if (registrationCategory && registrationCategory !== 'idsea_member') setStep(2);
                  }}
                    disabled={!registrationCategory || (registrationCategory === 'idsea_member' && !memberData)}
                    className="btn-primary" data-testid="step1-next" style={{ opacity: (!registrationCategory || (registrationCategory === 'idsea_member' && !memberData)) ? 0.5 : 1 }}>
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

                {/* Optional Add-ons */}
                {info?.registration_addons?.length > 0 && (
                  <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '20px', marginTop: '16px', border: '1px solid #e5e7eb' }}>
                    <h4 style={{ fontFamily: 'Poppins', fontSize: '15px', fontWeight: 600, color: '#0c3c60', marginBottom: '12px' }}>Optional Add-ons</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {info.registration_addons.map((addon, idx) => {
                        const isSelected = selectedAddons.includes(addon.name);
                        return (
                          <label key={idx} data-testid={`addon-checkbox-${idx}`}
                            style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px', borderRadius: '8px', cursor: 'pointer',
                              border: isSelected ? '2px solid #1e7a4d' : '1px solid #e5e7eb', background: isSelected ? '#f0fdf4' : 'white', transition: 'all 0.2s' }}>
                            <input type="checkbox" checked={isSelected} onChange={() => {
                              setSelectedAddons(prev => isSelected ? prev.filter(n => n !== addon.name) : [...prev, addon.name]);
                            }} style={{ width: '16px', height: '16px', accentColor: '#1e7a4d' }} />
                            <div style={{ flex: 1 }}>
                              <div style={{ fontFamily: 'Poppins', fontWeight: 600, fontSize: '14px', color: '#111827' }}>{addon.name}</div>
                              {addon.description && <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>{addon.description}</div>}
                            </div>
                            <div style={{ fontFamily: 'Poppins', fontWeight: 800, fontSize: '15px', color: '#0c3c60', whiteSpace: 'nowrap' }}>
                              {addon.currency === 'USD' ? '$' : '₹'}{addon.fee?.toLocaleString('en-IN')}
                            </div>
                          </label>
                        );
                      })}
                    </div>
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
                      <div><span style={{ color: '#6b7280' }}>Category:</span> <span style={{ textTransform: 'capitalize', fontWeight: 600 }}>{REG_CATEGORIES.find(c => c.key === registrationCategory)?.label || (isMember ? `${memberCategory} Member` : 'Non-Member')}</span></div>
                      {isMember && memberData?.membership_id && <div><span style={{ color: '#6b7280' }}>Member ID:</span> <strong>{memberData.membership_id}</strong></div>}
                    </div>
                    {/* Accompanying persons */}
                    {registrationCategory === 'accompanying' && accompanyingPersons.filter(p => p.name).length > 0 && (
                      <div style={{ marginTop: '12px' }}>
                        <span style={{ fontSize: '13px', color: '#6b7280', fontWeight: 600 }}>Accompanying Persons:</span>
                        {accompanyingPersons.filter(p => p.name).map((p, i) => (
                          <div key={i} style={{ fontSize: '13px', marginTop: '4px' }}>{p.name} ({p.relation})</div>
                        ))}
                      </div>
                    )}
                    {/* Corporate persons */}
                    {registrationCategory === 'corporate_industry' && corporatePersons.filter(p => p.name).length > 0 && (
                      <div style={{ marginTop: '12px' }}>
                        <span style={{ fontSize: '13px', color: '#6b7280', fontWeight: 600 }}>Corporate Personnel:</span>
                        {corporatePersons.filter(p => p.name).map((p, i) => (
                          <div key={i} style={{ fontSize: '13px', marginTop: '4px' }}>{p.name} — {p.designation}</div>
                        ))}
                      </div>
                    )}
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
                        <strong>{currencySymbol}{regFee}</strong>
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
                      {selectedAddons.length > 0 && (
                        <>
                          {selectedAddons.map(name => {
                            const a = info.registration_addons?.find(x => x.name === name);
                            return a ? (
                              <div key={name} style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Add-on: {name}</span>
                                <strong>{a.currency === 'USD' ? '$' : '₹'}{a.fee}</strong>
                              </div>
                            ) : null;
                          })}
                        </>
                      )}
                      {wantsMembership && memFee > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>IDSEA Membership ({membershipType})</span>
                          <strong>₹{memFee}</strong>
                        </div>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid #0c3c60', paddingTop: '10px', marginTop: '4px' }}>
                        <span style={{ fontFamily: 'Poppins', fontWeight: 700, fontSize: '16px', color: '#0c3c60' }}>Total Amount</span>
                        <span style={{ fontFamily: 'Poppins', fontWeight: 800, fontSize: '20px', color: '#0c3c60' }}>{currencySymbol}{totalAmount}</span>
                      </div>
                    </div>
                    <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '12px' }}>You will be able to choose your payment method in the next step.</p>
                  </div>

                  {error && <p style={{ color: '#ef4444', fontSize: '13px' }}>{error}</p>}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px' }}>
                  <button onClick={() => setStep(accom.enabled ? 3 : 2)} className="btn-secondary"><ArrowLeft size={14} /> Back</button>
                  <button onClick={handleSubmit} disabled={submitting} className="btn-primary" data-testid="submit-registration"
                    style={{ padding: '12px 32px', fontSize: '15px' }}>
                    {submitting ? 'Processing...' : totalAmount > 0 ? 'Proceed to Payment' : 'Confirm Registration'}
                  </button>
                </div>
              </div>
            )}

            {/* STEP 5: Payment */}
            {step === 5 && regResult && (
              <div data-testid="step-5-payment">
                <h3 style={{ fontFamily: 'Poppins', fontSize: '18px', fontWeight: 700, color: '#0c3c60', marginBottom: '24px' }}>Complete Payment</h3>
                <PaymentPage
                  amount={regResult.total_amount}
                  name={regResult.name}
                  email={form.email}
                  phone={form.phone}
                  purpose="event_registration"
                  memberId={memberData?.membership_id || ''}
                  eventRegistrationId={regResult.id}
                  membershipType={membershipType || memberCategory || ''}
                  onSuccess={handlePaymentSuccess}
                  onCancel={handlePaymentSkip}
                />
              </div>
            )}
          </div>
          )}
        </div>
      </div>
      <PublicFooter />
    </div>
  );
}
