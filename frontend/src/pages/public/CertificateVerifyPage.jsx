import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import PublicNavbar from '../../components/public/PublicNavbar';
import PublicFooter from '../../components/public/PublicFooter';
import SEOHead from '../../components/SEOHead';
import { ShieldCheck, ShieldX, Search, Download, Loader2, Award, Calendar, User, Building2 } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function CertificateVerifyPage() {
  const [searchParams] = useSearchParams();
  const [certId, setCertId] = useState(searchParams.get('id') || '');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const id = searchParams.get('id');
    if (id) { setCertId(id); handleVerify(id); }
  }, []);

  const handleVerify = async (id) => {
    const cid = id || certId;
    if (!cid.trim()) return;
    setLoading(true); setResult(null);
    try {
      const r = await axios.get(`${API}/public/certificates/verify/${cid.trim()}`);
      setResult(r.data);
    } catch { setResult({ verified: false, message: 'Certificate not found or server error' }); }
    setLoading(false);
  };

  const handleDownload = async () => {
    if (!result?.cert_id) return;
    setDownloading(true);
    try {
      const r = await axios.get(`${API}/public/certificates/download/${result.cert_id}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(r.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `certificate_${result.cert_id}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch { alert('Download failed'); }
    setDownloading(false);
  };

  const handleSubmit = (e) => { e.preventDefault(); handleVerify(); };

  return (
    <div style={{ background: '#fafbfc', minHeight: '100vh' }}>
      <SEOHead page="home" fallback={{ title: 'Verify Certificate | IDSEA', description: 'Verify and download IDSEA membership and event certificates.' }} />
      <PublicNavbar />

      <div style={{ position: 'relative', background: '#0c3c60', padding: '200px 24px 60px', textAlign: 'center', color: 'white', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, right: 0, width: '300px', height: '300px', borderRadius: '50%', background: 'rgba(30,122,77,0.15)', filter: 'blur(60px)', transform: 'translate(30%, -30%)' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(30,122,77,0.3)', padding: '6px 18px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, fontFamily: 'Poppins', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '16px', border: '1px solid rgba(30,122,77,0.4)' }}>
            <ShieldCheck size={14} /> Certificate Verification
          </div>
          <h1 style={{ fontFamily: 'Poppins, sans-serif', fontSize: 'clamp(24px, 4vw, 40px)', fontWeight: 800, marginBottom: '12px' }}>Verify & Download Certificate</h1>
          <p style={{ fontSize: '15px', opacity: 0.8, fontFamily: 'Inter', maxWidth: '500px', margin: '0 auto' }}>Enter your certificate ID to verify authenticity and download your certificate</p>
        </div>
      </div>

      <div style={{ maxWidth: '640px', margin: '-40px auto 0', padding: '0 24px 60px', position: 'relative', zIndex: 2 }}>
        {/* Search Form */}
        <div style={{ background: 'white', borderRadius: '20px', padding: '32px', boxShadow: '0 8px 32px rgba(0,0,0,0.1)', border: '1px solid #e8edf2', marginBottom: '24px' }}>
          <form onSubmit={handleSubmit}>
            <label style={{ fontSize: '14px', fontWeight: 700, color: '#0c3c60', fontFamily: 'Poppins', marginBottom: '10px', display: 'block' }}>Certificate ID</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                value={certId}
                onChange={e => setCertId(e.target.value.toUpperCase())}
                style={{ flex: 1, padding: '14px 16px', border: '2px solid #e5e7eb', borderRadius: '12px', fontSize: '16px', fontFamily: 'monospace', fontWeight: 600, letterSpacing: '1px', outline: 'none', transition: 'border-color 0.2s' }}
                placeholder="IDSEA-MEM-XXXXXXXX"
                onFocus={e => e.target.style.borderColor = '#3b82f6'}
                onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                data-testid="cert-id-input"
              />
              <button type="submit" disabled={loading || !certId.trim()} style={{
                display: 'flex', alignItems: 'center', gap: '8px', padding: '14px 24px', borderRadius: '12px', border: 'none', cursor: 'pointer',
                background: '#0c3c60', color: 'white', fontSize: '14px', fontWeight: 700, fontFamily: 'Poppins',
                opacity: loading || !certId.trim() ? 0.6 : 1, transition: 'opacity 0.2s'
              }} data-testid="verify-btn">
                {loading ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
                Verify
              </button>
            </div>
          </form>
        </div>

        {/* Result */}
        {result && (
          <div style={{ background: 'white', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', border: '1px solid #e8edf2' }} data-testid="verify-result">
            {/* Status Header */}
            <div style={{
              padding: '28px 32px', textAlign: 'center',
              background: result.verified ? 'linear-gradient(135deg, #059669, #1e7a4d)' : 'linear-gradient(135deg, #dc2626, #991b1b)',
              color: 'white'
            }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                {result.verified ? <ShieldCheck size={32} /> : <ShieldX size={32} />}
              </div>
              <h2 style={{ fontFamily: 'Poppins', fontSize: '22px', fontWeight: 800, marginBottom: '6px' }}>
                {result.verified ? 'Certificate Verified' : 'Not Verified'}
              </h2>
              <p style={{ fontSize: '14px', opacity: 0.85, fontFamily: 'Inter' }}>
                {result.verified ? 'This certificate is authentic and issued by IDSEA' : (result.message || 'Certificate not found in our records')}
              </p>
            </div>

            {result.verified && (
              <div style={{ padding: '28px 32px' }}>
                <div style={{ display: 'grid', gap: '16px', marginBottom: '24px' }}>
                  <InfoRow icon={Award} label="Certificate ID" value={result.cert_id} highlight />
                  <InfoRow icon={User} label="Recipient" value={result.recipient_name} />
                  <InfoRow icon={Building2} label="Type" value={result.type === 'membership' ? `Membership Certificate` : `Event Certificate`} />
                  {result.membership_type && <InfoRow icon={Award} label="Membership" value={result.membership_type} />}
                  {result.membership_id && <InfoRow icon={Award} label="Member ID" value={result.membership_id} />}
                  {result.event_title && <InfoRow icon={Calendar} label="Event" value={result.event_title} />}
                  <InfoRow icon={Calendar} label="Issued Date" value={new Date(result.issued_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })} />
                </div>

                <button onClick={handleDownload} disabled={downloading} style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                  padding: '14px', borderRadius: '12px', border: 'none', cursor: 'pointer',
                  background: 'linear-gradient(135deg, #0c3c60, #164e7e)', color: 'white',
                  fontSize: '15px', fontWeight: 700, fontFamily: 'Poppins',
                  boxShadow: '0 4px 16px rgba(12,60,96,0.3)', transition: 'transform 0.2s'
                }} data-testid="download-cert-btn">
                  {downloading ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                  {downloading ? 'Generating PDF...' : 'Download Certificate PDF'}
                </button>
                <p style={{ textAlign: 'center', fontSize: '11px', color: '#9ca3af', marginTop: '10px' }}>
                  Certificate is generated on-the-fly and not stored. You can download it anytime.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <PublicFooter />
    </div>
  );
}

function InfoRow({ icon: Icon, label, value, highlight }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', background: highlight ? '#f0fdf4' : '#fafbfc', borderRadius: '10px', border: `1px solid ${highlight ? '#bbf7d0' : '#e8edf2'}` }}>
      <Icon size={16} style={{ color: highlight ? '#059669' : '#6b7280', flexShrink: 0 }} />
      <div>
        <div style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', fontFamily: 'Poppins' }}>{label}</div>
        <div style={{ fontSize: '14px', color: '#111827', fontWeight: highlight ? 700 : 500, fontFamily: highlight ? 'monospace' : 'Inter', letterSpacing: highlight ? '0.5px' : 'normal' }}>{value}</div>
      </div>
    </div>
  );
}
