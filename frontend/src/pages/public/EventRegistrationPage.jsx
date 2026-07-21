import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import PublicNavbar from '../../components/public/PublicNavbar';
import PublicFooter from '../../components/public/PublicFooter';
import PaymentPage from '../../components/PaymentPage';
import {
  CheckCircle, ArrowRight, ArrowLeft, Phone, Search,
  Hotel, CreditCard, CalendarClock, Info, Upload, FileText,
  UserPlus, Users, X
} from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const REG_CATEGORIES = [
  { key: 'member', label: 'IDSEA Member', description: 'Academic / Corporate / Entrepreneur member', feeKey: 'member' },
  { key: 'non_member', label: 'Non-Member', description: 'General participant (address & ID proof required)', feeKey: 'non_member' },
  { key: 'student', label: 'Student / JRF / SRF / RA / Retired', description: 'College info & bonafide certificate required', feeKey: 'student' },
  { key: 'international', label: 'International Delegate', description: 'Fees in USD, Razorpay payment only', feeKey: 'international' },
];

const FEE_TABLE_COLS = [
  { key: 'member', label: 'IDSEA Member (INR)' },
  { key: 'non_member', label: 'Non-Member (INR)' },
  { key: 'student', label: 'Student/JRF/SRF/RA/Retired (INR)' },
  { key: 'international', label: 'International (USD)' },
];

const formatDate = (d) => {
  if (!d) return '';
  try { return new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); }
  catch { return d; }
};

