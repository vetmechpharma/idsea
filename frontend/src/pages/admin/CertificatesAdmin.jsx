import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Award, Plus, X, Search } from 'lucide-react';
import { API } from '../../contexts/AuthContext';

export default function CertificatesAdmin() {
  const [certificates, setCertificates] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState('');
  const [form, setForm] = useState({ member_id: '', certificate_type: 'membership', event_name: '', issue_date: '' });
  const [searchMember, setSearchMember] = useState('');

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  useEffect(() => {
    Promise.all([
      axios.get(`${API}/admin/certificates`),
      axios.get(`${API}/admin/members`, { params: { status: 'approved' } })
    ]).then(([certs, mems]) => {
      setCertificates(certs.data);
      setMembers(mems.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleGenerate = async () => {
    if (!form.member_id) return showToast('Select a member');
    try {
      const r = await axios.post(`${API}/admin/certificates/generate`, form);
      showToast(`Certificate generated! ID: ${r.data.id}`);
      setShowModal(false);
      setForm({ member_id: '', certificate_type: 'membership', event_name: '', issue_date: '' });
      const certs = await axios.get(`${API}/admin/certificates`);
      setCertificates(certs.data);
    } catch (e) { showToast('Error: ' + (e.response?.data?.detail || 'Failed')); }
  };

  const filteredMembers = members.filter(m =>
    m.name?.toLowerCase().includes(searchMember.toLowerCase()) ||
    m.email?.toLowerCase().includes(searchMember.toLowerCase())
  );

  return (
    <div>
      {toast && <div className="toast-success" data-testid="toast">{toast}</div>}
      <div className="page-header">
        <h1 className="page-title">Certificate Generator</h1>
        <button onClick={() => setShowModal(true)} className="btn-primary" data-testid="generate-cert-btn">
          <Award size={16} /> Generate Certificate
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '20px' }}>
        {[
          { label: 'Total Certificates', value: certificates.length, color: '#0c3c60', bg: '#dbeafe' },
          { label: 'Membership Certs', value: certificates.filter(c => c.certificate_type === 'membership').length, color: '#1e7a4d', bg: '#d1fae5' },
          { label: 'Event Certs', value: certificates.filter(c => c.certificate_type === 'event').length, color: '#7c3aed', bg: '#ede9fe' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className="stat-card">
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
              <Award size={18} style={{ color }} />
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color, fontFamily: 'Poppins', lineHeight: 1 }}>{value}</div>
            <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px', fontFamily: 'Inter' }}>{label}</div>
          </div>
        ))}
      </div>

      {loading ? <div className="loading-spinner">Loading...</div> : (
        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table" data-testid="certificates-table">
            <thead>
              <tr><th>Cert ID</th><th>Member</th><th>Type</th><th>Event</th><th>Issue Date</th><th>Issued By</th></tr>
            </thead>
            <tbody>
              {certificates.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>No certificates generated yet</td></tr>
              ) : certificates.map(c => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 700, color: '#0c3c60', fontFamily: 'Poppins', fontSize: '13px' }}>{c.id}</td>
                  <td>
                    <div style={{ fontWeight: 600, fontSize: '13px', color: '#111827' }}>{c.member_name}</div>
                    <div style={{ fontSize: '11px', color: '#9ca3af' }}>{c.membership_id}</div>
                  </td>
                  <td><span className={`badge ${c.certificate_type === 'membership' ? 'badge-approved' : 'badge-academic'}`}>{c.certificate_type}</span></td>
                  <td style={{ fontSize: '13px', color: '#6b7280' }}>{c.event_name || '-'}</td>
                  <td style={{ fontSize: '12px', color: '#9ca3af' }}>{c.issue_date}</td>
                  <td style={{ fontSize: '12px', color: '#9ca3af' }}>{c.issued_by}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontFamily: 'Poppins', fontSize: '17px', fontWeight: 700, color: '#0c3c60', margin: 0 }}>Generate Certificate</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}><X size={20} /></button>
            </div>
            <div className="form-group">
              <label className="form-label">Search & Select Member *</label>
              <div style={{ position: 'relative', marginBottom: '8px' }}>
                <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                <input value={searchMember} onChange={e => setSearchMember(e.target.value)} className="form-input" style={{ paddingLeft: '32px' }} placeholder="Search by name or email..." />
              </div>
              <select value={form.member_id} onChange={e => setForm({ ...form, member_id: e.target.value })} className="form-select" data-testid="cert-member-select" style={{ maxHeight: '200px' }}>
                <option value="">-- Select a member --</option>
                {filteredMembers.map(m => (
                  <option key={m.id} value={m.id}>{m.name} ({m.membership_id || m.email})</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">Certificate Type</label>
                <select value={form.certificate_type} onChange={e => setForm({ ...form, certificate_type: e.target.value })} className="form-select" data-testid="cert-type-select">
                  <option value="membership">Membership Certificate</option>
                  <option value="event">Event Participation</option>
                  <option value="appreciation">Appreciation</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Issue Date</label>
                <input type="date" value={form.issue_date} onChange={e => setForm({ ...form, issue_date: e.target.value })} className="form-input" />
              </div>
            </div>
            {form.certificate_type === 'event' && (
              <div className="form-group">
                <label className="form-label">Event Name</label>
                <input value={form.event_name} onChange={e => setForm({ ...form, event_name: e.target.value })} className="form-input" placeholder="Name of the event" />
              </div>
            )}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
              <button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
              <button onClick={handleGenerate} className="btn-primary" data-testid="confirm-generate-btn">Generate</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
