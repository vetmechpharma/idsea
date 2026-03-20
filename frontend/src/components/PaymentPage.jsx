import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { CreditCard, QrCode, Building2, Copy, CheckCircle, Loader2, AlertCircle } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function PaymentPage({ amount, name, email, phone, purpose, memberId, eventRegistrationId, membershipType, onSuccess, onCancel, currency = 'INR', isInternational = false }) {
  const [paySettings, setPaySettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('');
  const [qrData, setQrData] = useState(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [utrNumber, setUtrNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [payMethod, setPayMethod] = useState('');
  const [copied, setCopied] = useState('');
  const [error, setError] = useState('');
  const [rzpLoading, setRzpLoading] = useState(false);

  const currSym = currency === 'USD' ? '$' : '\u20B9';

  useEffect(() => {
    axios.get(`${API}/public/payment-settings`).then(r => {
      setPaySettings(r.data);
      if (isInternational) {
        // International: Razorpay only
        setTab('razorpay');
      } else {
        // Domestic: UPI QR as primary
        if (r.data.upi_ids?.length) setTab('upi');
        else if (r.data.razorpay_enabled) setTab('razorpay');
        else if (r.data.bank_accounts?.length) setTab('bank');
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [isInternational]);

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) { resolve(true); return; }
      const s = document.createElement('script');
      s.src = 'https://checkout.razorpay.com/v1/checkout.js';
      s.onload = () => resolve(true);
      s.onerror = () => resolve(false);
      document.body.appendChild(s);
    });
  };

  const handleRazorpay = async () => {
    setRzpLoading(true); setError('');
    try {
      const res = await axios.post(`${API}/payments/create-order`, {
        amount, currency: currency || 'INR', member_id: memberId || '', member_name: name, member_email: email,
        membership_type: membershipType || '', event_registration_id: eventRegistrationId || '', purpose: purpose || 'membership'
      });
      const { payment_id, razorpay_order_id, key_id } = res.data;
      if (!razorpay_order_id) { setError('Razorpay not configured. Please contact IDSEA for payment assistance.'); setRzpLoading(false); return; }

      const loaded = await loadRazorpay();
      if (!loaded) { setError('Failed to load Razorpay. Please try again.'); setRzpLoading(false); return; }

      const options = {
        key: key_id, amount: amount * 100, currency: currency || 'INR', name: 'IDSEA',
        description: purpose === 'event_registration' ? 'Event Registration' : 'Membership Payment',
        order_id: razorpay_order_id,
        prefill: { name, email, contact: phone },
        handler: async function (response) {
          try {
            await axios.post(`${API}/payments/verify`, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              payment_id
            });
            onSuccess?.('razorpay');
          } catch { setError('Payment verification failed'); }
        },
        modal: { ondismiss: () => setRzpLoading(false) },
        theme: { color: '#0c3c60' }
      };
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (e) { setError(e.response?.data?.detail || 'Failed to create order'); }
    setRzpLoading(false);
  };

  const fetchQR = async () => {
    setQrLoading(true);
    try {
      const r = await axios.get(`${API}/payments/upi-qr?amount=${amount}&name=IDSEA`);
      setQrData(r.data);
    } catch (e) { setError(e.response?.data?.detail || 'QR generation failed'); }
    setQrLoading(false);
  };

  useEffect(() => { if (tab === 'upi' && !qrData) fetchQR(); }, [tab]);

  const submitUTR = async () => {
    if (!utrNumber.trim()) { setError('Please enter UTR/Reference number'); return; }
    setSubmitting(true); setError('');
    try {
      await axios.post(`${API}/payments/submit-utr`, {
        utr_number: utrNumber.trim(), payment_method: payMethod || tab, amount,
        name, email, member_id: memberId || '', membership_type: membershipType || '',
        event_registration_id: eventRegistrationId || '', purpose: purpose || 'membership'
      });
      onSuccess?.(payMethod || tab);
    } catch (e) { setError(e.response?.data?.detail || 'Submission failed'); }
    setSubmitting(false);
  };

  const copyText = (text, label) => { navigator.clipboard.writeText(text); setCopied(label); setTimeout(() => setCopied(''), 2000); };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}><Loader2 size={24} className="animate-spin" style={{ color: '#0c3c60' }} /></div>;

  // Build available tabs based on international status
  const tabs = [];
  if (isInternational) {
    // International: Razorpay ONLY
    if (paySettings?.razorpay_enabled) tabs.push({ key: 'razorpay', label: 'Pay via Razorpay', icon: CreditCard });
  } else {
    // Domestic: UPI first (primary), then Razorpay, then Bank
    if (paySettings?.upi_ids?.length) tabs.push({ key: 'upi', label: 'UPI QR', icon: QrCode });
    if (paySettings?.razorpay_enabled) tabs.push({ key: 'razorpay', label: 'Pay Online', icon: CreditCard });
    if (paySettings?.bank_accounts?.length) tabs.push({ key: 'bank', label: 'Bank Transfer', icon: Building2 });
  }

  if (tabs.length === 0) return (
    <div style={{ textAlign: 'center', padding: '40px' }}>
      <AlertCircle size={32} style={{ color: '#d97706', margin: '0 auto 12px' }} />
      <p style={{ color: '#6b7280', fontSize: '14px' }}>
        {isInternational
          ? 'Razorpay is not configured. Please contact IDSEA for payment instructions.'
          : 'No payment methods configured. Please contact IDSEA for payment instructions.'}
      </p>
      {onCancel && <button onClick={onCancel} className="btn-secondary" style={{ marginTop: '12px' }}>Go Back</button>}
    </div>
  );

  return (
    <div data-testid="payment-page">
      {/* Amount Header */}
      <div style={{ textAlign: 'center', padding: '20px 0 24px', borderBottom: '1px solid #e5e7eb', marginBottom: '24px' }}>
        <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>Amount Payable</div>
        <div style={{ fontSize: '32px', fontWeight: 800, color: '#0c3c60', fontFamily: 'Poppins' }} data-testid="payment-amount">
          {currSym}{amount?.toLocaleString('en-IN')}
        </div>
        {isInternational && (
          <div style={{ fontSize: '12px', color: '#1e40af', background: '#dbeafe', display: 'inline-block', padding: '4px 12px', borderRadius: '6px', marginTop: '6px', fontWeight: 600 }}>
            Payment in {currency} via Razorpay
          </div>
        )}
        <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>{name} | {purpose === 'event_registration' ? 'Event Registration' : 'Membership'}</div>
      </div>

      {/* Tabs - Only show if more than 1 option */}
      {tabs.length > 1 && (
        <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', background: '#f1f5f9', padding: '4px', borderRadius: '10px' }}>
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} data-testid={`pay-tab-${t.key}`}
              style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontFamily: 'Poppins', fontWeight: 600, fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                background: tab === t.key ? 'white' : 'transparent', color: tab === t.key ? '#0c3c60' : '#6b7280',
                boxShadow: tab === t.key ? '0 1px 4px rgba(0,0,0,0.08)' : 'none', transition: 'all 0.2s' }}>
              <t.icon size={14} /> {t.label}
            </button>
          ))}
        </div>
      )}

      {error && <div style={{ background: '#fef2f2', color: '#991b1b', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px' }}>{error}</div>}

      {/* Razorpay Tab */}
      {tab === 'razorpay' && (
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '20px' }}>
            {isInternational
              ? 'International payment via Razorpay (Credit/Debit Card)'
              : 'Pay securely via Credit/Debit Card, Net Banking, or UPI through Razorpay'}
          </p>
          <button onClick={handleRazorpay} disabled={rzpLoading} className="btn-primary" data-testid="pay-razorpay-btn"
            style={{ padding: '14px 40px', fontSize: '15px', fontWeight: 700, width: '100%', maxWidth: '300px' }}>
            {rzpLoading ? 'Processing...' : `Pay ${currSym}${amount?.toLocaleString('en-IN')}`}
          </button>
          <p style={{ color: '#9ca3af', fontSize: '11px', marginTop: '12px' }}>Powered by Razorpay. Payment auto-verified.</p>
        </div>
      )}

      {/* UPI Tab */}
      {tab === 'upi' && (
        <div>
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            {qrLoading ? <Loader2 size={24} className="animate-spin" style={{ color: '#0c3c60' }} /> : qrData?.qr_image ? (
              <>
                <img src={qrData.qr_image} alt="UPI QR" style={{ width: '200px', height: '200px', margin: '0 auto', display: 'block', borderRadius: '12px', border: '2px solid #e5e7eb' }} data-testid="upi-qr-image" />
                <p style={{ fontSize: '13px', color: '#0c3c60', fontWeight: 600, marginTop: '12px' }}>Scan QR to pay {'\u20B9'}{amount}</p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '8px' }}>
                  <span style={{ fontSize: '13px', color: '#6b7280' }}>UPI ID: <strong>{qrData.upi_id}</strong></span>
                  <button onClick={() => copyText(qrData.upi_id, 'upi')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#0c3c60' }}>
                    {copied === 'upi' ? <CheckCircle size={14} style={{ color: '#1e7a4d' }} /> : <Copy size={14} />}
                  </button>
                </div>
              </>
            ) : <p style={{ color: '#9ca3af' }}>UPI QR not available</p>}
          </div>

          <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '20px' }}>
            <label className="form-label" style={{ fontWeight: 600 }}>After payment, enter UTR/Reference Number *</label>
            <input value={utrNumber} onChange={e => setUtrNumber(e.target.value)} className="form-input" placeholder="Enter UTR or UPI Reference Number" data-testid="utr-input" style={{ marginBottom: '12px' }} />
            <button onClick={() => { setPayMethod('upi'); submitUTR(); }} disabled={submitting || !utrNumber.trim()} className="btn-primary" data-testid="submit-utr-btn"
              style={{ width: '100%', padding: '12px', fontSize: '14px', opacity: !utrNumber.trim() ? 0.5 : 1 }}>
              {submitting ? 'Submitting...' : 'Submit Payment Proof'}
            </button>
          </div>
        </div>
      )}

      {/* Bank Transfer Tab */}
      {tab === 'bank' && (
        <div>
          {paySettings.bank_accounts.map((bank, i) => (
            <div key={i} style={{ background: '#f8fafc', borderRadius: '10px', padding: '16px', marginBottom: '12px', border: '1px solid #e5e7eb' }} data-testid={`bank-detail-${i}`}>
              <div style={{ fontFamily: 'Poppins', fontWeight: 700, fontSize: '14px', color: '#0c3c60', marginBottom: '10px' }}>{bank.bank_name}</div>
              {[
                ['Account Holder', bank.holder_name],
                ['Account No', bank.account_no],
                ['IFSC', bank.ifsc],
                ['Branch', bank.branch],
              ].map(([label, val]) => val && (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', fontSize: '13px', borderBottom: '1px solid #f1f5f9' }}>
                  <span style={{ color: '#6b7280' }}>{label}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <strong style={{ color: '#111827' }}>{val}</strong>
                    <button onClick={() => copyText(val, `${label}-${i}`)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: '#0c3c60' }}>
                      {copied === `${label}-${i}` ? <CheckCircle size={12} style={{ color: '#1e7a4d' }} /> : <Copy size={12} />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ))}

          <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '20px', marginTop: '8px' }}>
            <label className="form-label" style={{ fontWeight: 600 }}>After bank transfer, enter UTR Number *</label>
            <input value={utrNumber} onChange={e => setUtrNumber(e.target.value)} className="form-input" placeholder="Enter UTR/Transaction Reference Number" data-testid="bank-utr-input" style={{ marginBottom: '12px' }} />
            <button onClick={() => { setPayMethod('bank_transfer'); submitUTR(); }} disabled={submitting || !utrNumber.trim()} className="btn-primary" data-testid="submit-bank-utr-btn"
              style={{ width: '100%', padding: '12px', fontSize: '14px', opacity: !utrNumber.trim() ? 0.5 : 1 }}>
              {submitting ? 'Submitting...' : 'Submit Payment Proof'}
            </button>
          </div>
        </div>
      )}

      {onCancel && (
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <button onClick={onCancel} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: '13px', textDecoration: 'underline' }}>Cancel / Pay Later</button>
        </div>
      )}
    </div>
  );
}