export default function EventRegistrationPage() {
  const { eventId } = useParams();
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [regResult, setRegResult] = useState(null);

  // Step 1: Category
  const [registrationCategory, setRegistrationCategory] = useState('');
  const [phone, setPhone] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [memberData, setMemberData] = useState(null);
  const [lookupError, setLookupError] = useState('');

  // Step 2: Details
  const [form, setForm] = useState({
    name: '', email: '', phone: '', qualification: '', organization: '', state: '',
    address_line1: '', address_line2: '', district: '', address_state: '', country: 'India', pincode: '',
    college: '', university: '',
  });
  const [identityProofUrl, setIdentityProofUrl] = useState('');
  const [bonafideCertUrl, setBonafideCertUrl] = useState('');
  const [uploadingId, setUploadingId] = useState(false);
  const [uploadingBon, setUploadingBon] = useState(false);

  // Step 2 (continued): Add-ons & Membership
  const [selectedAddons, setSelectedAddons] = useState([]);
  const [wantsMembership, setWantsMembership] = useState(false);
  const [membershipType, setMembershipType] = useState('');

  // Step 3: Accommodation
  const [accomChoice, setAccomChoice] = useState('');
  const [selectedHotelIdx, setSelectedHotelIdx] = useState(-1);
  const [selectedRoomType, setSelectedRoomType] = useState('');
  const [additionalPersons, setAdditionalPersons] = useState([]);

  useEffect(() => {
    axios.get(`${API}/public/events/${eventId}/registration-info`)
      .then(r => { setInfo(r.data); setLoading(false); })
      .catch(e => { setError(e.response?.data?.detail || 'Event not found or registration closed'); setLoading(false); });
  }, [eventId]);

  // Current fee tier (earliest tier whose deadline hasn't passed)
  const currentTier = useMemo(() => {
    if (!info?.fee_tiers?.length) return null;
    const today = new Date().toISOString().split('T')[0];
    const sorted = [...info.fee_tiers].sort((a, b) => (a.deadline || '').localeCompare(b.deadline || ''));
    for (const tier of sorted) {
      if (tier.deadline && today <= tier.deadline) return tier;
    }
    return sorted[sorted.length - 1];
  }, [info]);

  const sortedTiers = useMemo(() => {
    if (!info?.fee_tiers?.length) return [];
    return [...info.fee_tiers].sort((a, b) => (a.deadline || '').localeCompare(b.deadline || ''));
  }, [info]);

  const isInternational = registrationCategory === 'international';
  const currency = isInternational ? 'USD' : 'INR';
  const currSym = isInternational ? '$' : '\u20B9';
  const accom = info?.accommodation || {};

  // Fee category key for lookup
  const feeKey = useMemo(() => {
    if (registrationCategory === 'member') return 'member';
    return registrationCategory || 'non_member';
  }, [registrationCategory]);

  // Registration fee from current tier
  const regFee = useMemo(() => {
    if (!currentTier) return 0;
    return currentTier.fees?.[feeKey] || 0;
  }, [currentTier, feeKey]);

  // Is free accommodation for this category?
  const isFreeAccom = useMemo(() => {
    if (!accom.enabled) return false;
    return (accom.free_categories || []).includes(feeKey);
  }, [accom, feeKey]);

  // Default accommodation fee from current tier
  const defaultAccomFee = useMemo(() => {
    if (!accom.enabled || !currentTier) return 0;
    if (isFreeAccom) return 0;
    return currentTier.accommodation_fees?.[feeKey] || 0;
  }, [accom, currentTier, feeKey, isFreeAccom]);

  // Selected premium hotel details
  const selectedHotel = useMemo(() => {
    if (selectedHotelIdx < 0) return null;
    return (info?.premium_hotels || [])[selectedHotelIdx] || null;
  }, [info, selectedHotelIdx]);

  // Selected room's base price (USD for international, INR for others)
  const hotelRoomPrice = useMemo(() => {
    if (!selectedHotel || !selectedRoomType) return 0;
    const room = (selectedHotel.room_types || []).find(r => r.type === selectedRoomType);
    if (!room) return 0;
    return isInternational ? (room.price_usd || 0) : (room.price || 0);
  }, [selectedHotel, selectedRoomType, isInternational]);

  // Hotel tax
  const hotelTaxPercent = selectedHotel?.tax_percent || 0;
  const hotelTaxAmount = useMemo(() => Math.round(hotelRoomPrice * hotelTaxPercent / 100), [hotelRoomPrice, hotelTaxPercent]);
  const hotelTotal = hotelRoomPrice + hotelTaxAmount;

  // Accommodation fee based on choice
  const accomFee = useMemo(() => {
    if (!accom.enabled) return 0;
    if (accomChoice === 'self') return 0;
    if (accomChoice === 'default') return isFreeAccom ? 0 : defaultAccomFee;
    if (accomChoice === 'premium_hotel') return hotelTotal;
    return 0;
  }, [accom, accomChoice, isFreeAccom, defaultAccomFee, hotelTotal]);

  // Additional persons fee (USD for international)
  const addPersonFee = useMemo(() => {
    const perPerson = isInternational ? (info?.additional_person_fee_usd || 0) : (info?.additional_person_fee || 0);
    const validPersons = additionalPersons.filter(p => p.name);
    return validPersons.length * perPerson;
  }, [info, additionalPersons, isInternational]);

  // Add-on fees
  const addonFee = useMemo(() => {
    if (!selectedAddons.length || !info?.registration_addons?.length) return 0;
    return info.registration_addons
      .filter(a => selectedAddons.includes(a.name))
      .reduce((sum, a) => sum + (isInternational ? (a.fee_usd || 0) : (a.fee_inr || 0)), 0);
  }, [selectedAddons, info, isInternational]);

  // Membership fee (from dynamic plans)
  const memFee = useMemo(() => {
    if (!wantsMembership || !membershipType || registrationCategory === 'member') return 0;
    const plan = (info?.membership_plans || []).find(p => p.key === membershipType);
    if (!plan) return 0;
    return isInternational ? (plan.fee_usd || 0) : (plan.fee_inr || 0);
  }, [wantsMembership, membershipType, registrationCategory, info, isInternational]);

  const totalAmount = regFee + accomFee + addPersonFee + addonFee + memFee;

  // Member lookup
  const lookupMember = async () => {
    if (!phone || phone.length < 5) { setLookupError('Enter a valid phone number'); return; }
    setLookupLoading(true); setLookupError(''); setMemberData(null);
    try {
      const r = await axios.get(`${API}/public/members/lookup?phone=${encodeURIComponent(phone)}`);
      if (r.data.found) {
        setMemberData(r.data.member);
        setForm(f => ({
          ...f,
          name: r.data.member.name || '', email: r.data.member.email || '',
          phone: r.data.member.phone || phone, qualification: r.data.member.qualification || '',
          organization: r.data.member.organization || '', state: r.data.member.state || '',
        }));
      } else {
        setLookupError('No approved member found with this phone number.');
      }
    } catch { setLookupError('Lookup failed. Please try again.'); }
    setLookupLoading(false);
  };

  // PDF upload handler
  const uploadPdf = async (type) => {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = '.pdf';
    input.onchange = async (e) => {
      const file = e.target.files[0]; if (!file) return;
      if (type === 'identity') setUploadingId(true); else setUploadingBon(true);
      const fd = new FormData(); fd.append('file', file);
      try {
        const r = await axios.post(`${API}/public/upload-pdf`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        if (type === 'identity') setIdentityProofUrl(r.data.url);
        else setBonafideCertUrl(r.data.url);
      } catch { alert('Upload failed. Only PDF files up to 10MB are allowed.'); }
      if (type === 'identity') setUploadingId(false); else setUploadingBon(false);
    };
    input.click();
  };

  // Add additional person
  const addPerson = () => setAdditionalPersons(p => [...p, { name: '', age: '', mobile: '' }]);
  const removePerson = (idx) => setAdditionalPersons(p => p.filter((_, i) => i !== idx));
  const updatePerson = (idx, key, val) => {
    setAdditionalPersons(p => { const arr = [...p]; arr[idx] = { ...arr[idx], [key]: val }; return arr; });
  };

  // Validation per step
  const canProceedStep1 = registrationCategory === 'member' ? !!memberData : !!registrationCategory;

  const canProceedStep2 = useMemo(() => {
    if (!form.name || !form.email || !form.phone) return false;
    if (registrationCategory === 'non_member') {
      if (!form.address_line1 || !form.address_state || !form.pincode) return false;
      if (!identityProofUrl) return false;
    }
    if (registrationCategory === 'student') {
      if (!form.college) return false;
      if (!form.address_line1 || !form.address_state || !form.pincode) return false;
      if (!bonafideCertUrl || !identityProofUrl) return false;
    }
    if (registrationCategory === 'international') {
      if (!form.country || !form.address_line1 || !form.pincode) return false;
      if (!identityProofUrl) return false;
    }
    return true;
  }, [form, registrationCategory, identityProofUrl, bonafideCertUrl]);

  const canProceedStep3 = !!accomChoice && (accomChoice !== 'premium_hotel' || (selectedHotelIdx >= 0 && selectedRoomType));

  const handleSubmit = async () => {
    if (!form.name || !form.email || !form.phone) return;
    // Prevent duplicate submission if registration already created
    if (regResult) {
      if (totalAmount > 0) setStep(5);
      else setSubmitted(true);
      return;
    }
    setSubmitting(true); setError('');
    try {
      const payload = {
        is_member: registrationCategory === 'member',
        member_id: memberData?.membership_id || '',
        member_category: memberData?.membership_type || '',
        registration_category: registrationCategory,
        name: form.name, email: form.email, phone: form.phone,
        qualification: form.qualification, organization: form.organization, state: form.state,
        address_line1: form.address_line1, address_line2: form.address_line2,
        district: form.district, address_state: form.address_state,
        country: form.country, pincode: form.pincode,
        college: form.college, university: form.university,
        identity_proof_url: identityProofUrl,
        bonafide_cert_url: bonafideCertUrl,
        accommodation_choice: accomChoice || 'none',
        hotel_name: accomChoice === 'premium_hotel' ? (selectedHotel?.name || '') : '',
        hotel_room_type: accomChoice === 'premium_hotel' ? selectedRoomType : '',
        hotel_tax_percent: accomChoice === 'premium_hotel' ? hotelTaxPercent : 0,
        hotel_base_amount: accomChoice === 'premium_hotel' ? hotelRoomPrice : 0,
        hotel_tax_amount: accomChoice === 'premium_hotel' ? hotelTaxAmount : 0,
        additional_persons: additionalPersons.filter(p => p.name),
        additional_persons_fee: addPersonFee,
        wants_membership: wantsMembership,
        membership_type: wantsMembership ? membershipType : '',
        selected_addons: selectedAddons,
        addon_fee: addonFee,
        registration_fee: regFee,
        accommodation_fee: accomFee,
        membership_fee: memFee,
        total_amount: totalAmount,
        payment_mode: 'offline',
      };
      const r = await axios.post(`${API}/public/events/${eventId}/register`, payload);
      const reg = r.data.registration;
      setRegResult(reg);
      const serverTotal = reg?.total_amount ?? totalAmount;
      if (serverTotal > 0) setStep(5);
      else setSubmitted(true);
    } catch (e) { setError(e.response?.data?.detail || 'Registration failed'); }
    setSubmitting(false);
  };

  const handlePaymentSuccess = (method) => {
    if (regResult) setRegResult({ ...regResult, payment_status: method === 'razorpay' ? 'paid' : 'verification_pending', payment_mode: method });
    setSubmitted(true);
  };

  // ---- RENDER ----

  if (loading) return (
    <div style={{ background: '#f8fafc' }}>
      <PublicNavbar />
      <div style={{ paddingTop: '200px', textAlign: 'center' }}><div className="loading-spinner">Loading...</div></div>
    </div>
  );

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
          <div style={{ width: '64px', height: '64px', background: '#d1fae5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <CheckCircle size={32} style={{ color: '#1e7a4d' }} />
          </div>
          <h2 style={{ fontFamily: 'Poppins', color: '#0c3c60', fontSize: '22px', fontWeight: 700, marginBottom: '8px' }}>Registration Successful!</h2>
          <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '24px' }}>You have been registered for <strong>{info?.title}</strong>.</p>
          <div style={{ background: '#f0f9ff', borderRadius: '10px', padding: '20px', textAlign: 'left', marginBottom: '24px' }}>
            <div style={{ display: 'grid', gap: '8px', fontSize: '14px' }}>
              <div><span style={{ color: '#6b7280' }}>Name:</span> <strong>{regResult?.name}</strong></div>
              <div><span style={{ color: '#6b7280' }}>Category:</span> <strong style={{ textTransform: 'capitalize' }}>{regResult?.registration_category?.replace('_', ' ')}</strong></div>
              <div><span style={{ color: '#6b7280' }}>Registration Fee:</span> <strong>{currSym}{regResult?.registration_fee}</strong></div>
              {regResult?.accommodation_fee > 0 && <div><span style={{ color: '#6b7280' }}>Accommodation:</span> <strong>{currSym}{regResult?.accommodation_fee}</strong></div>}
              {regResult?.additional_persons_fee > 0 && <div><span style={{ color: '#6b7280' }}>Additional Persons:</span> <strong>{currSym}{regResult?.additional_persons_fee}</strong></div>}
              {regResult?.addon_fee > 0 && <div><span style={{ color: '#6b7280' }}>Add-ons:</span> <strong>{currSym}{regResult?.addon_fee}</strong></div>}
              {regResult?.membership_fee > 0 && <div><span style={{ color: '#6b7280' }}>Membership Fee:</span> <strong>{currSym}{regResult?.membership_fee}</strong></div>}
              <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '8px', marginTop: '4px' }}>
                <span style={{ color: '#0c3c60', fontWeight: 700, fontSize: '16px' }}>Total: {currSym}{regResult?.total_amount}</span>
              </div>
              <div><span style={{ color: '#6b7280' }}>Payment:</span>{' '}
                {regResult?.payment_status === 'paid'
                  ? <span style={{ color: '#1e7a4d', fontWeight: 600 }}>Paid</span>
                  : regResult?.payment_status === 'verification_pending'
                    ? <span style={{ color: '#d97706', fontWeight: 600 }}>Verification Pending</span>
                    : <span style={{ color: '#d97706', fontWeight: 600 }}>Pending</span>}
              </div>
            </div>
          </div>
          <Link to="/events" className="btn-primary" style={{ textDecoration: 'none', display: 'inline-flex' }}>Back to Events</Link>
        </div>
      </div>
      <PublicFooter />
    </div>
  );

  const accomEnabled = accom.enabled;
  const stepLabels = step === 0 ? [] : ['Category', 'Details', ...(accomEnabled ? ['Accommodation'] : []), 'Review', 'Payment'];

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
        .fee-table .active-badge { background: #1e7a4d; color: white; padding: 2px 8px; border-radius: 10px; font-size: 10px; font-weight: 700; margin-left: 6px; }
        .fee-table .free-badge { background: #d1fae5; color: #065f46; padding: 2px 8px; border-radius: 10px; font-size: 11px; font-weight: 700; }
        @media (max-width: 640px) {
          .fee-cards-mobile { display: flex; flex-direction: column; gap: 16px; }
          .fee-card { background: white; border-radius: 12px; border: 1px solid #e5e7eb; overflow: hidden; }
          .fee-card.active { border: 2px solid #1e7a4d; }
          .fee-card-header { padding: 14px 16px; display: flex; justify-content: space-between; align-items: center; }
          .fee-card-body { padding: 0 16px 16px; }
          .fee-card-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
          .fee-card-row:last-child { border-bottom: none; }
          .fee-desktop { display: none !important; }
        }
        @media (min-width: 641px) { .fee-cards-mobile { display: none !important; } }
      `}</style>

      <div>
        {/* Event Header */}
        <div style={{ background: '#0c3c60', padding: '170px 24px 30px', color: 'white', textAlign: 'center' }}>
          <h1 style={{ fontFamily: 'Poppins', fontSize: 'clamp(20px,3vw,32px)', fontWeight: 800, marginBottom: '8px' }}>Event Registration</h1>
          <h2 style={{ fontFamily: 'Poppins', fontSize: '16px', fontWeight: 500, opacity: 0.9, marginBottom: '8px' }}>{info?.title}</h2>
          <p style={{ fontSize: '14px', opacity: 0.7 }}>{info?.date}{info?.end_date ? ` - ${info.end_date}` : ''} | {info?.venue}</p>
        </div>

        {/* Step Indicator */}
        {step > 0 && (
          <div style={{ maxWidth: '800px', margin: '0 auto', padding: '24px 24px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
              {stepLabels.map((label, idx) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '13px', fontWeight: 700, fontFamily: 'Poppins',
                    background: step > idx + 1 ? '#1e7a4d' : step === idx + 1 ? '#0c3c60' : '#e5e7eb',
                    color: step >= idx + 1 ? 'white' : '#9ca3af'
                  }}>{step > idx + 1 ? '\u2713' : idx + 1}</div>
                  <span style={{ fontSize: '13px', fontFamily: 'Poppins', fontWeight: step === idx + 1 ? 600 : 400, color: step === idx + 1 ? '#0c3c60' : '#9ca3af' }}>{label}</span>
                  {idx < stepLabels.length - 1 && <div style={{ width: '32px', height: '2px', background: step > idx + 1 ? '#1e7a4d' : '#e5e7eb' }} />}
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ maxWidth: step === 0 ? '960px' : '720px', margin: '0 auto', padding: '24px', transition: 'max-width 0.3s ease' }}>

          {/* ========== STEP 0: Fee Overview ========== */}
          {step === 0 && (
            <div data-testid="step-fee-overview">
              {/* Registration Fee Table */}
              {sortedTiers.length > 0 && (
                <div style={{ background: 'white', borderRadius: '16px', padding: '28px', boxShadow: '0 4px 12px rgba(0,0,0,0.06)', marginBottom: '20px' }}>
                  <h3 style={{ fontFamily: 'Poppins', fontSize: '18px', fontWeight: 700, color: '#0c3c60', marginBottom: '6px' }}>Registration Fees</h3>
                  <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '20px' }}>Fees vary by tier and participant category.</p>

                  <div className="fee-table-wrap fee-desktop">
                    <table className="fee-table" data-testid="fee-table-registration">
                      <thead>
                        <tr>
                          <th>Tier</th>
                          <th>Deadline</th>
                          {FEE_TABLE_COLS.map(c => <th key={c.key}>{c.label}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {sortedTiers.map((tier, idx) => {
                          const isActive = currentTier?.name === tier.name;
                          return (
                            <tr key={idx} className={isActive ? 'tier-active' : ''}>
                              <td>
                                <span style={{ fontFamily: 'Poppins', fontWeight: 600 }}>{tier.name}</span>
                                {isActive && <span className="active-badge">CURRENT</span>}
                              </td>
                              <td style={{ whiteSpace: 'nowrap' }}>
                                <CalendarClock size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px', color: '#6b7280' }} />
                                {formatDate(tier.deadline)}
                              </td>
                              {FEE_TABLE_COLS.map(c => (
                                <td key={c.key} className="amount">
                                  {c.key === 'international' ? '$' : '\u20B9'}{(tier.fees?.[c.key] || 0).toLocaleString('en-IN')}
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
                      return (
                        <div key={idx} className={`fee-card ${isActive ? 'active' : ''}`}>
                          <div className="fee-card-header" style={{ background: isActive ? '#f0fdf4' : '#f8fafc' }}>
                            <div>
                              <span style={{ fontFamily: 'Poppins', fontWeight: 700, fontSize: '15px', color: '#0c3c60' }}>{tier.name}</span>
                              {isActive && <span className="active-badge">CURRENT</span>}
                            </div>
                            <span style={{ fontSize: '12px', color: '#6b7280' }}>By {formatDate(tier.deadline)}</span>
                          </div>
                          <div className="fee-card-body">
                            {FEE_TABLE_COLS.map(c => (
                              <div key={c.key} className="fee-card-row">
                                <span>{c.label.replace(' (INR)', '').replace(' (USD)', '')}</span>
                                <span style={{ fontFamily: 'Poppins', fontWeight: 700, color: '#0c3c60' }}>
                                  {c.key === 'international' ? '$' : '\u20B9'}{(tier.fees?.[c.key] || 0).toLocaleString('en-IN')}
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

              {/* Accommodation Fees */}
              {accomEnabled && sortedTiers.some(t => t.accommodation_fees) && (
                <div style={{ background: 'white', borderRadius: '16px', padding: '28px', boxShadow: '0 4px 12px rgba(0,0,0,0.06)', marginBottom: '20px' }}>
                  <h3 style={{ fontFamily: 'Poppins', fontSize: '18px', fontWeight: 700, color: '#0c3c60', marginBottom: '6px' }}>Default Accommodation Fees</h3>
                  <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '16px' }}>
                    Standard accommodation with registration. Premium hotels available as upgrade.
                    {(accom.free_categories || []).length > 0 && (
                      <span style={{ display: 'block', marginTop: '4px', color: '#1e7a4d', fontWeight: 600 }}>
                        Free accommodation for: {accom.free_categories.map(c => REG_CATEGORIES.find(rc => rc.feeKey === c)?.label || c).join(', ')}
                      </span>
                    )}
                  </p>
                  <div className="fee-table-wrap fee-desktop">
                    <table className="fee-table" data-testid="fee-table-accommodation">
                      <thead>
                        <tr>
                          <th>Tier</th>
                          <th>Deadline</th>
                          {FEE_TABLE_COLS.filter(c => c.key !== 'international').map(c => <th key={c.key}>{c.label}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {sortedTiers.map((tier, idx) => {
                          const isActive = currentTier?.name === tier.name;
                          const freeCats = accom.free_categories || [];
                          return (
                            <tr key={idx} className={isActive ? 'tier-active' : ''}>
                              <td>
                                <span style={{ fontFamily: 'Poppins', fontWeight: 600 }}>{tier.name}</span>
                                {isActive && <span className="active-badge">CURRENT</span>}
                              </td>
                              <td style={{ whiteSpace: 'nowrap' }}><CalendarClock size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px', color: '#6b7280' }} />{formatDate(tier.deadline)}</td>
                              {FEE_TABLE_COLS.filter(c => c.key !== 'international').map(c => (
                                <td key={c.key} className="amount">
                                  {freeCats.includes(c.key) ? <span className="free-badge">FREE</span> : `\u20B9${(tier.accommodation_fees?.[c.key] || 0).toLocaleString('en-IN')}`}
                                </td>
                              ))}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Premium Hotels & Membership Info */}
              <div style={{ display: 'grid', gridTemplateColumns: ((info?.premium_hotels?.length > 0) && info?.allow_membership_registration) ? '1fr 1fr' : '1fr', gap: '20px', marginBottom: '20px' }}>
                {(info?.premium_hotels || []).length > 0 && (
                  <div style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}>
                    <h4 style={{ fontFamily: 'Poppins', fontSize: '15px', fontWeight: 700, color: '#0c3c60', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Hotel size={16} /> Premium Hotel Options
                    </h4>
                    <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '12px' }}>Upgrade from default accommodation. Price = Room + Tax%</p>
                    {info.premium_hotels.map((hotel, idx) => (
                      <div key={idx} style={{ background: '#f8fafc', borderRadius: '8px', padding: '12px 14px', marginBottom: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <span style={{ fontFamily: 'Poppins', fontWeight: 600, fontSize: '14px', color: '#111827' }}>{hotel.name}</span>
                            {hotel.rating && <span style={{ fontSize: '11px', color: '#d4a017', fontWeight: 600, marginLeft: '8px' }}>{hotel.rating}</span>}
                          </div>
                          <span style={{ fontSize: '12px', color: '#6b7280' }}>Tax: {hotel.tax_percent}%</span>
                        </div>
                        {(hotel.room_types || []).length > 0 && (
                          <div style={{ marginTop: '6px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            {hotel.room_types.map((rt, ri) => (
                              <span key={ri} style={{ fontSize: '12px', padding: '3px 8px', background: '#e0f2fe', borderRadius: '6px', color: '#0c3c60' }}>
                                {rt.type}: {'\u20B9'}{rt.price?.toLocaleString('en-IN')}{rt.price_usd ? ` / $${rt.price_usd}` : ''}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {info?.allow_membership_registration && (info?.membership_plans || []).length > 0 && (
                  <div style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}>
                    <h4 style={{ fontFamily: 'Poppins', fontSize: '15px', fontWeight: 700, color: '#0c3c60', marginBottom: '14px' }}>Become an IDSEA Member</h4>
                    <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '12px' }}>Non-members, students & international delegates can apply for membership during registration</p>
                    {info.membership_plans.filter(p => p.enabled !== false).map((plan, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: '#f8fafc', borderRadius: '8px', marginBottom: '8px' }}>
                        <span style={{ fontFamily: 'Poppins', fontWeight: 600, fontSize: '14px', color: '#111827' }}>{plan.label}</span>
                        <span style={{ fontFamily: 'Poppins', fontWeight: 800, fontSize: '15px', color: '#1e7a4d' }}>
                          {'\u20B9'}{plan.fee_inr?.toLocaleString('en-IN')} / ${plan.fee_usd}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Additional Info */}
              {((info?.additional_person_fee > 0) || (info?.additional_person_fee_usd > 0)) && accomEnabled && (
                <div style={{ background: 'white', borderRadius: '16px', padding: '20px 24px', boxShadow: '0 4px 12px rgba(0,0,0,0.06)', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#334155' }}>
                    <Users size={16} style={{ color: '#0c3c60' }} />
                    <span>Additional accompanying persons: <strong>{'\u20B9'}{info.additional_person_fee} per person</strong>
                    {info.additional_person_fee_usd > 0 && <> / <strong>${info.additional_person_fee_usd} per person (International)</strong></>}
                    </span>
                  </div>
                </div>
              )}

              {/* Proceed */}
              <div style={{ textAlign: 'center', padding: '8px 0 16px' }}>
                <button onClick={() => setStep(1)} className="btn-primary" data-testid="proceed-to-register"
                  style={{ padding: '16px 40px', fontSize: '16px', fontFamily: 'Poppins', fontWeight: 700 }}>
                  Proceed to Register <ArrowRight size={18} />
                </button>
              </div>
            </div>
          )}

          {/* ========== FORM STEPS ========== */}
          {step >= 1 && (
          <div style={{ background: 'white', borderRadius: '16px', padding: '32px', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}>

            {/* ===== STEP 1: Category Selection ===== */}
            {step === 1 && (
              <div data-testid="step-1">
                <h3 style={{ fontFamily: 'Poppins', fontSize: '18px', fontWeight: 700, color: '#0c3c60', marginBottom: '24px' }}>Select Registration Category</h3>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px', marginBottom: '24px' }}>
                  {REG_CATEGORIES.map(cat => {
                    const fee = currentTier?.fees?.[cat.feeKey] || 0;
                    const isSelected = registrationCategory === cat.key;
                    return (
                      <button key={cat.key} onClick={() => {
                        setRegistrationCategory(cat.key);
                        if (cat.key !== 'member') { setMemberData(null); setPhone(''); setLookupError(''); }
                      }}
                        data-testid={`cat-${cat.key}`}
                        style={{
                          padding: '20px 16px', borderRadius: '12px', cursor: 'pointer', textAlign: 'left',
                          border: isSelected ? '2px solid #1e7a4d' : '2px solid #e5e7eb',
                          background: isSelected ? '#f0fdf4' : 'white', transition: 'all 0.2s ease'
                        }}>
                        <div style={{ fontFamily: 'Poppins', fontWeight: 700, fontSize: '14px', color: '#111827', marginBottom: '4px' }}>{cat.label}</div>
                        <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>{cat.description}</div>
                        {currentTier && cat.key !== 'member' && (
                          <div style={{ fontFamily: 'Poppins', fontWeight: 800, fontSize: '16px', color: '#0c3c60' }}>
                            {cat.key === 'international' ? '$' : '\u20B9'}{fee.toLocaleString('en-IN')}
                          </div>
                        )}
                        {cat.key === 'member' && currentTier && (
                          <div style={{ fontSize: '12px', color: '#1e7a4d', fontWeight: 600 }}>
                            {'\u20B9'}{(currentTier.fees?.member || 0).toLocaleString('en-IN')} (all member types)
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* IDSEA Member Lookup */}
                {registrationCategory === 'member' && !memberData && (
                  <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '20px', border: '1px solid #e5e7eb', marginBottom: '16px' }}>
                    <label className="form-label"><Phone size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} />Enter your registered mobile number</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input value={phone} onChange={e => setPhone(e.target.value)} className="form-input" placeholder="+91 98765 43210" data-testid="phone-lookup-input" style={{ flex: 1 }}
                        onKeyDown={e => e.key === 'Enter' && lookupMember()} />
                      <button onClick={lookupMember} disabled={lookupLoading} data-testid="lookup-btn" className="btn-primary" style={{ whiteSpace: 'nowrap' }}>
                        {lookupLoading ? 'Searching...' : <><Search size={14} /> Find</>}
                      </button>
                    </div>
                    {lookupError && <p style={{ color: '#ef4444', fontSize: '13px', marginTop: '8px' }}>{lookupError}</p>}
                  </div>
                )}

                {/* Member Found */}
                {registrationCategory === 'member' && memberData && (
                  <div style={{ background: '#f0fdf4', borderRadius: '10px', padding: '20px', border: '1px solid #bbf7d0', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                      <CheckCircle size={18} style={{ color: '#1e7a4d' }} />
                      <span style={{ fontFamily: 'Poppins', fontWeight: 700, color: '#1e7a4d', fontSize: '14px' }}>Member Found!</span>
                      <button onClick={() => { setMemberData(null); setPhone(''); }} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', fontSize: '12px' }}>Change</button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '14px' }}>
                      <div><span style={{ color: '#6b7280' }}>Name:</span> <strong>{memberData.name}</strong></div>
                      <div><span style={{ color: '#6b7280' }}>ID:</span> <strong>{memberData.membership_id}</strong></div>
                      <div><span style={{ color: '#6b7280' }}>Type:</span> <span style={{ textTransform: 'capitalize' }}>{memberData.membership_type}</span></div>
                      <div><span style={{ color: '#6b7280' }}>Org:</span> {memberData.organization}</div>
                    </div>
                    {currentTier && (
                      <div style={{ marginTop: '12px', padding: '12px', background: 'white', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                        <span style={{ fontSize: '13px', color: '#6b7280' }}>Registration Fee ({currentTier.name}):</span>
                        <span style={{ fontSize: '18px', fontWeight: 800, color: '#0c3c60', marginLeft: '8px', fontFamily: 'Poppins' }}>
                          {'\u20B9'}{currentTier.fees?.member || 0}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Non-member fee preview */}
                {registrationCategory && registrationCategory !== 'member' && currentTier && (
                  <div style={{ background: '#f0f9ff', borderRadius: '10px', padding: '16px', border: '1px solid #bae6fd', marginBottom: '16px' }}>
                    <span style={{ fontSize: '13px', color: '#6b7280' }}>
                      {REG_CATEGORIES.find(c => c.key === registrationCategory)?.label} Fee ({currentTier.name}):
                    </span>
                    <span style={{ fontSize: '18px', fontWeight: 800, color: '#0c3c60', marginLeft: '8px', fontFamily: 'Poppins' }}>
                      {registrationCategory === 'international' ? '$' : '\u20B9'}{regFee}
                    </span>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
                  <button onClick={() => setStep(0)} className="btn-secondary" style={{ marginRight: 'auto' }}><ArrowLeft size={14} /> Back</button>
                  <button onClick={() => canProceedStep1 && setStep(2)} disabled={!canProceedStep1}
                    className="btn-primary" data-testid="step1-next" style={{ opacity: !canProceedStep1 ? 0.5 : 1 }}>
                    Next <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            )}

            {/* ===== STEP 2: Participant Details ===== */}
            {step === 2 && (
              <div data-testid="step-2">
                <h3 style={{ fontFamily: 'Poppins', fontSize: '18px', fontWeight: 700, color: '#0c3c60', marginBottom: '24px' }}>
                  {registrationCategory === 'member' ? 'Confirm Your Details' : 'Participant Details'}
                </h3>

                {/* Basic fields */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group"><label className="form-label">Full Name *</label>
                    <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="form-input" data-testid="reg-name" readOnly={registrationCategory === 'member'} />
                  </div>
                  <div className="form-group"><label className="form-label">Email *</label>
                    <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="form-input" data-testid="reg-email" />
                  </div>
                  <div className="form-group"><label className="form-label">Phone *</label>
                    <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="form-input" data-testid="reg-phone" />
                  </div>
                  <div className="form-group"><label className="form-label">Qualification</label>
                    <input value={form.qualification} onChange={e => setForm(f => ({ ...f, qualification: e.target.value }))} className="form-input" />
                  </div>
                  <div className="form-group"><label className="form-label">Organization</label>
                    <input value={form.organization} onChange={e => setForm(f => ({ ...f, organization: e.target.value }))} className="form-input" />
                  </div>
                </div>

                {/* Non-Member: Address + ID Proof */}
                {registrationCategory === 'non_member' && (
                  <div style={{ background: '#fef3c7', borderRadius: '10px', padding: '20px', marginTop: '16px', border: '1px solid #fde68a' }}>
                    <h4 style={{ fontFamily: 'Poppins', fontSize: '14px', fontWeight: 600, color: '#92400e', marginBottom: '12px' }}>
                      Address & Identity Proof (Required for Non-Members)
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div className="form-group"><label className="form-label">Address Line 1 *</label>
                        <input value={form.address_line1} onChange={e => setForm(f => ({ ...f, address_line1: e.target.value }))} className="form-input" data-testid="address-line1" />
                      </div>
                      <div className="form-group"><label className="form-label">Address Line 2</label>
                        <input value={form.address_line2} onChange={e => setForm(f => ({ ...f, address_line2: e.target.value }))} className="form-input" />
                      </div>
                      <div className="form-group"><label className="form-label">District</label>
                        <input value={form.district} onChange={e => setForm(f => ({ ...f, district: e.target.value }))} className="form-input" />
                      </div>
                      <div className="form-group"><label className="form-label">State *</label>
                        <input value={form.address_state} onChange={e => setForm(f => ({ ...f, address_state: e.target.value }))} className="form-input" data-testid="address-state" />
                      </div>
                      <div className="form-group"><label className="form-label">Pincode *</label>
                        <input value={form.pincode} onChange={e => setForm(f => ({ ...f, pincode: e.target.value }))} className="form-input" data-testid="address-pincode" />
                      </div>
                    </div>
                    <div style={{ marginTop: '12px' }}>
                      <label className="form-label">Identity Proof (PDF) *</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <button onClick={() => uploadPdf('identity')} disabled={uploadingId} className="btn-secondary" data-testid="upload-identity-proof"
                          style={{ fontSize: '13px', padding: '8px 14px' }}>
                          {uploadingId ? 'Uploading...' : <><Upload size={14} /> Upload PDF</>}
                        </button>
                        {identityProofUrl && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: '#1e7a4d', fontWeight: 600 }}>
                            <CheckCircle size={14} /> Uploaded
                            <a href={`${process.env.REACT_APP_BACKEND_URL}${identityProofUrl}`} target="_blank" rel="noreferrer"
                              style={{ color: '#0c3c60', marginLeft: '4px', fontSize: '12px' }}>View</a>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Student: College + Address + Bonafide + Identity Proof */}
                {registrationCategory === 'student' && (
                  <div style={{ background: '#ede9fe', borderRadius: '10px', padding: '20px', marginTop: '16px', border: '1px solid #c4b5fd' }}>
                    <h4 style={{ fontFamily: 'Poppins', fontSize: '14px', fontWeight: 600, color: '#5b21b6', marginBottom: '12px' }}>
                      Student / JRF / SRF / RA / Retired - Details
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div className="form-group"><label className="form-label">College/Institute *</label>
                        <input value={form.college} onChange={e => setForm(f => ({ ...f, college: e.target.value }))} className="form-input" data-testid="college-input" />
                      </div>
                      <div className="form-group"><label className="form-label">University</label>
                        <input value={form.university} onChange={e => setForm(f => ({ ...f, university: e.target.value }))} className="form-input" data-testid="university-input" />
                      </div>
                    </div>
                    <h4 style={{ fontFamily: 'Poppins', fontSize: '13px', fontWeight: 600, color: '#5b21b6', margin: '16px 0 10px' }}>Address *</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div className="form-group"><label className="form-label">Address Line 1 *</label>
                        <input value={form.address_line1} onChange={e => setForm(f => ({ ...f, address_line1: e.target.value }))} className="form-input" data-testid="student-address-line1" />
                      </div>
                      <div className="form-group"><label className="form-label">Address Line 2</label>
                        <input value={form.address_line2} onChange={e => setForm(f => ({ ...f, address_line2: e.target.value }))} className="form-input" />
                      </div>
                      <div className="form-group"><label className="form-label">District</label>
                        <input value={form.district} onChange={e => setForm(f => ({ ...f, district: e.target.value }))} className="form-input" />
                      </div>
                      <div className="form-group"><label className="form-label">State *</label>
                        <input value={form.address_state} onChange={e => setForm(f => ({ ...f, address_state: e.target.value }))} className="form-input" data-testid="student-state" />
                      </div>
                      <div className="form-group"><label className="form-label">Pincode *</label>
                        <input value={form.pincode} onChange={e => setForm(f => ({ ...f, pincode: e.target.value }))} className="form-input" data-testid="student-pincode" />
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '12px' }}>
                      <div>
                        <label className="form-label">Bonafide Certificate (PDF) *</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <button onClick={() => uploadPdf('bonafide')} disabled={uploadingBon} className="btn-secondary" data-testid="upload-bonafide"
                            style={{ fontSize: '13px', padding: '8px 14px' }}>
                            {uploadingBon ? 'Uploading...' : <><Upload size={14} /> Upload PDF</>}
                          </button>
                          {bonafideCertUrl && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: '#1e7a4d', fontWeight: 600 }}>
                              <CheckCircle size={14} /> Uploaded
                              <a href={`${process.env.REACT_APP_BACKEND_URL}${bonafideCertUrl}`} target="_blank" rel="noreferrer"
                                style={{ color: '#0c3c60', marginLeft: '4px', fontSize: '12px' }}>View</a>
                            </span>
                          )}
                        </div>
                      </div>
                      <div>
                        <label className="form-label">Identity Proof (PDF) *</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <button onClick={() => uploadPdf('identity')} disabled={uploadingId} className="btn-secondary" data-testid="upload-student-identity"
                            style={{ fontSize: '13px', padding: '8px 14px' }}>
                            {uploadingId ? 'Uploading...' : <><Upload size={14} /> Upload PDF</>}
                          </button>
                          {identityProofUrl && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: '#1e7a4d', fontWeight: 600 }}>
                              <CheckCircle size={14} /> Uploaded
                              <a href={`${process.env.REACT_APP_BACKEND_URL}${identityProofUrl}`} target="_blank" rel="noreferrer"
                                style={{ color: '#0c3c60', marginLeft: '4px', fontSize: '12px' }}>View</a>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* International: Full Address + Postal Code + Identity Proof */}
                {registrationCategory === 'international' && (
                  <div style={{ background: '#dbeafe', borderRadius: '10px', padding: '20px', marginTop: '16px', border: '1px solid #93c5fd' }}>
                    <h4 style={{ fontFamily: 'Poppins', fontSize: '14px', fontWeight: 600, color: '#1e40af', marginBottom: '12px' }}>
                      International Delegate Details
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div className="form-group"><label className="form-label">Country *</label>
                        <input value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value }))} className="form-input" data-testid="country-input" />
                      </div>
                      <div className="form-group"><label className="form-label">Address Line 1 *</label>
                        <input value={form.address_line1} onChange={e => setForm(f => ({ ...f, address_line1: e.target.value }))} className="form-input" data-testid="intl-address-line1" />
                      </div>
                      <div className="form-group"><label className="form-label">Address Line 2</label>
                        <input value={form.address_line2} onChange={e => setForm(f => ({ ...f, address_line2: e.target.value }))} className="form-input" />
                      </div>
                      <div className="form-group"><label className="form-label">District / City</label>
                        <input value={form.district} onChange={e => setForm(f => ({ ...f, district: e.target.value }))} className="form-input" />
                      </div>
                      <div className="form-group"><label className="form-label">State / Province</label>
                        <input value={form.address_state} onChange={e => setForm(f => ({ ...f, address_state: e.target.value }))} className="form-input" data-testid="intl-state" />
                      </div>
                      <div className="form-group"><label className="form-label">Postal Code *</label>
                        <input value={form.pincode} onChange={e => setForm(f => ({ ...f, pincode: e.target.value }))} className="form-input" data-testid="intl-postal-code" />
                      </div>
                    </div>
                    <div style={{ marginTop: '12px' }}>
                      <label className="form-label">Identity Proof (PDF) *</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <button onClick={() => uploadPdf('identity')} disabled={uploadingId} className="btn-secondary" data-testid="upload-intl-identity"
                          style={{ fontSize: '13px', padding: '8px 14px' }}>
                          {uploadingId ? 'Uploading...' : <><Upload size={14} /> Upload PDF</>}
                        </button>
                        {identityProofUrl && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: '#1e7a4d', fontWeight: 600 }}>
                            <CheckCircle size={14} /> Uploaded
                            <a href={`${process.env.REACT_APP_BACKEND_URL}${identityProofUrl}`} target="_blank" rel="noreferrer"
                              style={{ color: '#0c3c60', marginLeft: '4px', fontSize: '12px' }}>View</a>
                          </span>
                        )}
                      </div>
                    </div>
                    <div style={{ marginTop: '12px', padding: '8px 12px', background: '#bfdbfe', borderRadius: '6px', fontSize: '12px', color: '#1e40af' }}>
                      <Info size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
                      Fees in USD. Payment via Razorpay only.
                    </div>
                  </div>
                )}

                {/* Optional Add-ons */}
                {(info?.registration_addons || []).length > 0 && (
                  <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '20px', marginTop: '16px', border: '1px solid #e5e7eb' }}>
                    <h4 style={{ fontFamily: 'Poppins', fontSize: '15px', fontWeight: 600, color: '#0c3c60', marginBottom: '12px' }}>Optional Add-ons</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {info.registration_addons.map((addon, idx) => {
                        const isSelected = selectedAddons.includes(addon.name);
                        const adFee = isInternational ? (addon.fee_usd || 0) : (addon.fee_inr || 0);
                        return (
                          <label key={idx} data-testid={`addon-checkbox-${idx}`}
                            style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px', borderRadius: '8px', cursor: 'pointer',
                              border: isSelected ? '2px solid #1e7a4d' : '1px solid #e5e7eb', background: isSelected ? '#f0fdf4' : 'white' }}>
                            <input type="checkbox" checked={isSelected} onChange={() => {
                              setSelectedAddons(prev => isSelected ? prev.filter(n => n !== addon.name) : [...prev, addon.name]);
                            }} style={{ width: '16px', height: '16px', accentColor: '#1e7a4d' }} />
                            <div style={{ flex: 1 }}>
                              <div style={{ fontFamily: 'Poppins', fontWeight: 600, fontSize: '14px', color: '#111827' }}>{addon.name}</div>
                              {addon.description && <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>{addon.description}</div>}
                            </div>
                            <div style={{ fontFamily: 'Poppins', fontWeight: 800, fontSize: '15px', color: '#0c3c60', whiteSpace: 'nowrap' }}>
                              {isInternational ? '$' : '\u20B9'}{adFee.toLocaleString('en-IN')}
                            </div>
                            {addon.pdf_url && (
                              <a href={`${process.env.REACT_APP_BACKEND_URL}${addon.pdf_url}`} target="_blank" rel="noreferrer"
                                style={{ fontSize: '11px', color: '#1e7a4d' }} onClick={e => e.stopPropagation()}>
                                <FileText size={14} />
                              </a>
                            )}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Become a Member */}
                {registrationCategory !== 'member' && info?.allow_membership_registration && (info?.membership_plans || []).length > 0 && (
                  <div style={{ background: '#f0fdf4', borderRadius: '10px', padding: '20px', marginTop: '16px', border: '1px solid #bbf7d0' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontFamily: 'Poppins', fontSize: '14px', fontWeight: 600, color: '#0c3c60', marginBottom: '12px' }}>
                      <input type="checkbox" checked={wantsMembership} onChange={e => { setWantsMembership(e.target.checked); if (!e.target.checked) setMembershipType(''); }}
                        data-testid="wants-membership" style={{ width: '16px', height: '16px' }} />
                      <UserPlus size={16} /> I also want to become an IDSEA Member
                    </label>
                    {wantsMembership && (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '10px' }}>
                        {info.membership_plans.filter(p => p.enabled !== false).map((plan, idx) => {
                          const planFee = isInternational ? (plan.fee_usd || 0) : (plan.fee_inr || 0);
                          return (
                            <button key={idx} onClick={() => setMembershipType(plan.key)} data-testid={`membership-${plan.key}`}
                              style={{
                                padding: '14px 12px', borderRadius: '8px', cursor: 'pointer', textAlign: 'center',
                                border: membershipType === plan.key ? '2px solid #1e7a4d' : '1px solid #e5e7eb',
                                background: membershipType === plan.key ? '#d1fae5' : 'white'
                              }}>
                              <div style={{ fontSize: '13px', fontWeight: 600, color: '#111827', fontFamily: 'Poppins' }}>{plan.label}</div>
                              <div style={{ fontSize: '15px', fontWeight: 800, color: '#1e7a4d', marginTop: '4px', fontFamily: 'Poppins' }}>
                                {isInternational ? '$' : '\u20B9'}{planFee.toLocaleString('en-IN')}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px' }}>
                  <button onClick={() => setStep(1)} className="btn-secondary"><ArrowLeft size={14} /> Back</button>
                  <button onClick={() => canProceedStep2 && setStep(accomEnabled ? 3 : 4)} disabled={!canProceedStep2}
                    className="btn-primary" data-testid="step2-next" style={{ opacity: !canProceedStep2 ? 0.5 : 1 }}>
                    Next <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            )}

            {/* ===== STEP 3: Accommodation ===== */}
            {step === 3 && (
              <div data-testid="step-3">
                <h3 style={{ fontFamily: 'Poppins', fontSize: '18px', fontWeight: 700, color: '#0c3c60', marginBottom: '24px' }}>Accommodation</h3>

                {isFreeAccom && (
                  <div style={{ background: '#d1fae5', borderRadius: '8px', padding: '12px', marginBottom: '16px', fontSize: '14px', color: '#065f46', fontWeight: 600 }}>
                    Free default accommodation available for your category!
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {/* Default Accommodation */}
                  <button onClick={() => { setAccomChoice('default'); setSelectedHotelIdx(-1); setSelectedRoomType(''); }}
                    data-testid="accom-default"
                    style={{ padding: '18px', borderRadius: '10px', cursor: 'pointer', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      border: accomChoice === 'default' ? '2px solid #1e7a4d' : '1px solid #e5e7eb',
                      background: accomChoice === 'default' ? '#f0fdf4' : 'white' }}>
                    <div>
                      <div style={{ fontFamily: 'Poppins', fontWeight: 600, fontSize: '14px', color: '#111827' }}>
                        {isFreeAccom ? 'Default Accommodation (Free)' : 'Default Accommodation'}
                      </div>
                      <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
                        {isFreeAccom ? 'Complimentary for your category' : 'Standard accommodation included with registration'}
                      </div>
                    </div>
                    <div style={{ fontFamily: 'Poppins', fontWeight: 800, fontSize: '16px', color: isFreeAccom ? '#1e7a4d' : '#0c3c60' }}>
                      {isFreeAccom ? 'FREE' : `\u20B9${defaultAccomFee.toLocaleString('en-IN')}`}
                    </div>
                  </button>

                  {/* Premium Hotels */}
                  {(info?.premium_hotels || []).length > 0 && (
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#0c3c60', fontFamily: 'Poppins', margin: '8px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Hotel size={14} /> Premium Hotel Options
                        <span style={{ fontSize: '11px', color: '#6b7280', fontWeight: 400 }}>(replaces default accommodation)</span>
                      </div>
                      {info.premium_hotels.map((hotel, idx) => {
                        const isHotelSelected = accomChoice === 'premium_hotel' && selectedHotelIdx === idx;
                        return (
                          <div key={idx} data-testid={`accom-hotel-${idx}`}
                            style={{ border: isHotelSelected ? '2px solid #0c3c60' : '1px solid #e5e7eb', borderRadius: '10px', padding: '16px', marginBottom: '10px',
                              background: isHotelSelected ? '#f0f9ff' : 'white', cursor: 'pointer' }}
                            onClick={() => { setAccomChoice('premium_hotel'); setSelectedHotelIdx(idx); setSelectedRoomType(''); }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Hotel size={16} style={{ color: '#0c3c60' }} />
                                <span style={{ fontFamily: 'Poppins', fontWeight: 600, fontSize: '14px', color: '#111827' }}>{hotel.name}</span>
                                {hotel.rating && <span style={{ fontSize: '11px', color: '#d4a017', fontWeight: 600 }}>{hotel.rating}</span>}
                              </div>
                              <span style={{ fontSize: '12px', color: '#6b7280' }}>+{hotel.tax_percent}% tax</span>
                            </div>
                            {hotel.location && <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>{hotel.location}</div>}
                            {/* Room type selection */}
                            {isHotelSelected && (hotel.room_types || []).length > 0 && (
                              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }} onClick={e => e.stopPropagation()}>
                                {hotel.room_types.map((rt, ri) => {
                                  const isRoom = selectedRoomType === rt.type;
                                  const roomP = isInternational ? (rt.price_usd || 0) : (rt.price || 0);
                                  const tax = Math.round(roomP * (hotel.tax_percent || 0) / 100);
                                  return (
                                    <button key={ri} onClick={() => setSelectedRoomType(rt.type)} data-testid={`room-${idx}-${ri}`}
                                      style={{
                                        padding: '10px 14px', borderRadius: '8px', cursor: 'pointer', textAlign: 'center',
                                        border: isRoom ? '2px solid #0c3c60' : '1px solid #e5e7eb',
                                        background: isRoom ? '#dbeafe' : '#f8fafc'
                                      }}>
                                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#111827' }}>{rt.type}</div>
                                      <div style={{ fontSize: '14px', fontWeight: 800, color: '#0c3c60', fontFamily: 'Poppins' }}>
                                        {currSym}{roomP.toLocaleString('en-IN')}
                                      </div>
                                      <div style={{ fontSize: '11px', color: '#6b7280' }}>+{currSym}{tax} tax</div>
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Self-Accommodation */}
                  {accom.self_option && (
                    <button onClick={() => { setAccomChoice('self'); setSelectedHotelIdx(-1); setSelectedRoomType(''); }}
                      data-testid="accom-self"
                      style={{ width: '100%', padding: '16px', borderRadius: '10px', cursor: 'pointer', textAlign: 'left',
                        border: accomChoice === 'self' ? '2px solid #6b7280' : '1px solid #e5e7eb',
                        background: accomChoice === 'self' ? '#f8fafc' : 'white' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontFamily: 'Poppins', fontWeight: 600, fontSize: '14px', color: '#111827' }}>Self-Accommodation</div>
                          <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>I will arrange my own accommodation (no fee)</div>
                        </div>
                        <div style={{ fontFamily: 'Poppins', fontWeight: 800, fontSize: '16px', color: '#6b7280' }}>{currSym}0</div>
                      </div>
                    </button>
                  )}
                </div>

                {/* Additional Persons */}
                {accomChoice && accomChoice !== 'self' && ((isInternational ? (info?.additional_person_fee_usd || 0) : (info?.additional_person_fee || 0)) > 0) && (
                  <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '20px', marginTop: '20px', border: '1px solid #e5e7eb' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <h4 style={{ fontFamily: 'Poppins', fontSize: '14px', fontWeight: 600, color: '#0c3c60', margin: 0 }}>
                        <Users size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} />
                        Additional Persons ({currSym}{isInternational ? info.additional_person_fee_usd : info.additional_person_fee} per person)
                      </h4>
                      <button onClick={addPerson} data-testid="add-person-btn"
                        style={{ background: '#f0fdf4', border: '1px dashed #1e7a4d', color: '#1e7a4d', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>
                        + Add Person
                      </button>
                    </div>
                    {additionalPersons.map((p, idx) => (
                      <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.5fr auto', gap: '8px', marginBottom: '8px' }}>
                        <input value={p.name} onChange={e => updatePerson(idx, 'name', e.target.value)} className="form-input" placeholder="Full Name" data-testid={`person-name-${idx}`} />
                        <input value={p.age} onChange={e => updatePerson(idx, 'age', e.target.value)} className="form-input" placeholder="Age" type="number" data-testid={`person-age-${idx}`} />
                        <input value={p.mobile} onChange={e => updatePerson(idx, 'mobile', e.target.value)} className="form-input" placeholder="Mobile No." data-testid={`person-mobile-${idx}`} />
                        <button onClick={() => removePerson(idx)} style={{ background: '#fee2e2', color: '#991b1b', border: 'none', padding: '8px', borderRadius: '6px', cursor: 'pointer' }}>
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                    {additionalPersons.filter(p => p.name).length > 0 && (
                      <div style={{ fontSize: '13px', color: '#1e7a4d', fontWeight: 600, marginTop: '8px' }}>
                        Additional fee: {currSym}{addPersonFee.toLocaleString('en-IN')} ({additionalPersons.filter(p => p.name).length} person{additionalPersons.filter(p => p.name).length > 1 ? 's' : ''})
                      </div>
                    )}
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px' }}>
                  <button onClick={() => setStep(2)} className="btn-secondary"><ArrowLeft size={14} /> Back</button>
                  <button onClick={() => canProceedStep3 && setStep(4)} disabled={!canProceedStep3}
                    className="btn-primary" data-testid="step3-next" style={{ opacity: !canProceedStep3 ? 0.5 : 1 }}>
                    Next <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            )}

            {/* ===== STEP 4: Review & Submit ===== */}
            {step === 4 && (
              <div data-testid="step-4">
                <h3 style={{ fontFamily: 'Poppins', fontSize: '18px', fontWeight: 700, color: '#0c3c60', marginBottom: '24px' }}>Review & Submit</h3>

                <div style={{ display: 'grid', gap: '16px' }}>
                  {/* Participant */}
                  <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '20px' }}>
                    <h4 style={{ fontFamily: 'Poppins', fontSize: '14px', fontWeight: 600, color: '#0c3c60', marginBottom: '12px' }}>Participant</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '14px' }}>
                      <div><span style={{ color: '#6b7280' }}>Name:</span> <strong>{form.name}</strong></div>
                      <div><span style={{ color: '#6b7280' }}>Email:</span> {form.email}</div>
                      <div><span style={{ color: '#6b7280' }}>Phone:</span> {form.phone}</div>
                      <div><span style={{ color: '#6b7280' }}>Category:</span> <strong style={{ textTransform: 'capitalize' }}>{REG_CATEGORIES.find(c => c.key === registrationCategory)?.label}</strong></div>
                      {registrationCategory === 'member' && memberData?.membership_id && (
                        <div><span style={{ color: '#6b7280' }}>Member ID:</span> <strong>{memberData.membership_id}</strong></div>
                      )}
                      {registrationCategory === 'non_member' && form.address_line1 && (
                        <div style={{ gridColumn: 'span 2' }}><span style={{ color: '#6b7280' }}>Address:</span> {form.address_line1}{form.address_line2 ? `, ${form.address_line2}` : ''}, {form.district ? `${form.district}, ` : ''}{form.address_state} - {form.pincode}</div>
                      )}
                      {registrationCategory === 'student' && form.college && (
                        <div style={{ gridColumn: 'span 2' }}><span style={{ color: '#6b7280' }}>College:</span> {form.college}{form.university ? ` (${form.university})` : ''}</div>
                      )}
                      {registrationCategory === 'international' && form.country && (
                        <div><span style={{ color: '#6b7280' }}>Country:</span> {form.country}</div>
                      )}
                    </div>
                  </div>

                  {/* Accommodation */}
                  {accomEnabled && accomChoice && (
                    <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '20px' }}>
                      <h4 style={{ fontFamily: 'Poppins', fontSize: '14px', fontWeight: 600, color: '#0c3c60', marginBottom: '8px' }}>Accommodation</h4>
                      <div style={{ fontSize: '14px' }}>
                        {accomChoice === 'self' && <span>Self-Accommodation (No fee)</span>}
                        {accomChoice === 'default' && <span>{isFreeAccom ? 'Default Accommodation (Free)' : `Default Accommodation \u2014 \u20B9${defaultAccomFee.toLocaleString('en-IN')}`}</span>}
                        {accomChoice === 'premium_hotel' && selectedHotel && (
                          <span>{selectedHotel.name} ({selectedRoomType}) \u2014 <strong>{'\u20B9'}{hotelRoomPrice.toLocaleString('en-IN')} + {'\u20B9'}{hotelTaxAmount} tax = {'\u20B9'}{hotelTotal.toLocaleString('en-IN')}</strong></span>
                        )}
                      </div>
                      {additionalPersons.filter(p => p.name).length > 0 && (
                        <div style={{ marginTop: '10px', fontSize: '13px' }}>
                          <span style={{ color: '#6b7280' }}>Additional Persons:</span>
                          {additionalPersons.filter(p => p.name).map((p, i) => (
                            <div key={i} style={{ marginTop: '2px' }}>{p.name} (Age: {p.age || '-'}, Mobile: {p.mobile || '-'})</div>
                          ))}
                          <div style={{ fontWeight: 600, marginTop: '4px', color: '#0c3c60' }}>Fee: {'\u20B9'}{addPersonFee.toLocaleString('en-IN')}</div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Add-ons */}
                  {selectedAddons.length > 0 && (
                    <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '20px' }}>
                      <h4 style={{ fontFamily: 'Poppins', fontSize: '14px', fontWeight: 600, color: '#0c3c60', marginBottom: '8px' }}>Add-ons</h4>
                      {selectedAddons.map(name => {
                        const a = (info?.registration_addons || []).find(x => x.name === name);
                        const fee = a ? (isInternational ? a.fee_usd : a.fee_inr) : 0;
                        return a ? <div key={name} style={{ fontSize: '14px', marginBottom: '4px' }}>{name} \u2014 <strong>{currSym}{fee}</strong></div> : null;
                      })}
                    </div>
                  )}

                  {/* Membership */}
                  {wantsMembership && membershipType && (
                    <div style={{ background: '#f0fdf4', borderRadius: '10px', padding: '20px', border: '1px solid #bbf7d0' }}>
                      <h4 style={{ fontFamily: 'Poppins', fontSize: '14px', fontWeight: 600, color: '#065f46', marginBottom: '8px' }}>IDSEA Membership</h4>
                      <div style={{ fontSize: '14px' }}>
                        <span style={{ textTransform: 'capitalize' }}>{(info?.membership_plans || []).find(p => p.key === membershipType)?.label || membershipType}</span>
                        {' \u2014 '}<strong>{currSym}{memFee}</strong>
                      </div>
                    </div>
                  )}

                  {/* Fee Breakdown */}
                  <div style={{ background: '#f0f9ff', borderRadius: '10px', padding: '20px', border: '1px solid #bae6fd' }}>
                    <h4 style={{ fontFamily: 'Poppins', fontSize: '14px', fontWeight: 600, color: '#0c3c60', marginBottom: '12px' }}>
                      <CreditCard size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} />Fee Breakdown
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Registration Fee {currentTier ? `(${currentTier.name})` : ''}</span>
                        <strong>{currSym}{regFee.toLocaleString('en-IN')}</strong>
                      </div>
                      {accomEnabled && accomChoice && accomChoice !== 'self' && (
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>Accommodation{accomChoice === 'premium_hotel' && selectedHotel ? ` (${selectedHotel.name} - ${selectedRoomType})` : accomChoice === 'default' && isFreeAccom ? ' (Free)' : ' (Default)'}</span>
                          <strong>{accomFee === 0 ? 'FREE' : `${currSym}${accomFee.toLocaleString('en-IN')}`}</strong>
                        </div>
                      )}
                      {accomEnabled && accomChoice === 'self' && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#6b7280' }}>
                          <span>Accommodation (Self)</span><strong>{currSym}0</strong>
                        </div>
                      )}
                      {addPersonFee > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>Additional Persons ({additionalPersons.filter(p => p.name).length})</span>
                          <strong>{currSym}{addPersonFee.toLocaleString('en-IN')}</strong>
                        </div>
                      )}
                      {selectedAddons.map(name => {
                        const a = (info?.registration_addons || []).find(x => x.name === name);
                        const fee = a ? (isInternational ? a.fee_usd : a.fee_inr) : 0;
                        return a ? (
                          <div key={name} style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Add-on: {name}</span><strong>{currSym}{fee}</strong>
                          </div>
                        ) : null;
                      })}
                      {wantsMembership && memFee > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>Membership ({(info?.membership_plans || []).find(p => p.key === membershipType)?.label || membershipType})</span>
                          <strong>{currSym}{memFee}</strong>
                        </div>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid #0c3c60', paddingTop: '10px', marginTop: '4px' }}>
                        <span style={{ fontFamily: 'Poppins', fontWeight: 700, fontSize: '16px', color: '#0c3c60' }}>Total Amount</span>
                        <span style={{ fontFamily: 'Poppins', fontWeight: 800, fontSize: '20px', color: '#0c3c60' }}>{currSym}{totalAmount.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                    {isInternational && <p style={{ fontSize: '12px', color: '#1e40af', marginTop: '10px' }}><Info size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />International delegates: Payment via Razorpay only.</p>}
                    {!isInternational && totalAmount > 0 && <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '10px' }}>You can choose your payment method in the next step.</p>}
                  </div>

                  {error && <p style={{ color: '#ef4444', fontSize: '13px' }}>{error}</p>}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px' }}>
                  <button onClick={() => setStep(accomEnabled ? 3 : 2)} className="btn-secondary"><ArrowLeft size={14} /> Back</button>
                  <button onClick={handleSubmit} disabled={submitting} className="btn-primary" data-testid="submit-registration"
                    style={{ padding: '12px 32px', fontSize: '15px' }}>
                    {submitting ? 'Processing...' : totalAmount > 0 ? 'Proceed to Payment' : 'Confirm Registration'}
                  </button>
                </div>
              </div>
            )}

            {/* ===== STEP 5: Payment ===== */}
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
                  membershipType={membershipType || memberData?.membership_type || ''}
                  currency={currency}
                  isInternational={isInternational}
                  onSuccess={handlePaymentSuccess}
                  onCancel={() => setSubmitted(true)}
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
