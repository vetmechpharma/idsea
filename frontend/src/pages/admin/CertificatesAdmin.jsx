import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API } from '../../contexts/AuthContext';
import {
  Award, Plus, Copy, Trash2, Eye, Edit3, FileText, Users, Calendar,
  Download, Search, LayoutTemplate, Loader2
} from 'lucide-react';

export default function CertificatesAdmin() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');
  const [delModal, setDelModal] = useState(null);
  const [genModal, setGenModal] = useState(null);
  const [members, setMembers] = useState([]);
  const [events, setEvents] = useState([]);
  const [genMemberId, setGenMemberId] = useState('');
  const [genEventId, setGenEventId] = useState('');
  const [genLoading, setGenLoading] = useState(false);
  const [searchMember, setSearchMember] = useState('');

  const showToast = (m) => { setToast(m); setTimeout(() => setToast(''), 3000); };

  const load = async () => {
    try {
      const [t, m, e] = await Promise.all([
        axios.get(`${API}/admin/certificate-templates`),
        axios.get(`${API}/admin/members`, { params: { status: 'approved' } }),
        axios.get(`${API}/admin/events`),
      ]);
      setTemplates(t.data || []);
      setMembers(m.data || []);
      setEvents(e.data || []);
    } catch { }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleClone = async (id) => {
    try {
      await axios.post(`${API}/admin/certificate-templates/${id}/clone`);
      showToast('Template cloned!');
      load();
    } catch { showToast('Clone failed'); }
  };

  const handleDelete = async () => {
    if (!delModal) return;
    try {
      await axios.delete(`${API}/admin/certificate-templates/${delModal}`);
      showToast('Template deleted');
      setDelModal(null);
      load();
    } catch { showToast('Delete failed'); }
  };

  const handlePreview = async (id) => {
    try {
      const r = await axios.post(`${API}/admin/certificate-templates/${id}/preview`, {}, { responseType: 'blob' });
      const url = URL.createObjectURL(r.data);
      window.open(url, '_blank');
    } catch { showToast('Preview failed'); }
  };

  const handleGenMember = async () => {
    if (!genMemberId || !genModal) return;
    setGenLoading(true);
    try {
      const r = await axios.post(`${API}/admin/certificate-templates/${genModal}/generate-member/${genMemberId}`, {}, { responseType: 'blob' });
      const url = URL.createObjectURL(r.data);
      const a = document.createElement('a'); a.href = url; a.download = 'certificate.pdf'; a.click();
      URL.revokeObjectURL(url);
      showToast('Certificate downloaded!');
    } catch { showToast('Generation failed'); }
    setGenLoading(false);
  };

  const handleGenEvent = async () => {
    if (!genEventId || !genModal) return;
    setGenLoading(true);
    try {
      const r = await axios.post(`${API}/admin/certificate-templates/${genModal}/generate-event/${genEventId}`, {}, { responseType: 'blob' });
      const url = URL.createObjectURL(r.data);
      const a = document.createElement('a'); a.href = url; a.download = 'certificates.zip'; a.click();
      URL.revokeObjectURL(url);
      showToast('Certificates ZIP downloaded!');
    } catch { showToast('Bulk generation failed'); }
    setGenLoading(false);
  };

  const filteredMembers = members.filter(m =>
    m.name?.toLowerCase().includes(searchMember.toLowerCase()) ||
    m.email?.toLowerCase().includes(searchMember.toLowerCase()) ||
    m.membership_id?.toLowerCase().includes(searchMember.toLowerCase())
  );

  const typeColors = { membership: { bg: '#d1fae5', color: '#065f46' }, event: { bg: '#dbeafe', color: '#1e40af' }, custom: { bg: '#fef3c7', color: '#92400e' } };

  return (
    <div>
      {toast && <div className="toast-success" data-testid="toast">{toast}</div>}

      <div className="page-header">
        <h1 className="page-title" data-testid="page-title">Certificate Designer</h1>
        <button onClick={() => navigate('/admin/certificates/design/new')} className="btn-primary" data-testid="new-template-btn">
          <Plus size={16} /> New Template
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: 'Total Templates', value: templates.length, color: '#0c3c60', bg: '#dbeafe', icon: LayoutTemplate },
          { label: 'Membership', value: templates.filter(t => t.type === 'membership').length, color: '#065f46', bg: '#d1fae5', icon: Award },
          { label: 'Event/Conference', value: templates.filter(t => t.type === 'event').length, color: '#1e40af', bg: '#dbeafe', icon: Calendar },
          { label: 'Custom', value: templates.filter(t => t.type === 'custom').length, color: '#92400e', bg: '#fef3c7', icon: FileText },
        ].map(({ label, value, color, bg, icon: Icon }) => (
          <div key={label} className="stat-card">
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px' }}>
              <Icon size={16} style={{ color }} />
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color, fontFamily: 'Poppins', lineHeight: 1 }}>{value}</div>
            <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px', fontFamily: 'Inter' }}>{label}</div>
          </div>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#9ca3af' }}><Loader2 size={28} className="animate-spin" style={{ margin: '0 auto 12px' }} /> Loading templates...</div>
      ) : templates.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 24px', background: 'white', borderRadius: '16px', border: '1px solid #e5e7eb' }}>
          <LayoutTemplate size={48} style={{ color: '#d1d5db', margin: '0 auto 16px' }} />
          <h3 style={{ fontFamily: 'Poppins', fontSize: '18px', fontWeight: 700, color: '#374151', marginBottom: '8px' }}>No Certificate Templates</h3>
          <p style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '20px' }}>Create your first certificate template using the visual designer</p>
          <button onClick={() => navigate('/admin/certificates/design/new')} className="btn-primary" data-testid="create-first-template-btn">
            <Plus size={16} /> Create Template
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }} data-testid="templates-grid">
          {templates.map(t => {
            const tc = typeColors[t.type] || typeColors.custom;
            return (
              <div key={t.id} style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden', transition: 'box-shadow 0.2s', cursor: 'default' }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)'}
                onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
                data-testid={`template-card-${t.id}`}>
                {/* Preview area */}
                <div style={{ height: '140px', background: t.background_color || '#f9fafb', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid #e5e7eb',
                  backgroundImage: t.background_image_url ? `url(${t.background_image_url.startsWith('http') ? t.background_image_url : process.env.REACT_APP_BACKEND_URL + t.background_image_url})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center' }}>
                  {!t.background_image_url && (
                    <div style={{ textAlign: 'center', color: '#d1d5db' }}>
                      <Award size={32} />
                      <div style={{ fontSize: '10px', marginTop: '4px' }}>{t.orientation === 'portrait' ? 'Portrait' : 'Landscape'}</div>
                    </div>
                  )}
                  <span style={{ position: 'absolute', top: 8, right: 8, background: tc.bg, color: tc.color, padding: '2px 10px', borderRadius: '12px', fontSize: '10px', fontWeight: 700, textTransform: 'capitalize', fontFamily: 'Poppins' }}>{t.type}</span>
                </div>

                {/* Info */}
                <div style={{ padding: '14px 16px' }}>
                  <h3 style={{ fontFamily: 'Poppins', fontSize: '14px', fontWeight: 700, color: '#111827', margin: '0 0 4px', lineHeight: 1.3 }}>{t.name}</h3>
                  <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '12px' }}>
                    {t.elements?.length || 0} elements &middot; {t.orientation} &middot; Updated {new Date(t.updated_at).toLocaleDateString()}
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    <button onClick={() => navigate(`/admin/certificates/design/${t.id}`)} style={cardBtnStyle('#dbeafe', '#1e40af')} data-testid={`edit-${t.id}`}><Edit3 size={12} /> Edit</button>
                    <button onClick={() => handlePreview(t.id)} style={cardBtnStyle('#f0fdf4', '#065f46')} data-testid={`preview-${t.id}`}><Eye size={12} /> Preview</button>
                    <button onClick={() => { setGenModal(t.id); setGenMemberId(''); setGenEventId(''); setSearchMember(''); }} style={cardBtnStyle('#fef3c7', '#92400e')} data-testid={`generate-${t.id}`}><Download size={12} /> Generate</button>
                    <button onClick={() => handleClone(t.id)} style={cardBtnStyle('#f3f4f6', '#374151')} data-testid={`clone-${t.id}`}><Copy size={12} /></button>
                    <button onClick={() => setDelModal(t.id)} style={cardBtnStyle('#fee2e2', '#dc2626')} data-testid={`delete-${t.id}`}><Trash2 size={12} /></button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Modal */}
      {delModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '400px' }}>
            <h2 style={{ fontFamily: 'Poppins', fontSize: '16px', fontWeight: 700, color: '#dc2626', margin: '0 0 12px' }}>Delete Template?</h2>
            <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '20px' }}>This action cannot be undone. The template and its design will be permanently removed.</p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => setDelModal(null)} className="btn-secondary">Cancel</button>
              <button onClick={handleDelete} style={{ background: '#dc2626', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }} data-testid="confirm-delete-btn">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Generate Modal */}
      {genModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontFamily: 'Poppins', fontSize: '16px', fontWeight: 700, color: '#0c3c60', margin: 0 }}>Generate Certificates</h2>
              <button onClick={() => setGenModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}><span style={{ fontSize: '20px' }}>&times;</span></button>
            </div>

            {/* Tab: Single Member */}
            <div style={{ background: '#f0f9ff', borderRadius: '10px', padding: '16px', marginBottom: '16px', border: '1px solid #bae6fd' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <Users size={16} style={{ color: '#1e40af' }} />
                <span style={{ fontFamily: 'Poppins', fontWeight: 700, fontSize: '13px', color: '#1e40af' }}>Single Member Certificate</span>
              </div>
              <div style={{ position: 'relative', marginBottom: '8px' }}>
                <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                <input value={searchMember} onChange={e => setSearchMember(e.target.value)} placeholder="Search member..." style={{ width: '100%', padding: '8px 8px 8px 32px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '12px', boxSizing: 'border-box' }} data-testid="gen-search-member" />
              </div>
              <select value={genMemberId} onChange={e => setGenMemberId(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '12px', marginBottom: '8px', boxSizing: 'border-box' }} data-testid="gen-member-select">
                <option value="">-- Select Member --</option>
                {filteredMembers.map(m => <option key={m.id} value={m.id}>{m.name} ({m.membership_id || m.email})</option>)}
              </select>
              <button onClick={handleGenMember} disabled={!genMemberId || genLoading} className="btn-primary" style={{ width: '100%', justifyContent: 'center', opacity: !genMemberId ? 0.5 : 1 }} data-testid="gen-member-btn">
                {genLoading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />} Download PDF
              </button>
            </div>

            {/* Tab: Bulk Event */}
            <div style={{ background: '#fef3c7', borderRadius: '10px', padding: '16px', border: '1px solid #fde68a' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <Calendar size={16} style={{ color: '#92400e' }} />
                <span style={{ fontFamily: 'Poppins', fontWeight: 700, fontSize: '13px', color: '#92400e' }}>Bulk Event Certificates (ZIP)</span>
              </div>
              <p style={{ fontSize: '11px', color: '#78716c', marginBottom: '8px' }}>Generates certificates for all paid registrations of the selected event.</p>
              <select value={genEventId} onChange={e => setGenEventId(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '12px', marginBottom: '8px', boxSizing: 'border-box' }} data-testid="gen-event-select">
                <option value="">-- Select Event --</option>
                {events.map(ev => <option key={ev.id} value={ev.id}>{ev.title}</option>)}
              </select>
              <button onClick={handleGenEvent} disabled={!genEventId || genLoading} style={{ width: '100%', padding: '8px', background: '#92400e', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', opacity: !genEventId ? 0.5 : 1 }} data-testid="gen-event-btn">
                {genLoading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />} Download All (ZIP)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const cardBtnStyle = (bg, color) => ({
  display: 'flex', alignItems: 'center', gap: '4px', padding: '5px 10px',
  background: bg, color, border: 'none', borderRadius: '6px', cursor: 'pointer',
  fontSize: '11px', fontWeight: 600, fontFamily: 'Poppins', whiteSpace: 'nowrap',
});
