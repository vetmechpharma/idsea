import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { Plus, Search, Edit, Trash2, Check, X, Download, Mail, Pause, RefreshCw, Eye, ChevronDown, ShieldCheck, RotateCcw, MessageCircle, Paperclip, RefreshCcw } from 'lucide-react';
import { API } from '../../contexts/AuthContext';
import { FileUpload } from '../../components/admin/FileUpload';
import PhoneInput from '../../components/PhoneInput';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

const PREFIXES = ['', 'Dr.', 'Mr.', 'Mrs.', 'Ms.', 'Prof.', 'Shri', 'Smt.'];
const STATES = ['', 'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Delhi', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal'];

const emptyAddr = { line1: '', line2: '', line3: '', state: '', district: '', pincode: '' };
const initForm = {
  prefix: '', name: '', email: '', phone: '', qualification: '', specialization: '', organization: '',
  permanent_address: { ...emptyAddr }, contact_address: { ...emptyAddr }, contact_same_as_permanent: false,
  state: '', photo_url: '', membership_type: 'academic', payment_status: 'pending', membership_id: ''
};

export default function MembersAdmin() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editMember, setEditMember] = useState(null);
  const [form, setForm] = useState(initForm);
  const [toast, setToast] = useState('');
  const [detailModal, setDetailModal] = useState(null);
  const [emailModal, setEmailModal] = useState(null);
  const [emailForm, setEmailForm] = useState({ subject: '', body: '', cc: '', send_email: true, send_whatsapp: false, attachments: [] });
  const [regenLoading, setRegenLoading] = useState(false);
  const [changeTypeModal, setChangeTypeModal] = useState(null);
  const [newType, setNewType] = useState('');
  const [verifyModal, setVerifyModal] = useState(null);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [page, setPage] = useState(1);
  const PER_PAGE = 20;

  const token = localStorage.getItem('idsea_token');
  const headers = { Authorization: `Bearer ${token}` };
  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const load = async () => {
    setLoading(true);
    const params = {};
    if (statusFilter !== 'all') params.status = statusFilter;
    if (typeFilter !== 'all') params.membership_type = typeFilter;
    if (search) params.search = search;
    const r = await axios.get(`${API}/admin/members`, { params, headers });
    // Sort by newest first
    const sorted = (r.data || []).sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    setMembers(sorted);
    setPage(1);
    setLoading(false);
  };

  useEffect(() => { load(); }, [statusFilter, typeFilter]);

  const handleSearch = (e) => { e.preventDefault(); load(); };

  const openAdd = () => { setEditMember(null); setForm({ ...initForm, permanent_address: { ...emptyAddr }, contact_address: { ...emptyAddr } }); setShowModal(true); };
  const openEdit = (m) => {
    setEditMember(m);
    setForm({
      prefix: m.prefix || '', name: m.name, email: m.email, phone: m.phone || '',
      qualification: m.qualification || '', specialization: m.specialization || '', organization: m.organization || '',
      permanent_address: m.permanent_address || { ...emptyAddr },
      contact_address: m.contact_address || { ...emptyAddr },
      contact_same_as_permanent: m.contact_same_as_permanent || false,
      state: m.state || '', photo_url: m.photo_url || '', membership_type: m.membership_type, payment_status: m.payment_status, membership_id: m.membership_id || ''
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      const payload = { ...form };
      if (form.contact_same_as_permanent) payload.contact_address = { ...form.permanent_address };
      payload.state = form.permanent_address?.state || form.state;
      if (editMember) {
        await axios.put(`${API}/admin/members/${editMember.id}`, payload, { headers });
        showToast('Member updated');
      } else {
        await axios.post(`${API}/admin/members`, payload, { headers });
        showToast('Member added');
      }
      setShowModal(false); load();
    } catch (e) { showToast('Error: ' + (e.response?.data?.detail || 'Failed')); }
  };

  const handleAction = async (id, action) => {
    try {
      await axios.put(`${API}/admin/members/${id}/${action}`, {}, { headers });
      showToast(`Member ${action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'put on hold'}!`);
      load();
    } catch (e) { showToast(e.response?.data?.detail || 'Action failed'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this member?')) return;
    await axios.delete(`${API}/admin/members/${id}`, { headers });
    showToast('Member deleted'); load();
  };

  const handleSendEmail = async () => {
    if (!emailModal || !emailForm.subject || !emailForm.body) return;
    if (!emailForm.send_email && !emailForm.send_whatsapp) { showToast('Select at least Email or WhatsApp'); return; }
    try {
      // Convert file objects to base64 data URLs
      const attachments = [];
      for (const file of emailForm.attachments) {
        const dataUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.readAsDataURL(file);
        });
        attachments.push({ filename: file.name, data_url: dataUrl });
      }
      await axios.post(`${API}/admin/members/${emailModal.id}/send-email`, {
        ...emailForm, attachments
      }, { headers });
      const channels = [emailForm.send_email && 'Email', emailForm.send_whatsapp && 'WhatsApp'].filter(Boolean).join(' & ');
      showToast(`${channels} sent to ${emailModal.name}`);
      setEmailModal(null);
      setEmailForm({ subject: '', body: '', cc: '', send_email: true, send_whatsapp: false, attachments: [] });
    } catch (e) { showToast('Send failed: ' + (e.response?.data?.detail || 'Error')); }
  };

  const handleFileAttach = (e) => {
    const files = Array.from(e.target.files);
    setEmailForm(prev => ({ ...prev, attachments: [...prev.attachments, ...files] }));
  };

  const removeAttachment = (idx) => {
    setEmailForm(prev => ({ ...prev, attachments: prev.attachments.filter((_, i) => i !== idx) }));
  };

  const handleRegenerateCerts = async () => {
    if (!window.confirm('Regenerate certificates for ALL approved members using the latest template and send via email?\n\nThis may take several minutes for 100+ members.')) return;
    setRegenLoading(true);
    try {
      const r = await axios.post(`${API}/admin/members/regenerate-certificates`, { send_email: true }, { headers });
      showToast(r.data.message || 'Certificate regeneration started');
    } catch (e) { showToast('Failed: ' + (e.response?.data?.detail || 'Error')); }
    setRegenLoading(false);
  };

  const handleChangeType = async () => {
    if (!changeTypeModal || !newType) return;
    try {
      const r = await axios.put(`${API}/admin/members/${changeTypeModal.id}/change-type`, { membership_type: newType }, { headers });
      showToast(`Type changed. New ID: ${r.data.membership_id || 'N/A'}`);
      setChangeTypeModal(null); load();
    } catch { showToast('Change failed'); }
  };

  const handleVerifyId = async () => {
    if (!verifyModal) return;
    setVerifyLoading(true);
    try {
      await axios.put(`${API}/admin/members/${verifyModal.id}/verify-college-id`, {}, { headers });
      setMembers(prev => prev.map(m => m.id === verifyModal.id ? { ...m, college_id_verified: true } : m));
      showToast(`College ID verified for ${verifyModal.prefix ? verifyModal.prefix + ' ' : ''}${verifyModal.name}`);
      setVerifyModal(null);
    } catch (e) { showToast('Verification failed: ' + (e.response?.data?.detail || 'Error')); }
    setVerifyLoading(false);
  };

  const handleRequestReupload = async () => {
    if (!verifyModal) return;
    setVerifyLoading(true);
    try {
      await axios.put(`${API}/admin/members/${verifyModal.id}/request-reupload-college-id`, {}, { headers });
      setMembers(prev => prev.map(m => m.id === verifyModal.id ? { ...m, college_id_verified: false, college_id_url: '' } : m));
      showToast(`Re-upload requested for ${verifyModal.prefix ? verifyModal.prefix + ' ' : ''}${verifyModal.name}`);
      setVerifyModal(null);
    } catch (e) { showToast('Request failed: ' + (e.response?.data?.detail || 'Error')); }
    setVerifyLoading(false);
  };

  const isStudentUnverified = (m) => {
    return ['student', 'students_membership'].includes(m.membership_type) && m.college_id_url && !m.college_id_verified;
  };

  const updateAddr = (which, key, val) => setForm(f => ({ ...f, [which]: { ...f[which], [key]: val } }));

  const AddressFields = ({ which, label }) => (
    <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '16px', border: '1px solid #e5e7eb' }}>
      <div style={{ fontFamily: 'Poppins', fontWeight: 700, fontSize: '13px', color: '#0c3c60', marginBottom: '12px' }}>{label}</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        <div className="form-group" style={{ margin: 0, gridColumn: '1 / -1' }}><label className="form-label">Address Line 1</label><input value={form[which]?.line1 || ''} onChange={e => updateAddr(which, 'line1', e.target.value)} className="form-input" placeholder="House/Flat No, Building" /></div>
        <div className="form-group" style={{ margin: 0, gridColumn: '1 / -1' }}><label className="form-label">Address Line 2</label><input value={form[which]?.line2 || ''} onChange={e => updateAddr(which, 'line2', e.target.value)} className="form-input" placeholder="Street, Area, Locality" /></div>
        <div className="form-group" style={{ margin: 0, gridColumn: '1 / -1' }}><label className="form-label">Address Line 3</label><input value={form[which]?.line3 || ''} onChange={e => updateAddr(which, 'line3', e.target.value)} className="form-input" placeholder="Landmark (optional)" /></div>
        <div className="form-group" style={{ margin: 0 }}><label className="form-label">State</label>
          <select value={form[which]?.state || ''} onChange={e => updateAddr(which, 'state', e.target.value)} className="form-select">{STATES.map(s => <option key={s} value={s}>{s || 'Select State'}</option>)}</select>
        </div>
        <div className="form-group" style={{ margin: 0 }}><label className="form-label">District</label><input value={form[which]?.district || ''} onChange={e => updateAddr(which, 'district', e.target.value)} className="form-input" placeholder="District" /></div>
        <div className="form-group" style={{ margin: 0 }}><label className="form-label">Pincode</label><input value={form[which]?.pincode || ''} onChange={e => updateAddr(which, 'pincode', e.target.value)} className="form-input" placeholder="6-digit pincode" maxLength={6} /></div>
      </div>
    </div>
  );

  const statusBadge = (status) => {
    const colors = { pending: '#f59e0b', approved: '#10b981', rejected: '#ef4444', hold: '#6b7280' };
    return <span style={{ background: `${colors[status]}15`, color: colors[status], padding: '3px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: 700 }}>{status}</span>;
  };

  return (
    <div>
      {toast && <div className="toast-success" data-testid="toast">{toast}</div>}
      <div className="page-header">
        <h1 className="page-title" data-testid="members-title">Membership Management</h1>
        <button onClick={openAdd} className="btn-primary" data-testid="add-member-btn"><Plus size={16} /> Add Member</button>
      </div>

      {/* Filters */}
      <div className="admin-card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px', flex: 1, minWidth: '200px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
              <input value={search} onChange={e => setSearch(e.target.value)} className="form-input" style={{ paddingLeft: '32px' }} placeholder="Search members..." data-testid="member-search" />
            </div>
            <button type="submit" className="btn-primary">Search</button>
          </form>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="form-select" style={{ width: 'auto' }} data-testid="filter-status">
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="hold">On Hold</option>
          </select>
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="form-select" style={{ width: 'auto' }} data-testid="filter-type">
            <option value="all">All Types</option>
            <option value="academic">Academic</option>
            <option value="entrepreneur">Entrepreneur</option>
            <option value="corporate">Corporate</option>
            <option value="student">Student</option>
          </select>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button onClick={() => { axios.get(`${API}/admin/members/export/excel`, { params: { ...(statusFilter !== 'all' && { status: statusFilter }), ...(typeFilter !== 'all' && { membership_type: typeFilter }) }, responseType: 'blob', headers }).then(r => { const url = URL.createObjectURL(r.data); const a = document.createElement('a'); a.href = url; a.download = 'IDSEA_Members.xlsx'; a.click(); URL.revokeObjectURL(url); }); }}
              className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', padding: '6px 12px' }} data-testid="export-excel-btn"><Download size={14} /> Excel</button>
            <button onClick={() => { axios.get(`${API}/admin/members/export/pdf`, { params: { ...(statusFilter !== 'all' && { status: statusFilter }), ...(typeFilter !== 'all' && { membership_type: typeFilter }) }, responseType: 'blob', headers }).then(r => { const url = URL.createObjectURL(r.data); const a = document.createElement('a'); a.href = url; a.download = 'IDSEA_Members.pdf'; a.click(); URL.revokeObjectURL(url); }); }}
              className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', padding: '6px 12px' }} data-testid="export-pdf-btn"><Download size={14} /> PDF</button>
            <button onClick={handleRegenerateCerts} disabled={regenLoading} data-testid="regen-certs-btn"
              className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', padding: '6px 12px', color: '#7c3aed', borderColor: '#e9d5ff' }}>
              <RefreshCcw size={14} className={regenLoading ? 'animate-spin' : ''} /> {regenLoading ? 'Regenerating...' : 'Regen Certs & Email'}
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table className="admin-table" data-testid="members-table">
          <thead>
            <tr>
              <th>Member</th>
              <th>Type</th>
              <th>Organization</th>
              <th>State</th>
              <th>Payment</th>
              <th>Status</th>
              <th>Membership ID</th>
              <th style={{ textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>Loading...</td></tr>
              : members.length === 0 ? <tr><td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>No members found</td></tr>
                : members.slice((page - 1) * PER_PAGE, page * PER_PAGE).map(m => (
                  <tr key={m.id} data-testid={`member-row-${m.id}`}>
                    <td>
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        {m.photo_url ? <img src={m.photo_url.startsWith('/api') ? `${API.replace('/api', '')}${m.photo_url}` : m.photo_url} alt="" style={{ width: '34px', height: '34px', borderRadius: '50%', objectFit: 'cover' }} /> : <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: '#0c3c60', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '13px', flexShrink: 0, fontFamily: 'Poppins' }}>{m.name?.charAt(0)}</div>}
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '13px', color: '#111827' }}>{m.prefix ? `${m.prefix} ` : ''}{m.name}</div>
                          <div style={{ fontSize: '11px', color: '#9ca3af' }}>{m.email}</div>
                        </div>
                      </div>
                    </td>
                    <td><span className={`badge badge-${m.membership_type}`}>{m.membership_type}</span></td>
                    <td style={{ fontSize: '13px', color: '#6b7280', maxWidth: '160px' }}>{m.organization || '-'}</td>
                    <td style={{ fontSize: '13px', color: '#6b7280' }}>{m.state || m.permanent_address?.state || '-'}</td>
                    <td><span className={`badge badge-${m.payment_status}`}>{m.payment_status}</span></td>
                    <td>{statusBadge(m.status)}</td>
                    <td style={{ fontSize: '12px', color: '#0c3c60', fontWeight: 600, fontFamily: 'monospace' }}>
                      {m.membership_id || '-'}
                      {['student','students_membership'].includes(m.membership_type) && m.validity_end && (() => {
                        const vEnd = new Date(m.validity_end);
                        const now = new Date();
                        const daysLeft = Math.ceil((vEnd - now) / 86400000);
                        const isExpired = daysLeft <= 0;
                        const isNearExpiry = daysLeft > 0 && daysLeft <= 90;
                        return (
                          <div style={{ fontSize: '10px', fontWeight: 700, fontFamily: 'Poppins', marginTop: '2px',
                            color: isExpired ? '#dc2626' : isNearExpiry ? '#d97706' : '#059669',
                            background: isExpired ? '#fef2f2' : isNearExpiry ? '#fffbeb' : '#f0fdf4',
                            padding: '1px 6px', borderRadius: '4px', display: 'inline-block' }}>
                            {isExpired ? 'EXPIRED' : isNearExpiry ? `${daysLeft}d left` : `Valid till ${vEnd.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}`}
                          </div>
                        );
                      })()}
                      {['student','students_membership'].includes(m.membership_type) && m.college_id_url && (
                        <div style={{ fontSize: '10px', marginTop: '2px', color: m.college_id_verified ? '#059669' : '#d97706', fontWeight: 600 }}>
                          {m.college_id_verified ? 'ID Verified' : 'ID Pending'}
                        </div>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '4px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <button onClick={() => setDetailModal(m)} title="View" data-testid={`view-member-${m.id}`} style={{ background: '#f0f9ff', color: '#0c3c60', border: 'none', padding: '5px', borderRadius: '6px', cursor: 'pointer' }}><Eye size={14} /></button>
                        {(m.status === 'pending' || m.status === 'hold') && (
                          <button onClick={() => { if (isStudentUnverified(m)) { showToast('Verify student college ID before approving'); return; } handleAction(m.id, 'approve'); }} data-testid={`approve-${m.id}`} title={isStudentUnverified(m) ? 'Verify college ID first' : 'Approve'} style={{ background: isStudentUnverified(m) ? '#f3f4f6' : '#d1fae5', color: isStudentUnverified(m) ? '#9ca3af' : '#065f46', border: 'none', padding: '5px 8px', borderRadius: '6px', cursor: isStudentUnverified(m) ? 'not-allowed' : 'pointer', fontSize: '11px', fontWeight: 700, fontFamily: 'Poppins', opacity: isStudentUnverified(m) ? 0.6 : 1 }}><Check size={13} /></button>
                        )}
                        {(m.status === 'pending' || m.status === 'hold') && (
                          <button onClick={() => handleAction(m.id, 'reject')} data-testid={`reject-${m.id}`} title="Reject" style={{ background: '#fee2e2', color: '#991b1b', border: 'none', padding: '5px 8px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: 700, fontFamily: 'Poppins' }}><X size={13} /></button>
                        )}
                        {m.status === 'pending' && (
                          <button onClick={() => handleAction(m.id, 'hold')} data-testid={`hold-${m.id}`} title="Hold" style={{ background: '#f3f4f6', color: '#6b7280', border: 'none', padding: '5px 8px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: 700, fontFamily: 'Poppins' }}><Pause size={13} /></button>
                        )}
                        <button onClick={() => setEmailModal(m)} title="Send Email" data-testid={`email-${m.id}`} style={{ background: '#dbeafe', color: '#1e40af', border: 'none', padding: '5px', borderRadius: '6px', cursor: 'pointer' }}><Mail size={14} /></button>
                        <button onClick={() => openEdit(m)} title="Edit" style={{ background: '#fef3c7', color: '#92400e', border: 'none', padding: '5px', borderRadius: '6px', cursor: 'pointer' }}><Edit size={14} /></button>
                        {m.status === 'approved' && (
                          <button onClick={() => { setChangeTypeModal(m); setNewType(m.membership_type); }} title="Change Type" data-testid={`change-type-${m.id}`} style={{ background: '#f3e8ff', color: '#6b21a8', border: 'none', padding: '5px', borderRadius: '6px', cursor: 'pointer' }}><RefreshCw size={14} /></button>
                        )}
                        {['student','students_membership'].includes(m.membership_type) && m.college_id_url && !m.college_id_verified && (
                          <button onClick={() => setVerifyModal(m)} data-testid={`verify-id-${m.id}`} title="Verify College ID" style={{ background: '#faf5ff', color: '#7c3aed', border: '1px solid #e9d5ff', padding: '5px 8px', borderRadius: '6px', cursor: 'pointer', fontSize: '10px', fontWeight: 700, fontFamily: 'Poppins', display: 'flex', alignItems: 'center', gap: '3px' }}><ShieldCheck size={12} /> Verify ID</button>
                        )}
                        {['student','students_membership'].includes(m.membership_type) && (m.status === 'expired' || m.status === 'approved') && (
                          <button onClick={async () => { if (!window.confirm(`Upgrade ${m.prefix ? m.prefix + ' ' : ''}${m.name} to Academic membership?`)) return; await axios.post(`${API}/admin/members/${m.id}/upgrade`, { new_type: 'academic' }, { headers: { Authorization: `Bearer ${token}` } }); load(); }} title="Upgrade to Academic" style={{ background: '#eff6ff', color: '#1e40af', border: 'none', padding: '5px 8px', borderRadius: '6px', cursor: 'pointer', fontSize: '10px', fontWeight: 700, fontFamily: 'Poppins' }}>Upgrade</button>
                        )}
                        <button onClick={() => handleDelete(m.id)} title="Delete" style={{ background: '#fee2e2', color: '#991b1b', border: 'none', padding: '5px', borderRadius: '6px', cursor: 'pointer' }}><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
        {/* Pagination */}
        {members.length > PER_PAGE && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderTop: '1px solid #e5e7eb', background: '#f8fafc' }}>
            <span style={{ fontSize: '12px', color: '#6b7280' }}>Showing {(page - 1) * PER_PAGE + 1}-{Math.min(page * PER_PAGE, members.length)} of {members.length}</span>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ padding: '6px 14px', borderRadius: '6px', border: '1px solid #e5e7eb', background: 'white', cursor: page === 1 ? 'default' : 'pointer', opacity: page === 1 ? 0.4 : 1, fontSize: '12px', fontWeight: 600 }}>Prev</button>
              <span style={{ padding: '6px 12px', fontSize: '12px', fontWeight: 700, color: '#0c3c60' }}>Page {page} of {Math.ceil(members.length / PER_PAGE)}</span>
              <button onClick={() => setPage(p => Math.min(Math.ceil(members.length / PER_PAGE), p + 1))} disabled={page >= Math.ceil(members.length / PER_PAGE)} style={{ padding: '6px 14px', borderRadius: '6px', border: '1px solid #e5e7eb', background: 'white', cursor: page >= Math.ceil(members.length / PER_PAGE) ? 'default' : 'pointer', opacity: page >= Math.ceil(members.length / PER_PAGE) ? 0.4 : 1, fontSize: '12px', fontWeight: 600 }}>Next</button>
            </div>
          </div>
        )}
      </div>
      <div style={{ marginTop: '12px', fontSize: '13px', color: '#9ca3af', fontFamily: 'Inter' }}>Showing {members.length} records</div>

      {/* Detail Modal */}
      {detailModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontFamily: 'Poppins', fontSize: '17px', fontWeight: 700, color: '#0c3c60', margin: 0 }}>Member Details</h2>
              <button onClick={() => setDetailModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}><X size={20} /></button>
            </div>
            <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', alignItems: 'center' }}>
              {detailModal.photo_url ? <img src={detailModal.photo_url.startsWith('/api') ? `${API.replace('/api', '')}${detailModal.photo_url}` : detailModal.photo_url} alt="" style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover' }} /> : <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#0c3c60', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '20px', fontFamily: 'Poppins' }}>{detailModal.name?.charAt(0)}</div>}
              <div>
                <div style={{ fontFamily: 'Poppins', fontWeight: 700, fontSize: '18px', color: '#111827' }}>{detailModal.prefix ? `${detailModal.prefix} ` : ''}{detailModal.name}</div>
                <div style={{ fontSize: '13px', color: '#6b7280' }}>{detailModal.email} | {detailModal.phone || '-'}</div>
                <div style={{ marginTop: '4px' }}>{statusBadge(detailModal.status)} <span style={{ marginLeft: '8px', fontFamily: 'monospace', color: '#0c3c60', fontWeight: 600, fontSize: '13px' }}>{detailModal.membership_id || ''}</span></div>
              </div>
            </div>
            <div style={{ display: 'grid', gap: '8px', fontSize: '13px' }}>
              {[
                ['Membership Type', detailModal.membership_type],
                ['Qualification', detailModal.qualification],
                ['Specialization', detailModal.specialization],
                ['Organization', detailModal.organization],
                ['Payment Status', detailModal.payment_status],
                ['Joined', detailModal.join_date],
                ...(['student','students_membership'].includes(detailModal.membership_type) ? [
                  ['Year of Study', detailModal.year_of_study],
                  ['Graduation Year', detailModal.graduation_year],
                  ['Enrollment Number', detailModal.enrollment_number],
                  ['College ID', detailModal.college_id_verified ? 'Verified' : (detailModal.college_id_url ? 'Uploaded (Pending)' : 'Not uploaded')],
                  ['Validity', detailModal.validity_end ? `${new Date(detailModal.validity_start).toLocaleDateString('en-IN')} - ${new Date(detailModal.validity_end).toLocaleDateString('en-IN')}` : 'Not set'],
                ] : []),
              ].map(([l, v]) => v ? <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: '#f8fafc', borderRadius: '6px' }}><span style={{ color: '#6b7280' }}>{l}</span><strong style={{ color: '#111827', textTransform: 'capitalize' }}>{v}</strong></div> : null)}
            </div>
            {['student','students_membership'].includes(detailModal.membership_type) && detailModal.college_id_url && (
              <div style={{ marginTop: '12px', background: '#faf5ff', borderRadius: '10px', padding: '14px', border: '1px solid #e9d5ff' }}>
                <div style={{ fontWeight: 700, fontSize: '13px', color: '#7c3aed', marginBottom: '8px' }}>College ID Card</div>
                {detailModal.college_id_url.endsWith('.pdf') ? (
                  <a href={detailModal.college_id_url.startsWith('/api') ? `${API.replace('/api', '')}${detailModal.college_id_url}` : detailModal.college_id_url} target="_blank" rel="noreferrer" style={{ color: '#7c3aed', fontSize: '13px', fontWeight: 600 }}>View PDF</a>
                ) : (
                  <img src={detailModal.college_id_url.startsWith('/api') ? `${API.replace('/api', '')}${detailModal.college_id_url}` : detailModal.college_id_url} alt="College ID" style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px', objectFit: 'contain' }} />
                )}
              </div>
            )}
            {detailModal.permanent_address?.line1 && (
              <div style={{ marginTop: '16px', background: '#f8fafc', borderRadius: '10px', padding: '14px' }}>
                <div style={{ fontWeight: 700, fontSize: '13px', color: '#0c3c60', marginBottom: '8px' }}>Permanent Address</div>
                <div style={{ fontSize: '13px', color: '#374151', lineHeight: 1.6 }}>
                  {[detailModal.permanent_address.line1, detailModal.permanent_address.line2, detailModal.permanent_address.line3].filter(Boolean).join(', ')}
                  {detailModal.permanent_address.district && `, ${detailModal.permanent_address.district}`}
                  {detailModal.permanent_address.state && `, ${detailModal.permanent_address.state}`}
                  {detailModal.permanent_address.pincode && ` - ${detailModal.permanent_address.pincode}`}
                </div>
              </div>
            )}
            {detailModal.contact_address?.line1 && !detailModal.contact_same_as_permanent && (
              <div style={{ marginTop: '10px', background: '#f8fafc', borderRadius: '10px', padding: '14px' }}>
                <div style={{ fontWeight: 700, fontSize: '13px', color: '#0c3c60', marginBottom: '8px' }}>Contact Address</div>
                <div style={{ fontSize: '13px', color: '#374151', lineHeight: 1.6 }}>
                  {[detailModal.contact_address.line1, detailModal.contact_address.line2, detailModal.contact_address.line3].filter(Boolean).join(', ')}
                  {detailModal.contact_address.district && `, ${detailModal.contact_address.district}`}
                  {detailModal.contact_address.state && `, ${detailModal.contact_address.state}`}
                  {detailModal.contact_address.pincode && ` - ${detailModal.contact_address.pincode}`}
                </div>
              </div>
            )}
            {detailModal.contact_same_as_permanent && <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '8px' }}>Contact address same as permanent address</p>}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button onClick={() => { setEmailModal(detailModal); setDetailModal(null); }} className="btn-secondary"><Mail size={14} /> Send Email</button>
              <button onClick={() => setDetailModal(null)} className="btn-primary">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '680px', maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontFamily: 'Poppins', fontSize: '17px', fontWeight: 700, color: '#0c3c60', margin: 0 }}>{editMember ? 'Edit Member' : 'Add Member'}</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}><X size={20} /></button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '10px', marginBottom: '12px' }}>
              <div className="form-group" style={{ margin: 0 }}><label className="form-label">Prefix</label>
                <select value={form.prefix} onChange={e => setForm({ ...form, prefix: e.target.value })} className="form-select" data-testid="prefix-select">
                  {PREFIXES.map(p => <option key={p} value={p}>{p || 'None'}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ margin: 0 }}><label className="form-label">Full Name *</label><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="form-input" required data-testid="member-name" /></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div className="form-group" style={{ margin: 0 }}><label className="form-label">Email *</label><input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="form-input" required /></div>
              <div className="form-group" style={{ margin: 0 }}><label className="form-label">Phone</label><PhoneInput value={form.phone} onChange={(val) => setForm({ ...form, phone: val || '' })} testId="member-phone" /></div>
              <div className="form-group" style={{ margin: 0 }}><label className="form-label">Qualification</label><input value={form.qualification} onChange={e => setForm({ ...form, qualification: e.target.value })} className="form-input" /></div>
              <div className="form-group" style={{ margin: 0 }}><label className="form-label">Specialization</label><input value={form.specialization} onChange={e => setForm({ ...form, specialization: e.target.value })} className="form-input" /></div>
              <div className="form-group" style={{ margin: 0, gridColumn: '1 / -1' }}><label className="form-label">Organization</label><input value={form.organization} onChange={e => setForm({ ...form, organization: e.target.value })} className="form-input" /></div>
            </div>

            {/* Photo Upload */}
            <div className="form-group" style={{ marginTop: '12px' }}>
              <label className="form-label">Photo</label>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <FileUpload accept="image/*" label="Upload Photo" onUpload={(url) => setForm({ ...form, photo_url: url })} />
                {form.photo_url && <img src={form.photo_url.startsWith('/api') ? `${API.replace('/api', '')}${form.photo_url}` : form.photo_url} alt="" style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover' }} />}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '12px' }}>
              <div className="form-group" style={{ margin: 0 }}><label className="form-label">Membership Type</label>
                <select value={form.membership_type} onChange={e => setForm({ ...form, membership_type: e.target.value })} className="form-select">
                  <option value="academic">Academic</option>
                  <option value="entrepreneur">Entrepreneur</option>
                  <option value="corporate">Corporate</option>
                  <option value="student">Student</option>
                </select>
              </div>
              <div className="form-group" style={{ margin: 0 }}><label className="form-label">Payment Status</label>
                <select value={form.payment_status} onChange={e => setForm({ ...form, payment_status: e.target.value })} className="form-select">
                  <option value="pending">Pending</option><option value="paid">Paid</option>
                </select>
              </div>
            </div>

            {/* Membership ID — editable for approved members */}
            {editMember && editMember.membership_id && (
              <div style={{ marginTop: '12px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Membership ID</label>
                  <input value={form.membership_id} onChange={e => setForm({ ...form, membership_id: e.target.value })} className="form-input" placeholder="ACD/IDSEA/0001" data-testid="member-id-input" />
                  <span style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px', display: 'block' }}>Edit only to fix ID numbering. Format: PREFIX/IDSEA/SERIAL</span>
                </div>
              </div>
            )}

            {/* Permanent Address */}
            <div style={{ marginTop: '16px' }}><AddressFields which="permanent_address" label="Permanent Address" /></div>

            {/* Contact Address */}
            <div style={{ marginTop: '12px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: '10px', fontSize: '13px', color: '#374151' }}>
                <input type="checkbox" checked={form.contact_same_as_permanent} onChange={e => setForm({ ...form, contact_same_as_permanent: e.target.checked, ...(e.target.checked ? { contact_address: { ...form.permanent_address } } : {}) })} data-testid="same-address-checkbox" />
                <span style={{ fontWeight: 600 }}>Contact address is same as permanent address</span>
              </label>
              {!form.contact_same_as_permanent && <AddressFields which="contact_address" label="Contact Address" />}
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
              <button onClick={handleSave} className="btn-primary" data-testid="save-member-btn">Save Member</button>
            </div>
          </div>
        </div>
      )}

      {/* Email & WhatsApp Modal */}
      {emailModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontFamily: 'Poppins', fontSize: '17px', fontWeight: 700, color: '#0c3c60', margin: 0 }}>Send Message to {emailModal.prefix ? `${emailModal.prefix} ` : ''}{emailModal.name}</h2>
              <button onClick={() => setEmailModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }} data-testid="close-email-modal"><X size={20} /></button>
            </div>

            {/* Channel Selection */}
            <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', padding: '12px 16px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e5e7eb' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
                <input type="checkbox" checked={emailForm.send_email} onChange={e => setEmailForm(f => ({ ...f, send_email: e.target.checked }))} data-testid="toggle-email" />
                <Mail size={14} style={{ color: '#2563eb' }} /> Email {emailModal.email ? `(${emailModal.email})` : '(No email)'}
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
                <input type="checkbox" checked={emailForm.send_whatsapp} onChange={e => setEmailForm(f => ({ ...f, send_whatsapp: e.target.checked }))} data-testid="toggle-whatsapp" />
                <MessageCircle size={14} style={{ color: '#25d366' }} /> WhatsApp {emailModal.phone ? `(${emailModal.phone})` : '(No phone)'}
              </label>
            </div>

            <div className="form-group" style={{ margin: '0 0 12px' }}>
              <label className="form-label">Subject *</label>
              <input value={emailForm.subject} onChange={e => setEmailForm(f => ({ ...f, subject: e.target.value }))} className="form-input" placeholder="Email subject" data-testid="email-subject" />
            </div>

            {emailForm.send_email && (
              <div className="form-group" style={{ margin: '0 0 12px' }}>
                <label className="form-label">CC (comma-separated)</label>
                <input value={emailForm.cc} onChange={e => setEmailForm(f => ({ ...f, cc: e.target.value }))} className="form-input" placeholder="cc@example.com, cc2@example.com" data-testid="email-cc" />
              </div>
            )}

            <div className="form-group" style={{ margin: '0 0 12px' }}>
              <label className="form-label">Message * (Rich Text)</label>
              <ReactQuill
                value={emailForm.body}
                onChange={(val) => setEmailForm(f => ({ ...f, body: val }))}
                theme="snow"
                style={{ background: 'white', borderRadius: '8px' }}
                modules={{ toolbar: [
                  [{ 'header': [1, 2, 3, false] }],
                  ['bold', 'italic', 'underline', 'strike'],
                  [{ 'color': [] }, { 'background': [] }],
                  [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                  [{ 'align': [] }],
                  ['link'],
                  ['clean']
                ]}}
                placeholder="Type your message..."
                data-testid="email-body"
              />
            </div>

            {/* Attachments */}
            <div style={{ marginBottom: '16px' }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Paperclip size={14} /> Attachments
              </label>
              <input type="file" multiple onChange={handleFileAttach} style={{ display: 'none' }} id="email-attach-input" data-testid="email-attach-input" />
              <label htmlFor="email-attach-input" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 14px', border: '1px dashed #d1d5db', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', color: '#6b7280', fontWeight: 600, background: '#fafbfc' }}>
                <Paperclip size={13} /> Add Files
              </label>
              {emailForm.attachments.length > 0 && (
                <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {emailForm.attachments.map((file, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 10px', background: '#eff6ff', borderRadius: '6px', fontSize: '11px', color: '#1e40af', fontWeight: 600 }}>
                      {file.name} ({(file.size / 1024).toFixed(0)}KB)
                      <button onClick={() => removeAttachment(idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', padding: 0 }}><X size={12} /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => setEmailModal(null)} className="btn-secondary">Cancel</button>
              <button onClick={handleSendEmail} className="btn-primary" data-testid="send-email-btn" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {emailForm.send_email && emailForm.send_whatsapp ? <><Mail size={14} /> Send Both</> : emailForm.send_whatsapp ? <><MessageCircle size={14} /> Send WhatsApp</> : <><Mail size={14} /> Send Email</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Type Modal */}
      {changeTypeModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '400px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontFamily: 'Poppins', fontSize: '17px', fontWeight: 700, color: '#6b21a8', margin: 0 }}>Change Membership Type</h2>
              <button onClick={() => setChangeTypeModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}><X size={20} /></button>
            </div>
            <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '16px' }}>Current: <strong style={{ textTransform: 'capitalize' }}>{changeTypeModal.membership_type}</strong> | ID: <strong>{changeTypeModal.membership_id}</strong></p>
            <div className="form-group"><label className="form-label">New Membership Type</label>
              <select value={newType} onChange={e => setNewType(e.target.value)} className="form-select" data-testid="new-type-select">
                <option value="academic">Academic (ACD/IDSEA/...)</option>
                <option value="entrepreneur">Entrepreneur (ENT/IDSEA/...)</option>
                <option value="corporate">Corporate (COP/IDSEA/...)</option>
              </select>
            </div>
            <p style={{ fontSize: '12px', color: '#d97706', marginBottom: '12px' }}>A new Membership ID will be generated for the selected type.</p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => setChangeTypeModal(null)} className="btn-secondary">Cancel</button>
              <button onClick={handleChangeType} className="btn-primary" data-testid="confirm-change-type">Change Type</button>
            </div>
          </div>
        </div>
      )}

      {/* Verify College ID Modal */}
      {verifyModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '520px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontFamily: 'Poppins', fontSize: '17px', fontWeight: 700, color: '#7c3aed', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={20} /> Verify College ID
              </h2>
              <button onClick={() => setVerifyModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }} data-testid="close-verify-modal"><X size={20} /></button>
            </div>
            <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '14px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                {verifyModal.photo_url ? <img src={verifyModal.photo_url.startsWith('/api') ? `${API.replace('/api', '')}${verifyModal.photo_url}` : verifyModal.photo_url} alt="" style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover' }} /> : <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#0c3c60', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '15px' }}>{verifyModal.name?.charAt(0)}</div>}
                <div>
                  <div style={{ fontWeight: 700, fontSize: '15px', color: '#111827', fontFamily: 'Poppins' }}>{verifyModal.prefix ? `${verifyModal.prefix} ` : ''}{verifyModal.name}</div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>{verifyModal.email} | {verifyModal.enrollment_number || 'No enrollment #'}</div>
                  <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>{verifyModal.organization || ''} {verifyModal.year_of_study ? `| Year: ${verifyModal.year_of_study}` : ''} {verifyModal.graduation_year ? `| Grad: ${verifyModal.graduation_year}` : ''}</div>
                </div>
              </div>
            </div>
            <div style={{ background: '#faf5ff', borderRadius: '10px', padding: '16px', border: '1px solid #e9d5ff', marginBottom: '16px' }}>
              <div style={{ fontWeight: 700, fontSize: '13px', color: '#7c3aed', marginBottom: '10px' }}>Uploaded College ID</div>
              {verifyModal.college_id_url ? (
                verifyModal.college_id_url.endsWith('.pdf') ? (
                  <a href={verifyModal.college_id_url.startsWith('/api') ? `${API.replace('/api', '')}${verifyModal.college_id_url}` : verifyModal.college_id_url} target="_blank" rel="noreferrer" style={{ color: '#7c3aed', fontSize: '13px', fontWeight: 600, textDecoration: 'underline' }}>View PDF Document</a>
                ) : (
                  <img src={verifyModal.college_id_url.startsWith('/api') ? `${API.replace('/api', '')}${verifyModal.college_id_url}` : verifyModal.college_id_url} alt="College ID" data-testid="verify-modal-college-id-img" style={{ width: '100%', maxHeight: '300px', borderRadius: '8px', objectFit: 'contain', background: 'white', border: '1px solid #e5e7eb' }} />
                )
              ) : <p style={{ color: '#9ca3af', fontSize: '13px' }}>No document uploaded</p>}
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={handleRequestReupload} disabled={verifyLoading} className="btn-secondary" data-testid="request-reupload-btn" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#d97706', borderColor: '#fbbf24' }}>
                <RotateCcw size={14} /> Request Re-upload
              </button>
              <button onClick={() => setVerifyModal(null)} className="btn-secondary" data-testid="cancel-verify-btn">Cancel</button>
              <button onClick={handleVerifyId} disabled={verifyLoading} className="btn-primary" data-testid="confirm-verify-btn" style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#059669' }}>
                <ShieldCheck size={14} /> {verifyLoading ? 'Processing...' : 'Verify ID'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
