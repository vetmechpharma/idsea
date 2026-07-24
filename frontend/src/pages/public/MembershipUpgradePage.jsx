import React, { useState } from 'react';
import axios from 'axios';
import PublicNavbar from '../../components/public/PublicNavbar';
import PublicFooter from '../../components/public/PublicFooter';
import { Search, ArrowUpCircle, AlertTriangle, CheckCircle, Calendar, Award, User } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function MembershipUpgradePage() {
  const [membershipId, setMembershipId] = useState('');
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [utr, setUtr] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const lookup = async (e) => {
    e.preventDefault();
    if (!membershipId.trim()) return;
    setLoading(true); setError(''); setMember(null);
    try {
      const r = await axios.post(`${API}/public/membership-lookup`, { membership_id: membershipId.trim() });
      setMember(r.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Membership not found');
    }
    setLoading(false);
  };

  const submitUpgrade = async () => {
    if (!utr.trim()) { setError('Please enter transaction reference number'); return; }
    setSubmitting(true); setError('');
    try {
      await axios.post(`${API}/public/membership-upgrade`, { member_id: member.id, utr_number: utr.trim() });
      setSubmitted(true);
    } catch (err) { setError(err.response?.data?.detail || 'Submission failed'); }
    setSubmitting(false);
  };

  const formatDate = (iso) => {
    if (!iso) return '-';
    try { return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); }
    catch { return iso; }
  };

  const daysLeft = member?.validity_end ? Math.ceil((new Date(member.validity_end) - new Date()) / 86400000) : null;
  const isExpired = daysLeft !== null && daysLeft <= 0;
  const isNearExpiry = daysLeft !== null && daysLeft > 0 && daysLeft <= 90;

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh' }}>
      <PublicNavbar />
      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '160px 24px 80px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#eff6ff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
            <ArrowUpCircle size={28} style={{ color: '#2563eb' }} />
          </div>
          <h1 style={{ fontFamily: 'Poppins, sans-serif', fontSize: '28px', fontWeight: 800, color: '#0c3c60', margin: '0 0 8px' }}>
            Membership Upgrade
          </h1>
          <p style={{ fontSize: '14px', color: '#6b7280', fontFamily: 'Inter, sans-serif' }}>
            Student members can upgrade to Academic (Lifetime) membership
          </p>
        </div>

        {submitted ? (
          <div style={{ background: 'white', borderRadius: '16px', padding: '40px 28px', textAlign: 'center', boxShadow: '0 4px 16px rgba(0,0,0,0.06)', border: '1px solid #d1fae5' }}>
            <CheckCircle size={48} style={{ color: '#059669', margin: '0 auto 16px', display: 'block' }} />
            <h2 style={{ fontFamily: 'Poppins', fontSize: '20px', fontWeight: 700, color: '#065f46', margin: '0 0 12px' }}>Upgrade Request Submitted</h2>
            <p style={{ fontSize: '14px', color: '#4b5563', lineHeight: 1.6 }}>
              Your upgrade request has been submitted successfully. Our admin team will review your payment and process the upgrade. You will receive a new Academic membership ID via email.
            </p>
          </div>
        ) : (
          <>
            {/* Lookup Form */}
            <div style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 16px rgba(0,0,0,0.06)', marginBottom: '20px' }}>
              <form onSubmit={lookup} style={{ display: 'flex', gap: '10px' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                  <input value={membershipId} onChange={e => setMembershipId(e.target.value)} placeholder="Enter your Membership ID (e.g., STUD/IDSEA/2026/000001)"
                    style={{ width: '100%', padding: '12px 14px 12px 40px', border: '1px solid #e5e7eb', borderRadius: '10px', fontSize: '14px', fontFamily: 'Inter', outline: 'none' }}
                    data-testid="upgrade-membership-id" />
                </div>
                <button type="submit" disabled={loading} className="btn-primary" data-testid="upgrade-lookup-btn" style={{ whiteSpace: 'nowrap' }}>
                  {loading ? 'Looking up...' : 'Look Up'}
                </button>
              </form>
            </div>

            {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '12px 16px', marginBottom: '16px', color: '#dc2626', fontSize: '13px', fontWeight: 600 }}>{error}</div>}

            {/* Member Info */}
            {member && (
              <div style={{ background: 'white', borderRadius: '16px', padding: '28px', boxShadow: '0 4px 16px rgba(0,0,0,0.06)', border: '1px solid #e5e7eb' }}>
                <div style={{ display: 'flex', gap: '14px', alignItems: 'center', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid #f1f5f9' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <User size={22} style={{ color: '#2563eb' }} />
                  </div>
                  <div>
                    <div style={{ fontFamily: 'Poppins', fontWeight: 700, fontSize: '16px', color: '#111827' }}>{member.name}</div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>{member.email}</div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                  <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '12px' }}>
                    <div style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 600, marginBottom: '4px' }}>MEMBERSHIP ID</div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#0c3c60', fontFamily: 'monospace' }}>{member.membership_id}</div>
                  </div>
                  <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '12px' }}>
                    <div style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 600, marginBottom: '4px' }}>TYPE</div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#7c3aed' }}>{member.membership_type}</div>
                  </div>
                  <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '12px' }}>
                    <div style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 600, marginBottom: '4px' }}>STATUS</div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: isExpired ? '#dc2626' : '#059669', textTransform: 'capitalize' }}>{member.status}</div>
                  </div>
                  {member.validity_end && (
                    <div style={{ background: isExpired ? '#fef2f2' : isNearExpiry ? '#fffbeb' : '#f0fdf4', borderRadius: '10px', padding: '12px' }}>
                      <div style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 600, marginBottom: '4px' }}>VALID TILL</div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: isExpired ? '#dc2626' : isNearExpiry ? '#d97706' : '#059669' }}>
                        {formatDate(member.validity_end)} {daysLeft > 0 ? `(${daysLeft} days left)` : '(Expired)'}
                      </div>
                    </div>
                  )}
                </div>

                {member.can_upgrade ? (
                  <div style={{ background: '#eff6ff', borderRadius: '12px', padding: '20px', border: '1px solid #bfdbfe' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                      <ArrowUpCircle size={18} style={{ color: '#2563eb' }} />
                      <span style={{ fontFamily: 'Poppins', fontWeight: 700, fontSize: '15px', color: '#1e40af' }}>Upgrade to Academic (Lifetime)</span>
                    </div>
                    <p style={{ fontSize: '13px', color: '#4b5563', lineHeight: 1.6, marginBottom: '14px' }}>
                      Pay the Academic membership fee and submit your transaction reference below. After admin verification, you'll receive a new Academic membership ID (lifetime, no expiry).
                    </p>
                    <div className="form-group" style={{ margin: '0 0 12px' }}>
                      <label className="form-label">Transaction Reference / UTR Number *</label>
                      <input value={utr} onChange={e => setUtr(e.target.value)} className="form-input" placeholder="Enter UTR or transaction reference" data-testid="upgrade-utr" />
                    </div>
                    <button onClick={submitUpgrade} disabled={submitting} className="btn-primary" style={{ width: '100%' }} data-testid="submit-upgrade-btn">
                      <ArrowUpCircle size={14} /> {submitting ? 'Submitting...' : 'Submit Upgrade Request'}
                    </button>
                  </div>
                ) : (
                  <div style={{ background: '#f1f5f9', borderRadius: '10px', padding: '16px', textAlign: 'center' }}>
                    <AlertTriangle size={20} style={{ color: '#d97706', margin: '0 auto 8px', display: 'block' }} />
                    <p style={{ fontSize: '13px', color: '#6b7280' }}>
                      {!member.is_student ? 'This membership is not a student membership. Only student memberships can be upgraded.' : 'This membership is not eligible for upgrade at this time.'}
                    </p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
      <PublicFooter />
    </div>
  );
}
