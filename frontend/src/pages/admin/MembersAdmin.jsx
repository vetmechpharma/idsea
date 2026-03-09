import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Plus, Search, Edit, Trash2, Check, X, Download } from 'lucide-react';
import { API } from '../../contexts/AuthContext';

const STATES = ['', 'Andhra Pradesh', 'Assam', 'Bihar', 'Delhi', 'Goa', 'Gujarat', 'Haryana', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Odisha', 'Punjab', 'Rajasthan', 'Tamil Nadu', 'Telangana', 'Uttar Pradesh', 'West Bengal'];

const initForm = { name: '', email: '', phone: '', qualification: '', specialization: '', organization: '', address: '', state: '', photo_url: '', membership_type: 'academic', payment_status: 'pending' };

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

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const load = async () => {
    setLoading(true);
    const params = {};
    if (statusFilter !== 'all') params.status = statusFilter;
    if (typeFilter !== 'all') params.membership_type = typeFilter;
    if (search) params.search = search;
    const r = await axios.get(`${API}/admin/members`, { params });
    setMembers(r.data);
    setLoading(false);
  };

  useEffect(() => { load(); }, [statusFilter, typeFilter]);

  const handleSearch = (e) => { e.preventDefault(); load(); };

  const openAdd = () => { setEditMember(null); setForm(initForm); setShowModal(true); };
  const openEdit = (m) => { setEditMember(m); setForm({ name: m.name, email: m.email, phone: m.phone || '', qualification: m.qualification || '', specialization: m.specialization || '', organization: m.organization || '', address: m.address || '', state: m.state || '', photo_url: m.photo_url || '', membership_type: m.membership_type, payment_status: m.payment_status }); setShowModal(true); };

  const handleSave = async () => {
    try {
      if (editMember) {
        await axios.put(`${API}/admin/members/${editMember.id}`, form);
        showToast('Member updated successfully');
      } else {
        await axios.post(`${API}/admin/members`, form);
        showToast('Member added successfully');
      }
      setShowModal(false); load();
    } catch (e) { showToast('Error: ' + (e.response?.data?.detail || 'Failed')); }
  };

  const handleApprove = async (id) => {
    await axios.put(`${API}/admin/members/${id}/approve`);
    showToast('Member approved!'); load();
  };

  const handleReject = async (id) => {
    await axios.put(`${API}/admin/members/${id}/reject`);
    showToast('Member rejected'); load();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this member?')) return;
    await axios.delete(`${API}/admin/members/${id}`);
    showToast('Member deleted'); load();
  };

  return (
    <div>
      {toast && <div className="toast-success" data-testid="toast">{toast}</div>}
      <div className="page-header">
        <h1 className="page-title">Membership Management</h1>
        <button onClick={openAdd} className="btn-primary" data-testid="add-member-btn">
          <Plus size={16} /> Add Member
        </button>
      </div>

      {/* Filters */}
      <div className="admin-card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px', flex: 1, minWidth: '200px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
              <input value={search} onChange={e => setSearch(e.target.value)} className="form-input" style={{ paddingLeft: '32px' }} placeholder="Search members..." />
            </div>
            <button type="submit" className="btn-primary">Search</button>
          </form>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="form-select" style={{ width: 'auto' }} data-testid="filter-status">
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="form-select" style={{ width: 'auto' }} data-testid="filter-type">
            <option value="all">All Types</option>
            <option value="academic">Academic</option>
            <option value="entrepreneur">Entrepreneur</option>
            <option value="corporate">Corporate</option>
          </select>
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
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>Loading...</td></tr>
            ) : members.length === 0 ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>No members found</td></tr>
            ) : members.map(m => (
              <tr key={m.id}>
                <td>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    {m.photo_url ? <img src={m.photo_url} alt="" style={{ width: '34px', height: '34px', borderRadius: '50%', objectFit: 'cover' }} /> : <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: '#0c3c60', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '13px', flexShrink: 0, fontFamily: 'Poppins' }}>{m.name?.charAt(0)}</div>}
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '13px', color: '#111827' }}>{m.name}</div>
                      <div style={{ fontSize: '11px', color: '#9ca3af' }}>{m.email}</div>
                    </div>
                  </div>
                </td>
                <td><span className={`badge badge-${m.membership_type}`}>{m.membership_type}</span></td>
                <td style={{ fontSize: '13px', color: '#6b7280', maxWidth: '160px' }}>{m.organization || '-'}</td>
                <td style={{ fontSize: '13px', color: '#6b7280' }}>{m.state || '-'}</td>
                <td><span className={`badge badge-${m.payment_status}`}>{m.payment_status}</span></td>
                <td><span className={`badge badge-${m.status}`}>{m.status}</span></td>
                <td style={{ fontSize: '12px', color: '#9ca3af' }}>{m.membership_id || '-'}</td>
                <td>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {m.status === 'pending' && (
                      <>
                        <button onClick={() => handleApprove(m.id)} data-testid="approve-btn" title="Approve" style={{ background: '#d1fae5', color: '#065f46', border: 'none', padding: '5px 8px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', fontFamily: 'Poppins' }}>
                          <Check size={14} /> Approve
                        </button>
                        <button onClick={() => handleReject(m.id)} data-testid="reject-btn" title="Reject" style={{ background: '#fee2e2', color: '#991b1b', border: 'none', padding: '5px 8px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', fontFamily: 'Poppins' }}>
                          <X size={14} /> Reject
                        </button>
                      </>
                    )}
                    <button onClick={() => openEdit(m)} title="Edit" style={{ background: '#dbeafe', color: '#1e40af', border: 'none', padding: '5px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                      <Edit size={14} />
                    </button>
                    <button onClick={() => handleDelete(m.id)} title="Delete" style={{ background: '#fee2e2', color: '#991b1b', border: 'none', padding: '5px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ marginTop: '12px', fontSize: '13px', color: '#9ca3af', fontFamily: 'Inter' }}>Showing {members.length} records</div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontFamily: 'Poppins', fontSize: '17px', fontWeight: 700, color: '#0c3c60', margin: 0 }}>{editMember ? 'Edit Member' : 'Add Member'}</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}><X size={20} /></button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {[['name', 'Full Name', 'text', true], ['email', 'Email', 'email', true], ['phone', 'Phone', 'text', false], ['qualification', 'Qualification', 'text', false], ['specialization', 'Specialization', 'text', false], ['organization', 'Organization', 'text', false], ['photo_url', 'Photo URL', 'url', false]].map(([k, label, type, req]) => (
                <div key={k} className="form-group" style={{ gridColumn: k === 'photo_url' ? '1 / -1' : 'auto' }}>
                  <label className="form-label">{label}</label>
                  <input type={type} value={form[k]} onChange={e => setForm({ ...form, [k]: e.target.value })} className="form-input" required={req} />
                </div>
              ))}
              <div className="form-group">
                <label className="form-label">Membership Type</label>
                <select value={form.membership_type} onChange={e => setForm({ ...form, membership_type: e.target.value })} className="form-select">
                  <option value="academic">Academic</option>
                  <option value="entrepreneur">Entrepreneur</option>
                  <option value="corporate">Corporate</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">State</label>
                <select value={form.state} onChange={e => setForm({ ...form, state: e.target.value })} className="form-select">
                  {STATES.map(s => <option key={s} value={s}>{s || 'Select State'}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Address</label>
                <textarea value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className="form-textarea" rows={2} />
              </div>
              <div className="form-group">
                <label className="form-label">Payment Status</label>
                <select value={form.payment_status} onChange={e => setForm({ ...form, payment_status: e.target.value })} className="form-select">
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
              <button onClick={handleSave} className="btn-primary" data-testid="save-member-btn">Save Member</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
